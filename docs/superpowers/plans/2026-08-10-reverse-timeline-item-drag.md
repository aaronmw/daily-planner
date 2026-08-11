# Reverse Timeline Item Drag Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a scheduled item be dragged from the timeline into an exact position in the selected Items list, atomically transferring and unscheduling it with continuous two-ghost feedback.

**Architecture:** Lift pointer capture and the moving ghost out of the timeline hook into a shared `ItemDragProvider` with a registry of drop targets. Timeline and Items each resolve and render their own typed preview; the Items target inserts a virtualized outline entry and commits through one atomic application command.

**Tech Stack:** React 19, TypeScript 6, Zustand, TanStack Virtual, Pointer Events, Vitest, Tailwind CSS v4, Tauri 2/WKWebView.

## Global Constraints

- Keep one moving in-app card ghost attached to the exact grab point.
- Keep the eight-pixel drag-intent threshold and click suppression.
- Preserve timeline snapping at five-minute increments.
- Items drops always target the currently selected writable list.
- The Items preview occupies its insertion slot and moves neighbouring cards aside.
- One persistence mutation must update `listId`, `orderKey`, and `scheduledStartMinutes: null`.
- Invalid/read-only targets show no preview; dropping outside a valid target changes nothing.
- List cards and item-list edge auto-scrolling remain out of scope.
- Do not add dependencies or restore native HTML drag-and-drop.
- Local checkpoint commits are allowed in this detached worktree for subagent review packages. Do not push, merge, or integrate with `main` until Aaron reviews the required post-implementation decision audit.
- After verification, use the established signed Tauri build/install workflow, stop only the exact Daily Planner process, and reopen the installed app.

---

## File Responsibility Map

- `src/core/application/plannerCommands.ts`: owns the atomic `returnItemToList` mutation and authorization.
- `src/features/items/itemListInsertion.ts`: pure conversion from pointer/row geometry to insertion neighbours.
- `src/features/items/itemDropTargets.ts`: shared drop-preview types and first-valid-target arbitration.
- `src/features/items/ItemDragProvider.tsx`: sole owner of pointer capture, moving ghost, gesture lifecycle, target registry, and commit dispatch.
- `src/features/timeline/useTimelineItemDropTarget.ts`: timeline geometry, snap preview, and scheduling commit.
- `src/features/items/useItemListDropTarget.ts`: Items-column geometry, insertion preview, and return-to-list commit.
- `src/features/items/ItemColumn.tsx`: virtualized insertion entry and outline rendering.
- `src/app/App.tsx`: mounts the shared drag provider inside the commands provider.
- `src/styles/features.css`: moving-ghost styles already present; adds the Items insertion outline.

### Task 1: Atomic Return-To-List Command

**Files:**
- Modify: `src/core/application/plannerCommands.ts`
- Test: `src/core/application/__tests__/plannerCommands.test.ts`

**Interfaces:**
- Consumes: `createOrderKeyBetween(previous: PlannerItem | null, next: PlannerItem | null): string`.
- Produces: `PlannerCommands.returnItemToList(id: ItemId, targetListId: ListId, previousId: ItemId | null, nextId: ItemId | null): Promise<void>`.

- [ ] **Step 1: Write failing atomic-mutation and authorization tests**

Append tests that build literal source/destination state, call the wished-for command, and inspect the real store and memory repository:

