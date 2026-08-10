begin;

create extension if not exists pgtap with schema extensions;

create temporary table planner_test_results (
  position bigint generated always as identity,
  result text not null
);

create temporary table planner_test_ids (
  owner_id uuid,
  reader_id uuid,
  commenter_id uuid,
  writer_id uuid,
  full_id uuid,
  new_owner_id uuid,
  outsider_id uuid,
  guest_id uuid,
  account_id uuid,
  list_id uuid,
  destination_list_id uuid,
  item_id uuid,
  comment_id uuid,
  reply_id uuid,
  attachment_id uuid
);

insert into planner_test_ids values (
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000003',
  '10000000-0000-4000-8000-000000000004',
  '10000000-0000-4000-8000-000000000005',
  '10000000-0000-4000-8000-000000000006',
  '10000000-0000-4000-8000-000000000007',
  '10000000-0000-4000-8000-000000000008',
  '10000000-0000-4000-8000-000000000009',
  '20000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000002',
  '30000000-0000-4000-8000-000000000001',
  '40000000-0000-4000-8000-000000000001',
  '40000000-0000-4000-8000-000000000002',
  '50000000-0000-4000-8000-000000000001'
);

grant select on planner_test_ids to authenticated;
grant select, insert on planner_test_results to authenticated;
grant usage, select on sequence planner_test_results_position_seq to authenticated;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  is_anonymous, created_at, updated_at
)
select
  '00000000-0000-0000-0000-000000000000',
  fixture.user_id,
  'authenticated',
  'authenticated',
  fixture.user_id::text || '@example.test',
  'not-used',
  now(),
  '{}'::jsonb,
  '{}'::jsonb,
  fixture.user_id = (select guest_id from planner_test_ids),
  now(),
  now()
from (
  select owner_id as user_id from planner_test_ids
  union all select reader_id from planner_test_ids
  union all select commenter_id from planner_test_ids
  union all select writer_id from planner_test_ids
  union all select full_id from planner_test_ids
  union all select new_owner_id from planner_test_ids
  union all select outsider_id from planner_test_ids
  union all select guest_id from planner_test_ids
  union all select account_id from planner_test_ids
) as fixture
on conflict (id) do nothing;

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);

select set_config('request.jwt.claim.sub', owner_id::text, true) from planner_test_ids;
select public.register_collaboration_identity('owner-public', 'owner-private', 'owner-iv');
select set_config('request.jwt.claim.sub', reader_id::text, true) from planner_test_ids;
select public.register_collaboration_identity('reader-public', 'reader-private', 'reader-iv');
select set_config('request.jwt.claim.sub', commenter_id::text, true) from planner_test_ids;
select public.register_collaboration_identity('commenter-public', 'commenter-private', 'commenter-iv');
select set_config('request.jwt.claim.sub', writer_id::text, true) from planner_test_ids;
select public.register_collaboration_identity('writer-public', 'writer-private', 'writer-iv');
select set_config('request.jwt.claim.sub', full_id::text, true) from planner_test_ids;
select public.register_collaboration_identity('full-public', 'full-private', 'full-iv');
select set_config('request.jwt.claim.sub', new_owner_id::text, true) from planner_test_ids;
select public.register_collaboration_identity('new-owner-public', 'new-owner-private', 'new-owner-iv');
select set_config('request.jwt.claim.sub', outsider_id::text, true) from planner_test_ids;
select public.register_collaboration_identity('outsider-public', 'outsider-private', 'outsider-iv');
select set_config('request.jwt.claim.sub', guest_id::text, true) from planner_test_ids;
select public.register_collaboration_identity('guest-public', 'guest-private', 'guest-iv');
select set_config('request.jwt.claim.sub', account_id::text, true) from planner_test_ids;
select public.register_collaboration_identity('account-public', 'account-private', 'account-iv');

insert into planner_test_results (result) select plan(66);

select set_config('request.jwt.claim.sub', owner_id::text, true) from planner_test_ids;
insert into planner_test_results (result) select lives_ok(
  $$ select public.create_encrypted_list(
    (select list_id from planner_test_ids),
    'encrypted-list', 'list-iv', 'owner-wrapped-key', 'owner-wrapped-iv'
  ) $$,
  'owner can create an encrypted list through the RPC'
);

insert into planner_test_results (result) select is(
  (select role::text from public.list_memberships
    where list_id = (select list_id from planner_test_ids)
      and user_id = (select owner_id from planner_test_ids)),
  'owner',
  'list creation installs exactly one owner membership'
);

insert into planner_test_results (result) select is(
  (select key_version from public.list_key_envelopes
    where list_id = (select list_id from planner_test_ids)
      and user_id = (select owner_id from planner_test_ids)),
  1,
  'list creation stores the version-one owner key envelope'
);

