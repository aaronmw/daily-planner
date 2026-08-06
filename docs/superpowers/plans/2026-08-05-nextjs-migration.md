# Next.js Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Create React App with Next.js App Router while preserving the existing daily planner behavior.

**Architecture:** Next.js provides the root route and document shell. The planner remains a single client component because it uses browser-only APIs and interactive state throughout. Existing component, hook, and utility modules stay under `src/`.

**Tech Stack:** Next.js App Router, React, styled-components, Jest, Babel.

## Global Constraints

- Do not preserve the old `/daily-planner/` base path.
- Do not redesign the UI.
- Do not deploy or commit.
- Start the local server only for verification, then stop it.

---

### Task 1: Replace CRA Dependencies And Scripts

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Produces: `npm run dev`, `npm run build`, and `npm test -- --runInBand` commands.

- [x] **Step 1: Install Next and Jest tooling**

Run:

```bash
npm uninstall react-scripts @testing-library/jest-dom @testing-library/react babel-plugin-styled-components eslint-plugin-react typescript
npm install next@latest react@latest react-dom@latest styled-components@latest marked@latest polished@latest lodash@latest
npm install --save-dev jest@latest babel-jest@latest jest-environment-jsdom@latest @babel/preset-env@latest @babel/preset-react@latest prettier@latest
```

- [x] **Step 2: Update scripts**

Set:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "jest"
  }
}
```

### Task 2: Add Next App Router Shell

**Files:**
- Create: `app/layout.js`
- Create: `app/page.js`
- Create: `src/App.js`
- Delete: `src/index.js`
- Delete: `public/index.html`

**Interfaces:**
- Produces: default export `App` from `src/App.js`.
- Consumes: `App` from `app/page.js`.

- [x] **Step 1: Move app component**

Move the existing app code from `src/index.js` into `src/App.js`, add `'use client';` at the top, remove `createRoot`, and export `App` as default.

- [x] **Step 2: Add route entry**

Create `app/page.js`:

```js
import App from '../src/App';

export default function Page() {
    return <App />;
}
```

- [x] **Step 3: Add root layout**

Create `app/layout.js`:

```js
export const metadata = {
    title: 'Daily Planner',
    description: 'A local-first daily planning app.',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
```

### Task 3: Configure Build And Tests

**Files:**
- Create: `next.config.js`
- Create: `babel.config.js`
- Create: `jest.config.js`
- Modify: `.eslintrc.js`

**Interfaces:**
- Produces: Next config with styled-components compiler support.
- Produces: Jest config that discovers existing `src/**/__tests__/*.test.js` suites.

- [x] **Step 1: Configure Next**

Create `next.config.js`:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
    compiler: {
        styledComponents: true,
    },
};

module.exports = nextConfig;
```

- [x] **Step 2: Configure Babel for Jest**

Create `babel.config.js`:

```js
module.exports = {
    presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'automatic' }],
    ],
};
```

- [x] **Step 3: Configure Jest**

Create `jest.config.js`:

```js
module.exports = {
    testEnvironment: 'jsdom',
    testMatch: ['<rootDir>/src/**/__tests__/**/*.test.js'],
};
```

- [x] **Step 4: Simplify eslint config**

Keep the existing eslint rules that match current code style and remove CRA assumptions.

### Task 4: Remove CRA Build Artifacts

**Files:**
- Delete: `build/`

**Interfaces:**
- Produces: no tracked CRA build artifacts.

- [x] **Step 1: Delete generated CRA output**

Remove the tracked `build/` directory because Next outputs to `.next/` and generated output should not be committed for this migration.

### Task 5: Verify

**Files:**
- No source edits unless verification reveals a specific compatibility issue.

**Interfaces:**
- Consumes: commands from Task 1.

- [x] **Step 1: Run tests**

Run:

```bash
npm test -- --runInBand
```

Expected: 4 test suites pass.

- [x] **Step 2: Run production build**

Run:

```bash
npm run build
```

Expected: Next.js production build succeeds.

- [x] **Step 3: Run server once and stop it**

Run:

```bash
BROWSER=none HOST=127.0.0.1 PORT=3010 npm run dev
curl -I http://127.0.0.1:3010
```

Expected: HTTP 200, then stop the dev server process.

Result: HTTP 200 was verified against an already-running Next dev server for this project on port 3010. A second server could not start while that process was active, and the existing process was left running because it was not created by this verification step.
