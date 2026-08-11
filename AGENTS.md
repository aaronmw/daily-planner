# Daily Planner Agent Guidance

## Development Workflow

- Treat `pnpm dev` as the default development command. It launches **Daily
  Planner Dev**, an isolated Tauri shell backed by Vite HMR.
- Use the existing `pnpm dev` session for routine React, CSS, and browser-side
  TypeScript validation. These changes must not trigger a signed release build
  or replacement of `/Applications/Daily Planner.app`.
- Use `pnpm dev:web` only when browser-only behavior is explicitly in scope.
- Do not start, stop, restart, replace, or kill persistent development
  processes unless the user explicitly authorizes that process action in the
  current request.
- Keep strict ports. If port `1420` or `3010` is occupied, report the conflict;
  do not select a fallback port or terminate the existing owner.

## Installed Application Validation

- Use `pnpm tauri:release` only when the user explicitly requests validation
  of the installed production app, native signing or packaging changed, or a
  production release is being prepared.
- Native Rust or Tauri configuration changes may use Tauri's development
  watcher for iteration, but validate the signed installed app before claiming
  production packaging is ready.