insert into planner_test_results (result) select throws_ok(
  $$ insert into public.encrypted_items (
    id, list_id, creator_id, ciphertext, iv, key_version
  ) values (
    '30000000-0000-4000-8000-000000000099',
    (select list_id from planner_test_ids),
    (select owner_id from planner_test_ids), 'direct', 'direct-iv', 1
  ) $$,
  '42501',
  'permission denied for table encrypted_items',
  'authenticated clients cannot mutate content tables directly'
);

insert into planner_test_results (result) select is(
  has_table_privilege('authenticated', 'public.notification_jobs', 'insert'),
  false,
  'authenticated clients cannot enqueue notification jobs directly'
);

insert into planner_test_results (result) select throws_ok(
  $$ update public.list_memberships
    set role = 'read'
    where list_id = (select list_id from planner_test_ids)
      and user_id = (select owner_id from planner_test_ids) $$,
  '42501',
  'permission denied for table list_memberships',
  'authenticated clients cannot bypass owner invariants with direct DML'
);

insert into planner_test_results (result) select throws_ok(
  $$ select public.create_list_invitation(
    (select list_id from planner_test_ids),
    '60000000-0000-4000-8000-000000000099',
    'a9992252dcf9edc4df576f353b472d8c9a602e1c0a96dd1a43df7cb9d58d346d',
    'read', now() + interval '7 days 1 minute'
  ) $$,
  '22023',
  'Invitations must be non-owner, future-dated, and expire within seven days',
  'invitation lifetime is capped at seven days'
);
insert into planner_test_results (result) select throws_ok(
  $$ select public.create_list_invitation(
    (select list_id from planner_test_ids),
    '60000000-0000-4000-8000-000000000098',
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    'owner', now() + interval '1 day'
  ) $$,
  '22023',
  'Invitations must be non-owner, future-dated, and expire within seven days',
  'invitations can never grant the owner role'
);

-- Create one role-specific invitation for every non-owner access level plus a
-- future ownership candidate. The secret itself is never persisted.
select public.create_list_invitation(
  list_id, '60000000-0000-4000-8000-000000000001',
  'f03319dee240faa729e0cfa7ab5ffd80a1d64a127e3643f239009abff6382914',
  'read', now() + interval '7 days'
) from planner_test_ids;
select public.create_list_invitation(
  list_id, '60000000-0000-4000-8000-000000000002',
  '11ad1f53e76e22ae23034d816a7ba2c066b0a584cb09552e15460b2a8c99d86e',
  'comment', now() + interval '7 days'
) from planner_test_ids;
select public.create_list_invitation(
  list_id, '60000000-0000-4000-8000-000000000003',
  'ef80202ea99d7c668a9677d9242456057ac10488311cb8757674490e194a56e1',
  'write', now() + interval '7 days'
) from planner_test_ids;
select public.create_list_invitation(
  list_id, '60000000-0000-4000-8000-000000000004',
  'f96baec90ffe175186263d133b11542f260ee9fb69cd7c312829481585974c7e',
  'full', now() + interval '7 days'
) from planner_test_ids;
select public.create_list_invitation(
  list_id, '60000000-0000-4000-8000-000000000005',
  'f597503b109486107d1547e63c27736ea8606ff1b572dc091d92c55ab07298e8',
  'full', now() + interval '7 days'
) from planner_test_ids;

select set_config('request.jwt.claim.sub', reader_id::text, true) from planner_test_ids;
select * from public.redeem_list_invitation(
  '60000000-0000-4000-8000-000000000001',
  'reader-secret',
  '[{"key_version":1,"wrapped_key":"reader-wrapped","wrapped_key_iv":"reader-wrapped-iv"}]'::jsonb
);
select set_config('request.jwt.claim.sub', commenter_id::text, true) from planner_test_ids;
select * from public.redeem_list_invitation(
  '60000000-0000-4000-8000-000000000002',
  'commenter-secret',
  '[{"key_version":1,"wrapped_key":"commenter-wrapped","wrapped_key_iv":"commenter-wrapped-iv"}]'::jsonb
);
select set_config('request.jwt.claim.sub', writer_id::text, true) from planner_test_ids;
select * from public.redeem_list_invitation(
  '60000000-0000-4000-8000-000000000003',
  'writer-secret',
  '[{"key_version":1,"wrapped_key":"writer-wrapped","wrapped_key_iv":"writer-wrapped-iv"}]'::jsonb
);
select set_config('request.jwt.claim.sub', full_id::text, true) from planner_test_ids;
select * from public.redeem_list_invitation(
  '60000000-0000-4000-8000-000000000004',
  'full-secret',
  '[{"key_version":1,"wrapped_key":"full-wrapped","wrapped_key_iv":"full-wrapped-iv"}]'::jsonb
);
select set_config('request.jwt.claim.sub', new_owner_id::text, true) from planner_test_ids;
select * from public.redeem_list_invitation(
  '60000000-0000-4000-8000-000000000005',
  'new-owner-secret',
  '[{"key_version":1,"wrapped_key":"new-owner-wrapped","wrapped_key_iv":"new-owner-wrapped-iv"}]'::jsonb
);

