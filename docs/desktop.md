# Daily Planner For macOS

Daily Planner uses one React/Vite application for its web and Tauri surfaces.
The desktop shell embeds the same Vite build in macOS's system
WebView; it does not load or proxy the hosted web app.

## Run For Development

```sh
pnpm tauri:dev
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

The browser app uses `pnpm dev`. Development processes are
user-managed; build and install scripts do not start or stop them.

## Production Signing

Set up Daily Planner's project-specific local identity once:

```sh
pnpm setup:macos-signing
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
pnpm tauri:build
```

The build verifies strict signing and a designated requirement tied to Daily
Planner's production bundle identifier and either a persistent certificate or
an Apple Team ID. A `cdhash`-only requirement is rejected.

## Transactional Installation

`pnpm tauri:build` creates and verifies the signed release bundle without
touching `/Applications`. `pnpm desktop:install` installs an existing verified
bundle at `/Applications/Daily Planner.app`. `pnpm tauri:release` combines both
steps and must be used only after release approval.

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
partition ACL whenever the executable changes. The legacy app-path ACL can be
perfectly normalized while that separate partition gate still causes macOS to
prompt for a newly built executable. Daily Planner intentionally leaves those
entries alone.

The installer verifies both gates. A self-signed build is reported as
build-specific even when its current hash is approved. If a replacement hash
is not approved, installation rolls back instead of relaunching into a surprise
password prompt. Routine React and CSS work should use `pnpm tauri:dev`, which
keeps the development shell stable and updates the UI through Vite HMR.

Apple-issued identities provide a stable Team ID and are the durable solution
for production rebuilds. In Xcode, open **Settings > Accounts**, select the
Apple team, choose **Manage Certificates**, and add an **Apple Development**
certificate. The build will select it automatically ahead of the local
self-signed identity. Apple documents this workflow in
[Create, export, and delete signing certificates](https://help.apple.com/xcode/mac/current/en.lproj/dev154b28f09.html).

If Xcode shows the certificate but `security find-identity -v -p codesigning`
does not list it as valid, verify that the renewed **Worldwide Developer
Relations - G3** intermediate is installed. Apple Development certificates use
that intermediate; the retired WWDR certificate expired in 2023. Download the
renewed public certificate only from [Apple PKI](https://www.apple.com/certificateauthority/).

The first transition from the self-signed identity to an Apple-issued identity
may require one final explicit Keychain approval so macOS can persist the Team
ID partition. Opt into that known transition with:

```sh
DAILY_PLANNER_ALLOW_KEYCHAIN_REAUTH=1 pnpm tauri:release
```

Afterward, ordinary production rebuilds signed by the same Apple team should
not need new per-build `cdhash` approvals. Never remove the existing WebCrypto
item to avoid the prompt; doing so can make encrypted local data unreadable.

## Build Storage

Native outputs use the shared Cargo target configured in
`~/.cargo/config.toml`:

- `~/.cargo/shared-target/release/bundle/macos/Daily Planner.app`
- `~/.cargo/shared-target/release/bundle/dmg/Daily Planner_<version>_aarch64.dmg`

Do not run `cargo clean` while the shared target is configured; it clears
artifacts used by every Rust project sharing that directory. Use the targeted
cleanup commands after stopping the matching development process:

```sh
pnpm clean:web
pnpm clean:rust:dev
pnpm clean:rust:release
```

Release cleanup retains generated app and DMG bundles.
