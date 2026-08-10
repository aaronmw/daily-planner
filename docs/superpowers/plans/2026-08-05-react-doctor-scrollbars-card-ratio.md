# React Doctor Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan item-by-item. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Clear the actionable React Doctor findings from the planner migration while applying the requested scrollbar and portrait card styling.

**Architecture:** Keep `App` as a small client shell, move planner state/actions into a hook, and move the viewport layout into a presentational component. Fix targeted React diagnostics locally in the affected components, then make CSS-only styling updates in `app/globals.css`.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS v4, Jest, React Doctor 0.9.5.

## Global Constraints

- Working-tree mode only: leave changes unstaged; do not commit, push, or open a PR.
- Do not start, stop, or restart Aaron's development server.
- Use Aaron's existing `localhost:3010` server only for browser verification after implementation.
- No legacy planner data needs preserving; obsolete helpers and CRA assumptions may be removed or replaced.
- Preserve current planner workflows and visual intent except for requested scrollbar and card ratio changes.
- Scrollbar thumbs must use the planner background color and transparent tracks.
- List cards must use a portrait `2 / 3` aspect ratio.

---

### Item 1: Capture Diagnostics And Scope

**Files:**
- Read: `src/App.js`
- Read: `src/components/ColorPicker.js`
- Read: `src/components/EditInPlace.js`
- Read: `src/components/Sidebar.js`
- Read: `src/components/atoms/tokens.js`
- Read: `src/hooks/useDrop.js`
- Read: `src/utils/withDebugLabel.js`

**Interfaces:**
- Consumes: React Doctor 0.9.5 file-scope and project-scope reports.
- Produces: A concrete fix list keyed to React Doctor rule names and source files.

- [x] **Step 1: Run baseline build and tests**

Run: `npm run build`
Expected: Next production build exits 0.

Run: `npm test -- --runInBand`
Expected: Jest exits 0.

- [x] **Step 2: Run React Doctor file-scope scan**

Run: `npx -y react-doctor@0.9.5 --json --blocking none --yes --scope files --base HEAD --include-untracked --json-out "$RUN_DIR/files.json"`
Expected: JSON schema version 3 with actionable diagnostics for files changed by this migration.

- [x] **Step 3: Run React Doctor project-scope scan for `src`**

Run: `npx -y react-doctor@0.9.5 --verbose --scope full --project src --yes`
Expected: Confirms the same findings plus the older `withDebugLabel` React 19 defaultProps issue.

### Item 2: Split The Giant App Component

**Files:**
- Create: `src/hooks/usePlannerApp.js`
- Create: `src/components/PlannerLayout.js`
- Modify: `src/App.js`

**Interfaces:**
- Consumes: Current `App` state, action callbacks, keyboard shortcuts, and layout render tree.
- Produces: `usePlannerApp()` returning `{ appActions, appData, appThemeStyle, columnWidths, isTransitioning, onChangeIsShowingListManager, unarchivedLists }`; `PlannerLayout` consuming that object.

- [x] **Step 1: Move planner state and actions into `usePlannerApp`**

Move persistent state, derived values, callbacks, drag state effect, transition helpers, and keyboard shortcut hooks out of `App`.

- [x] **Step 2: Move viewport JSX into `PlannerLayout`**

Render the same `Trash`, `Sidebar`, `PrimaryAppColumn`, `Transition`, `ListManager`, `ItemDetails`, and `Timeline` structure using data returned by `usePlannerApp`.

- [x] **Step 3: Keep `App` as a thin client shell**

`App` should call `usePlannerApp()` and render `<PlannerLayout planner={planner} />`, leaving the component body far below React Doctor's 300-line threshold.

### Item 3: Fix Concrete React Diagnostics

**Files:**
- Modify: `src/components/ColorPicker.js`
- Modify: `src/components/EditInPlace.js`
- Modify: `src/components/Sidebar.js`
- Modify: `src/components/atoms/tokens.js`
- Modify: `src/hooks/useDrop.js`
- Modify: `src/utils/withDebugLabel.js`