set local role postgres;
insert into planner_test_results (result) select is(
  (select string_agg(role::text, ',' order by private.role_rank(role))
    from public.list_memberships
    where list_id = (select list_id from planner_test_ids)
      and state = 'active'),
  'read,comment,write,full,full,owner',
  'role-specific invitations preserve the complete access ladder'
);
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);

select set_config('request.jwt.claim.sub', outsider_id::text, true) from planner_test_ids;
insert into planner_test_results (result) select is(
  (select count(*)::integer from public.encrypted_lists),
  0,
  'outsiders cannot read encrypted lists'
);
insert into planner_test_results (result) select throws_ok(
  $$ select * from public.redeem_list_invitation(
    '60000000-0000-4000-8000-000000000001',
    'reader-secret', '[]'::jsonb
  ) $$,
  '42501',
  'Invitation is invalid, expired, revoked, or already used',
  'an invitation is single-use'
);

set local role postgres;
insert into public.list_invitations (
  id, list_id, created_by, role, secret_hash, created_at, expires_at
)
select
  '60000000-0000-4000-8000-000000000006', list_id, owner_id, 'read',
  '4eabed9e8a3fde4331fbd6c5afd4671b61bb4e44c29c0983bbbbb919cda6a800',
  now() - interval '2 days', now() - interval '1 day'
from planner_test_ids;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', outsider_id::text, true) from planner_test_ids;
insert into planner_test_results (result) select throws_ok(
  $$ select * from public.redeem_list_invitation(
    '60000000-0000-4000-8000-000000000006',
    'expired-secret', '[]'::jsonb
  ) $$,
  '42501',
  'Invitation is invalid, expired, revoked, or already used',
  'expired invitations cannot be redeemed'
);

select set_config('request.jwt.claim.sub', reader_id::text, true) from planner_test_ids;
insert into planner_test_results (result) select is(
  (select count(*)::integer from public.encrypted_lists),
  1,
  'read members can load list ciphertext'
);
insert into planner_test_results (result) select throws_ok(
  $$ select public.create_encrypted_item(
    (select list_id from planner_test_ids),
    '30000000-0000-4000-8000-000000000010', 'reader-item', 'reader-iv', 1
  ) $$,
  '42501',
  'Insufficient list access',
  'read members cannot create items'
);
insert into planner_test_results (result) select throws_ok(
  $$ select public.create_encrypted_comment(
    (select list_id from planner_test_ids),
    (select item_id from planner_test_ids),
    '40000000-0000-4000-8000-000000000010', null,
    'reader-comment', 'reader-comment-iv', 1
  ) $$,
  '42501',
  'Insufficient list access',
  'read members cannot comment'
);

select set_config('request.jwt.claim.sub', commenter_id::text, true) from planner_test_ids;
insert into planner_test_results (result) select throws_ok(
  $$ select public.create_encrypted_item(
    (select list_id from planner_test_ids),
    '30000000-0000-4000-8000-000000000011', 'commenter-item', 'commenter-iv', 1
  ) $$,
  '42501',
  'Insufficient list access',
  'comment members cannot mutate items'
);

select set_config('request.jwt.claim.sub', writer_id::text, true) from planner_test_ids;
insert into planner_test_results (result) select lives_ok(
  $$ select public.create_encrypted_list(
    (select destination_list_id from planner_test_ids),
    'encrypted-destination-list', 'destination-list-iv',
    'destination-wrapped-key', 'destination-wrapped-key-iv'
  ) $$,
  'a writer may own a separate encrypted destination list'
);
insert into planner_test_results (result) select lives_ok(
  $$ select public.create_encrypted_item(
    (select list_id from planner_test_ids),
    (select item_id from planner_test_ids), 'writer-item', 'writer-item-iv', 1
  ) $$,
  'write members can create items'
);
insert into planner_test_results (result) select is(
  (select creator_id from public.encrypted_items
    where id = (select item_id from planner_test_ids)),
  (select writer_id from planner_test_ids),
  'item creator attribution is immutable server metadata'
);
insert into planner_test_results (result) select throws_ok(
  $$ select public.update_encrypted_item(
    (select list_id from planner_test_ids),
    (select item_id from planner_test_ids), 'stale', 'stale-iv', 1, 99
  ) $$,
  '40001',
  'Item content revision conflict',
  'item writes enforce optimistic revisions'
);
insert into planner_test_results (result) select throws_ok(
  $$ select public.create_list_invitation(
    (select list_id from planner_test_ids),
    '60000000-0000-4000-8000-000000000020',
    '7abb7c72d4172aaf83f113adaccccd4d961f67fce836c7582f97310c4119c414',
    'read', now() + interval '1 day'
  ) $$,
  '42501',
  'Insufficient list access',
  'write members cannot administer invitations'
);

