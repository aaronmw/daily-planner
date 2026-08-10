begin;

create temporary table planner_item_function_definitions (
  position bigint generated always as identity,
  definition text not null
) on commit drop;

do $$
declare
  function_row record;
begin
  for function_row in
    select
      procedure_row.oid,
      procedure_row.oid::regprocedure::text as identity,
      procedure_row.proname,
      replace(
        replace(
          replace(pg_get_functiondef(procedure_row.oid), 'TASK', 'ITEM'),
          'Task',
          'Item'
        ),
        'task',
        'item'
      ) as definition
    from pg_proc as procedure_row
    join pg_namespace as namespace_row
      on namespace_row.oid = procedure_row.pronamespace
    where (
      namespace_row.nspname = 'public'
      and procedure_row.proname = any(array[
        'create_encrypted_task',
        'update_encrypted_task',
        'move_encrypted_task',
        'set_encrypted_task_deleted',
        'create_encrypted_attachment',
        'create_encrypted_comment',
        'mark_comment_thread_read',
        'claim_identity_handoff'
      ])
    ) or (
      namespace_row.nspname = 'private'
      and procedure_row.proname = 'broadcast_notification_job'
    )
    order by namespace_row.nspname, procedure_row.proname
  loop
    insert into planner_item_function_definitions (definition)
    values (function_row.definition);

    if function_row.proname = any(array[
      'create_encrypted_task',
      'update_encrypted_task',
      'move_encrypted_task',
      'set_encrypted_task_deleted',
      'create_encrypted_attachment',
      'create_encrypted_comment',
      'mark_comment_thread_read'
    ]) then
      execute format('drop function %s', function_row.identity);
    end if;
  end loop;
end;
$$;

alter table public.encrypted_tasks rename to encrypted_items;
alter table public.encrypted_comments rename column task_id to item_id;
alter table public.thread_reads rename column task_id to item_id;
alter table public.encrypted_attachment_metadata rename column task_id to item_id;
alter table public.notification_jobs rename column task_id to item_id;

do $$
declare
  v_constraint record;
begin
  for v_constraint in
    select
      constraint_catalog.conrelid::regclass as relation,
      constraint_catalog.conname,
      replace(constraint_catalog.conname, 'task', 'item') as next_name
    from pg_constraint as constraint_catalog
    join pg_class as relation_row on relation_row.oid = constraint_catalog.conrelid
    join pg_namespace as namespace_row on namespace_row.oid = relation_row.relnamespace
    where namespace_row.nspname = 'public'
      and constraint_catalog.conname like '%task%'
  loop
    execute format(
      'alter table %s rename constraint %I to %I',
      v_constraint.relation,
      v_constraint.conname,
      v_constraint.next_name
    );
  end loop;
end;
$$;

do $$
declare
  v_index record;
begin
  for v_index in
    select
      namespace_row.nspname,
      index_catalog.relname,
      replace(index_catalog.relname, 'task', 'item') as next_name
    from pg_class as index_catalog
    join pg_namespace as namespace_row on namespace_row.oid = index_catalog.relnamespace
    where namespace_row.nspname = 'public'
      and index_catalog.relkind = 'i'
      and index_catalog.relname like '%task%'
  loop
    execute format(
      'alter index %I.%I rename to %I',
      v_index.nspname,
      v_index.relname,
      v_index.next_name
    );
  end loop;
end;
$$;

do $$
declare
  v_policy record;
begin
  for v_policy in
    select
      policy_catalog.schemaname,
      policy_catalog.tablename,
      policy_catalog.policyname,
      replace(
        replace(policy_catalog.policyname, 'Tasks', 'Items'),
        'tasks',
        'items'
      ) as next_name
    from pg_policies as policy_catalog
    where policy_catalog.schemaname = 'public'
      and policy_catalog.policyname ilike '%task%'
  loop
    execute format(
      'alter policy %I on %I.%I rename to %I',
      v_policy.policyname,
      v_policy.schemaname,
      v_policy.tablename,
      v_policy.next_name
    );
  end loop;
