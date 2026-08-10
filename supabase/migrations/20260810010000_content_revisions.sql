-- Keep ciphertext authentication revisions independent from access and
-- lifecycle metadata revisions. Metadata-only changes must never make valid
-- encrypted content undecryptable.

alter table public.encrypted_lists
  add column content_revision bigint not null default 1 check (content_revision > 0);
alter table public.encrypted_tasks
  add column content_revision bigint not null default 1 check (content_revision > 0);
alter table public.encrypted_comments
  add column content_revision bigint not null default 1 check (content_revision > 0);
alter table public.encrypted_member_profiles
  add column content_revision bigint not null default 1 check (content_revision > 0);

create or replace function public.update_encrypted_list(
  p_list_id uuid,
  p_ciphertext text,
  p_iv text,
  p_key_version integer,
  p_expected_revision bigint
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_content_revision bigint;
begin
  perform private.require_list_role(p_list_id, 'write');
  if coalesce(p_ciphertext, '') = '' or coalesce(p_iv, '') = '' then
    raise exception 'Encrypted list content is required' using errcode = '22023';
  end if;

  update public.encrypted_lists
  set ciphertext = p_ciphertext,
      iv = p_iv,
      key_version = p_key_version,
      content_revision = content_revision + 1,
      revision = revision + 1,
      updated_at = now()
  where id = p_list_id
    and deleted_at is null
    and current_key_version = p_key_version
    and content_revision = p_expected_revision
  returning content_revision into v_content_revision;

  if not found then
    raise exception 'List content revision or key version conflict' using errcode = '40001';
  end if;
  return v_content_revision;
end;
$$;

create or replace function public.update_encrypted_task(
  p_list_id uuid,
  p_task_id uuid,
  p_ciphertext text,
  p_iv text,
  p_key_version integer,
  p_expected_revision bigint
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_content_revision bigint;
begin
  perform private.require_list_role(p_list_id, 'write');
  if coalesce(p_ciphertext, '') = '' or coalesce(p_iv, '') = '' then
    raise exception 'Encrypted task content is required' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.encrypted_lists
    where id = p_list_id and deleted_at is null and current_key_version = p_key_version
  ) then
    raise exception 'Task key version conflict' using errcode = '40001';
  end if;

  update public.encrypted_tasks
  set ciphertext = p_ciphertext,
      iv = p_iv,
      key_version = p_key_version,
      content_revision = content_revision + 1,
      revision = revision + 1,
      updated_at = now()
  where id = p_task_id
    and list_id = p_list_id
    and deleted_at is null
    and content_revision = p_expected_revision
  returning content_revision into v_content_revision;
  if not found then
    raise exception 'Task content revision conflict' using errcode = '40001';
  end if;
  update public.encrypted_lists
  set revision = revision + 1, updated_at = now()
  where id = p_list_id;
  return v_content_revision;
end;
$$;

create or replace function public.upsert_encrypted_member_profile(
  p_list_id uuid,
  p_ciphertext text,
  p_iv text,
  p_key_version integer,
  p_expected_revision bigint
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := private.require_actor();
  v_list_key_version integer;
  v_content_revision bigint;
begin
  perform private.require_list_role(p_list_id, 'read');
  if coalesce(p_ciphertext, '') = '' or coalesce(p_iv, '') = '' then
    raise exception 'Encrypted profile content is required' using errcode = '22023';
  end if;

  select current_key_version into v_list_key_version
  from public.encrypted_lists where id = p_list_id and deleted_at is null;
  if v_list_key_version is null or p_key_version <> v_list_key_version then
    raise exception 'Profile key version conflict' using errcode = '40001';
  end if;

  select content_revision into v_content_revision
  from public.encrypted_member_profiles
  where list_id = p_list_id and user_id = v_actor
  for update;

  if not found then
    if p_expected_revision <> 0 then
      raise exception 'Profile content revision conflict' using errcode = '40001';
    end if;
    insert into public.encrypted_member_profiles (
      list_id, user_id, ciphertext, iv, key_version
    ) values (
      p_list_id, v_actor, p_ciphertext, p_iv, p_key_version
    );
    return 1;
  end if;

  if v_content_revision <> p_expected_revision then
    raise exception 'Profile content revision conflict' using errcode = '40001';
  end if;

  update public.encrypted_member_profiles
  set ciphertext = p_ciphertext,
      iv = p_iv,
      key_version = p_key_version,
      content_revision = content_revision + 1,
      revision = revision + 1,
      updated_at = now()
  where list_id = p_list_id and user_id = v_actor
  returning content_revision into v_content_revision;
  return v_content_revision;
end;
$$;

create or replace function public.update_encrypted_comment(
  p_list_id uuid,
  p_comment_id uuid,
  p_ciphertext text,
  p_iv text,
  p_key_version integer,
  p_expected_revision bigint
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := private.require_actor();
  v_content_revision bigint;
begin
  perform private.require_list_role(p_list_id, 'comment');
  if coalesce(p_ciphertext, '') = '' or coalesce(p_iv, '') = '' then
    raise exception 'Encrypted comment content is required' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.encrypted_lists
    where id = p_list_id and deleted_at is null and current_key_version = p_key_version
  ) then
    raise exception 'Comment key version conflict' using errcode = '40001';
  end if;

  update public.encrypted_comments
  set ciphertext = p_ciphertext,
      iv = p_iv,
      key_version = p_key_version,
      content_revision = content_revision + 1,
      revision = revision + 1,
      updated_at = now()
  where id = p_comment_id
    and list_id = p_list_id
    and author_id = v_actor
    and deleted_at is null
    and content_revision = p_expected_revision
  returning content_revision into v_content_revision;
  if not found then
    raise exception 'Only the author can edit this comment at the expected content revision'
      using errcode = '42501';
  end if;
  return v_content_revision;
end;
$$;

comment on column public.encrypted_lists.content_revision is
  'Revision authenticated in list ciphertext AAD; metadata changes do not alter it.';
comment on column public.encrypted_tasks.content_revision is
  'Revision authenticated in task ciphertext AAD; metadata changes do not alter it.';
comment on column public.encrypted_comments.content_revision is
  'Revision authenticated in comment ciphertext AAD; metadata changes do not alter it.';

create or replace function public.move_encrypted_task(
  p_source_list_id uuid,
  p_destination_list_id uuid,
  p_task_id uuid,
  p_ciphertext text,
  p_iv text,
  p_key_version integer,
  p_expected_revision bigint,
  p_comments jsonb,
  p_attachment_ids uuid[]
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_comment jsonb;
  v_comment_count integer;
  v_content_revision bigint;
begin
  if p_source_list_id = p_destination_list_id then
    raise exception 'Task move requires two different lists' using errcode = '22023';
  end if;
  perform private.require_list_role(p_source_list_id, 'write');
  perform private.require_list_role(p_destination_list_id, 'write');
  if coalesce(p_ciphertext, '') = '' or coalesce(p_iv, '') = '' then
    raise exception 'Encrypted task content is required' using errcode = '22023';
  end if;
  if jsonb_typeof(coalesce(p_comments, '[]'::jsonb)) <> 'array' then
    raise exception 'Encrypted comment envelopes must be an array' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.encrypted_lists
    where id = p_destination_list_id
      and deleted_at is null
      and current_key_version = p_key_version
  ) then
    raise exception 'Task destination key version conflict' using errcode = '40001';
  end if;

  perform 1
  from public.encrypted_tasks
  where id = p_task_id
    and list_id = p_source_list_id
    and deleted_at is null
    and revision = p_expected_revision
  for update;
  if not found then
    raise exception 'Task revision conflict' using errcode = '40001';
  end if;

  select count(*) into v_comment_count
  from public.encrypted_comments
  where list_id = p_source_list_id and task_id = p_task_id;
  if jsonb_array_length(coalesce(p_comments, '[]'::jsonb)) <> v_comment_count
    or (
      select count(distinct (item->>'id'))
      from jsonb_array_elements(coalesce(p_comments, '[]'::jsonb)) as item
    ) <> v_comment_count
    or exists (
      select 1
      from jsonb_array_elements(coalesce(p_comments, '[]'::jsonb)) as item
      where coalesce(item->>'id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        or coalesce(item->>'ciphertext', '') = ''
        or coalesce(item->>'iv', '') = ''
        or coalesce((item->>'key_version')::integer, 0) <> p_key_version
        or coalesce((item->>'expected_revision')::bigint, 0) < 1
    )
    or exists (
      select 1
      from jsonb_array_elements(coalesce(p_comments, '[]'::jsonb)) as item
      left join public.encrypted_comments as comment_row
        on comment_row.id = (item->>'id')::uuid
        and comment_row.list_id = p_source_list_id
        and comment_row.task_id = p_task_id
        and comment_row.revision = (item->>'expected_revision')::bigint
      where comment_row.id is null
    ) then
    raise exception 'Task comments changed during the move' using errcode = '40001';
  end if;

  if (
      select count(distinct attachment_id)
      from unnest(coalesce(p_attachment_ids, '{}'::uuid[])) as attachment_id
    ) <> (
      select count(*) from public.encrypted_attachment_metadata
      where list_id = p_source_list_id and task_id = p_task_id
    )
    or exists (
      select 1 from public.encrypted_attachment_metadata as attachment
      where attachment.list_id = p_source_list_id
        and attachment.task_id = p_task_id
        and not (attachment.id = any(coalesce(p_attachment_ids, '{}'::uuid[])))
    )
    or exists (
      select 1 from unnest(coalesce(p_attachment_ids, '{}'::uuid[])) as attachment_id
      where not exists (
        select 1 from public.encrypted_attachment_metadata as attachment
        where attachment.id = attachment_id
          and attachment.list_id = p_source_list_id
          and attachment.task_id = p_task_id
      )
    )
    or exists (
      select 1
      from public.encrypted_attachment_metadata as attachment
      where attachment.list_id = p_source_list_id
        and attachment.task_id = p_task_id
        and attachment.deleted_at is null
        and (
          select count(*)
          from storage.objects as object_row
          where object_row.bucket_id = 'daily-planner-encrypted-attachments'
            and object_row.name like
              p_destination_list_id::text || '/' || attachment.id::text || '/%.bin'
        ) <> attachment.chunk_count
    ) then
    raise exception 'Task attachments changed during the move' using errcode = '40001';
  end if;

  set constraints all deferred;
  update public.encrypted_tasks
  set list_id = p_destination_list_id,
      ciphertext = p_ciphertext,
      iv = p_iv,
      key_version = p_key_version,
      content_revision = content_revision + 1,
      revision = revision + 1,
      updated_at = now()
  where id = p_task_id
    and list_id = p_source_list_id
    and revision = p_expected_revision
  returning content_revision into v_content_revision;

  for v_comment in
    select item from jsonb_array_elements(coalesce(p_comments, '[]'::jsonb)) as item
  loop
    update public.encrypted_comments
    set list_id = p_destination_list_id,
        ciphertext = v_comment->>'ciphertext',
        iv = v_comment->>'iv',
        key_version = p_key_version,
        content_revision = content_revision + 1,
        revision = revision + 1,
        updated_at = now()
    where id = (v_comment->>'id')::uuid
      and list_id = p_source_list_id
      and task_id = p_task_id
      and revision = (v_comment->>'expected_revision')::bigint;
    if not found then
      raise exception 'Task comments changed during the move' using errcode = '40001';
    end if;
  end loop;

  update public.thread_reads
  set list_id = p_destination_list_id
  where list_id = p_source_list_id and task_id = p_task_id;
  update public.encrypted_attachment_metadata
  set list_id = p_destination_list_id,
      key_version = p_key_version,
      revision = revision + 1,
      updated_at = now()
  where list_id = p_source_list_id and task_id = p_task_id;
  update public.notification_jobs
  set list_id = p_destination_list_id, updated_at = now()
  where list_id = p_source_list_id and task_id = p_task_id;
  update public.encrypted_lists
  set revision = revision + 1, updated_at = now()
  where id in (p_source_list_id, p_destination_list_id);

  return v_content_revision;
end;
$$;