```ts
it('atomically returns a scheduled item into an ordered destination list', async () => {
    const repository = new MemoryRepository();
    const store = createPlannerStore();
    const sourceList = createPlannerList({ label: 'Source' });
    const destinationList = createPlannerList({ label: 'Destination' });
    const previous = createPlannerItem({ listId: destinationList.id });
    const next = createPlannerItem({
        afterOrderKey: previous.orderKey,
        listId: destinationList.id,
    });
    const scheduled = {
        ...createPlannerItem({ listId: sourceList.id }),
        scheduledStartMinutes: 9 * 60,
    };
    store.getState().applySnapshot({
        lists: [sourceList, destinationList],
        items: [previous, next, scheduled],
    });
    const commands = createPlannerCommands({
        preferences: preferenceRepository,
        repository,
        store,
    });

    await commands.returnItemToList(
        scheduled.id,
        destinationList.id,
        previous.id,
        next.id
    );

    const returned = store.getState().itemsById.get(scheduled.id)!;
    expect(returned).toMatchObject({
        listId: destinationList.id,
        scheduledStartMinutes: null,
    });
    expect(returned.orderKey > previous.orderKey).toBe(true);
    expect(returned.orderKey < next.orderKey).toBe(true);
    expect(repository.mutations).toHaveLength(1);
    expect(repository.mutations[0]).toMatchObject({
        base: { id: scheduled.id, listId: sourceList.id },
        entity: {
            id: scheduled.id,
            listId: destinationList.id,
            scheduledStartMinutes: null,
        },
        type: 'put-item',
    });
});

it('requires write access to the destination before returning an item', async () => {
    const repository = new MemoryRepository();
    const store = createPlannerStore();
    const sourceList = createPlannerList({ label: 'Source' });
    const destinationList = createPlannerList({ label: 'Destination' });
    const scheduled = {
        ...createPlannerItem({ listId: sourceList.id }),
        scheduledStartMinutes: 9 * 60,
    };
    store.getState().applySnapshot({
        lists: [sourceList, destinationList],
        items: [scheduled],
    });
    const commands = createPlannerCommands({
        authorization: {
            canAccessList: id => id === sourceList.id,
        },
        preferences: preferenceRepository,
        repository,
        store,
    });

    await expect(
        commands.returnItemToList(
            scheduled.id,
            destinationList.id,
            null,
            null
        )
    ).rejects.toThrow('read only');
    expect(repository.mutations).toHaveLength(0);
    expect(store.getState().itemsById.get(scheduled.id)).toEqual(scheduled);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
./node_modules/.bin/vitest run --project unit src/core/application/__tests__/plannerCommands.test.ts
```

Expected: TypeScript/Vitest fails because `returnItemToList` does not exist.

- [ ] **Step 3: Add the command interface and one-mutation implementation**

Add this signature to `PlannerCommands`:

```ts
returnItemToList: (
    id: ItemId,
    targetListId: ListId,
    previousId: ItemId | null,
    nextId: ItemId | null
) => Promise<void>;
```

Add this command beside `moveItem`:

```ts
returnItemToList: async (id, targetListId, previousId, nextId) => {
    const state = store.getState();
    const item = state.itemsById.get(id);
    if (!item || !state.listsById.has(targetListId)) return;
    requireListAccess(item.listId, 'write');
    requireListAccess(targetListId, 'write');
    const previous = previousId
        ? (state.itemsById.get(previousId) ?? null)
        : null;
    const next = nextId ? (state.itemsById.get(nextId) ?? null) : null;
    await persist([
        putItem(
            item,
            updated(item, {
                listId: targetListId,
                orderKey: createOrderKeyBetween(previous, next),
                scheduledStartMinutes: null,
            })
        ),
    ]);
},
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run the Step 2 command. Expected: all planner-command tests pass.

- [ ] **Step 5: Review the task diff without committing**

Run:

```bash
git diff --check -- src/core/application/plannerCommands.ts src/core/application/__tests__/plannerCommands.test.ts
```

Expected: no whitespace errors. Commit only the Task 1 files as a local review checkpoint; do not push or integrate the commit.

### Task 2: Pure Item-List Insertion Resolver

**Files:**
- Create: `src/features/items/itemListInsertion.ts`
- Create: `src/features/items/__tests__/itemListInsertion.test.ts`

**Interfaces:**
- Consumes: rendered real-item row geometry measured in the Items scroll surface.
- Produces: `resolveItemListInsertion(pointerOffsetY: number, itemIds: readonly ItemId[], rows: readonly ItemListRowGeometry[]): ItemListInsertion`.

- [ ] **Step 1: Write failing top/middle/end/empty insertion tests**

```ts
import { describe, expect, it } from 'vitest';
import { createItemId } from '../../../core/domain/ids';
import { resolveItemListInsertion } from '../itemListInsertion';

