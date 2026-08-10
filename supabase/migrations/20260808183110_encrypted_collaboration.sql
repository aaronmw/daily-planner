-- Daily Planner collaboration stores only encrypted user-authored content.
-- Authorization topology, opaque identifiers, revisions, timestamps, roles,
-- ciphertext sizes, and delivery metadata remain visible to Supabase.

create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;

create type public.planner_role as enum ('read', 'comment', 'write', 'full', 'owner');
create type public.membership_state as enum ('active', 'removed');
create type public.planner_notification_kind as enum ('mention', 'reply');
create type public.planner_notification_state as enum (
  'pending', 'processing', 'retry', 'delivered', 'failed'
);
create type public.planner_push_platform as enum ('web', 'desktop');

create table public.collaboration_identities (
  user_id uuid primary key references auth.users(id) on delete cascade,
  public_key text not null check (char_length(public_key) > 0),
  is_anonymous boolean not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.identity_keyrings (
  user_id uuid primary key references public.collaboration_identities(user_id) on delete cascade,
  encrypted_private_key text not null check (char_length(encrypted_private_key) > 0),
  private_key_iv text not null check (char_length(private_key_iv) > 0),
  encrypted_account_key text,
  account_key_iv text,
  recovery_salt text,
  recovery_iv text,
  revision bigint not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (encrypted_account_key is null and account_key_iv is null and recovery_salt is null and recovery_iv is null)
    or
    (encrypted_account_key is not null and account_key_iv is not null and recovery_salt is not null and recovery_iv is not null)
  )
);

create table public.encrypted_lists (
  id uuid primary key,
  owner_id uuid not null references auth.users(id) on delete restrict,
  ciphertext text not null check (char_length(ciphertext) > 0),
  iv text not null check (char_length(iv) > 0),
  key_version integer not null default 1 check (key_version > 0),
  current_key_version integer not null default 1 check (current_key_version > 0),
  revision bigint not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (current_key_version >= key_version)
);

