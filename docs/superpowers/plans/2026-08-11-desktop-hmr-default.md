# Desktop HMR Default Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `pnpm dev` launch the isolated Tauri development shell with Vite HMR while preserving an explicit browser-only command and reserving signed installation for production-package validation.

**Architecture:** Reuse Tauri's existing development orchestration instead of adding a process manager. The public `dev` script delegates to `tauri:dev`; Tauri continues to launch the strict-port frontend child through `dev:desktop`, while `dev:web` exposes the standalone browser server. Repository-local agent guidance and developer documentation encode when to use HMR versus the signed release workflow.

**Tech Stack:** pnpm scripts, Tauri 2 CLI/configuration, Vite 8, Node.js test runner, Markdown project guidance

## Global Constraints

- `pnpm dev` is the primary full-stack development command.
- `pnpm dev:web` runs only the browser application on `127.0.0.1:3010` with `--strictPort`.
- `pnpm dev:desktop` remains Tauri's internal Vite command on `127.0.0.1:1420` with `--strictPort`.
- `pnpm tauri:dev` and `src-tauri/tauri.dev.conf.json` retain the isolated development bundle identity and deep-link scheme.
- The production signing, packaging, installation, and release commands do not change.
- Do not add a custom supervisor, daemon, fallback port, or implicit process termination.
- Persistent development processes remain user-authorized and user-managed.

---

### Task 1: Make the Tauri HMR shell the default development command

**Files:**
- Modify: `scripts/__tests__/tauri-development-isolation.test.mjs:5-25`
- Modify: `package.json:11-16`

**Interfaces:**
- Consumes: existing `tauri:dev` script, `dev:desktop` script, `src-tauri/tauri.conf.json` build configuration, and `src-tauri/tauri.dev.conf.json` identity override
- Produces: `pnpm dev` as the full-stack entry point and `pnpm dev:web` as the browser-only entry point

- [ ] **Step 1: Extend the workflow test with the public development-command contract**

Replace the existing test body with assertions that cover both command routing and development isolation:

```js
test('the default development command launches the isolated Tauri HMR shell', () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    const productionConfig = JSON.parse(
        readFileSync('src-tauri/tauri.conf.json', 'utf8')
    );
    const developmentConfig = JSON.parse(
        readFileSync('src-tauri/tauri.dev.conf.json', 'utf8')
    );

    assert.equal(packageJson.scripts.dev, 'pnpm tauri:dev');
    assert.equal(
        packageJson.scripts['dev:web'],
        'vite --host 127.0.0.1 --port 3010 --strictPort'
    );
    assert.equal(
        packageJson.scripts['dev:desktop'],
        'vite --host 127.0.0.1 --port 1420 --strictPort'
    );
    assert.match(packageJson.scripts['tauri:dev'], /^tauri dev /);
    assert.match(
        packageJson.scripts['tauri:dev'],
        /src-tauri\/tauri\.dev\.conf\.json/
    );
    assert.equal(productionConfig.build.beforeDevCommand, 'pnpm dev:desktop');
    assert.equal(productionConfig.build.devUrl, 'http://127.0.0.1:1420');
    assert.notEqual(developmentConfig.identifier, productionConfig.identifier);
    assert.equal(
        developmentConfig.identifier,
        'com.aaronwright.dailyplanner.dev'
    );
    assert.equal(developmentConfig.productName, 'Daily Planner Dev');
});
```

- [ ] **Step 2: Run the focused workflow test and confirm the old command surface fails**

Run:

```bash
node --test scripts/__tests__/tauri-development-isolation.test.mjs
```

Expected: FAIL because `packageJson.scripts.dev` still starts Vite directly and `packageJson.scripts['dev:web']` is undefined.

- [ ] **Step 3: Update the package scripts with the minimal command aliases**

Change the beginning of `package.json`'s `scripts` object to:

```json
"scripts": {
    "dev": "pnpm tauri:dev",
    "dev:web": "vite --host 127.0.0.1 --port 3010 --strictPort",
    "dev:desktop": "vite --host 127.0.0.1 --port 1420 --strictPort",
```