end;
$$;

do $$
declare
  v_trigger record;
begin
  for v_trigger in
    select
      trigger_catalog.tgrelid::regclass as relation,
      trigger_catalog.tgname,
      replace(trigger_catalog.tgname, 'task', 'item') as next_name
    from pg_trigger as trigger_catalog
    join pg_class as relation_row on relation_row.oid = trigger_catalog.tgrelid
    join pg_namespace as namespace_row on namespace_row.oid = relation_row.relnamespace
    where namespace_row.nspname = 'public'
      and not trigger_catalog.tgisinternal
      and trigger_catalog.tgname like '%task%'
  loop
    execute format(
      'alter trigger %I on %s rename to %I',
      v_trigger.tgname,
      v_trigger.relation,
      v_trigger.next_name
    );
  end loop;
end;
$$;

do $$
declare
  function_row record;
begin
  for function_row in
    select definition
    from planner_item_function_definitions
    order by position
  loop
    execute function_row.definition;
  end loop;
end;
$$;

revoke all on function public.create_encrypted_item(uuid, uuid, text, text, integer)
  from public, anon, authenticated;
grant execute on function public.create_encrypted_item(uuid, uuid, text, text, integer)
  to authenticated;
revoke all on function public.update_encrypted_item(uuid, uuid, text, text, integer, bigint)
  from public, anon, authenticated;
grant execute on function public.update_encrypted_item(uuid, uuid, text, text, integer, bigint)
  to authenticated;
revoke all on function public.move_encrypted_item(uuid, uuid, uuid, text, text, integer, bigint, jsonb, uuid[])
  from public, anon, authenticated;
grant execute on function public.move_encrypted_item(uuid, uuid, uuid, text, text, integer, bigint, jsonb, uuid[])
  to authenticated;
revoke all on function public.set_encrypted_item_deleted(uuid, uuid, boolean, bigint)
  from public, anon, authenticated;
grant execute on function public.set_encrypted_item_deleted(uuid, uuid, boolean, bigint)
  to authenticated;
revoke all on function public.create_encrypted_attachment(uuid, uuid, uuid, integer, bigint, integer)
  from public, anon, authenticated;
grant execute on function public.create_encrypted_attachment(uuid, uuid, uuid, integer, bigint, integer)
  to authenticated;
revoke all on function public.create_encrypted_comment(uuid, uuid, uuid, uuid, text, text, integer, uuid[])
  from public, anon, authenticated;
grant execute on function public.create_encrypted_comment(uuid, uuid, uuid, uuid, text, text, integer, uuid[])
  to authenticated;
revoke all on function public.mark_comment_thread_read(uuid, uuid, timestamptz)
  from public, anon, authenticated;
grant execute on function public.mark_comment_thread_read(uuid, uuid, timestamptz)
  to authenticated;

comment on table public.encrypted_items is
  'Item content encrypted client-side; creator identity is immutable attribution metadata.';

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name ilike '%task%'
  ) or exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and column_name ilike '%task%'
  ) or exists (
    select 1
    from pg_proc as procedure_row
    join pg_namespace as namespace_row
      on namespace_row.oid = procedure_row.pronamespace
    where namespace_row.nspname in ('public', 'private')
      and procedure_row.prokind = 'f'
      and pg_get_functiondef(procedure_row.oid) ilike '%task%'
  ) or exists (
    select 1 from pg_policies
    where schemaname = 'public' and policyname ilike '%task%'
  ) or exists (
    select 1
    from pg_class as relation_row
    join pg_namespace as namespace_row on namespace_row.oid = relation_row.relnamespace
    where namespace_row.nspname = 'public'
      and relation_row.relname ilike '%task%'
  ) or exists (
    select 1 from pg_constraint where conname ilike '%task%'
  ) or exists (
    select 1 from pg_trigger
    where not tgisinternal and tgname ilike '%task%'
  ) then
    raise exception 'Task-named collaboration objects remain after the item rename';
  end if;
end;
$$;

commit;