const first = createItemId();
const second = createItemId();
const third = createItemId();
const itemIds = [first, second, third];
const rows = [
    { id: first, size: 60, start: 72 },
    { id: second, size: 60, start: 132 },
    { id: third, size: 60, start: 192 },
];

describe('resolveItemListInsertion', () => {
    it('resolves the top slot before the first item', () => {
        expect(resolveItemListInsertion(80, itemIds, rows)).toEqual({
            index: 0,
            nextId: first,
            previousId: null,
        });
    });

    it('resolves a slot between rendered items', () => {
        expect(resolveItemListInsertion(190, itemIds, rows)).toEqual({
            index: 2,
            nextId: third,
            previousId: second,
        });
    });

    it('resolves the slot after the final rendered item', () => {
        expect(resolveItemListInsertion(260, itemIds, rows)).toEqual({
            index: 3,
            nextId: null,
            previousId: third,
        });
    });

    it('resolves the first slot in an empty list', () => {
        expect(resolveItemListInsertion(100, [], [])).toEqual({
            index: 0,
            nextId: null,
            previousId: null,
        });
    });
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
./node_modules/.bin/vitest run --project unit src/features/items/__tests__/itemListInsertion.test.ts
```

Expected: module resolution fails because `itemListInsertion.ts` is absent.

- [ ] **Step 3: Implement the geometry resolver**

```ts
import type { ItemId } from '../../core/domain/ids';

export interface ItemListRowGeometry {
    id: ItemId;
    size: number;
    start: number;
}

export interface ItemListInsertion {
    index: number;
    nextId: ItemId | null;
    previousId: ItemId | null;
}

export function resolveItemListInsertion(
    pointerOffsetY: number,
    itemIds: readonly ItemId[],
    rows: readonly ItemListRowGeometry[]
): ItemListInsertion {
    const nextRow = rows.find(
        row => pointerOffsetY < row.start + row.size / 2
    );
    const lastRow = rows.at(-1) ?? null;
    const rawIndex = nextRow
        ? itemIds.indexOf(nextRow.id)
        : lastRow
          ? itemIds.indexOf(lastRow.id) + 1
          : 0;
    const index = Math.max(0, Math.min(itemIds.length, rawIndex));
    return {
        index,
        nextId: itemIds[index] ?? null,
        previousId: itemIds[index - 1] ?? null,
    };
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run the Step 2 command. Expected: four tests pass.

- [ ] **Step 5: Review the task diff without committing**

Run `git diff --check -- src/features/items/itemListInsertion.ts src/features/items/__tests__/itemListInsertion.test.ts`. Expected: no whitespace errors. Commit only the Task 2 files as a local review checkpoint.

### Task 3: Shared Pointer-Drag Controller and Timeline Target

**Files:**
- Create: `src/features/items/itemDropTargets.ts`
- Create: `src/features/items/__tests__/itemDropTargets.test.ts`
- Create: `src/features/items/ItemDragProvider.tsx`
- Create: `src/features/timeline/useTimelineItemDropTarget.ts`
- Delete: `src/features/timeline/useTimelineItemDrag.ts`
- Modify: `src/features/timeline/TimelineColumn.tsx`
- Modify: `src/app/App.tsx`

**Interfaces:**
- Consumes: `hasCrossedItemDragThreshold`, the existing ghost DOM/CSS contract, `snapTimelineDragMinute`, item store state, and `PlannerCommands.updateItem`.
- Produces: `ItemDragProvider`, `useItemDragState()`, `useItemDropTarget(target)`, and typed `ItemDropPreview` variants used by both destination columns.

- [ ] **Step 1: Write a failing target-arbitration test**

```ts
import { describe, expect, it } from 'vitest';
import { createPlannerItem, createPlannerList } from '../../../core/domain/factories';
import {
    areActiveItemDropsEqual,
    resolveRegisteredItemDrop,
    type ItemDropTarget,
} from '../itemDropTargets';

describe('resolveRegisteredItemDrop', () => {
    it('returns the first registered target that accepts the pointer', () => {
        const list = createPlannerList();
        const item = createPlannerItem({ listId: list.id });
        const acceptedPreview = { kind: 'timeline' as const, minute: 615 };
        const targets: ItemDropTarget[] = [
            {
                commit: () => undefined,
                id: 'items',
                resolve: () => null,
            },
            {
                commit: () => undefined,
                id: 'timeline',
                resolve: () => acceptedPreview,
            },
        ];

        expect(
            resolveRegisteredItemDrop(
                targets,
                { clientX: 20, clientY: 30, grabRatioY: 0.5 },
                item
            )
        ).toEqual({ preview: acceptedPreview, targetId: 'timeline' });
    });

    it('compares typed previews without treating pointer movement as a change', () => {
        expect(
            areActiveItemDropsEqual(
                { preview: { kind: 'timeline', minute: 615 }, targetId: 'timeline' },
                { preview: { kind: 'timeline', minute: 615 }, targetId: 'timeline' }
            )
        ).toBe(true);
        expect(
            areActiveItemDropsEqual(
                { preview: { kind: 'timeline', minute: 615 }, targetId: 'timeline' },
                { preview: { kind: 'timeline', minute: 620 }, targetId: 'timeline' }
            )
        ).toBe(false);
    });
});
```

- [ ] **Step 2: Run the arbitration test and verify RED**

Run:

```bash
./node_modules/.bin/vitest run --project unit src/features/items/__tests__/itemDropTargets.test.ts
```

Expected: module resolution fails because `itemDropTargets.ts` is absent.

- [ ] **Step 3: Define drop variants, registry contracts, and arbitration**

```ts
import type { ItemId, ListId } from '../../core/domain/ids';
import type { PlannerItem } from '../../core/domain/types';

export interface ItemDropPointer {
    clientX: number;
    clientY: number;
    grabRatioY: number;
}

export type ItemDropPreview =
    | { kind: 'timeline'; minute: number }
    | {
          index: number;
          kind: 'items';
          listId: ListId;
          nextId: ItemId | null;
          previousId: ItemId | null;
      };

export interface ItemDropTarget {
    commit: (itemId: ItemId, preview: ItemDropPreview) => Promise<void> | void;
    id: string;
    resolve: (
        pointer: ItemDropPointer,
        item: PlannerItem
    ) => ItemDropPreview | null;
}

export interface ActiveItemDrop {
    preview: ItemDropPreview;
    targetId: string;
}

export function resolveRegisteredItemDrop(
    targets: readonly ItemDropTarget[],
    pointer: ItemDropPointer,
    item: PlannerItem
): ActiveItemDrop | null {
    for (const target of targets) {
        const preview = target.resolve(pointer, item);
        if (preview) return { preview, targetId: target.id };
    }
    return null;
}

export function areActiveItemDropsEqual(
    left: ActiveItemDrop | null,
    right: ActiveItemDrop | null
): boolean {
    if (left === right) return true;
    if (!left || !right || left.targetId !== right.targetId) return false;
    const leftPreview = left.preview;
    const rightPreview = right.preview;
    if (leftPreview.kind !== rightPreview.kind) return false;
    if (leftPreview.kind === 'timeline' && rightPreview.kind === 'timeline') {
        return leftPreview.minute === rightPreview.minute;
    }
    if (leftPreview.kind === 'items' && rightPreview.kind === 'items') {
        return (
            leftPreview.index === rightPreview.index &&
            leftPreview.listId === rightPreview.listId &&
            leftPreview.nextId === rightPreview.nextId &&
            leftPreview.previousId === rightPreview.previousId
        );
    }
    return false;
}
```

- [ ] **Step 4: Run the arbitration tests and verify GREEN**

Run the Step 2 command. Expected: two tests pass.

- [ ] **Step 5: Move the working pointer lifecycle into `ItemDragProvider`**

Move `PointerDrag`, `positionDragGhost`, `createDragGhost`, document Pointer Event listeners, pointer capture/release, moving clone, eight-pixel threshold, source opacity, window-blur cleanup, and click suppression out of `useTimelineItemDrag.ts` without changing those mechanics.

Replace the timeline-specific coordinate state with this context contract:

```ts
interface ItemDragContextValue {
    activeDrop: ActiveItemDrop | null;
    activeItemId: ItemId | null;
    registerDropTarget: (target: ItemDropTarget) => () => void;
}
```

Keep a `Map<string, ItemDropTarget>` ref, an `activeDropRef`, and matching React state. Registration must replace the same target ID and unregister only that exact object:

```ts
const registerDropTarget = useCallback((target: ItemDropTarget) => {
    targetsRef.current.set(target.id, target);
    return () => {
        if (targetsRef.current.get(target.id) === target) {
            targetsRef.current.delete(target.id);
        }
    };
}, []);
```

On every active pointer move, resolve the first accepting target synchronously and update both ref and state:

```ts
const nextDrop = item
    ? resolveRegisteredItemDrop(
          Array.from(targetsRef.current.values()),
          {
              clientX: event.clientX,
              clientY: event.clientY,
              grabRatioY: currentDrag.grabRatioY,
          },
          item
      )
    : null;
activeDropRef.current = nextDrop;
setActiveDrop(current =>
    areActiveItemDropsEqual(current, nextDrop) ? current : nextDrop
);
```

On pointer release, snapshot `activeDropRef.current` and its registered target before clearing all drag UI; then invoke `target.commit(itemId, preview)`. Catch a rejected promise with `console.error('Unable to drop item', error)` so persistence failure does not create an unhandled rejection.

Export:

```ts
export function ItemDragProvider({ children }: PropsWithChildren): ReactNode;
export function useItemDragState(): Pick<
    ItemDragContextValue,
    'activeDrop' | 'activeItemId'
>;
export function useItemDropTarget(target: ItemDropTarget): void;
```

`useItemDropTarget` reads `registerDropTarget` from context and registers the
memoized target for exactly the lifetime of that target object:

```ts
export function useItemDropTarget(target: ItemDropTarget): void {
    const { registerDropTarget } = useContext(ItemDragContext);
    useEffect(() => registerDropTarget(target), [registerDropTarget, target]);
}
```

- [ ] **Step 6: Mount the provider inside `PlannerCommandsProvider`**

Update `App.tsx`:

```tsx
<PlannerCommandsProvider>
    <ItemDragProvider>
        <PlannerShell />
    </ItemDragProvider>
</PlannerCommandsProvider>
```

- [ ] **Step 7: Register Timeline as a typed drop target**

Create `useTimelineItemDropTarget.ts`. Its `resolve` checks the timeline bounds, converts the pointer position to a raw minute with `(scrollTop + clientY - bounds.top) / pixelsPerMinute - item.durationMinutes * pointer.grabRatioY`, and returns `{ kind: 'timeline', minute: snapTimelineDragMinute(rawMinute, item.durationMinutes) }`. Its `commit` guards `preview.kind === 'timeline'` and calls:

```ts
await commands.updateItem(itemId, {
    scheduledStartMinutes: preview.minute,
});
```

The hook returns `{ draggedItemId, dropPreviewMinute }` derived from `useItemDragState()`. Update `TimelineColumn.tsx` to use this hook and retain the existing outline JSX unchanged. Remove `useTimelineItemDrag.ts` after all imports move.

- [ ] **Step 8: Run focused and static checks**

Run:

```bash
./node_modules/.bin/vitest run --project unit src/features/items/__tests__/itemDropTargets.test.ts src/features/items/__tests__/itemDragSession.test.ts src/features/timeline/__tests__/timelineScale.test.ts
./node_modules/.bin/tsc -b --pretty false
./node_modules/.bin/eslint src/features/items src/features/timeline src/app/App.tsx --max-warnings 0
```

Expected: all focused tests pass; TypeScript and ESLint exit zero.

- [ ] **Step 9: Review the task diff without committing**

Run `git diff --check`. Expected: no whitespace errors. Commit only the Task 3 files as a local review checkpoint.

### Task 4: Items Drop Target and Virtualized Insertion Preview

**Files:**
- Create: `src/features/items/useItemListDropTarget.ts`
- Modify: `src/features/items/ItemColumn.tsx`
- Modify: `src/styles/features.css`

**Interfaces:**
- Consumes: `useItemDropTarget`, `useItemDragState`, `resolveItemListInsertion`, `PlannerCommands.returnItemToList`, selected-list write capability, and rendered row data attributes.
- Produces: an Items drop registration plus an `ItemListInsertion` used to add one keyed virtual placeholder entry.

- [ ] **Step 1: Implement the Items target hook**

Define:

```ts
interface UseItemListDropTargetOptions {
    canWrite: boolean;
    containerRef: RefObject<HTMLDivElement | null>;
    itemIds: readonly ItemId[];
    selectedListId: ListId | null;
}
```

The registered target uses ID `items`. `resolve` returns `null` unless the dragged item is scheduled, the selected list exists, the list is writable, and the pointer is inside `containerRef` bounds. Convert the pointer to content Y with:

```ts
const pointerOffsetY =
    element.scrollTop + pointer.clientY - bounds.top;
```

Measure real rendered rows only:

```ts
const rows = Array.from(
    element.querySelectorAll<HTMLElement>('[data-item-list-row-id]')
).map(row => ({
    id: row.dataset.itemListRowId as ItemId,
    size: row.offsetHeight,
    start: row.offsetTop,
}));
```

Call `resolveItemListInsertion(pointerOffsetY, itemIds, rows)` and return its fields with `{ kind: 'items', listId: selectedListId }`. `commit` guards `preview.kind === 'items'` and awaits:

```ts
commands.returnItemToList(
    itemId,
    preview.listId,
    preview.previousId,
    preview.nextId
);
```

Return `{ activeItemId, insertion }`, where `insertion` is the Items preview only when the shared `activeDrop.targetId` is `items`; otherwise return `null` for `insertion`.

- [ ] **Step 2: Add the insertion entry to `ItemColumn`**

Represent virtual entries explicitly:

```ts
type ItemColumnEntry =
    | { kind: 'create' }
    | { id: ItemId; kind: 'item' }
    | { id: ItemId; kind: 'drop-preview' };
```

Call `useItemListDropTarget` before constructing entries. Resolve `draggedItem` from the returned `activeItemId` with one unconditional `usePlannerSelector` call. Build `[create, ...items]`, and when both `insertion` and `draggedItem` exist, splice one `drop-preview` entry at `insertion.index + 1`. Use `item-drop-preview` as its stable virtualizer key. Keep keyboard navigation and shortcut numbers based on the original `itemIds`, not the preview-augmented entries.

Real item wrappers receive:

```tsx
data-item-list-row-id={entry.kind === 'item' ? entry.id : undefined}
```

Render the preview entry in the existing absolute row wrapper:

```tsx
<div
    aria-hidden="true"
    className="planner-item-list-drag-preview w-full"
    style={{
        height: relative
            ? `calc(var(--planner-minute-height) * ${draggedItem.durationMinutes})`
            : 54,
    }}
/>
```

Retain the wrapper's existing `pb-[10px]`, `top: item.start`, and virtualizer measurement ref so the outline consumes a full virtual slot and shifts later cards.

- [ ] **Step 3: Style the outline consistently with Timeline**

Share the existing border rule:

```css
.planner-timeline-drag-preview,
.planner-item-list-drag-preview {
    border: var(--planner-stroke-width) solid var(--planner-item-border-hover);
    border-radius: var(--radius-planner);
}
```

Give the Items outline no fill or pointer interaction:

```css
.planner-item-list-drag-preview {
    background: transparent;
    pointer-events: none;
}
```

- [ ] **Step 4: Run focused behavior and static checks**

Run:

```bash
./node_modules/.bin/vitest run --project unit src/features/items/__tests__/itemListInsertion.test.ts src/core/application/__tests__/plannerCommands.test.ts
./node_modules/.bin/tsc -b --pretty false
./node_modules/.bin/eslint src/features/items src/core/application --max-warnings 0
```

Expected: focused tests pass; TypeScript and ESLint exit zero.

- [ ] **Step 5: Review the task diff without committing**

Run `git diff --check`. Expected: no whitespace errors. Confirm `ItemColumn` still uses `itemIds` for keyboard focus and selection, and only its render entries include the preview. Commit only the Task 4 files as a local review checkpoint.

### Task 5: Full Verification, Installed Build, and Decision Audit

**Files:**
- Verify all files changed by Tasks 1–4 plus the existing uncommitted forward-drag implementation.

**Interfaces:**
- Consumes: the complete two-direction drag implementation.
- Produces: fresh automated evidence, a newly installed signed desktop app for Aaron, and a decision audit before any implementation commit.

- [ ] **Step 1: Format changed source and test files**

Run Prettier only on the files named in this plan and the existing forward-drag files:

```bash
./node_modules/.bin/prettier --write \
  src/app/App.tsx \
  src/core/application/plannerCommands.ts \
  src/core/application/__tests__/plannerCommands.test.ts \
  src/features/items/ItemCard.tsx \
  src/features/items/ItemColumn.tsx \
  src/features/items/ItemDragProvider.tsx \
  src/features/items/itemDragSession.ts \
  src/features/items/itemDropTargets.ts \
  src/features/items/itemListInsertion.ts \
  src/features/items/useItemListDropTarget.ts \
  src/features/items/__tests__/*.test.ts \
  src/features/timeline/TimelineColumn.tsx \
  src/features/timeline/timelineScale.ts \
  src/features/timeline/useTimelineItemDropTarget.ts \
  src/features/timeline/__tests__/timelineScale.test.ts \
  src/styles/features.css
```

- [ ] **Step 2: Run all ordinary verification**

Run:

```bash
./node_modules/.bin/eslint src vite.config.ts vitest.config.ts eslint.config.ts --max-warnings 0
./node_modules/.bin/tsc -b --pretty false
./node_modules/.bin/vitest run --project unit --project node
./node_modules/.bin/vite build
npx react-doctor@latest --verbose --scope changed
git diff --check
```

Expected: lint, TypeScript, tests, build, and diff checks exit zero; React Doctor does not introduce a new diagnostic relative to its current 68/100, 28-warning baseline.

- [ ] **Step 3: Build the signed Tauri bundle**

Run:

```bash
node scripts/build-tauri-app.mjs --config '{"build":{"beforeBuildCommand":""}}'
```

Poll the foreground build until it exits. Expected: release compilation succeeds and produces the signed `.app` and `.dmg` bundles.

- [ ] **Step 4: Resolve, replace, stop, and reopen only Daily Planner**

Resolve the installed bundle and exact executable first:

```bash
ls -ld '/Applications/Daily Planner.app'
ps -axo pid=,command= | rg '/Applications/Daily Planner\.app/Contents/MacOS/' || true
```

Run the transactional installer:

```bash
node scripts/install-desktop-app.mjs
```

If the installer did not relaunch because the app was not running, run:

```bash
open -a '/Applications/Daily Planner.app'
```

Verify the exact process and signature:

```bash
ps -axo pid=,command= | rg '/Applications/Daily Planner\.app/Contents/MacOS/'
codesign --verify --deep --strict '/Applications/Daily Planner.app'
```

- [ ] **Step 5: Give the post-implementation decision audit and pause**

Report every meaningful architecture/UX/atomicity decision, alternatives, confidence, edge cases, validation gaps, pride gate, and overall verdict. Do not commit, push, merge, or revise the implementation until Aaron reviews the audit.

- [ ] **Step 6: Hand off the installed-app checks**

Ask Aaron to verify:

1. Dragging Timeline → Items shows the moving card and one outline insertion slot.
2. Existing cards move aside as the pointer crosses their midpoints.
3. Dropping transfers the item to the selected list, unschedules it, and preserves the previewed order.
4. Empty, top, middle, and end insertion positions work.
5. Read-only Items and release outside a target make no change.
6. Existing Items → Timeline and Timeline → Timeline dragging still work.

Keep all checkpoint commits local; do not push, merge, or integrate them until the audit and manual validation are approved.
