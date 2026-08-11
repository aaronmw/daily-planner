# Optimistic Drag Handoff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve the apparent dropped state while repository-first persistence is pending, hand the projection off seamlessly on success, and animate it back to its source on failure.

**Architecture:** Keep planner data non-optimistic and add a visual pending state to the shared pointer controller. Each drop target exposes the bounds of its already-rendered outline preview; a focused projection helper settles the full ghost onto those bounds and can redirect it back to the source. `ItemDragProvider` retains source hiding and destination preview state until the asynchronous target commit settles.

**Tech Stack:** React 19, TypeScript 6, Pointer Events, Web Animations API, Zustand, Vitest browser/Playwright, Tailwind CSS 4.

## Global Constraints

- Preserve repository-first persistence; do not speculatively mutate or roll back the planner store.
- Valid release keeps the source hidden, the destination outline mounted, and the full ghost projected at the destination until persistence settles.
- Successful persistence removes projection state only after the command has updated the planner store and React has received a paint opportunity.
- Failed persistence returns the ghost to the connected source before restoring ordinary rendering.
- `prefers-reduced-motion: reduce` skips spatial travel while preserving state ordering.
- Ignore new pointer-down attempts while a drop is settling or rolling back.
- Preserve current release validity: exact target identity, current item, visible preview, hit ownership, permission checks, and preview equality.
- Preserve Items → Timeline, Timeline → Timeline, Timeline → Items, five-minute Timeline snapping, outline-only previews, pointer capture/release, source opacity, click suppression, blur/cancel cleanup, and atomic reverse persistence.
- Do not add a motion dependency, spinner, loading label, retry queue, toast system, edge autoscroll, or list-card target.
- After changes that Aaron must validate in the installed app, rebuild, transactionally install, stop only the exact installed Daily Planner process, and reopen it.

---

### Task 1: Target-Owned Preview Bounds

**Files:**
- Modify: `src/features/items/itemDropTargets.ts`
- Modify: `src/features/items/useItemListDropTarget.ts`
- Modify: `src/features/items/ItemColumn.tsx`
- Modify: `src/features/timeline/useTimelineItemDropTarget.ts`
- Modify: `src/features/timeline/TimelineColumn.tsx`
- Modify: `src/features/items/__tests__/itemDropTargets.test.ts`
- Modify: `src/features/items/ItemDragProvider.browser.test.tsx`

**Interfaces:**
- Consumes: existing typed `ItemDropPreview` variants and rendered outline elements.
- Produces: required `ItemDropTarget.getPreviewBounds(preview): DOMRect | null`, with Items and Timeline outline refs wired by their owning columns.

- [ ] **Step 1: Add a failing browser assertion for preview bounds**

Update the browser `TestDropTarget` so its target element also acts as the rendered preview. Add a release-precondition assertion before pointer-up:

```tsx
const bounds = target.getBoundingClientRect();
expect(bounds.width).toBeGreaterThan(0);
expect(bounds.height).toBeGreaterThan(0);
```

Then add the required target method in the test harness before production has it:

```ts
getPreviewBounds: preview =>
    preview.kind === 'timeline'
        ? (targetRef.current?.getBoundingClientRect() ?? null)
        : null,
```

Run TypeScript before updating the production interface.

- [ ] **Step 2: Verify RED**

Run:

```bash
./node_modules/.bin/tsc -b --pretty false
```

Expected: TypeScript rejects `getPreviewBounds` as an unknown `ItemDropTarget` property.

- [ ] **Step 3: Add the preview-bounds contract**

Extend `ItemDropTarget`:

```ts
export interface ItemDropTarget {
    commit: (itemId: ItemId, preview: ItemDropPreview) => Promise<void> | void;
    getPreviewBounds: (preview: ItemDropPreview) => DOMRect | null;
    id: string;
    resolve: (
        pointer: ItemDropPointer,
        item: PlannerItem
    ) => ItemDropPreview | null;
}
```

Every target, including unit-test object literals, must define this method. Pure arbitration tests may return `null`; rendered browser targets return their element bounds.

- [ ] **Step 4: Wire the Items outline ref**

Add `previewRef` to `UseItemListDropTargetOptions`:

```ts
previewRef: RefObject<HTMLDivElement | null>;
```

Add this method to the memoized Items target:

```ts
getPreviewBounds: preview =>
    preview.kind === 'items'
        ? (previewRef.current?.getBoundingClientRect() ?? null)
        : null,
```

Include `previewRef` in the memo dependencies. In `ItemColumn`, create and pass the ref:

```ts
const dropPreviewRef = useRef<HTMLDivElement>(null);
```

Attach it only to the existing outline:

```tsx
<div
    aria-hidden="true"
    className="planner-item-list-drag-preview w-full"
    ref={dropPreviewRef}
    style={{
        height: relative
            ? `calc(var(--planner-minute-height) * ${previewItem.durationMinutes})`
            : 54,
    }}
/>
```

Update `PaddedItemListTarget` to render a ref-backed outline while `insertion` exists and pass that ref to `useItemListDropTarget`.

- [ ] **Step 5: Wire the Timeline outline ref**

Change `useTimelineItemDropTarget` to accept a third argument:

```ts
previewRef: RefObject<HTMLDivElement | null>
```

Add:

```ts
getPreviewBounds: preview =>
    preview.kind === 'timeline'
        ? (previewRef.current?.getBoundingClientRect() ?? null)
        : null,
```

Create `dropPreviewRef` in `TimelineColumn`, pass it to the hook, and attach it to the existing `.planner-timeline-drag-preview` element.

- [ ] **Step 6: Verify GREEN and commit the contract checkpoint**

Run:

```bash
./node_modules/.bin/vitest run --project unit src/features/items/__tests__/itemDropTargets.test.ts
./node_modules/.bin/vitest run --project browser src/features/items/ItemDragProvider.browser.test.tsx
./node_modules/.bin/tsc -b --pretty false
./node_modules/.bin/eslint src/features/items src/features/timeline --max-warnings 0
git diff --check
```

Expected: all commands exit zero. Commit only Task 1 files as a local checkpoint:

```bash
git add src/features/items/itemDropTargets.ts \
  src/features/items/useItemListDropTarget.ts \
  src/features/items/ItemColumn.tsx \
  src/features/timeline/useTimelineItemDropTarget.ts \
  src/features/timeline/TimelineColumn.tsx \
  src/features/items/__tests__/itemDropTargets.test.ts \
  src/features/items/ItemDragProvider.browser.test.tsx
git commit -m "refactor: expose item drop preview bounds"
```

---

### Task 2: Cancellable Ghost Projection Motion

**Files:**
- Create: `src/features/items/itemDropProjection.ts`
- Create: `src/features/items/itemDropProjection.browser.test.ts`

**Interfaces:**
- Consumes: a fixed-position inert ghost and destination/source `DOMRect` values.
- Produces: `startItemDropProjection(element, targetBounds, options): ItemDropProjectionAnimation`, whose `finished` promise settles after the ghost reaches its target and whose `stopAtCurrentBounds()` freezes the current presentation before redirection.

- [ ] **Step 1: Write failing reduced-motion and interruption tests**

Create browser tests that append a fixed-position element, call the wished-for API, and assert:

```ts
const projection = startItemDropProjection(ghost, targetBounds, {
    durationMs: 150,
    reducedMotion: true,
});
await projection.finished;
expect(ghost.style.transform).toBe(
    `translate3d(${targetBounds.left}px, ${targetBounds.top}px, 0)`
);
expect(ghost.style.width).toBe(`${targetBounds.width}px`);
expect(ghost.style.height).toBe(`${targetBounds.height}px`);
```

For interruption, start a long animation, wait one animation frame, call `stopAtCurrentBounds()`, and assert the ghost remains at its measured presentation rectangle rather than jumping to the destination.

- [ ] **Step 2: Verify RED**

Run:

```bash
./node_modules/.bin/vitest run --project browser src/features/items/itemDropProjection.browser.test.ts
```

Expected: module resolution fails because `itemDropProjection.ts` is absent.

- [ ] **Step 3: Implement the projection helper**

Create:

