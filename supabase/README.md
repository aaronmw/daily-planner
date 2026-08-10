# Daily Planner Supabase backend

This directory contains the backend-only slice for encrypted collaboration.
All user-authored planner content and attachment bytes are encrypted by clients
before they reach Supabase. The database still sees authorization topology,
opaque IDs, revisions, timestamps, roles, ciphertext sizes, and notification
routing metadata.

## Required project configuration

Enable anonymous Auth only after configuring Cloudflare Turnstile in Supabase.
The app treats `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and
`NEXT_PUBLIC_TURNSTILE_SITE_KEY` as one required collaboration configuration;
new anonymous sessions are rejected without a Turnstile token. Add the exact
web and `daily-planner://auth/callback` redirects to the Auth allowlist, and
disable public Realtime channels before enabling collaboration.

## Local verification

Install Docker and the Supabase CLI, then run:

```sh
supabase start
supabase db reset
supabase test db
supabase db lint
```

The attachment bucket is private. Object names must use this opaque shape:

```text
<list-uuid>/<attachment-uuid>/<zero-padded-chunk-index>.bin
```

Attachment deletion is intentionally two-phase: delete every Storage chunk
first, then call `delete_encrypted_attachment` to tombstone its metadata. Once
metadata is tombstoned, client Storage policies no longer expose those chunks;
an interrupted deletion therefore needs service-role cleanup.

Removing a member rotates the current list key and invalidates open invitations.
That prevents access to future writes, but cryptographic revocation cannot erase
keys or plaintext that a former member already downloaded.

`encrypted_lists.key_version` always describes the key/AAD used by that row's
current ciphertext. `current_key_version` advances during rotation and is used
for new or newly re-encrypted records. Invitations and identity handoffs must
carry one wrapped envelope for every historical key version so older records
remain readable to newly authorized members.

## Generic notification dispatcher

Deploy `functions/dispatch-notifications` with JWT verification disabled, then
invoke it from a trusted Supabase cron using the service-role bearer token. Set
`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` as function
secrets. The dispatcher sends only a generic notification; list labels, task
content, comments, and participant profiles never enter notification payloads.

Deploy `functions/cleanup-anonymous-identities` on a daily trusted cron as
well. It considers only anonymous identities inactive for at least 30 days and
deletes an Auth user only when no membership record of any state exists.