Do not change `tauri:dev`, `tauri:build`, `tauri:release`, or any Tauri configuration file.

- [ ] **Step 4: Run the focused workflow test and confirm the new contract passes**

Run:

```bash
node --test scripts/__tests__/tauri-development-isolation.test.mjs
```

Expected: PASS with one test and no persistent development process started.

- [ ] **Step 5: Checkpoint the command contract**

```bash
git add package.json scripts/__tests__/tauri-development-isolation.test.mjs
git commit -m "build: default development to Tauri HMR"
```

---

### Task 2: Encode the HMR-first workflow for humans and agents

**Files:**
- Create: `AGENTS.md`
- Modify: `README.md:24-36`
- Modify: `docs/desktop.md:7-26`

**Interfaces:**
- Consumes: the `dev`, `dev:web`, `dev:desktop`, `tauri:dev`, and `tauri:release` commands established in Task 1
- Produces: repository-local process guidance that distinguishes routine HMR validation from installed-production validation

- [ ] **Step 1: Add repository-local agent workflow guidance**

Create `AGENTS.md` with this content:

```markdown
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
```

- [ ] **Step 2: Make the native HMR workflow the README default**

Replace the README development paragraph with:

```markdown
`pnpm dev` launches the isolated **Daily Planner Dev** Tauri shell. Tauri starts
the React application through Vite on port `1420`, so React and CSS changes use
HMR without rebuilding or reinstalling the production app.

For browser-only development, run `pnpm dev:web`; it serves the same React
application at `http://127.0.0.1:3010`. Development processes are user-managed.
```

Keep the existing `pnpm dev` command block and environment-variable guidance.

- [ ] **Step 3: Update the macOS guide without changing release semantics**

Change the `Run For Development` command block in `docs/desktop.md` to
`pnpm dev`. Update its browser-only sentence to:

```markdown
The browser-only application uses `pnpm dev:web`. `pnpm tauri:dev` remains an
explicit alias for the native development workflow. Development processes are
user-managed; build and install scripts do not start or stop them.
```

Leave the production signing, transactional installation, Keychain safety, and
build-storage sections unchanged.

- [ ] **Step 4: Verify documentation consistency and formatting**

Run:

```bash
rg -n "pnpm (dev|dev:web|tauri:dev|tauri:release)" AGENTS.md README.md docs/desktop.md
pnpm exec prettier --check AGENTS.md README.md docs/desktop.md package.json scripts/__tests__/tauri-development-isolation.test.mjs
```

Expected: the command references match the design, and Prettier reports all
five files formatted.

- [ ] **Step 5: Checkpoint the human and agent workflow documentation**

```bash
git add AGENTS.md README.md docs/desktop.md
git commit -m "docs: adopt desktop HMR development workflow"
```

---

### Task 3: Verify the complete development workflow change

**Files:**
- Verify only; no planned file changes

**Interfaces:**
- Consumes: command routing and guidance from Tasks 1-2
- Produces: evidence that the new default does not regress the application, production build, or desktop workflow tooling

- [ ] **Step 1: Run desktop-workflow and static verification**

```bash
pnpm test:desktop-workflow
pnpm lint
pnpm typecheck
```

Expected: all commands exit successfully.

- [ ] **Step 2: Run application tests**

```bash
pnpm test
pnpm test:browser
```

Expected: all unit/node and browser projects pass.

- [ ] **Step 3: Build the web assets without installing the production app**

```bash
pnpm build
```

Expected: TypeScript and Vite complete successfully and write `dist/`. Do not
run `pnpm tauri:release`; signing and installation behavior did not change.

- [ ] **Step 4: Confirm the branch is clean and contains only the planned checkpoints**

```bash
git diff --check
git status --short --branch
git log --oneline --max-count=3
```

Expected: no uncommitted files; the two implementation checkpoints follow the
approved design checkpoint.