select set_config('request.jwt.claim.sub', commenter_id::text, true) from planner_test_ids;
insert into planner_test_results (result) select lives_ok(
  $$ select public.create_encrypted_comment(
    (select list_id from planner_test_ids),
    (select item_id from planner_test_ids),
    (select comment_id from planner_test_ids), null,
    'commenter-ciphertext', 'commenter-comment-iv', 1
  ) $$,
  'comment members can add encrypted comments'
);

select set_config('request.jwt.claim.sub', writer_id::text, true) from planner_test_ids;
insert into planner_test_results (result) select lives_ok(
  $$ select public.create_encrypted_comment(
    (select list_id from planner_test_ids),
    (select item_id from planner_test_ids),
    (select reply_id from planner_test_ids),
    (select comment_id from planner_test_ids),
    'reply-ciphertext', 'reply-iv', 1,
    array[(select reader_id from planner_test_ids)]
  ) $$,
  'write members inherit comment access and can mention members'
);

set local role postgres;
insert into planner_test_results (result) select is(
  (select count(*)::integer from public.notification_jobs
    where comment_id = (select reply_id from planner_test_ids)),
  2,
  'mentions and prior thread participants produce deduplicated recipients'
);
insert into planner_test_results (result) select is(
  (select kind::text from public.notification_jobs
    where comment_id = (select reply_id from planner_test_ids)
      and recipient_id = (select reader_id from planner_test_ids)),
  'mention',
  'explicit mentions take precedence over reply notifications'
);
insert into planner_test_results (result) select ok(
  pg_get_functiondef('private.broadcast_notification_job()'::regprocedure)
    not ilike '%''ciphertext''%'
  and pg_get_functiondef('private.broadcast_notification_job()'::regprocedure)
    not ilike '%''iv''%',
  'notification broadcasts contain routing metadata but no encrypted content fields'
);
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);

select set_config('request.jwt.claim.sub', writer_id::text, true) from planner_test_ids;
insert into planner_test_results (result) select throws_ok(
  $$ select public.delete_encrypted_comment(
    (select list_id from planner_test_ids),
    (select comment_id from planner_test_ids), 1
  ) $$,
  '42501',
  'Only the author or a full member can moderate this comment',
  'write members cannot moderate another author comment'
);

select set_config('request.jwt.claim.sub', full_id::text, true) from planner_test_ids;
insert into planner_test_results (result) select lives_ok(
  $$ select public.delete_encrypted_comment(
    (select list_id from planner_test_ids),
    (select comment_id from planner_test_ids), 1
  ) $$,
  'full members can moderate another author comment'
);
insert into planner_test_results (result) select lives_ok(
  $$ select public.set_list_member_role(
    (select list_id from planner_test_ids),
    (select reader_id from planner_test_ids), 'comment', 1
  ) $$,
  'full members can change a non-owner role'
);
select public.set_list_member_role(
  list_id, reader_id, 'read', 2
) from planner_test_ids;

insert into planner_test_results (result) select throws_ok(
  $$ select public.remove_list_member(
    (select list_id from planner_test_ids),
    (select owner_id from planner_test_ids),
    (select revision from public.encrypted_lists
      where id = (select list_id from planner_test_ids)),
    (select revision from public.list_memberships
      where list_id = (select list_id from planner_test_ids)
        and user_id = (select owner_id from planner_test_ids)),
    2, '[]'::jsonb
  ) $$,
  '42501',
  'The owner cannot be removed',
  'full members cannot remove the owner'
);
insert into planner_test_results (result) select throws_ok(
  $$ select public.transfer_list_ownership(
    (select list_id from planner_test_ids),
    (select new_owner_id from planner_test_ids), 'full',
    (select revision from public.encrypted_lists
      where id = (select list_id from planner_test_ids)),
    (select revision from public.list_memberships
      where list_id = (select list_id from planner_test_ids)
        and user_id = (select new_owner_id from planner_test_ids))
  ) $$,
  '42501',
  'Insufficient list access',
  'full members cannot transfer ownership'
);