create table public.list_memberships (
  list_id uuid not null references public.encrypted_lists(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.planner_role not null,
  state public.membership_state not null default 'active',
  revision bigint not null default 1 check (revision > 0),
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  removed_at timestamptz,
  removed_by uuid references auth.users(id) on delete set null,
  primary key (list_id, user_id),
  check (
    (state = 'active' and removed_at is null and removed_by is null)
    or
    (state = 'removed' and removed_at is not null)
  )
);

create table public.list_key_envelopes (
  list_id uuid not null references public.encrypted_lists(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  key_version integer not null check (key_version > 0),
  wrapped_key text not null check (char_length(wrapped_key) > 0),
  wrapped_key_iv text not null check (char_length(wrapped_key_iv) > 0),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (list_id, user_id, key_version),
  foreign key (list_id, user_id)
    references public.list_memberships(list_id, user_id) on delete cascade
);

create table public.list_invitations (
  id uuid primary key,
  list_id uuid not null references public.encrypted_lists(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  role public.planner_role not null check (role <> 'owner'),
  secret_hash text not null unique check (secret_hash ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  used_at timestamptz,
  used_by uuid references auth.users(id) on delete set null,
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id) on delete set null,
  check (expires_at > created_at),
  check ((used_at is null) = (used_by is null)),
  check ((revoked_at is null) = (revoked_by is null))
);

create table public.encrypted_member_profiles (
  list_id uuid not null,
  user_id uuid not null,
  ciphertext text not null check (char_length(ciphertext) > 0),
  iv text not null check (char_length(iv) > 0),
  key_version integer not null check (key_version > 0),
  revision bigint not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (list_id, user_id),
  foreign key (list_id, user_id)
    references public.list_memberships(list_id, user_id) on delete cascade
);

create table public.encrypted_tasks (
  id uuid primary key,
  list_id uuid not null references public.encrypted_lists(id) on delete cascade,
  creator_id uuid not null references auth.users(id) on delete restrict,
  ciphertext text not null check (char_length(ciphertext) > 0),
  iv text not null check (char_length(iv) > 0),
  key_version integer not null check (key_version > 0),
  revision bigint not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (list_id, id)
);

create table public.encrypted_comments (
  id uuid primary key,
  list_id uuid not null,
  task_id uuid not null,
  author_id uuid not null references auth.users(id) on delete restrict,
  parent_comment_id uuid,
  ciphertext text not null check (char_length(ciphertext) > 0),
  iv text not null check (char_length(iv) > 0),
  key_version integer not null check (key_version > 0),
  revision bigint not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (list_id, task_id, id),
  foreign key (list_id, task_id)
    references public.encrypted_tasks(list_id, id) on delete cascade
    deferrable initially deferred,
  foreign key (list_id, task_id, parent_comment_id)
    references public.encrypted_comments(list_id, task_id, id) on delete cascade
    deferrable initially deferred
);

create table public.comment_mentions (
  comment_id uuid not null references public.encrypted_comments(id) on delete cascade,
  mentioned_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, mentioned_user_id)
);

create table public.thread_reads (
  list_id uuid not null,
  task_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (list_id, task_id, user_id),
  foreign key (list_id, task_id)
    references public.encrypted_tasks(list_id, id) on delete cascade
    deferrable initially deferred
);

create table public.encrypted_attachment_metadata (
  id uuid primary key,
  list_id uuid not null,
  task_id uuid not null,
  uploader_id uuid not null references auth.users(id) on delete restrict,
  chunk_count integer not null check (chunk_count > 0),
  encrypted_byte_size bigint not null check (encrypted_byte_size >= 0),
  key_version integer not null check (key_version > 0),
  revision bigint not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (list_id, id),
  foreign key (list_id, task_id)
    references public.encrypted_tasks(list_id, id) on delete cascade
    deferrable initially deferred
);

create table public.push_subscriptions (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique check (endpoint ~ '^https://'),
  p256dh text not null check (char_length(p256dh) > 0),
  auth text not null check (char_length(auth) > 0),
  platform public.planner_push_platform not null,
  expiration_time timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notification_jobs (
  id uuid primary key default extensions.gen_random_uuid(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  list_id uuid not null references public.encrypted_lists(id) on delete cascade,
  task_id uuid not null,
  comment_id uuid not null references public.encrypted_comments(id) on delete cascade,
  kind public.planner_notification_kind not null,
  state public.planner_notification_state not null default 'pending',
  attempts integer not null default 0 check (attempts between 0 and 5),
  next_attempt_at timestamptz not null default now(),
  locked_at timestamptz,
  delivered_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (comment_id, recipient_id),
  foreign key (list_id, task_id)
    references public.encrypted_tasks(list_id, id) on delete cascade
    deferrable initially deferred,
  check ((state = 'delivered') = (delivered_at is not null))
);

create table public.identity_handoffs (
  id uuid primary key,
  secret_hash text not null unique check (secret_hash ~ '^[0-9a-f]{64}$'),
  source_user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  used_at timestamptz,
  used_by uuid references auth.users(id) on delete set null,
  check (expires_at > created_at),
  check ((used_at is null) = (used_by is null))
);

create index collaboration_identities_updated_idx
  on public.collaboration_identities (updated_at desc);
create index encrypted_lists_owner_updated_idx
  on public.encrypted_lists (owner_id, updated_at desc);
create index list_memberships_user_active_idx
  on public.list_memberships (user_id, list_id) where state = 'active';
create index list_memberships_list_active_idx
  on public.list_memberships (list_id, role, user_id) where state = 'active';
create index list_key_envelopes_user_idx
  on public.list_key_envelopes (user_id, list_id, key_version desc);
create index list_invitations_list_open_idx
  on public.list_invitations (list_id, expires_at)
  where used_at is null and revoked_at is null;
create index encrypted_member_profiles_user_idx
  on public.encrypted_member_profiles (user_id, list_id);
create index encrypted_tasks_list_updated_idx
  on public.encrypted_tasks (list_id, updated_at desc);
create index encrypted_tasks_creator_idx
  on public.encrypted_tasks (creator_id, updated_at desc);
create index encrypted_comments_thread_idx
  on public.encrypted_comments (list_id, task_id, created_at);
create index encrypted_comments_author_idx
  on public.encrypted_comments (author_id, created_at desc);
create index comment_mentions_user_idx
  on public.comment_mentions (mentioned_user_id, comment_id);
create index thread_reads_user_idx
  on public.thread_reads (user_id, list_id, task_id);
create index encrypted_attachment_task_idx
  on public.encrypted_attachment_metadata (list_id, task_id, created_at);
create index encrypted_attachment_uploader_idx
  on public.encrypted_attachment_metadata (uploader_id, created_at desc);
create index push_subscriptions_user_idx
  on public.push_subscriptions (user_id, updated_at desc);
create index notification_jobs_pending_idx
  on public.notification_jobs (next_attempt_at, created_at)
  where state in ('pending', 'retry');
create index notification_jobs_recipient_idx
  on public.notification_jobs (recipient_id, created_at desc);
create index identity_handoffs_source_idx
  on public.identity_handoffs (source_user_id, expires_at)
  where used_at is null;

alter table public.collaboration_identities enable row level security;
alter table public.identity_keyrings enable row level security;
alter table public.encrypted_lists enable row level security;
alter table public.list_memberships enable row level security;
alter table public.list_key_envelopes enable row level security;
alter table public.list_invitations enable row level security;
alter table public.encrypted_member_profiles enable row level security;
alter table public.encrypted_tasks enable row level security;
alter table public.encrypted_comments enable row level security;
alter table public.comment_mentions enable row level security;
alter table public.thread_reads enable row level security;
alter table public.encrypted_attachment_metadata enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notification_jobs enable row level security;
alter table public.identity_handoffs enable row level security;

create or replace function private.role_rank(p_role public.planner_role)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case p_role
    when 'read' then 1
    when 'comment' then 2
    when 'write' then 3
    when 'full' then 4
    when 'owner' then 5
  end;
$$;

create or replace function private.require_actor()
returns uuid
language plpgsql
stable
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  return v_actor;
end;
$$;

create or replace function private.current_list_role(p_list_id uuid)
returns public.planner_role
language sql
security definer
stable
set search_path = ''
as $$
  select member.role
  from public.list_memberships as member
  where member.list_id = p_list_id
    and member.user_id = (select auth.uid())
    and member.state = 'active';
$$;

create or replace function private.has_list_role(
  p_list_id uuid,
  p_required_role public.planner_role
)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and coalesce(
      private.role_rank(private.current_list_role(p_list_id))
        >= private.role_rank(p_required_role),
      false
    );
$$;

create or replace function private.require_list_role(
  p_list_id uuid,
  p_required_role public.planner_role
)
returns public.planner_role
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_role public.planner_role;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select member.role into v_role
  from public.list_memberships as member
  where member.list_id = p_list_id
    and member.user_id = v_actor
    and member.state = 'active';

  if v_role is null
    or private.role_rank(v_role) < private.role_rank(p_required_role) then
    raise exception 'Insufficient list access' using errcode = '42501';
  end if;
  return v_role;
end;
$$;

create or replace function private.can_read_identity(p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and (
      p_user_id = (select auth.uid())
      or exists (
        select 1
        from public.list_memberships as profile_member
        join public.list_memberships as viewer_member
          on viewer_member.list_id = profile_member.list_id
        where profile_member.user_id = p_user_id
          and viewer_member.user_id = (select auth.uid())
          and viewer_member.state = 'active'
      )
    );
$$;

create or replace function private.current_user_is_anonymous()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select coalesce((
    select user_row.is_anonymous
    from auth.users as user_row
    where user_row.id = (select auth.uid())
  ), false);
$$;

create or replace function private.assert_active_owner(p_list_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner_id uuid;
  v_owner_count integer;
  v_membership_owner_id uuid;
begin
  select list_row.owner_id into v_owner_id
  from public.encrypted_lists as list_row
  where list_row.id = p_list_id;

  if not found then
    return;
  end if;

  select count(*), min(member.user_id::text)::uuid
  into v_owner_count, v_membership_owner_id
  from public.list_memberships as member
  where member.list_id = p_list_id
    and member.state = 'active'
    and member.role = 'owner';

  if v_owner_count <> 1 or v_membership_owner_id <> v_owner_id then
    raise exception 'A list must have exactly one active owner matching owner_id'
      using errcode = '23514';
  end if;
end;
$$;

create or replace function private.enforce_list_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_list_id uuid;
begin
  if tg_table_name = 'encrypted_lists' then
    v_list_id := case when tg_op = 'DELETE' then old.id else new.id end;
  else
    v_list_id := case when tg_op = 'DELETE' then old.list_id else new.list_id end;
  end if;
  perform private.assert_active_owner(v_list_id);
  return null;
end;
$$;

create constraint trigger encrypted_lists_owner_invariant
after insert or update or delete on public.encrypted_lists
deferrable initially deferred
for each row execute function private.enforce_list_owner();

create constraint trigger list_memberships_owner_invariant
after insert or update or delete on public.list_memberships
deferrable initially deferred
for each row execute function private.enforce_list_owner();

create or replace function private.install_key_envelopes(
  p_list_id uuid,
  p_new_key_version integer,
  p_envelopes jsonb,
  p_excluded_user_id uuid,
  p_actor uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_expected_count integer;
  v_item_count integer;
  v_distinct_count integer;
begin
  if p_actor is null or p_actor <> (select auth.uid()) then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_excluded_user_id = p_actor then
    perform private.require_list_role(p_list_id, 'read');
  else
    perform private.require_list_role(p_list_id, 'full');
  end if;

  if p_new_key_version is null or p_new_key_version < 1
    or jsonb_typeof(p_envelopes) <> 'array' then
    raise exception 'Invalid key envelope set' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_envelopes) as item
    where jsonb_typeof(item) <> 'object'
      or coalesce(item->>'user_id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      or coalesce(item->>'wrapped_key', '') = ''
      or coalesce(item->>'wrapped_key_iv', '') = ''
  ) then
    raise exception 'Invalid key envelope set' using errcode = '22023';
  end if;

  select count(*) into v_expected_count
  from public.list_memberships as member
  where member.list_id = p_list_id
    and member.state = 'active'
    and member.user_id is distinct from p_excluded_user_id;

  select count(*), count(distinct item->>'user_id')
  into v_item_count, v_distinct_count
  from jsonb_array_elements(p_envelopes) as item;

  if v_item_count <> v_expected_count or v_distinct_count <> v_expected_count
    or exists (
      select 1
      from jsonb_array_elements(p_envelopes) as item
      where not exists (
        select 1
        from public.list_memberships as member
        where member.list_id = p_list_id
          and member.user_id = (item->>'user_id')::uuid
          and member.state = 'active'
          and member.user_id is distinct from p_excluded_user_id
      )
    ) then
    raise exception 'Key envelopes must exactly match remaining active members'
      using errcode = '22023';
  end if;

  insert into public.list_key_envelopes (
    list_id, user_id, key_version, wrapped_key, wrapped_key_iv, created_by
  )
  select
    p_list_id,
    (item->>'user_id')::uuid,
    p_new_key_version,
    item->>'wrapped_key',
    item->>'wrapped_key_iv',
    p_actor
  from jsonb_array_elements(p_envelopes) as item;
end;
$$;

create or replace function private.install_member_key_history(
  p_list_id uuid,
  p_user_id uuid,
  p_envelopes jsonb,
  p_created_by uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_expected_count integer;
  v_item_count integer;
  v_distinct_count integer;
begin
  if (select auth.uid()) is null
    or p_user_id is null
    or p_user_id <> (select auth.uid())
    or jsonb_typeof(p_envelopes) <> 'array' then
    raise exception 'Invalid member key history' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.list_memberships
    where list_id = p_list_id and user_id = p_user_id and state = 'active'
  ) then
    raise exception 'An active membership is required before installing keys'
      using errcode = '42501';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_envelopes) as item
    where jsonb_typeof(item) <> 'object'
      or coalesce(item->>'key_version', '') !~ '^[1-9][0-9]*$'
      or coalesce(item->>'wrapped_key', '') = ''
      or coalesce(item->>'wrapped_key_iv', '') = ''
  ) then
    raise exception 'Invalid member key history' using errcode = '22023';
  end if;

  select count(distinct envelope.key_version) into v_expected_count
  from public.list_key_envelopes as envelope
  where envelope.list_id = p_list_id;
  select count(*), count(distinct item->>'key_version')
  into v_item_count, v_distinct_count
  from jsonb_array_elements(p_envelopes) as item;

  if v_expected_count < 1
    or v_item_count <> v_expected_count
    or v_distinct_count <> v_expected_count
    or exists (
      select 1
      from jsonb_array_elements(p_envelopes) as item
      where not exists (
        select 1 from public.list_key_envelopes as existing_envelope
        where existing_envelope.list_id = p_list_id
          and existing_envelope.key_version = (item->>'key_version')::integer
      )
    ) then
    raise exception 'Key history must exactly match every list key version'
      using errcode = '22023';
  end if;

  insert into public.list_key_envelopes (
    list_id, user_id, key_version, wrapped_key, wrapped_key_iv, created_by
  )
  select
    p_list_id,
    p_user_id,
    (item->>'key_version')::integer,
    item->>'wrapped_key',
    item->>'wrapped_key_iv',
    p_created_by
  from jsonb_array_elements(p_envelopes) as item
  on conflict (list_id, user_id, key_version) do update
    set wrapped_key = excluded.wrapped_key,
        wrapped_key_iv = excluded.wrapped_key_iv,
        created_by = excluded.created_by,
        created_at = now();
end;
$$;

create policy "Members can read encrypted lists"
  on public.encrypted_lists for select to authenticated
  using ((select private.has_list_role(id, 'read')));

create policy "Members can read list memberships"
  on public.list_memberships for select to authenticated
  using ((select private.has_list_role(list_id, 'read')));

create policy "Users can read their list key envelopes"
  on public.list_key_envelopes for select to authenticated
  using (
    user_id = (select auth.uid())
    and (select private.has_list_role(list_id, 'read'))
  );

create policy "Full members can read list invitations"
  on public.list_invitations for select to authenticated
  using ((select private.has_list_role(list_id, 'full')));

create policy "Members can read encrypted member profiles"
  on public.encrypted_member_profiles for select to authenticated
  using ((select private.has_list_role(list_id, 'read')));

create policy "Members can read encrypted tasks"
  on public.encrypted_tasks for select to authenticated
  using ((select private.has_list_role(list_id, 'read')));

create policy "Members can read encrypted comments"
  on public.encrypted_comments for select to authenticated
  using ((select private.has_list_role(list_id, 'read')));

create policy "Members can read comment mentions"
  on public.comment_mentions for select to authenticated
  using (
    exists (
      select 1
      from public.encrypted_comments as comment_row
      where comment_row.id = comment_id
        and (select private.has_list_role(comment_row.list_id, 'read'))
    )
  );

create policy "Users can read their thread state"
  on public.thread_reads for select to authenticated
  using (
    user_id = (select auth.uid())
    and (select private.has_list_role(list_id, 'read'))
  );

create policy "Members can read opaque attachment metadata"
  on public.encrypted_attachment_metadata for select to authenticated
  using ((select private.has_list_role(list_id, 'read')));

create policy "Users can read their push subscriptions"
  on public.push_subscriptions for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Recipients can read notification jobs"
  on public.notification_jobs for select to authenticated
  using (recipient_id = (select auth.uid()));

create policy "Users can read their identity handoffs"
  on public.identity_handoffs for select to authenticated
  using (source_user_id = (select auth.uid()) or used_by = (select auth.uid()));

create policy "Users can read co-member public identities"
  on public.collaboration_identities for select to authenticated
  using ((select private.can_read_identity(user_id)));

create policy "Users can read their keyring"
  on public.identity_keyrings for select to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.register_collaboration_identity(
  p_public_key text,
  p_encrypted_private_key text,
  p_private_key_iv text,
  p_encrypted_account_key text default null,
  p_account_key_iv text default null,
  p_recovery_salt text default null,
  p_recovery_iv text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := private.require_actor();
  v_is_anonymous boolean;
begin
  if coalesce(p_public_key, '') = ''
    or coalesce(p_encrypted_private_key, '') = ''
    or coalesce(p_private_key_iv, '') = '' then
    raise exception 'Identity key material is required' using errcode = '22023';
  end if;
  if not (
    (p_encrypted_account_key is null and p_account_key_iv is null and p_recovery_salt is null and p_recovery_iv is null)
    or
    (p_encrypted_account_key is not null and p_account_key_iv is not null and p_recovery_salt is not null and p_recovery_iv is not null)
  ) then
    raise exception 'Recovery key material must be supplied together' using errcode = '22023';
  end if;

  select user_row.is_anonymous into v_is_anonymous
  from auth.users as user_row
  where user_row.id = v_actor;

  if exists (select 1 from public.collaboration_identities where user_id = v_actor) then
    raise exception 'Collaboration identity already exists' using errcode = '23505';
  end if;

  insert into public.collaboration_identities (user_id, public_key, is_anonymous)
  values (v_actor, p_public_key, coalesce(v_is_anonymous, false));

  insert into public.identity_keyrings (
    user_id, encrypted_private_key, private_key_iv,
    encrypted_account_key, account_key_iv, recovery_salt, recovery_iv
  ) values (
    v_actor, p_encrypted_private_key, p_private_key_iv,
    p_encrypted_account_key, p_account_key_iv, p_recovery_salt, p_recovery_iv
  );

  return v_actor;
end;
$$;

create or replace function public.update_collaboration_keyring(
  p_public_key text,
  p_encrypted_private_key text,
  p_private_key_iv text,
  p_encrypted_account_key text,
  p_account_key_iv text,
  p_recovery_salt text,
  p_recovery_iv text,
  p_expected_revision bigint
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := private.require_actor();
  v_revision bigint;
begin
  if coalesce(p_public_key, '') = ''
    or coalesce(p_encrypted_private_key, '') = ''
    or coalesce(p_private_key_iv, '') = ''
    or not (
      (p_encrypted_account_key is null and p_account_key_iv is null and p_recovery_salt is null and p_recovery_iv is null)
      or
      (p_encrypted_account_key is not null and p_account_key_iv is not null and p_recovery_salt is not null and p_recovery_iv is not null)
    ) then
    raise exception 'Invalid keyring material' using errcode = '22023';
  end if;

  update public.identity_keyrings
  set encrypted_private_key = p_encrypted_private_key,
      private_key_iv = p_private_key_iv,
      encrypted_account_key = p_encrypted_account_key,
      account_key_iv = p_account_key_iv,
      recovery_salt = p_recovery_salt,
      recovery_iv = p_recovery_iv,
      revision = revision + 1,
      updated_at = now()
  where user_id = v_actor and revision = p_expected_revision
  returning revision into v_revision;

  if not found then
    raise exception 'Keyring revision conflict' using errcode = '40001';
  end if;

  update public.collaboration_identities as identity_row
  set public_key = p_public_key,
      is_anonymous = coalesce(user_row.is_anonymous, false),
      updated_at = now()
  from auth.users as user_row
  where identity_row.user_id = v_actor
    and user_row.id = v_actor;

  return v_revision;
end;
$$;

create or replace function public.create_encrypted_list(
  p_list_id uuid,
  p_ciphertext text,
  p_iv text,
  p_wrapped_key text,
  p_wrapped_key_iv text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := private.require_actor();
begin
  if p_list_id is null
    or coalesce(p_ciphertext, '') = ''
    or coalesce(p_iv, '') = ''
    or coalesce(p_wrapped_key, '') = ''
    or coalesce(p_wrapped_key_iv, '') = '' then
    raise exception 'Encrypted list and owner key envelope are required' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.collaboration_identities where user_id = v_actor
  ) then
    raise exception 'Register a collaboration identity first' using errcode = '42501';
  end if;

  set constraints all deferred;
  insert into public.encrypted_lists (id, owner_id, ciphertext, iv, key_version)
  values (p_list_id, v_actor, p_ciphertext, p_iv, 1);

  insert into public.list_memberships (list_id, user_id, role)
  values (p_list_id, v_actor, 'owner');

  insert into public.list_key_envelopes (
    list_id, user_id, key_version, wrapped_key, wrapped_key_iv, created_by
  ) values (
    p_list_id, v_actor, 1, p_wrapped_key, p_wrapped_key_iv, v_actor
  );
  return p_list_id;
end;
$$;

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
  v_revision bigint;
begin
  perform private.require_list_role(p_list_id, 'write');
  if coalesce(p_ciphertext, '') = '' or coalesce(p_iv, '') = '' then
    raise exception 'Encrypted list content is required' using errcode = '22023';
  end if;

  update public.encrypted_lists
  set ciphertext = p_ciphertext,
      iv = p_iv,
      key_version = p_key_version,
      revision = revision + 1,
      updated_at = now()
  where id = p_list_id
    and deleted_at is null
    and current_key_version = p_key_version
    and revision = p_expected_revision
  returning revision into v_revision;

  if not found then
    raise exception 'List revision or key version conflict' using errcode = '40001';
  end if;
  return v_revision;
end;
$$;

create or replace function public.set_encrypted_list_deleted(
  p_list_id uuid,
  p_deleted boolean,
  p_expected_revision bigint
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := private.require_actor();
  v_revision bigint;
begin
  perform private.require_list_role(p_list_id, 'owner');
  update public.encrypted_lists
  set deleted_at = case when p_deleted then now() else null end,
      revision = revision + 1,
      updated_at = now()
  where id = p_list_id
    and owner_id = v_actor
    and revision = p_expected_revision
  returning revision into v_revision;

  if not found then
    raise exception 'Only the owner can delete this list at the expected revision'
      using errcode = '42501';
  end if;
  return v_revision;
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
  v_current_revision bigint;
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

  select revision into v_current_revision
  from public.encrypted_member_profiles
  where list_id = p_list_id and user_id = v_actor
  for update;

  if not found then
    if p_expected_revision <> 0 then
      raise exception 'Profile revision conflict' using errcode = '40001';
    end if;
    insert into public.encrypted_member_profiles (
      list_id, user_id, ciphertext, iv, key_version
    ) values (
      p_list_id, v_actor, p_ciphertext, p_iv, p_key_version
    );
    return 1;
  end if;

  if v_current_revision <> p_expected_revision then
    raise exception 'Profile revision conflict' using errcode = '40001';
  end if;

  update public.encrypted_member_profiles
  set ciphertext = p_ciphertext,
      iv = p_iv,
      key_version = p_key_version,
      revision = revision + 1,
      updated_at = now()
  where list_id = p_list_id and user_id = v_actor
  returning revision into v_current_revision;
  return v_current_revision;
end;
$$;

create or replace function public.create_list_invitation(
  p_list_id uuid,
  p_invitation_id uuid,
  p_secret_hash text,
  p_role public.planner_role,
  p_expires_at timestamptz
)
returns table (
  invitation_id uuid,
  invitation_role public.planner_role,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := private.require_actor();
begin
  perform private.require_list_role(p_list_id, 'full');
  if p_invitation_id is null
    or coalesce(p_secret_hash, '') !~ '^[0-9a-f]{64}$'
    or p_role is null
    or p_role = 'owner'
    or p_expires_at <= now()
    or p_expires_at > now() + interval '7 days' then
    raise exception 'Invitations must be non-owner, future-dated, and expire within seven days'
      using errcode = '22023';
  end if;

  insert into public.list_invitations (
    id, list_id, created_by, role, secret_hash, expires_at
  ) values (
    p_invitation_id, p_list_id, v_actor, p_role, p_secret_hash, p_expires_at
  );

  return query select p_invitation_id, p_role, p_expires_at;
end;
$$;

create or replace function public.revoke_list_invitation(
  p_list_id uuid,
  p_invitation_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := private.require_actor();
begin
  perform private.require_list_role(p_list_id, 'full');
  update public.list_invitations
  set revoked_at = now(), revoked_by = v_actor
  where id = p_invitation_id
    and list_id = p_list_id
    and used_at is null
    and revoked_at is null;
  if not found then
    raise exception 'Open invitation not found' using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.redeem_list_invitation(
  p_invitation_id uuid,
  p_secret text,
  p_key_envelopes jsonb
)
returns table (
  list_id uuid,
  member_role public.planner_role,
  key_version integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := private.require_actor();
  v_invitation public.list_invitations%rowtype;
  v_key_version integer;
begin
  if coalesce(p_secret, '') = '' or jsonb_typeof(p_key_envelopes) <> 'array' then
    raise exception 'Invitation secret and versioned key envelopes are required'
      using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.collaboration_identities where user_id = v_actor
  ) then
    raise exception 'Register a collaboration identity first' using errcode = '42501';
  end if;

  select * into v_invitation
  from public.list_invitations
  where id = p_invitation_id
  for update;

  if not found
    or v_invitation.used_at is not null
    or v_invitation.revoked_at is not null
    or v_invitation.expires_at <= now()
    or v_invitation.secret_hash <> encode(extensions.digest(p_secret, 'sha256'), 'hex') then
    raise exception 'Invitation is invalid, expired, revoked, or already used'
      using errcode = '42501';
  end if;

  select list_row.current_key_version into v_key_version
  from public.encrypted_lists as list_row
  where list_row.id = v_invitation.list_id and list_row.deleted_at is null
  for update;
  if not found then
    raise exception 'Shared list is unavailable' using errcode = 'P0002';
  end if;
  if exists (
    select 1 from public.list_memberships as existing_member
    where existing_member.list_id = v_invitation.list_id
      and existing_member.user_id = v_actor
      and existing_member.state = 'active'
  ) then
    raise exception 'User is already an active list member' using errcode = '23505';
  end if;

  insert into public.list_memberships (
    list_id, user_id, role, state, revision, joined_at, updated_at,
    removed_at, removed_by
  ) values (
    v_invitation.list_id, v_actor, v_invitation.role, 'active', 1, now(), now(),
    null, null
  )
  on conflict on constraint list_memberships_pkey do update
    set role = excluded.role,
        state = 'active',
        revision = public.list_memberships.revision + 1,
        joined_at = now(),
        updated_at = now(),
        removed_at = null,
        removed_by = null;

  perform private.install_member_key_history(
    v_invitation.list_id, v_actor, p_key_envelopes, v_invitation.created_by
  );

  update public.list_invitations
  set used_at = now(), used_by = v_actor
  where id = p_invitation_id;

  return query select v_invitation.list_id, v_invitation.role, v_key_version;
end;
$$;

create or replace function public.set_list_member_role(
  p_list_id uuid,
  p_user_id uuid,
  p_role public.planner_role,
  p_expected_revision bigint
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := private.require_actor();
  v_member public.list_memberships%rowtype;
  v_revision bigint;
begin
  perform private.require_list_role(p_list_id, 'full');
  if p_user_id = v_actor then
    raise exception 'Use the leave action to change your own access' using errcode = '22023';
  end if;
  if p_role is null or p_role = 'owner' then
    raise exception 'Ownership changes require the transfer action' using errcode = '22023';
  end if;

  select * into v_member
  from public.list_memberships
  where list_id = p_list_id and user_id = p_user_id and state = 'active'
  for update;
  if not found then
    raise exception 'Active member not found' using errcode = 'P0002';
  end if;
  if v_member.role = 'owner' then
    raise exception 'The owner role is immutable outside ownership transfer'
      using errcode = '42501';
  end if;
  if v_member.revision <> p_expected_revision then
    raise exception 'Membership revision conflict' using errcode = '40001';
  end if;

  update public.list_memberships
  set role = p_role,
      revision = revision + 1,
      updated_at = now()
  where list_id = p_list_id and user_id = p_user_id
  returning revision into v_revision;

  update public.encrypted_lists
  set revision = revision + 1, updated_at = now()
  where id = p_list_id;
  return v_revision;
end;
$$;

create or replace function public.rotate_list_key(
  p_list_id uuid,
  p_expected_list_revision bigint,
  p_new_key_version integer,
  p_envelopes jsonb
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := private.require_actor();
  v_list public.encrypted_lists%rowtype;
  v_revision bigint;
begin
  perform private.require_list_role(p_list_id, 'full');
  select * into v_list
  from public.encrypted_lists
  where id = p_list_id and deleted_at is null
  for update;
  if not found then
    raise exception 'List not found' using errcode = 'P0002';
  end if;
  if v_list.revision <> p_expected_list_revision
    or p_new_key_version <> v_list.current_key_version + 1 then
    raise exception 'List revision or key version conflict' using errcode = '40001';
  end if;

  perform private.install_key_envelopes(
    p_list_id, p_new_key_version, p_envelopes, null, v_actor
  );
  update public.encrypted_lists
  set current_key_version = p_new_key_version,
      revision = revision + 1,
      updated_at = now()
  where id = p_list_id
  returning revision into v_revision;
  update public.list_invitations
  set revoked_at = now(), revoked_by = v_actor
  where list_id = p_list_id and used_at is null and revoked_at is null;
  return v_revision;
end;
$$;

create or replace function public.remove_list_member(
  p_list_id uuid,
  p_user_id uuid,
  p_expected_list_revision bigint,
  p_expected_member_revision bigint,
  p_new_key_version integer,
  p_envelopes jsonb
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := private.require_actor();
  v_list public.encrypted_lists%rowtype;
  v_member public.list_memberships%rowtype;
  v_revision bigint;
begin
  perform private.require_list_role(p_list_id, 'full');
  if p_user_id = v_actor then
    raise exception 'Use leave_list for your own membership' using errcode = '22023';
  end if;

  select * into v_list from public.encrypted_lists
  where id = p_list_id and deleted_at is null for update;
  select * into v_member from public.list_memberships
  where list_id = p_list_id and user_id = p_user_id and state = 'active' for update;

  if v_list.id is null or v_member.user_id is null then
    raise exception 'Active member not found' using errcode = 'P0002';
  end if;
  if v_member.role = 'owner' then
    raise exception 'The owner cannot be removed' using errcode = '42501';
  end if;
  if v_list.revision <> p_expected_list_revision
    or v_member.revision <> p_expected_member_revision
    or p_new_key_version <> v_list.current_key_version + 1 then
    raise exception 'List, membership, or key version conflict' using errcode = '40001';
  end if;

  perform private.install_key_envelopes(
    p_list_id, p_new_key_version, p_envelopes, p_user_id, v_actor
  );
  update public.list_memberships
  set state = 'removed',
      revision = revision + 1,
      updated_at = now(),
      removed_at = now(),
      removed_by = v_actor
  where list_id = p_list_id and user_id = p_user_id;
  update public.encrypted_lists
  set current_key_version = p_new_key_version,
      revision = revision + 1,
      updated_at = now()
  where id = p_list_id
  returning revision into v_revision;
  update public.list_invitations
  set revoked_at = now(), revoked_by = v_actor
  where list_id = p_list_id and used_at is null and revoked_at is null;
  return v_revision;
end;
$$;

create or replace function public.leave_list(
  p_list_id uuid,
  p_expected_list_revision bigint,
  p_expected_member_revision bigint,
  p_new_key_version integer,
  p_envelopes jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := private.require_actor();
  v_list public.encrypted_lists%rowtype;
  v_member public.list_memberships%rowtype;
begin
  perform private.require_list_role(p_list_id, 'read');
  select * into v_list from public.encrypted_lists
  where id = p_list_id and deleted_at is null for update;
  select * into v_member from public.list_memberships
  where list_id = p_list_id and user_id = v_actor and state = 'active' for update;
  if v_member.role = 'owner' then
    raise exception 'Transfer ownership before leaving' using errcode = '42501';
  end if;
  if v_list.revision <> p_expected_list_revision
    or v_member.revision <> p_expected_member_revision
    or p_new_key_version <> v_list.current_key_version + 1 then
    raise exception 'List, membership, or key version conflict' using errcode = '40001';
  end if;

  -- A departing member still possesses the current key and can wrap the next
  -- version for the members who remain.
  perform private.install_key_envelopes(
    p_list_id, p_new_key_version, p_envelopes, v_actor, v_actor
  );
  update public.list_memberships
  set state = 'removed', revision = revision + 1, updated_at = now(),
      removed_at = now(), removed_by = v_actor
  where list_id = p_list_id and user_id = v_actor;
  update public.encrypted_lists
  set current_key_version = p_new_key_version, revision = revision + 1, updated_at = now()
  where id = p_list_id;
  update public.list_invitations
  set revoked_at = now(), revoked_by = v_actor
  where list_id = p_list_id and used_at is null and revoked_at is null;
end;
$$;

create or replace function public.transfer_list_ownership(
  p_list_id uuid,
  p_new_owner_id uuid,
  p_former_owner_role public.planner_role,
  p_expected_list_revision bigint,
  p_expected_new_owner_revision bigint,
  p_new_key_version integer default null,
  p_envelopes jsonb default null
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := private.require_actor();
  v_list public.encrypted_lists%rowtype;
  v_new_owner public.list_memberships%rowtype;
  v_revision bigint;
begin
  perform private.require_list_role(p_list_id, 'owner');
  if p_new_owner_id is null or p_new_owner_id = v_actor then
    raise exception 'Choose another active member as owner' using errcode = '22023';
  end if;
  if p_former_owner_role = 'owner' then
    raise exception 'The former owner role must change after transfer' using errcode = '22023';
  end if;

  select * into v_list from public.encrypted_lists
  where id = p_list_id and owner_id = v_actor and deleted_at is null for update;
  select * into v_new_owner from public.list_memberships
  where list_id = p_list_id and user_id = p_new_owner_id and state = 'active' for update;

  if v_list.id is null or v_new_owner.user_id is null then
    raise exception 'New owner must be an active list member' using errcode = 'P0002';
  end if;
  if v_list.revision <> p_expected_list_revision
    or v_new_owner.revision <> p_expected_new_owner_revision then
    raise exception 'List or membership revision conflict' using errcode = '40001';
  end if;

  set constraints all deferred;
  if p_former_owner_role is null then
    if p_new_key_version is null
      or p_new_key_version <> v_list.current_key_version + 1
      or p_envelopes is null then
      raise exception 'Removing the former owner requires a rotated key envelope set'
        using errcode = '22023';
    end if;
    perform private.install_key_envelopes(
      p_list_id, p_new_key_version, p_envelopes, v_actor, v_actor
    );
    update public.list_memberships
    set state = 'removed',
        revision = revision + 1,
        updated_at = now(),
        removed_at = now(),
        removed_by = v_actor
    where list_id = p_list_id and user_id = v_actor;
  else
    if p_new_key_version is not null or p_envelopes is not null then
      raise exception 'Key rotation is only accepted when removing the former owner'
        using errcode = '22023';
    end if;
    update public.list_memberships
    set role = p_former_owner_role,
        revision = revision + 1,
        updated_at = now()
    where list_id = p_list_id and user_id = v_actor;
  end if;

  update public.list_memberships
  set role = 'owner',
      revision = revision + 1,
      updated_at = now()
  where list_id = p_list_id and user_id = p_new_owner_id;

  update public.encrypted_lists
  set owner_id = p_new_owner_id,
      current_key_version = coalesce(p_new_key_version, current_key_version),
      revision = revision + 1,
      updated_at = now()
  where id = p_list_id
  returning revision into v_revision;

  if p_former_owner_role is null then
    update public.list_invitations
    set revoked_at = now(), revoked_by = v_actor
    where list_id = p_list_id and used_at is null and revoked_at is null;
  end if;
  return v_revision;
end;
$$;

create or replace function public.create_encrypted_task(
  p_list_id uuid,
  p_task_id uuid,
  p_ciphertext text,
  p_iv text,
  p_key_version integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := private.require_actor();
begin
  perform private.require_list_role(p_list_id, 'write');
  if p_task_id is null or coalesce(p_ciphertext, '') = '' or coalesce(p_iv, '') = '' then
    raise exception 'Encrypted task content is required' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.encrypted_lists
    where id = p_list_id and deleted_at is null and current_key_version = p_key_version
  ) then
    raise exception 'Task key version conflict' using errcode = '40001';
  end if;

  insert into public.encrypted_tasks (
    id, list_id, creator_id, ciphertext, iv, key_version
  ) values (
    p_task_id, p_list_id, v_actor, p_ciphertext, p_iv, p_key_version
  );
  update public.encrypted_lists
  set revision = revision + 1, updated_at = now()
  where id = p_list_id;
  return p_task_id;
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
  v_revision bigint;
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
      revision = revision + 1,
      updated_at = now()
  where id = p_task_id
    and list_id = p_list_id
    and deleted_at is null
    and revision = p_expected_revision
  returning revision into v_revision;
  if not found then
    raise exception 'Task revision conflict' using errcode = '40001';
  end if;
  update public.encrypted_lists
  set revision = revision + 1, updated_at = now()
  where id = p_list_id;
  return v_revision;
end;
$$;

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
  v_revision bigint;
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
      revision = revision + 1,
      updated_at = now()
  where id = p_task_id
    and list_id = p_source_list_id
    and revision = p_expected_revision
  returning revision into v_revision;

  for v_comment in
    select item from jsonb_array_elements(coalesce(p_comments, '[]'::jsonb)) as item
  loop
    update public.encrypted_comments
    set list_id = p_destination_list_id,
        ciphertext = v_comment->>'ciphertext',
        iv = v_comment->>'iv',
        key_version = p_key_version,
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

  return v_revision;
end;
$$;

create or replace function public.set_encrypted_task_deleted(
  p_list_id uuid,
  p_task_id uuid,
  p_deleted boolean,
  p_expected_revision bigint
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_revision bigint;
begin
  perform private.require_list_role(p_list_id, 'write');
  update public.encrypted_tasks
  set deleted_at = case when p_deleted then now() else null end,
      revision = revision + 1,
      updated_at = now()
  where id = p_task_id
    and list_id = p_list_id
    and revision = p_expected_revision
  returning revision into v_revision;
  if not found then
    raise exception 'Task revision conflict' using errcode = '40001';
  end if;
  update public.encrypted_lists
  set revision = revision + 1, updated_at = now()
  where id = p_list_id;
  return v_revision;
end;
$$;

create or replace function public.create_encrypted_attachment(
  p_list_id uuid,
  p_task_id uuid,
  p_attachment_id uuid,
  p_chunk_count integer,
  p_encrypted_byte_size bigint,
  p_key_version integer
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := private.require_actor();
begin
  perform private.require_list_role(p_list_id, 'write');
  if p_attachment_id is null or p_chunk_count <= 0 or p_encrypted_byte_size < 0 then
    raise exception 'Invalid encrypted attachment metadata' using errcode = '22023';
  end if;
  if not exists (
    select 1
    from public.encrypted_tasks as task_row
    join public.encrypted_lists as list_row on list_row.id = task_row.list_id
    where task_row.id = p_task_id
      and task_row.list_id = p_list_id
      and task_row.deleted_at is null
      and list_row.deleted_at is null
      and list_row.current_key_version = p_key_version
  ) then
    raise exception 'Task or attachment key version is unavailable' using errcode = '40001';
  end if;

  insert into public.encrypted_attachment_metadata (
    id, list_id, task_id, uploader_id, chunk_count,
    encrypted_byte_size, key_version
  ) values (
    p_attachment_id, p_list_id, p_task_id, v_actor, p_chunk_count,
    p_encrypted_byte_size, p_key_version
  );
  return p_attachment_id;
end;
$$;

create or replace function public.delete_encrypted_attachment(
  p_list_id uuid,
  p_attachment_id uuid,
  p_expected_revision bigint
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := private.require_actor();
  v_role public.planner_role;
  v_attachment public.encrypted_attachment_metadata%rowtype;
  v_revision bigint;
begin
  v_role := private.require_list_role(p_list_id, 'write');
  select * into v_attachment
  from public.encrypted_attachment_metadata
  where id = p_attachment_id and list_id = p_list_id
  for update;
  if not found then
    raise exception 'Attachment not found' using errcode = 'P0002';
  end if;
  if v_attachment.uploader_id <> v_actor
    and private.role_rank(v_role) < private.role_rank('full') then
    raise exception 'Only the uploader or a full member can delete this attachment'
      using errcode = '42501';
  end if;
  if v_attachment.revision <> p_expected_revision then
    raise exception 'Attachment revision conflict' using errcode = '40001';
  end if;

  update public.encrypted_attachment_metadata
  set deleted_at = now(), revision = revision + 1, updated_at = now()
  where id = p_attachment_id
  returning revision into v_revision;
  return v_revision;
end;
$$;

create or replace function public.create_encrypted_comment(
  p_list_id uuid,
  p_task_id uuid,
  p_comment_id uuid,
  p_parent_comment_id uuid,
  p_ciphertext text,
  p_iv text,
  p_key_version integer,
  p_mentioned_user_ids uuid[] default '{}'::uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := private.require_actor();
begin
  perform private.require_list_role(p_list_id, 'comment');
  if p_comment_id is null or coalesce(p_ciphertext, '') = '' or coalesce(p_iv, '') = '' then
    raise exception 'Encrypted comment content is required' using errcode = '22023';
  end if;
  if not exists (
    select 1
    from public.encrypted_tasks as task_row
    join public.encrypted_lists as list_row on list_row.id = task_row.list_id
    where task_row.id = p_task_id
      and task_row.list_id = p_list_id
      and task_row.deleted_at is null
      and list_row.deleted_at is null
      and list_row.current_key_version = p_key_version
  ) then
    raise exception 'Task or comment key version is unavailable' using errcode = '40001';
  end if;
  if p_parent_comment_id is not null and not exists (
    select 1 from public.encrypted_comments
    where id = p_parent_comment_id
      and list_id = p_list_id
      and task_id = p_task_id
      and deleted_at is null
  ) then
    raise exception 'Parent comment is not in this thread' using errcode = '22023';
  end if;
  if exists (
    select 1
    from unnest(coalesce(p_mentioned_user_ids, '{}'::uuid[])) as mentioned(user_id)
    where mentioned.user_id <> v_actor
      and not exists (
        select 1 from public.list_memberships as member
        where member.list_id = p_list_id
          and member.user_id = mentioned.user_id
          and member.state = 'active'
      )
  ) then
    raise exception 'Mentioned users must be active list members' using errcode = '42501';
  end if;

  insert into public.encrypted_comments (
    id, list_id, task_id, author_id, parent_comment_id,
    ciphertext, iv, key_version
  ) values (
    p_comment_id, p_list_id, p_task_id, v_actor, p_parent_comment_id,
    p_ciphertext, p_iv, p_key_version
  );

  insert into public.comment_mentions (comment_id, mentioned_user_id)
  select p_comment_id, distinct_mention.user_id
  from (
    select distinct mentioned.user_id
    from unnest(coalesce(p_mentioned_user_ids, '{}'::uuid[])) as mentioned(user_id)
    where mentioned.user_id <> v_actor
  ) as distinct_mention;

  insert into public.notification_jobs (
    recipient_id, list_id, task_id, comment_id, kind
  )
  select
    recipient.user_id,
    p_list_id,
    p_task_id,
    p_comment_id,
    case
      when bool_or(recipient.is_mentioned) then 'mention'::public.planner_notification_kind
      else 'reply'::public.planner_notification_kind
    end
  from (
    select distinct_mention.user_id, true as is_mentioned
    from (
      select distinct mentioned.user_id
      from unnest(coalesce(p_mentioned_user_ids, '{}'::uuid[])) as mentioned(user_id)
      where mentioned.user_id <> v_actor
    ) as distinct_mention
    union all
    select previous.author_id, false
    from public.encrypted_comments as previous
    where previous.list_id = p_list_id
      and previous.task_id = p_task_id
      and previous.author_id <> v_actor
      and previous.id <> p_comment_id
      and previous.deleted_at is null
  ) as recipient
  join public.list_memberships as member
    on member.list_id = p_list_id
    and member.user_id = recipient.user_id
    and member.state = 'active'
  group by recipient.user_id
  on conflict (comment_id, recipient_id) do update
    set kind = case
      when excluded.kind = 'mention'::public.planner_notification_kind
        then 'mention'::public.planner_notification_kind
      else public.notification_jobs.kind
    end,
    updated_at = now();

  insert into public.thread_reads (list_id, task_id, user_id, last_read_at)
  values (p_list_id, p_task_id, v_actor, now())
  on conflict (list_id, task_id, user_id) do update
    set last_read_at = excluded.last_read_at;
  return p_comment_id;
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
  v_revision bigint;
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
      revision = revision + 1,
      updated_at = now()
  where id = p_comment_id
    and list_id = p_list_id
    and author_id = v_actor
    and deleted_at is null
    and revision = p_expected_revision
  returning revision into v_revision;
  if not found then
    raise exception 'Only the author can edit this comment at the expected revision'
      using errcode = '42501';
  end if;
  return v_revision;
end;
$$;

create or replace function public.delete_encrypted_comment(
  p_list_id uuid,
  p_comment_id uuid,
  p_expected_revision bigint
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := private.require_actor();
  v_role public.planner_role;
  v_comment public.encrypted_comments%rowtype;
  v_revision bigint;
begin
  v_role := private.require_list_role(p_list_id, 'comment');
  select * into v_comment
  from public.encrypted_comments
  where id = p_comment_id and list_id = p_list_id and deleted_at is null
  for update;
  if not found then
    raise exception 'Comment not found' using errcode = 'P0002';
  end if;
  if v_comment.author_id <> v_actor
    and private.role_rank(v_role) < private.role_rank('full') then
    raise exception 'Only the author or a full member can moderate this comment'
      using errcode = '42501';
  end if;
  if v_comment.revision <> p_expected_revision then
    raise exception 'Comment revision conflict' using errcode = '40001';
  end if;

  update public.encrypted_comments
  set deleted_at = now(), revision = revision + 1, updated_at = now()
  where id = p_comment_id
  returning revision into v_revision;
  return v_revision;
end;
$$;

create or replace function public.mark_comment_thread_read(
  p_list_id uuid,
  p_task_id uuid,
  p_read_at timestamptz default now()
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := private.require_actor();
begin
  perform private.require_list_role(p_list_id, 'read');
  if not exists (
    select 1 from public.encrypted_tasks
    where id = p_task_id and list_id = p_list_id
  ) then
    raise exception 'Task not found' using errcode = 'P0002';
  end if;
  insert into public.thread_reads (list_id, task_id, user_id, last_read_at)
  values (p_list_id, p_task_id, v_actor, coalesce(p_read_at, now()))
  on conflict (list_id, task_id, user_id) do update
    set last_read_at = greatest(public.thread_reads.last_read_at, excluded.last_read_at);
  return coalesce(p_read_at, now());
end;
$$;

create or replace function public.upsert_push_subscription(
  p_subscription_id uuid,
  p_endpoint text,
  p_p256dh text,
  p_auth text,
  p_platform public.planner_push_platform,
  p_expiration_time timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := private.require_actor();
  v_existing_owner uuid;
begin
  if p_subscription_id is null
    or coalesce(p_endpoint, '') !~ '^https://'
    or coalesce(p_p256dh, '') = ''
    or coalesce(p_auth, '') = ''
    or p_platform is null then
    raise exception 'Invalid push subscription' using errcode = '22023';
  end if;

  select user_id into v_existing_owner
  from public.push_subscriptions
  where id = p_subscription_id or endpoint = p_endpoint
  for update;
  if found and v_existing_owner <> v_actor then
    raise exception 'Push subscription belongs to another identity' using errcode = '42501';
  end if;

  insert into public.push_subscriptions (
    id, user_id, endpoint, p256dh, auth, platform, expiration_time
  ) values (
    p_subscription_id, v_actor, p_endpoint, p_p256dh, p_auth, p_platform,
    p_expiration_time
  )
  on conflict (id) do update
    set endpoint = excluded.endpoint,
        p256dh = excluded.p256dh,
        auth = excluded.auth,
        platform = excluded.platform,
        expiration_time = excluded.expiration_time,
        updated_at = now()
    where public.push_subscriptions.user_id = v_actor;
  return p_subscription_id;
end;
$$;

create or replace function public.delete_push_subscription(p_subscription_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := private.require_actor();
begin
  delete from public.push_subscriptions
  where id = p_subscription_id and user_id = v_actor;
  if not found then
    raise exception 'Push subscription not found' using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.create_identity_handoff(
  p_handoff_id uuid,
  p_secret_hash text,
  p_expires_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := private.require_actor();
begin
  if not private.current_user_is_anonymous() then
    raise exception 'Only an anonymous identity can create a handoff'
      using errcode = '42501';
  end if;
  if p_handoff_id is null
    or coalesce(p_secret_hash, '') !~ '^[0-9a-f]{64}$'
    or p_expires_at <= now()
    or p_expires_at > now() + interval '15 minutes' then
    raise exception 'Identity handoff must expire within fifteen minutes'
      using errcode = '22023';
  end if;

  insert into public.identity_handoffs (
    id, secret_hash, source_user_id, expires_at
  ) values (
    p_handoff_id, p_secret_hash, v_actor, p_expires_at
  );
  return p_handoff_id;
end;
$$;

create or replace function public.claim_identity_handoff(
  p_handoff_id uuid,
  p_secret text,
  p_rewrapped_keys jsonb,
  p_reencrypted_profiles jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := private.require_actor();
  v_handoff public.identity_handoffs%rowtype;
  v_source_id uuid;
  v_expected_count integer;
  v_item_count integer;
  v_distinct_count integer;
  v_source_member record;
begin
  if private.current_user_is_anonymous() then
    raise exception 'Sign in before claiming an anonymous identity'
      using errcode = '42501';
  end if;
  if jsonb_typeof(p_rewrapped_keys) <> 'array' then
    raise exception 'Rewrapped keys must be a JSON array' using errcode = '22023';
  end if;
  if jsonb_typeof(p_reencrypted_profiles) <> 'array' then
    raise exception 'Re-encrypted profiles must be a JSON array' using errcode = '22023';
  end if;

  select * into v_handoff
  from public.identity_handoffs
  where id = p_handoff_id
  for update;
  if not found
    or v_handoff.used_at is not null
    or v_handoff.expires_at <= now()
    or v_handoff.secret_hash <> encode(extensions.digest(p_secret, 'sha256'), 'hex') then
    raise exception 'Identity handoff is invalid, expired, or already used'
      using errcode = '42501';
  end if;
  v_source_id := v_handoff.source_user_id;
  if v_source_id = v_actor then
    raise exception 'A different signed-in identity is required' using errcode = '22023';
  end if;
  if not coalesce((
    select identity_row.is_anonymous
    from public.collaboration_identities as identity_row
    where identity_row.user_id = v_source_id
  ), false) then
    raise exception 'Identity handoff source is not anonymous' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.collaboration_identities where user_id = v_actor
  ) then
    raise exception 'Register the destination collaboration identity first'
      using errcode = '42501';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_rewrapped_keys) as item
    where jsonb_typeof(item) <> 'object'
      or coalesce(item->>'list_id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      or coalesce(item->>'key_version', '') !~ '^[1-9][0-9]*$'
      or coalesce(item->>'wrapped_key', '') = ''
      or coalesce(item->>'wrapped_key_iv', '') = ''
      or not exists (
        select 1
        from public.list_memberships as source_member
        join public.list_key_envelopes as source_envelope
          on source_envelope.list_id = source_member.list_id
          and source_envelope.user_id = source_member.user_id
        where source_member.list_id = (item->>'list_id')::uuid
          and source_member.user_id = v_source_id
          and source_member.state = 'active'
          and source_envelope.key_version = (item->>'key_version')::integer
      )
  ) then
    raise exception 'Rewrapped keys must match active source memberships'
      using errcode = '22023';
  end if;

  select count(*) into v_expected_count
  from public.list_key_envelopes as source_envelope
  join public.list_memberships as source_member
    on source_member.list_id = source_envelope.list_id
    and source_member.user_id = source_envelope.user_id
  where source_member.user_id = v_source_id and source_member.state = 'active';
  select
    count(*),
    count(distinct (item->>'list_id', item->>'key_version'))
  into v_item_count, v_distinct_count
  from jsonb_array_elements(p_rewrapped_keys) as item;
  if v_item_count <> v_expected_count or v_distinct_count <> v_expected_count then
    raise exception 'Rewrapped keys must exactly match active source memberships'
      using errcode = '22023';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(p_reencrypted_profiles) as profile
    where jsonb_typeof(profile) <> 'object'
      or coalesce(profile->>'list_id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      or coalesce(profile->>'key_version', '') !~ '^[1-9][0-9]*$'
      or coalesce(profile->>'ciphertext', '') = ''
      or coalesce(profile->>'iv', '') = ''
      or not exists (
        select 1
        from public.list_memberships as source_member
        join public.encrypted_lists as list_row on list_row.id = source_member.list_id
        where source_member.list_id = (profile->>'list_id')::uuid
          and source_member.user_id = v_source_id
          and source_member.state = 'active'
          and list_row.current_key_version = (profile->>'key_version')::integer
      )
  ) then
    raise exception 'Re-encrypted profiles must match current source memberships'
      using errcode = '22023';
  end if;
  select count(*), count(distinct (profile->>'list_id'))
  into v_item_count, v_distinct_count
  from jsonb_array_elements(p_reencrypted_profiles) as profile;
  if v_item_count <> (
      select count(*) from public.list_memberships
      where user_id = v_source_id and state = 'active'
    ) or v_distinct_count <> v_item_count then
    raise exception 'Re-encrypted profiles must exactly match active source memberships'
      using errcode = '22023';
  end if;

  set constraints all deferred;
  for v_source_member in
    select member.*, list_row.current_key_version
    from public.list_memberships as member
    join public.encrypted_lists as list_row on list_row.id = member.list_id
    where member.user_id = v_source_id and member.state = 'active'
    for update of member, list_row
  loop
    insert into public.list_memberships (
      list_id, user_id, role, state, revision, joined_at, updated_at,
      removed_at, removed_by
    ) values (
      v_source_member.list_id, v_actor, v_source_member.role, 'active', 1,
      v_source_member.joined_at, now(), null, null
    )
    on conflict (list_id, user_id) do update
      set role = case
        when excluded.role = 'owner' then 'owner'::public.planner_role
        when public.list_memberships.role = 'owner' then 'owner'::public.planner_role
        when private.role_rank(excluded.role) > private.role_rank(public.list_memberships.role)
          then excluded.role
        else public.list_memberships.role
      end,
      state = 'active',
      revision = public.list_memberships.revision + 1,
      updated_at = now(),
      removed_at = null,
      removed_by = null;

    insert into public.list_key_envelopes (
      list_id, user_id, key_version, wrapped_key, wrapped_key_iv, created_by
    )
    select
      v_source_member.list_id,
      v_actor,
      (item->>'key_version')::integer,
      item->>'wrapped_key',
      item->>'wrapped_key_iv',
      v_actor
    from jsonb_array_elements(p_rewrapped_keys) as item
    where (item->>'list_id')::uuid = v_source_member.list_id
    on conflict (list_id, user_id, key_version) do update
      set wrapped_key = excluded.wrapped_key,
          wrapped_key_iv = excluded.wrapped_key_iv,
          created_by = excluded.created_by,
          created_at = now();

    if v_source_member.role = 'owner' then
      update public.encrypted_lists
      set owner_id = v_actor, revision = revision + 1, updated_at = now()
      where id = v_source_member.list_id;
    end if;

    insert into public.encrypted_member_profiles (
      list_id, user_id, ciphertext, iv, key_version, revision, created_at, updated_at
    )
    select
      v_source_member.list_id,
      v_actor,
      profile->>'ciphertext',
      profile->>'iv',
      (profile->>'key_version')::integer,
      1,
      now(),
      now()
    from jsonb_array_elements(p_reencrypted_profiles) as profile
    where (profile->>'list_id')::uuid = v_source_member.list_id
    on conflict (list_id, user_id) do nothing;
    delete from public.encrypted_member_profiles
    where list_id = v_source_member.list_id and user_id = v_source_id;

    update public.list_memberships
    set state = 'removed',
        revision = revision + 1,
        updated_at = now(),
        removed_at = now(),
        removed_by = v_actor
    where list_id = v_source_member.list_id and user_id = v_source_id;
  end loop;

  update public.encrypted_tasks set creator_id = v_actor where creator_id = v_source_id;
  update public.encrypted_comments set author_id = v_actor where author_id = v_source_id;
  update public.encrypted_attachment_metadata set uploader_id = v_actor where uploader_id = v_source_id;

  insert into public.comment_mentions (comment_id, mentioned_user_id, created_at)
  select comment_id, v_actor, created_at
  from public.comment_mentions
  where mentioned_user_id = v_source_id
  on conflict (comment_id, mentioned_user_id) do nothing;
  delete from public.comment_mentions where mentioned_user_id = v_source_id;

  insert into public.thread_reads (list_id, task_id, user_id, last_read_at)
  select list_id, task_id, v_actor, max(last_read_at)
  from public.thread_reads
  where user_id = v_source_id
  group by list_id, task_id
  on conflict (list_id, task_id, user_id) do update
    set last_read_at = greatest(public.thread_reads.last_read_at, excluded.last_read_at);
  delete from public.thread_reads where user_id = v_source_id;

  delete from public.notification_jobs as source_job
  using public.notification_jobs as destination_job
  where source_job.recipient_id = v_source_id
    and destination_job.recipient_id = v_actor
    and destination_job.comment_id = source_job.comment_id;
  update public.notification_jobs set recipient_id = v_actor
  where recipient_id = v_source_id;

  delete from public.push_subscriptions as source_subscription
  using public.push_subscriptions as destination_subscription
  where source_subscription.user_id = v_source_id
    and destination_subscription.user_id = v_actor
    and destination_subscription.endpoint = source_subscription.endpoint;
  update public.push_subscriptions set user_id = v_actor, updated_at = now()
  where user_id = v_source_id;

  update public.identity_handoffs
  set used_at = now(), used_by = v_actor
  where id = p_handoff_id;
  return v_source_id;
end;
$$;

insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
)
values (
  'daily-planner-encrypted-attachments',
  'daily-planner-encrypted-attachments',
  false,
  null,
  array['application/octet-stream']::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = null,
    allowed_mime_types = array['application/octet-stream']::text[];

create or replace function private.can_read_attachment_object(p_name text)
returns boolean
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_parts text[];
  v_list_id uuid;
  v_attachment_id uuid;
  v_chunk_index integer;
begin
  if v_actor is null then
    return false;
  end if;
  v_parts := string_to_array(p_name, '/');
  if cardinality(v_parts) <> 3
    or v_parts[1] !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    or v_parts[2] !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    or v_parts[3] !~ '^[0-9]{6}\.bin$' then
    return false;
  end if;
  v_list_id := v_parts[1]::uuid;
  v_attachment_id := v_parts[2]::uuid;
  v_chunk_index := substring(v_parts[3] from '^([0-9]{6})\.bin$')::integer;

  return exists (
    select 1
    from public.encrypted_attachment_metadata as attachment
    join public.list_memberships as member
      on member.list_id = attachment.list_id
    where attachment.id = v_attachment_id
      and attachment.list_id = v_list_id
      and attachment.deleted_at is null
      and v_chunk_index >= 0
      and v_chunk_index < attachment.chunk_count
      and member.user_id = v_actor
      and member.state = 'active'
  );
exception
  when invalid_text_representation or numeric_value_out_of_range then
    return false;
end;
$$;

create or replace function private.can_write_attachment_object(p_name text)
returns boolean
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_parts text[];
  v_list_id uuid;
  v_attachment_id uuid;
  v_chunk_index integer;
begin
  if v_actor is null then
    return false;
  end if;
  v_parts := string_to_array(p_name, '/');
  if cardinality(v_parts) <> 3
    or v_parts[1] !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    or v_parts[2] !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    or v_parts[3] !~ '^[0-9]{6}\.bin$' then
    return false;
  end if;
  v_list_id := v_parts[1]::uuid;
  v_attachment_id := v_parts[2]::uuid;
  v_chunk_index := substring(v_parts[3] from '^([0-9]{6})\.bin$')::integer;

  return exists (
    select 1
    from public.encrypted_attachment_metadata as attachment
    join public.list_memberships as member
      on member.list_id = attachment.list_id
    where attachment.id = v_attachment_id
      and attachment.list_id = v_list_id
      and attachment.deleted_at is null
      and v_chunk_index >= 0
      and v_chunk_index < attachment.chunk_count
      and member.user_id = v_actor
      and member.state = 'active'
      and private.role_rank(member.role) >= private.role_rank('write')
      and (
        attachment.uploader_id = v_actor
        or private.role_rank(member.role) >= private.role_rank('full')
      )
  );
exception
  when invalid_text_representation or numeric_value_out_of_range then
    return false;
end;
$$;

create or replace function private.can_stage_attachment_object(p_name text)
returns boolean
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_parts text[];
  v_destination_list_id uuid;
  v_attachment_id uuid;
  v_chunk_index integer;
begin
  if v_actor is null then
    return false;
  end if;
  v_parts := string_to_array(p_name, '/');
  if cardinality(v_parts) <> 3
    or v_parts[1] !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    or v_parts[2] !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    or v_parts[3] !~ '^[0-9]{6}\.bin$' then
    return false;
  end if;
  v_destination_list_id := v_parts[1]::uuid;
  v_attachment_id := v_parts[2]::uuid;
  v_chunk_index := substring(v_parts[3] from '^([0-9]{6})\.bin$')::integer;

  return private.has_list_role(v_destination_list_id, 'write')
    and exists (
      select 1
      from public.encrypted_attachment_metadata as attachment
      where attachment.id = v_attachment_id
        and attachment.list_id <> v_destination_list_id
        and attachment.deleted_at is null
        and v_chunk_index >= 0
        and v_chunk_index < attachment.chunk_count
        and private.has_list_role(attachment.list_id, 'write')
    );
exception
  when invalid_text_representation or numeric_value_out_of_range then
    return false;
end;
$$;

drop policy if exists "Planner members can download encrypted attachment chunks"
  on storage.objects;
create policy "Planner members can download encrypted attachment chunks"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'daily-planner-encrypted-attachments'
    and (select private.can_read_attachment_object(name))
  );

drop policy if exists "Planner writers can upload encrypted attachment chunks"
  on storage.objects;
create policy "Planner writers can upload encrypted attachment chunks"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'daily-planner-encrypted-attachments'
    and (
      (select private.can_write_attachment_object(name))
      or (select private.can_stage_attachment_object(name))
    )
  );

drop policy if exists "Planner writers can replace encrypted attachment chunks"
  on storage.objects;
create policy "Planner writers can replace encrypted attachment chunks"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'daily-planner-encrypted-attachments'
    and (
      (select private.can_write_attachment_object(name))
      or (select private.can_stage_attachment_object(name))
    )
  )
  with check (
    bucket_id = 'daily-planner-encrypted-attachments'
    and (
      (select private.can_write_attachment_object(name))
      or (select private.can_stage_attachment_object(name))
    )
  );

drop policy if exists "Planner writers can delete encrypted attachment chunks"
  on storage.objects;
create policy "Planner writers can delete encrypted attachment chunks"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'daily-planner-encrypted-attachments'
    and (
      (select private.can_write_attachment_object(name))
      or (select private.can_stage_attachment_object(name))
    )
  );

create or replace function private.can_access_planner_realtime_topic()
returns boolean
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_topic text := realtime.topic();
  v_list_id uuid;
begin
  if v_actor is null or v_topic is null then
    return false;
  end if;
  if v_topic = 'user:' || v_actor::text then
    return true;
  end if;
  if v_topic !~* '^list:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  v_list_id := substring(v_topic from 6)::uuid;
  return exists (
    select 1 from public.list_memberships
    where list_id = v_list_id and user_id = v_actor and state = 'active'
  );
exception
  when invalid_text_representation then
    return false;
end;
$$;

drop policy if exists "Planner members can receive private collaboration messages"
  on realtime.messages;
create policy "Planner members can receive private collaboration messages"
  on realtime.messages for select to authenticated
  using (
    realtime.messages.extension in ('broadcast', 'presence')
    and realtime.messages.topic = realtime.topic()
    and (select private.can_access_planner_realtime_topic())
  );

drop policy if exists "Planner members can send private collaboration messages"
  on realtime.messages;
create policy "Planner members can send private collaboration messages"
  on realtime.messages for insert to authenticated
  with check (
    realtime.messages.extension in ('broadcast', 'presence')
    and realtime.messages.topic = realtime.topic()
    and (select private.can_access_planner_realtime_topic())
  );

create or replace function private.broadcast_planner_list_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_new jsonb := to_jsonb(new);
  v_old jsonb := to_jsonb(old);
  v_list_id uuid;
begin
  v_list_id := coalesce(
    nullif(v_new->>'list_id', '')::uuid,
    nullif(v_old->>'list_id', '')::uuid,
    case when tg_table_name = 'encrypted_lists' then nullif(v_new->>'id', '')::uuid end,
    case when tg_table_name = 'encrypted_lists' then nullif(v_old->>'id', '')::uuid end
  );
  if v_list_id is null and tg_table_name = 'comment_mentions' then
    select comment_row.list_id into v_list_id
    from public.encrypted_comments as comment_row
    where comment_row.id = coalesce(
      nullif(v_new->>'comment_id', '')::uuid,
      nullif(v_old->>'comment_id', '')::uuid
    );
  end if;
  if v_list_id is null then
    return null;
  end if;

  perform realtime.broadcast_changes(
    'list:' || v_list_id::text,
    tg_op,
    tg_op,
    tg_table_name,
    tg_table_schema,
    new,
    old
  );
  return null;
end;
$$;

create or replace function private.broadcast_identity_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := coalesce(new.user_id, old.user_id);
  v_list_id uuid;
begin
  if tg_op = 'UPDATE'
    and old.public_key is not distinct from new.public_key
    and old.is_anonymous is not distinct from new.is_anonymous then
    return null;
  end if;
  for v_list_id in
    select distinct membership.list_id
    from public.list_memberships as membership
    where membership.user_id = v_user_id
  loop
    perform realtime.broadcast_changes(
      'list:' || v_list_id::text,
      tg_op,
      tg_op,
      tg_table_name,
      tg_table_schema,
      new,
      old
    );
  end loop;
  return null;
end;
$$;

create or replace function private.broadcast_membership_access_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := coalesce(new.user_id, old.user_id);
  v_list_id uuid := coalesce(new.list_id, old.list_id);
  v_role public.planner_role := coalesce(new.role, old.role);
  v_state public.membership_state := coalesce(new.state, old.state);
  v_revision bigint := coalesce(new.revision, old.revision);
begin
  perform realtime.send(
    jsonb_build_object(
      'listId', v_list_id,
      'role', v_role,
      'state', v_state,
      'revision', v_revision
    ),
    'access_changed',
    'user:' || v_user_id::text,
    true
  );
  return null;
end;
$$;

create or replace function private.broadcast_notification_job()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform realtime.send(
    jsonb_build_object(
      'jobId', new.id,
      'listId', new.list_id,
      'taskId', new.task_id,
      'commentId', new.comment_id,
      'kind', new.kind,
      'createdAt', new.created_at
    ),
    'notification_created',
    'user:' || new.recipient_id::text,
    true
  );
  return null;
end;
$$;

create trigger collaboration_identities_broadcast_changes
  after insert or update or delete on public.collaboration_identities
  for each row execute function private.broadcast_identity_change();
create trigger encrypted_lists_broadcast_changes
  after insert or update or delete on public.encrypted_lists
  for each row execute function private.broadcast_planner_list_row();
create trigger list_memberships_broadcast_changes
  after insert or update or delete on public.list_memberships
  for each row execute function private.broadcast_planner_list_row();
create trigger list_memberships_access_changes
  after insert or update or delete on public.list_memberships
  for each row execute function private.broadcast_membership_access_change();
create trigger encrypted_member_profiles_broadcast_changes
  after insert or update or delete on public.encrypted_member_profiles
  for each row execute function private.broadcast_planner_list_row();
create trigger encrypted_tasks_broadcast_changes
  after insert or update or delete on public.encrypted_tasks
  for each row execute function private.broadcast_planner_list_row();
create trigger encrypted_comments_broadcast_changes
  after insert or update or delete on public.encrypted_comments
  for each row execute function private.broadcast_planner_list_row();
create trigger comment_mentions_broadcast_changes
  after insert or update or delete on public.comment_mentions
  for each row execute function private.broadcast_planner_list_row();
create trigger encrypted_attachments_broadcast_changes
  after insert or update or delete on public.encrypted_attachment_metadata
  for each row execute function private.broadcast_planner_list_row();
create trigger notification_jobs_broadcast_insert
  after insert on public.notification_jobs
  for each row execute function private.broadcast_notification_job();

revoke all on public.collaboration_identities from public, anon, authenticated;
revoke all on public.identity_keyrings from public, anon, authenticated;
revoke all on public.encrypted_lists from public, anon, authenticated;
revoke all on public.list_memberships from public, anon, authenticated;
revoke all on public.list_key_envelopes from public, anon, authenticated;
revoke all on public.list_invitations from public, anon, authenticated;
revoke all on public.encrypted_member_profiles from public, anon, authenticated;
revoke all on public.encrypted_tasks from public, anon, authenticated;
revoke all on public.encrypted_comments from public, anon, authenticated;
revoke all on public.comment_mentions from public, anon, authenticated;
revoke all on public.thread_reads from public, anon, authenticated;
revoke all on public.encrypted_attachment_metadata from public, anon, authenticated;
revoke all on public.push_subscriptions from public, anon, authenticated;
revoke all on public.notification_jobs from public, anon, authenticated;
revoke all on public.identity_handoffs from public, anon, authenticated;

grant select on public.collaboration_identities to authenticated;
grant select on public.identity_keyrings to authenticated;
grant select on public.encrypted_lists to authenticated;
grant select on public.list_memberships to authenticated;
grant select on public.list_key_envelopes to authenticated;
grant select on public.list_invitations to authenticated;
grant select on public.encrypted_member_profiles to authenticated;
grant select on public.encrypted_tasks to authenticated;
grant select on public.encrypted_comments to authenticated;
grant select on public.comment_mentions to authenticated;
grant select on public.thread_reads to authenticated;
grant select on public.encrypted_attachment_metadata to authenticated;
grant select on public.push_subscriptions to authenticated;
grant select on public.notification_jobs to authenticated;
grant select on public.identity_handoffs to authenticated;

revoke all on schema private from public, anon, authenticated;
revoke all on all functions in schema private from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.has_list_role(uuid, public.planner_role) to authenticated;
grant execute on function private.can_read_identity(uuid) to authenticated;
grant execute on function private.can_read_attachment_object(text) to authenticated;
grant execute on function private.can_write_attachment_object(text) to authenticated;
grant execute on function private.can_stage_attachment_object(text) to authenticated;
grant execute on function private.can_access_planner_realtime_topic() to authenticated;

do $$
declare
  v_signature regprocedure;
begin
  for v_signature in
    select procedure_row.oid::regprocedure
    from pg_proc as procedure_row
    join pg_namespace as namespace_row
      on namespace_row.oid = procedure_row.pronamespace
    where namespace_row.nspname = 'public'
      and procedure_row.proname = any(array[
        'register_collaboration_identity',
        'update_collaboration_keyring',
        'create_encrypted_list',
        'update_encrypted_list',
        'set_encrypted_list_deleted',
        'upsert_encrypted_member_profile',
        'create_list_invitation',
        'revoke_list_invitation',
        'redeem_list_invitation',
        'set_list_member_role',
        'rotate_list_key',
        'remove_list_member',
        'leave_list',
        'transfer_list_ownership',
        'create_encrypted_task',
        'update_encrypted_task',
        'move_encrypted_task',
        'set_encrypted_task_deleted',
        'create_encrypted_attachment',
        'delete_encrypted_attachment',
        'create_encrypted_comment',
        'update_encrypted_comment',
        'delete_encrypted_comment',
        'mark_comment_thread_read',
        'upsert_push_subscription',
        'delete_push_subscription',
        'create_identity_handoff',
        'claim_identity_handoff'
      ])
  loop
    execute format(
      'revoke all on function %s from public, anon, authenticated',
      v_signature
    );
    execute format('grant execute on function %s to authenticated', v_signature);
  end loop;
end;
$$;

alter default privileges in schema public revoke execute on functions from public;
alter default privileges in schema private revoke execute on functions from public;

comment on table public.encrypted_lists is
  'List content encrypted client-side with AES-256-GCM. key_version authenticates this row; current_key_version selects the key for new writes.';
comment on table public.encrypted_tasks is
  'Task content encrypted client-side; creator identity is immutable attribution metadata.';
comment on table public.encrypted_comments is
  'Comment content encrypted client-side; routing and authorship metadata remain visible.';
comment on table public.encrypted_attachment_metadata is
  'Opaque metadata for independently encrypted attachment chunks stored in a private bucket.';
comment on table public.list_key_envelopes is
  'Versioned list keys individually wrapped to each member public key.';
comment on function public.remove_list_member(uuid, uuid, bigint, bigint, integer, jsonb) is
  'Revokes future access by rotating the list key. It cannot erase keys or plaintext a former member already downloaded.';