```ts
export interface ItemDropProjectionOptions {
    durationMs: number;
    reducedMotion: boolean;
}

export interface ItemDropProjectionAnimation {
    finished: Promise<void>;
    stopAtCurrentBounds: () => void;
}

const projectionKeyframe = (bounds: DOMRect): Keyframe => ({
    height: `${bounds.height}px`,
    transform: `translate3d(${bounds.left}px, ${bounds.top}px, 0)`,
    width: `${bounds.width}px`,
});

export const placeItemDropProjection = (
    element: HTMLElement,
    bounds: DOMRect
): void => {
    element.style.height = `${bounds.height}px`;
    element.style.transform =
        `translate3d(${bounds.left}px, ${bounds.top}px, 0)`;
    element.style.width = `${bounds.width}px`;
};

export function startItemDropProjection(
    element: HTMLElement,
    targetBounds: DOMRect,
    options: ItemDropProjectionOptions
): ItemDropProjectionAnimation {
    if (
        options.reducedMotion ||
        options.durationMs <= 0 ||
        typeof element.animate !== 'function'
    ) {
        placeItemDropProjection(element, targetBounds);
        return {
            finished: Promise.resolve(),
            stopAtCurrentBounds: () => undefined,
        };
    }

    const sourceBounds = element.getBoundingClientRect();
    const animation = element.animate(
        [projectionKeyframe(sourceBounds), projectionKeyframe(targetBounds)],
        {
            duration: options.durationMs,
            easing: 'cubic-bezier(0.2, 0, 0, 1)',
            fill: 'forwards',
        }
    );
    let stopped = false;
    const stopAtCurrentBounds = () => {
        if (stopped) return;
        stopped = true;
        const currentBounds = element.getBoundingClientRect();
        animation.cancel();
        placeItemDropProjection(element, currentBounds);
    };
    return {
        finished: animation.finished
            .then(() => {
                if (stopped) return;
                stopped = true;
                animation.cancel();
                placeItemDropProjection(element, targetBounds);
            })
            .catch(() => undefined),
        stopAtCurrentBounds,
    };
}
```

- [ ] **Step 4: Verify GREEN and commit the helper**

Run:

```bash
./node_modules/.bin/vitest run --project browser src/features/items/itemDropProjection.browser.test.ts
./node_modules/.bin/tsc -b --pretty false
./node_modules/.bin/eslint src/features/items/itemDropProjection.ts src/features/items/itemDropProjection.browser.test.ts --max-warnings 0
git diff --check
```

Expected: all checks exit zero. Commit:

```bash
git add src/features/items/itemDropProjection.ts \
  src/features/items/itemDropProjection.browser.test.ts
git commit -m "feat: animate item drop projections"
```

---

### Task 3: Pending Commit and Smooth Rollback State Machine

**Files:**
- Modify: `src/features/items/ItemDragProvider.tsx`
- Modify: `src/features/items/ItemDragProvider.browser.test.tsx`
- Modify: `src/features/items/ItemColumn.tsx`

**Interfaces:**
- Consumes: target preview bounds, `startItemDropProjection`, existing release validation, and async `target.commit`.
- Produces: a visual `settling`/`rolling-back` lifecycle that preserves source hiding and destination projection until commit completion.

- [ ] **Step 1: Add a deferred commit test harness**

Add:

```ts
const deferred = <T,>() => {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    return { promise, reject, resolve };
};
```

Allow `TestDropTarget.onCommit` to return `Promise<void> | void` and use its target element for `getPreviewBounds`.

- [ ] **Step 2: Write the failing success-pending regression**

Use a deferred commit. After valid `pointerup`, assert before resolving:

```ts
expect(commit).toHaveBeenCalledTimes(1);
expect(source).toHaveAttribute('data-pointer-dragging', 'true');
expect(target).toHaveAttribute('data-preview-minute', '540');
expect(
    document.querySelector('[data-pointer-drag-ghost="true"]')
).toHaveAttribute('data-item-drop-pending', 'true');
expect(document.documentElement).not.toHaveAttribute('data-item-dragging');
```

Resolve the deferred promise, then assert the source hiding, preview, pending ghost, and pending marker all clear.

- [ ] **Step 3: Verify RED**

Run:

```bash
./node_modules/.bin/vitest run --project browser src/features/items/ItemDragProvider.browser.test.tsx
```