select set_config('request.jwt.claim.sub', owner_id::text, true) from planner_test_ids;
insert into planner_test_results (result) select lives_ok(
  $$ select public.transfer_list_ownership(
    (select list_id from planner_test_ids),
    (select new_owner_id from planner_test_ids), 'full',
    (select revision from public.encrypted_lists
      where id = (select list_id from planner_test_ids)),
    (select revision from public.list_memberships
      where list_id = (select list_id from planner_test_ids)
        and user_id = (select new_owner_id from planner_test_ids))
  ) $$,
  'the owner can transfer ownership while retaining full access'
);

set local role postgres;
insert into planner_test_results (result) select is(
  (select owner_id from public.encrypted_lists
    where id = (select list_id from planner_test_ids)),
  (select new_owner_id from planner_test_ids),
  'ownership transfer updates the immutable owner pointer atomically'
);
insert into planner_test_results (result) select is(
  (select count(*)::integer from public.list_memberships
    where list_id = (select list_id from planner_test_ids)
      and state = 'active' and role = 'owner'),
  1,
  'ownership transfer preserves exactly one active owner'
);
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);

select set_config('request.jwt.claim.sub', owner_id::text, true) from planner_test_ids;
insert into planner_test_results (result) select throws_ok(
  $$ select public.set_list_member_role(
    (select list_id from planner_test_ids),
    (select new_owner_id from planner_test_ids), 'full',
    (select revision from public.list_memberships
      where list_id = (select list_id from planner_test_ids)
        and user_id = (select new_owner_id from planner_test_ids))
  ) $$,
  '42501',
  'The owner role is immutable outside ownership transfer',
  'former owners with full access still cannot demote the new owner'
);

select set_config('request.jwt.claim.sub', new_owner_id::text, true) from planner_test_ids;
select public.transfer_list_ownership(
  list_id, owner_id, 'full',
  (select revision from public.encrypted_lists where id = planner_test_ids.list_id),
  (select revision from public.list_memberships
    where list_id = planner_test_ids.list_id and user_id = planner_test_ids.owner_id)
) from planner_test_ids;

set local role postgres;
insert into planner_test_results (result) select is(
  (select owner_id from public.encrypted_lists
    where id = (select list_id from planner_test_ids)),
  (select owner_id from planner_test_ids),
  'the appointed owner can transfer ownership back'
);
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);

-- Storage uses opaque paths only. Metadata must exist before a writer can put
-- chunks, and the chunk index must be within the declared count.
select set_config('request.jwt.claim.sub', writer_id::text, true) from planner_test_ids;
select public.create_encrypted_attachment(
  list_id, item_id, attachment_id, 2, 4096,
  (select current_key_version from public.encrypted_lists where id = planner_test_ids.list_id)
) from planner_test_ids;
insert into planner_test_results (result) select lives_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id)
  select
    'daily-planner-encrypted-attachments',
    list_id::text || '/' || attachment_id::text || '/000000.bin',
    writer_id::text
  from planner_test_ids $$,
  'write members can upload their declared encrypted attachment chunks'
);

select set_config('request.jwt.claim.sub', reader_id::text, true) from planner_test_ids;
insert into planner_test_results (result) select is(
  (select count(*)::integer from storage.objects
    where bucket_id = 'daily-planner-encrypted-attachments'),
  1,
  'read members can download encrypted attachment chunks'
);
insert into planner_test_results (result) select throws_ok(
  $$ insert into storage.objects (bucket_id, name, owner_id)
  select
    'daily-planner-encrypted-attachments',
    list_id::text || '/' || attachment_id::text || '/000001.bin',
    reader_id::text
  from planner_test_ids $$,
  '42501',
  'new row violates row-level security policy for table "objects"',
  'read members cannot upload attachment chunks'
);

select set_config('request.jwt.claim.sub', outsider_id::text, true) from planner_test_ids;
insert into planner_test_results (result) select is(
  (select count(*)::integer from storage.objects
    where bucket_id = 'daily-planner-encrypted-attachments'),
  0,
  'outsiders cannot read encrypted attachment chunks'
);

-- Cross-list moves stage opaque encrypted objects at the destination first,
-- then atomically move the item and every relational child under new AAD.
select set_config('request.jwt.claim.sub', writer_id::text, true) from planner_test_ids;
insert into storage.objects (bucket_id, name, owner_id)
select
  'daily-planner-encrypted-attachments',
  list_id::text || '/' || attachment_id::text || '/000001.bin',
  writer_id::text
from planner_test_ids;
insert into storage.objects (bucket_id, name, owner_id)
select
  'daily-planner-encrypted-attachments',
  destination_list_id::text || '/' || attachment_id::text || '/' || chunk_name,
  writer_id::text
