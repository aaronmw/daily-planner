# Daily Planner For macOS

Daily Planner uses the same React interface for its Next.js web app and Tauri
desktop app. The desktop shell embeds a dedicated Vite build in macOS's system
WebView; it does not load or proxy the hosted web app.

## Run For Development

```sh
npm run tauri:dev
```

This is the routine desktop workflow. Tauri starts Vite and opens **Daily
Planner Dev**. React and CSS changes use Vite HMR without rebuilding or
reinstalling the production app. Native Rust or Tauri configuration changes may
restart only the development shell.

Development uses `com.aaronwright.dailyplanner.dev` and the
`daily-planner-dev://` deep-link scheme. Production uses
`com.aaronwright.dailyplanner` and `daily-planner://`. The separate bundle
identifiers keep WebView storage, IndexedDB, app data, and WebCrypto Keychain
items from colliding. Quit the installed release before development if its
global shortcuts conflict with the development shell.

The browser app continues to use `npm run dev`. Development processes are
user-managed; build and install scripts do not start or stop them.

## Production Signing

Set up Daily Planner's project-specific local identity once:

```sh
npm run setup:macos-signing
```

No private key or certificate is stored in the repository. Production builds
choose a signing identity in this order:

1. `APPLE_SIGNING_IDENTITY`, when explicitly supplied.
2. Developer ID Application.
3. Apple Development.
4. Mac Developer.
5. `Daily Planner Local Development Code Signing`.

Installable builds reject ad-hoc signing. The local self-signed identity gives
this Mac a persistent certificate-based designated requirement, but it is only
for local development. It is not suitable for public distribution or
notarization. Public distribution requires an appropriate Apple-issued
identity, normally Developer ID Application, plus notarization.

```sh
npm run tauri:build
```

The build verifies strict signing and a designated requirement tied to Daily
Planner's production bundle identifier and either a persistent certificate or
an Apple Team ID. A `cdhash`-only requirement is rejected.

## Transactional Installation

`npm run tauri:build` installs the signed release at
`/Applications/Daily Planner.app`. `npm run desktop:install` repeats only the
installation phase.

The installer performs these steps in order:

1. Verify the source bundle and stable designated requirement.
2. Stop the running production app.
3. Copy to a same-volume staging path and atomically replace the Applications
   bundle while retaining the previous app as a backup.
4. Register the replacement with Launch Services and metadata indexing.
5. Inspect and, only when safe, normalize the existing WebCrypto ACL.
6. Delete the backup to commit the replacement.
7. Relaunch the app only when it was running before installation.

Registration and ACL failures are fatal. Before relaunch, the installer
restores and re-registers the previous bundle. Source verification happens
before the running app is stopped.

## WebCrypto Keychain Safety

The production WebView may create a generic-password item whose account is
`com.apple.WebKit.WebCrypto.master+com.aaronwright.dailyplanner`. It protects
the non-exportable WebCrypto keys used by encrypted IndexedDB data.

Installation never reads, exports, deletes, or replaces that key. It reads only
Keychain ACL metadata. Exact access means:

- decrypt is password-free;
- exactly one application is trusted;
- the trusted path is `/Applications/Daily Planner.app`;
- the trusted requirement matches the currently verified stable requirement;
- the trusted requirement is certificate- or Team-ID-based, never
  `cdhash`-only; and
- access is never open to every application.

If ACL repair is needed, the native helper changes only the decrypt ACL, calls
`SecKeychainItemSetAccess` to persist it, then the installer independently
re-reads and verifies the item. Unexpected or broad ACLs are refused rather
than widened. The workflow never changes Keychain partition lists and never
automates `security set-key-partition-list` with the login password.

Self-signed apps can accumulate changing `cdhash` entries in the legacy
partition ACL whenever the executable changes. Daily Planner intentionally
leaves those entries alone. Apple-issued identities provide a stable Team ID,
which is a better long-term partition identity.

## Build Storage

Native outputs use the shared Cargo target configured in
`~/.cargo/config.toml`:

- `~/.cargo/shared-target/release/bundle/macos/Daily Planner.app`
- `~/.cargo/shared-target/release/bundle/dmg/Daily Planner_<version>_aarch64.dmg`

Do not run `cargo clean` while the shared target is configured; it clears
artifacts used by every Rust project sharing that directory. Use the targeted
cleanup commands after stopping the matching development process:

```sh
npm run clean:web
npm run clean:rust:dev
npm run clean:rust:release
```

Release cleanup retains generated app and DMG bundles.