**Interfaces:**
- Consumes: Existing props for color picking, editable text, sidebar drag-open behavior, theme tokens, drop handlers, and debug labels.
- Produces: Same outward behavior without render-time browser global reads, mirror-prop effects, local state used only as handler scratch, module-scope impurity, rebuilt pure helper, or React 19 `defaultProps` assignment.

- [x] **Step 1: Guard color picker portals**

Use a small portal wrapper that reads `document.body` only after mount, then let `WindowShader` and `ColorPaletteContainer` render through it.

- [x] **Step 2: Make `EditInPlace` draft state explicit**

Keep a local draft only while editing, initialize it when editing starts, derive non-editing display directly from `value`, and replace the measuring-height state effect with imperative textarea sizing.

- [x] **Step 3: Make remote edit activation mount-owned**

Replace `isRemotelyActivated` with `startsEditing` and key the relevant editable labels by entity id so initial edit mode is owned by component mount, not a prop-change effect.

- [x] **Step 4: Make sidebar forced-open tracking imperative**

Use a ref for the temporary drag-open marker so changing it does not redraw the sidebar.

- [x] **Step 5: Remove module-scope `Date.now()`**

Remove unused `DEFAULT_LIST_PROPS` from `tokens.js` exports rather than preserving an obsolete frozen id.

- [x] **Step 6: Lift pure drop helper**

Move `onDragOver` to module scope in `useDrop.js`.

- [x] **Step 7: Replace React 19 `defaultProps` mutation**

Change `withDebugLabel` to return a wrapper component that injects `data-debug-label` through props.

### Item 4: Apply Requested Visual Styling

**Files:**
- Modify: `app/globals.css`
- Modify as needed: `src/components/atoms/tokens.js`
- Modify as needed: `src/components/TrashedLists.js`

**Interfaces:**
- Consumes: Current Tailwind v4 global CSS and planner CSS variables.
- Produces: Background-colored scrollbar thumbs, transparent tracks, and list cards with `aspect-ratio: 2 / 3`.

- [x] **Step 1: Add global scrollbar styling**

Use `scrollbar-color: var(--planner-background) transparent` and WebKit scrollbar selectors with transparent tracks and `var(--planner-background)` thumbs.

- [x] **Step 2: Change list-card grid sizing**

Set `.planner-list-card-grid > *` to `aspect-ratio: 2 / 3` and remove the fixed card height so width controls portrait height.

- [x] **Step 3: Remove stale fixed card height token if unused**

Delete `LIST_CARD_HEIGHT` if no component imports it after the CSS change.

### Item 5: Verify And Report

**Files:**
- Read changed files and scan outputs only.

**Interfaces:**
- Consumes: Updated working tree.
- Produces: Evidence-backed status and decision audit.

- [x] **Step 1: Run build and tests**

Run: `npm run build`
Expected: exits 0.

Run: `npm test -- --runInBand`
Expected: exits 0.

- [x] **Step 2: Run React Doctor rescans**

Run: `npx -y react-doctor@0.9.5 --verbose --scope files --base HEAD --include-untracked --yes`
Expected: actionable diagnostics disappear or any remaining findings are explained with evidence.

Run: `npx -y react-doctor@0.9.5 --verbose --scope full --project src --yes`
Expected: actionable diagnostics disappear or any remaining findings are explained with evidence.

- [x] **Step 3: Browser verify on Aaron's existing server**

Use `http://localhost:3010` only if it is already running.
Expected: no Next.js console error bubble, scrollbars use transparent tracks/background thumbs, and list cards render portrait.

- [x] **Step 4: Clean temporary artifacts**

Remove any Playwright scratch files created during verification.

- [x] **Step 5: Give decision audit**

Report meaningful choices, confidence, remaining validation gaps, and whether the implementation is ready to finalize.