from planner_test_ids
cross join (values ('000000.bin'), ('000001.bin')) as chunks(chunk_name);

insert into planner_test_results (result) select lives_ok(
  $$ select public.move_encrypted_item(
    (select list_id from planner_test_ids),
    (select destination_list_id from planner_test_ids),
    (select item_id from planner_test_ids),
    'moved-item-ciphertext', 'moved-item-iv', 1,
    (select revision from public.encrypted_items where id = (select item_id from planner_test_ids)),
    (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', comment_row.id,
        'ciphertext', 'moved-' || comment_row.id::text,
        'iv', 'moved-iv-' || comment_row.id::text,
        'key_version', 1,
        'expected_revision', comment_row.revision
      )), '[]'::jsonb)
      from public.encrypted_comments as comment_row
      where comment_row.item_id = (select item_id from planner_test_ids)
        and comment_row.list_id = (select list_id from planner_test_ids)
    ),
    (
      select coalesce(array_agg(attachment.id), '{}'::uuid[])
      from public.encrypted_attachment_metadata as attachment
      where attachment.item_id = (select item_id from planner_test_ids)
        and attachment.list_id = (select list_id from planner_test_ids)
    )
  ) $$,
  'write members can atomically move an encrypted item between writable lists'
);
insert into planner_test_results (result) select is(
  (select list_id from public.encrypted_items where id = (select item_id from planner_test_ids)),
  (select destination_list_id from planner_test_ids),
  'the encrypted item moves to the destination list'
);
insert into planner_test_results (result) select ok(
  not exists (
    select 1 from public.encrypted_comments
    where item_id = (select item_id from planner_test_ids)
      and list_id <> (select destination_list_id from planner_test_ids)
  ) and not exists (
    select 1 from public.encrypted_attachment_metadata
    where item_id = (select item_id from planner_test_ids)
      and list_id <> (select destination_list_id from planner_test_ids)
  ) and (
    select creator_id = (select writer_id from planner_test_ids)
    from public.encrypted_items where id = (select item_id from planner_test_ids)
  ),
  'comments, attachments, and immutable creator attribution stay coherent after a move'
);
insert into planner_test_results (result) select lives_ok(
  $$ select public.move_encrypted_item(
    (select destination_list_id from planner_test_ids),
    (select list_id from planner_test_ids),
    (select item_id from planner_test_ids),
    'returned-item-ciphertext', 'returned-item-iv', 1,
    (select revision from public.encrypted_items where id = (select item_id from planner_test_ids)),
    (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', comment_row.id,
        'ciphertext', 'returned-' || comment_row.id::text,
        'iv', 'returned-iv-' || comment_row.id::text,
        'key_version', 1,
        'expected_revision', comment_row.revision
      )), '[]'::jsonb)
      from public.encrypted_comments as comment_row
      where comment_row.item_id = (select item_id from planner_test_ids)
        and comment_row.list_id = (select destination_list_id from planner_test_ids)
    ),
    (
      select coalesce(array_agg(attachment.id), '{}'::uuid[])
      from public.encrypted_attachment_metadata as attachment
      where attachment.item_id = (select item_id from planner_test_ids)
        and attachment.list_id = (select destination_list_id from planner_test_ids)
    )
  ) $$,
  'the same encrypted item can move back without orphaning relational children'
);

-- Realtime authorization is private for both list and per-user topics.
select set_config('request.jwt.claim.sub', reader_id::text, true) from planner_test_ids;
select set_config(
  'realtime.topic',
  'list:' || (select list_id::text from planner_test_ids),
  true
);
insert into planner_test_results (result) select ok(
  private.can_access_planner_realtime_topic(),
  'active members can receive their private list topic'
);

select set_config('request.jwt.claim.sub', outsider_id::text, true) from planner_test_ids;
insert into planner_test_results (result) select ok(
  not private.can_access_planner_realtime_topic(),
  'outsiders cannot receive a private list topic'
);

select set_config('request.jwt.claim.sub', reader_id::text, true) from planner_test_ids;
select set_config(
  'realtime.topic',
  'user:' || (select reader_id::text from planner_test_ids),
  true
);
insert into planner_test_results (result) select ok(
  private.can_access_planner_realtime_topic(),
  'notification recipients can receive their private user topic'
);

select set_config('request.jwt.claim.sub', outsider_id::text, true) from planner_test_ids;
insert into planner_test_results (result) select ok(
  not private.can_access_planner_realtime_topic(),
  'outsiders cannot receive another identity user topic'
);