Expected: the source, preview, and ghost clear immediately after `pointerup`, so the pending assertions fail.

- [ ] **Step 4: Split immediate pointer cleanup from visual cleanup**

In `ItemDragProvider`, add a pending session and target-ID ref:

```ts
interface PendingItemDrop {
    ghost: HTMLElement;
    id: ItemId;
    preview: ItemDropPreview;
    source: HTMLElement;
    target: ItemDropTarget;
}

const pendingTargetIdRef = useRef<string | null>(null);
```

Inside the listener effect keep `let pendingDrop: PendingItemDrop | null = null`.

Create `releasePointerGesture(currentDrag)` that nulls `drag`, releases pointer capture, and removes `document.documentElement.dataset.itemDragging`, but deliberately leaves the ghost, `source.dataset.pointerDragging`, `activeItemId`, and `activeDrop` intact.

Create `finishPendingDrop(session, updateReactState = true)` that only acts when `pendingDrop === session`, then removes the ghost, restores the source, clears pending refs and all active-drop refs, and clears React state when mounted.

Update `handlePointerDown` to return when either `drag` or `pendingDrop` exists.

- [ ] **Step 5: Implement the async visual handoff**

After the existing release validation, require:

```ts
const previewBounds = activeDrop
    ? target?.getPreviewBounds(activeDrop.preview)
    : null;
```

Invalid releases still call the full immediate reset. For a valid release with bounds:

```ts
releasePointerGesture(currentDrag);
const session: PendingItemDrop = {
    ghost: currentDrag.ghost,
    id,
    preview: activeDrop.preview,
    source,
    target,
};
pendingDrop = session;
pendingTargetIdRef.current = target.id;
session.ghost.dataset.itemDropPending = 'true';
```

Start settlement and persistence together:

```ts
const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
).matches;
const settle = startItemDropProjection(session.ghost, previewBounds, {
    durationMs: 150,
    reducedMotion,
});

void (async () => {
    try {
        await Promise.all([
            settle.finished,
            Promise.resolve().then(() => target.commit(id, activeDrop.preview)),
        ]);
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    } catch (error) {
        console.error('Unable to drop item', error);
        settle.stopAtCurrentBounds();
        const sourceBounds = source.isConnected
            ? source.getBoundingClientRect()
            : null;
        if (sourceBounds) {
            const rollback = startItemDropProjection(
                session.ghost,
                sourceBounds,
                { durationMs: 200, reducedMotion }
            );
            await rollback.finished;
        }
    } finally {
        finishPendingDrop(session);
    }
})();
```

Keep target invalidation from clearing an already-committed pending preview:

```ts
if (pendingTargetIdRef.current === targetId) return;
```

Window blur resets only an active pointer drag; it must not tear down `pendingDrop`. Provider unmount removes both an active drag and any pending projection without updating React state.

- [ ] **Step 6: Prevent duplicate Items rendering during the success paint**

When an Items insertion preview is active, construct rendered item entries without a same-ID item that has just entered `itemIds`:

```ts
const renderedItemIds =
    insertion && activeItemId
        ? itemIds.filter(id => id !== activeItemId)
        : itemIds;
const entries: ItemColumnEntry[] = [
    { kind: 'create' },
    ...renderedItemIds.map(id => ({ id, kind: 'item' }) as const),
];
```

Continue using the original `itemIds` for keyboard navigation, focus, selection, and shortcut numbers.

- [ ] **Step 7: Add failure, blocking, and reduced-motion regressions**

Add focused browser tests:

1. Reject the deferred commit and assert the source stays hidden until rollback completes, then is restored; preview and ghost clear; `console.error` receives `Unable to drop item`.
2. Dispatch a second source pointer-down/move while pending and assert only the first ghost/session exists and the second target does not activate.
3. Stub `matchMedia('(prefers-reduced-motion: reduce)')` to `matches: true`, reject, and assert cleanup completes without waiting for animation travel.
4. Keep the existing invalid/outside release test immediate; it must never set `data-item-drop-pending`.

- [ ] **Step 8: Verify Task 3 and commit the implementation checkpoint**

Run:

```bash
./node_modules/.bin/prettier --write \
  src/features/items/ItemDragProvider.tsx \
  src/features/items/ItemDragProvider.browser.test.tsx \
  src/features/items/ItemColumn.tsx \
  src/features/items/itemDropProjection.ts \
  src/features/items/itemDropProjection.browser.test.ts
./node_modules/.bin/vitest run --project browser \
  src/features/items/ItemDragProvider.browser.test.tsx \
  src/features/items/itemDropProjection.browser.test.ts
./node_modules/.bin/vitest run --project unit \
  src/features/items/__tests__/itemDropTargets.test.ts \
  src/features/items/__tests__/itemDragSession.test.ts \
  src/core/application/__tests__/plannerCommands.test.ts
./node_modules/.bin/tsc -b --pretty false
./node_modules/.bin/eslint src/features/items src/features/timeline --max-warnings 0
git diff --check
```

Expected: all checks exit zero. Commit Task 3 files:

```bash
git add src/features/items/ItemDragProvider.tsx \
  src/features/items/ItemDragProvider.browser.test.tsx \
  src/features/items/ItemColumn.tsx
git commit -m "feat: preserve optimistic drag handoff"
```

---

### Task 4: Final Verification and Installed App

**Files:**
- Verify all files changed by Tasks 1–3.

**Interfaces:**
- Consumes: the complete pending projection and rollback lifecycle.
- Produces: fresh automated evidence and an installed signed Daily Planner build at the verified HEAD.

- [ ] **Step 1: Run ordinary verification**

Run:

```bash
./node_modules/.bin/prettier --check \
  src/features/items/itemDropTargets.ts \
  src/features/items/useItemListDropTarget.ts \
  src/features/items/ItemColumn.tsx \
  src/features/items/ItemDragProvider.tsx \
  src/features/items/ItemDragProvider.browser.test.tsx \
  src/features/items/itemDropProjection.ts \
  src/features/items/itemDropProjection.browser.test.ts \
  src/features/timeline/useTimelineItemDropTarget.ts \
  src/features/timeline/TimelineColumn.tsx
./node_modules/.bin/eslint src vite.config.ts vitest.config.ts eslint.config.ts --max-warnings 0
./node_modules/.bin/tsc -b --pretty false
./node_modules/.bin/vitest run
./node_modules/.bin/vite build
npx react-doctor@latest --verbose --scope changed
git diff --check
git status --short
```

Expected: formatting, lint, TypeScript, all configured Vitest projects, Vite, and diff checks exit zero. React Doctor must not introduce an unexamined in-scope correctness warning; document the existing full-scan fallback and component-size warning.

- [ ] **Step 2: Build the signed Tauri bundle**

Run:

```bash
node scripts/build-tauri-app.mjs --config '{"build":{"beforeBuildCommand":""}}'
```

Wait for release compilation and signed `.app`/`.dmg` generation to exit zero.

- [ ] **Step 3: Resolve, install, and reopen only Daily Planner**

Resolve first:

```bash
ls -ld '/Applications/Daily Planner.app'
ps -axo pid=,command= | rg '^\s*[0-9]+ /Applications/Daily Planner\.app/Contents/MacOS/daily-planner$' || true
```

Install transactionally:

```bash
node scripts/install-desktop-app.mjs
```

If the installer reports no relaunch because the exact app was not running:

```bash
open -a '/Applications/Daily Planner.app'
```

Verify:

```bash
ps -axo pid=,command= | rg '^\s*[0-9]+ /Applications/Daily Planner\.app/Contents/MacOS/daily-planner$'
codesign --verify --deep --strict '/Applications/Daily Planner.app'
shasum -a 256 \
  '/Users/aaronwright/.cargo/shared-target/release/bundle/macos/Daily Planner.app/Contents/MacOS/daily-planner' \
  '/Applications/Daily Planner.app/Contents/MacOS/daily-planner'
```

Expected: exact installed process is running, strict signature verification exits zero, and hashes match.

- [ ] **Step 4: Decision audit and manual handoff**

Before merge, push, or main integration, report implementation decisions, alternatives, confidence, edge cases, React Doctor delta, validation gaps, pride gate, and readiness. Ask Aaron to verify successful drops do not expose the source and failed persistence rolls the projection back smoothly.
