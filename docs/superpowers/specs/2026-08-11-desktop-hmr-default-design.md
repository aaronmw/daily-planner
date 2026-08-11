# Desktop HMR Default Design

## Goal

Make the full Tauri application the default local development surface so
routine React and CSS work uses Vite hot-module replacement inside the native
shell. Keep signed release builds and transactional installation available for
production-package validation without using them for ordinary UI iteration.

## Current State

The project already has the required development architecture:

- `pnpm tauri:dev` launches Tauri with
  `src-tauri/tauri.dev.conf.json`.
- Tauri starts Vite on `127.0.0.1:1420` through `beforeDevCommand`.
- The native development shell loads that Vite URL and receives HMR updates.
- The development shell uses its own product name, bundle identifier, deep-link
  scheme, WebView storage, IndexedDB, app data, and WebCrypto Keychain items.

The problem is discoverability and workflow policy. `pnpm dev` currently opens
only the browser application, while agent guidance directs every installed-app
validation through a signed release build and transactional reinstall.

## Command Interface

`pnpm dev` becomes the primary full-stack development command. It delegates to
the existing Tauri development command, which owns both the native shell and
its Vite child process.

The command surface will be:

- `pnpm dev`: launch **Daily Planner Dev** with Vite HMR.
- `pnpm dev:web`: launch the browser-only application on port `3010`.
- `pnpm tauri:dev`: retain the explicit Tauri development entry point.
- `pnpm dev:desktop`: remain the internal Vite command used by Tauri's
  `beforeDevCommand` on port `1420`; it is not the normal human entry point.
- `pnpm tauri:release`: retain the signed build plus transactional production
  installation workflow.

Keeping `pnpm tauri:dev` and `pnpm dev:desktop` stable avoids unnecessary
configuration churn and preserves existing automation. `pnpm dev` will delegate
to `pnpm tauri:dev` rather than duplicating the Tauri CLI arguments.

## Runtime Behavior

Tauri continues to own the development process tree:

1. `pnpm dev` starts `tauri dev` with the dedicated development override.
2. Tauri runs `pnpm dev:desktop` and waits for `http://127.0.0.1:1420`.
3. Tauri opens **Daily Planner Dev** against the Vite server.
4. React and CSS edits update through HMR without rebuilding or reinstalling
   the native application.
5. Rust or Tauri configuration edits are handled by Tauri's native development
   watcher and may rebuild or relaunch only the development shell.

The installed production application remains untouched throughout this loop.

## Agent Workflow

Project-local `AGENTS.md` guidance will make the intended validation split
explicit:

- Use `pnpm dev` for routine desktop development and UI validation when the
  user has authorized starting the development session.
- Prefer the existing development session and HMR when it is already running.
- Do not implicitly start, stop, replace, or kill persistent development
  processes.
- Do not rebuild or reinstall `/Applications/Daily Planner.app` for ordinary
  React, CSS, or browser-side TypeScript changes.
- Use the signed release/install workflow when the user explicitly requests
  installed-production validation, when native packaging or signing behavior
  changed, or when preparing a production release.

These rules preserve the repository's process-control safety while preventing
the slow release workflow from becoming the default validation loop.

## Failure Behavior

Both Vite development ports remain strict. If a required port is already in
use, the command exits with a clear error rather than selecting another port or
killing an existing process. Tauri and Vite retain their native diagnostics for
frontend compilation and native-shell failures.

No custom supervisor, daemon, or background-process manager will be added.

## Documentation

The README and desktop guide will lead with `pnpm dev` for the native HMR
workflow and present `pnpm dev:web` as the browser-only escape hatch. Release
and installation instructions remain unchanged.

## Verification

Automated workflow coverage will confirm that:

- `pnpm dev` delegates to the Tauri development command.
- `pnpm dev:web` owns the browser-only Vite server on port `3010`.
- Tauri still uses the isolated development configuration and bundle identity.
- Tauri's internal frontend command still uses the strict port `1420`.

The existing unit/node, browser, type, lint, build, and desktop-workflow checks
remain the verification surface. Starting a persistent development session is
not part of automated verification unless explicitly requested.

## Non-Goals

- Replacing Tauri's built-in development watcher.
- Adding a custom process manager or port-discovery mechanism.
- Sharing production WebView storage or Keychain state with the development
  shell.
- Changing signing, packaging, installation, or release semantics.
- Automatically managing development servers without user authorization.