select set_config('request.jwt.claim.sub', reader_id::text, true) from planner_test_ids;
insert into planner_test_results (result) select is(
  (select count(*)::integer from public.notification_jobs
    where recipient_id = (select reader_id from planner_test_ids)),
  1,
  'notification recipients can read only their own routing jobs'
);
select set_config('request.jwt.claim.sub', outsider_id::text, true) from planner_test_ids;
insert into planner_test_results (result) select is(
  (select count(*)::integer from public.notification_jobs),
  0,
  'outsiders cannot read notification jobs'
);

-- Removing a non-owner installs a complete next-version envelope set and
-- revokes all still-open links.
select set_config('request.jwt.claim.sub', full_id::text, true) from planner_test_ids;
insert into planner_test_results (result) select lives_ok(
  $$ select public.remove_list_member(
    (select list_id from planner_test_ids),
    (select commenter_id from planner_test_ids),
    (select revision from public.encrypted_lists
      where id = (select list_id from planner_test_ids)),
    (select revision from public.list_memberships
      where list_id = (select list_id from planner_test_ids)
        and user_id = (select commenter_id from planner_test_ids)),
    (select current_key_version + 1 from public.encrypted_lists
      where id = (select list_id from planner_test_ids)),
    (
      select jsonb_agg(jsonb_build_object(
        'user_id', member.user_id,
        'wrapped_key', 'rotated-' || member.user_id::text,
        'wrapped_key_iv', 'rotated-iv-' || member.user_id::text
      ))
      from public.list_memberships as member
      where member.list_id = (select list_id from planner_test_ids)
        and member.state = 'active'
        and member.user_id <> (select commenter_id from planner_test_ids)
    )
  ) $$,
  'full members can remove a non-owner only with complete rotated envelopes'
);

set local role postgres;
insert into planner_test_results (result) select is(
  (select state::text from public.list_memberships
    where list_id = (select list_id from planner_test_ids)
      and user_id = (select commenter_id from planner_test_ids)),
  'removed',
  'removed memberships remain as historical attribution records'
);
insert into planner_test_results (result) select is(
  (select current_key_version from public.encrypted_lists
    where id = (select list_id from planner_test_ids)),
  2,
  'member removal rotates the current write key version'
);
insert into planner_test_results (result) select is(
  (select key_version from public.encrypted_lists
    where id = (select list_id from planner_test_ids)),
  1,
  'key rotation preserves the key version authenticated by existing list ciphertext'
);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', owner_id::text, true) from planner_test_ids;
select public.update_encrypted_list(
  list_id,
  'reencrypted-list-v2',
  'reencrypted-list-v2-iv',
  2,
  (select content_revision from public.encrypted_lists
    where id = planner_test_ids.list_id)
) from planner_test_ids;
set local role postgres;
insert into planner_test_results (result) select is(
  (select key_version from public.encrypted_lists
    where id = (select list_id from planner_test_ids)),
  2,
  'explicit list re-encryption advances the ciphertext AAD key version'
);

-- Exercise anonymous-to-account identity handoff after the key rotation.
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', full_id::text, true) from planner_test_ids;
select public.create_list_invitation(
  list_id, '60000000-0000-4000-8000-000000000007',
  'c14d572fd83485db6ea9a8c149030c662c061d413d4bc23b895b6619ea06e02a',
  'read', now() + interval '1 day'
) from planner_test_ids;
select set_config('request.jwt.claim.sub', guest_id::text, true) from planner_test_ids;
select * from public.redeem_list_invitation(
  '60000000-0000-4000-8000-000000000007',
  'guest-secret',
  '[
    {"key_version":1,"wrapped_key":"guest-wrapped-v1","wrapped_key_iv":"guest-wrapped-v1-iv"},
    {"key_version":2,"wrapped_key":"guest-wrapped-v2","wrapped_key_iv":"guest-wrapped-v2-iv"}
  ]'::jsonb
);
insert into planner_test_results (result) select is(
  (select count(*)::integer from public.list_key_envelopes
    where list_id = (select list_id from planner_test_ids)
      and user_id = (select guest_id from planner_test_ids)),
  2,
  'members joining after rotation receive every historical list key envelope'
);
select public.create_identity_handoff(
  '70000000-0000-4000-8000-000000000001',
  'e84d5f93df8be94b82b1b1dfa02b309603cc9e8c2f4d20086cdec94c01f2877a',
  now() + interval '10 minutes'
);

