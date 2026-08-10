# Supabase SQL tests

`database/collaboration_security.test.sql` is a transactionally isolated pgTAP
suite for the encrypted collaboration backend. It covers the planner role
matrix, outsider denial, optimistic revisions, owner invariants and transfer,
single-use/expired invitations, moderation, key rotation, identity handoff,
anonymous-account upgrade finalization, private Realtime topics, and encrypted
attachment Storage policies.

Run after a local reset:

```sh
supabase start
supabase db reset
supabase test db
```
