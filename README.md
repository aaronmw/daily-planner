# Daily Planner

Daily Planner is a local-first React application shared by the web and macOS
Tauri shells. Planner records are normalized in memory, encrypted individually,
and persisted in IndexedDB. Supabase collaboration is opt-in and keeps planner
content encrypted on the client.

## Requirements

- Node.js 22.12 or newer
- pnpm 11.16.0 through Corepack
- Rust and the Tauri prerequisites for native builds

```sh
corepack enable
pnpm install
```

The lockfile uses a seven-day release quarantine and a no-downgrade trust
policy. Exact versions reviewed while bootstrapping this rewrite are listed as
exceptions in `pnpm-workspace.yaml`; future versions remain subject to the
policy.

## Development

```sh
pnpm dev
```

`pnpm dev` launches the isolated **Daily Planner Dev** Tauri shell. Tauri starts
the React application through Vite on port `1420`, so React and CSS changes use
HMR without rebuilding or reinstalling the production app.

For browser-only development, run `pnpm dev:web`; it serves the same React
application at `http://127.0.0.1:3010`. Development processes are user-managed.

Copy `.env.example` to a local ignored environment file when collaboration is
needed. Every `VITE_*` value is browser-visible; use only the Supabase
publishable key, never a service-role or secret key.

## Architecture

- `src/core/domain`: validated entities, branded UUIDs, factories, ordering
- `src/core/store`: normalized Zustand state and narrow selectors
- `src/core/application`: typed commands and infrastructure ports
- `src/core/collaboration`: lifecycle-managed sync, conflicts, and roles
- `src/platform/persistence`: encrypted per-record Dexie repositories
- `src/platform/collaboration`: Supabase, crypto, attachment, and auth adapters
- `src/features`: planner UI organized by vertical slice
- `src-tauri`: isolated native development and production shells

The rewrite starts with the `daily-planner-v5` vault. It deliberately leaves
older IndexedDB databases and the existing production WebCrypto Keychain item
untouched.

## Verification

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:browser
pnpm build
pnpm test:desktop-workflow
```

`pnpm tauri:build` creates a strictly signed bundle without installing it.
`pnpm desktop:install` performs the separately audited transactional install.
`pnpm tauri:release` combines those commands and therefore replaces the app in
`/Applications`; use it only after release approval.

## Web Hosting

Vite emits a static single-page application in `dist/`. A static host must
rewrite unknown application routes, including `/share/:listId`, to
`/index.html` while serving existing assets normally. This is a host rewrite,
not an HTTP redirect, so React Router receives the original clean URL.

## Supabase

Migrations are imperative SQL under `supabase/migrations`. Review migration
status before applying anything:

```sh
pnpm supabase migration list
```

The pgTAP suite requires a configured database connection or a local Supabase
stack with Docker. Schema changes, function deployment, and remote migrations
are intentionally separate from application builds.