select set_config('request.jwt.claim.sub', account_id::text, true) from planner_test_ids;
insert into planner_test_results (result) select lives_ok(
  $$ select public.claim_identity_handoff(
    '70000000-0000-4000-8000-000000000001',
    'handoff-secret',
    jsonb_build_array(
      jsonb_build_object(
        'list_id', (select list_id from planner_test_ids),
        'key_version', 1,
        'wrapped_key', 'account-wrapped-v1',
        'wrapped_key_iv', 'account-wrapped-v1-iv'
      ),
      jsonb_build_object(
        'list_id', (select list_id from planner_test_ids),
        'key_version', 2,
        'wrapped_key', 'account-wrapped-v2',
        'wrapped_key_iv', 'account-wrapped-v2-iv'
      )
    ),
    jsonb_build_array(
      jsonb_build_object(
        'list_id', (select list_id from planner_test_ids),
        'key_version', 2,
        'ciphertext', 'account-profile-ciphertext',
        'iv', 'account-profile-iv'
      )
    )
  ) $$,
  'a permanent account can claim an anonymous identity with rewrapped keys'
);

set local role postgres;
insert into planner_test_results (result) select is(
  (select state::text from public.list_memberships
    where list_id = (select list_id from planner_test_ids)
      and user_id = (select guest_id from planner_test_ids)),
  'removed',
  'identity handoff deactivates the source membership'
);
insert into planner_test_results (result) select is(
  (select role::text from public.list_memberships
    where list_id = (select list_id from planner_test_ids)
      and user_id = (select account_id from planner_test_ids)
      and state = 'active'),
  'read',
  'identity handoff transfers access to the destination account'
);
insert into planner_test_results (result) select ok(
  (select used_at is not null and used_by = (select account_id from planner_test_ids)
    from public.identity_handoffs
    where id = '70000000-0000-4000-8000-000000000001'),
  'identity handoff is consumed once'
);

-- Supabase preserves the user ID when an anonymous account links a permanent
-- identity. Finalizing the recovered keyring must also refresh this cached flag.
update auth.users
set is_anonymous = false
where id = (select guest_id from planner_test_ids);
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', guest_id::text, true) from planner_test_ids;
select public.update_collaboration_keyring(
  'guest-upgraded-public',
  'guest-upgraded-private',
  'guest-upgraded-private-iv',
  'guest-account-key',
  'guest-account-key-iv',
  'guest-recovery-salt',
  'guest-recovery-iv',
  1
);
set local role postgres;
insert into planner_test_results (result) select is(
  (select is_anonymous from public.collaboration_identities
    where user_id = (select guest_id from planner_test_ids)),
  false,
  'keyring finalization refreshes an upgraded identity from auth.users'
);

-- The owner may appoint a successor and leave in one atomic operation. This
-- path must rotate only the current write key, not falsify existing ciphertext
-- key metadata.
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', owner_id::text, true) from planner_test_ids;
insert into planner_test_results (result) select lives_ok(
  $$ select public.transfer_list_ownership(
    (select list_id from planner_test_ids),
    (select new_owner_id from planner_test_ids),
    null::public.planner_role,
    (select revision from public.encrypted_lists
      where id = (select list_id from planner_test_ids)),
    (select revision from public.list_memberships
      where list_id = (select list_id from planner_test_ids)
        and user_id = (select new_owner_id from planner_test_ids)),
    (select current_key_version + 1 from public.encrypted_lists
      where id = (select list_id from planner_test_ids)),
    (
      select jsonb_agg(jsonb_build_object(
        'user_id', member.user_id,
        'wrapped_key', 'owner-transfer-' || member.user_id::text,
        'wrapped_key_iv', 'owner-transfer-iv-' || member.user_id::text
      ))
      from public.list_memberships as member
      where member.list_id = (select list_id from planner_test_ids)
        and member.state = 'active'
        and member.user_id <> (select owner_id from planner_test_ids)
    )
  ) $$,
  'an owner can transfer ownership and remove themselves with rotated envelopes'
);

set local role postgres;
insert into planner_test_results (result) select is(
  (select owner_id from public.encrypted_lists
    where id = (select list_id from planner_test_ids)),
  (select new_owner_id from planner_test_ids),
  'ownership transfer with removal appoints the successor atomically'
);
insert into planner_test_results (result) select is(
  (select state::text from public.list_memberships
    where list_id = (select list_id from planner_test_ids)
      and user_id = (select owner_id from planner_test_ids)),
  'removed',
  'ownership transfer with removal deactivates the former owner'
);
insert into planner_test_results (result) select is(
  (select current_key_version from public.encrypted_lists
    where id = (select list_id from planner_test_ids)),
  3,
  'ownership transfer with removal advances the current write key'
);
insert into planner_test_results (result) select is(
  (select key_version from public.encrypted_lists
    where id = (select list_id from planner_test_ids)),
  2,
  'ownership transfer preserves the AAD key version of unchanged list ciphertext'
);

insert into planner_test_results (result) select * from finish();
select result from planner_test_results order by position;
rollback;
