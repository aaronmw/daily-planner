# Timeline Drag and Initial Scroll Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore native item-card dragging in WKWebView and initialize the timeline one hour before the current local time without overriding later manual scrolling.

**Architecture:** Keep the existing native drag payload and timeline drop logic, but replace transform-based virtual row placement with a small WebKit-safe `top` positioning helper. Add a pure initial-minute helper to the existing timeline scale module, initialize the timeline from it once, and preserve the existing scroll ref as the source of truth afterward.

**Tech Stack:** React 19, TypeScript 6, TanStack Virtual, Vitest, Tailwind CSS 4, Tauri/WKWebView

## Global Constraints

- Preserve drag payloads, drop-time rounding, scheduling commands, permissions, virtualization, and keyboard behavior.
- Preserve manual timeline scrolling after the initial mount.
- Clamp pre-1:00 AM initialization to midnight.
- Do not add WebKit-only drag CSS or replace native drag and drop with a custom pointer system.
- Do not rebuild, stop, or relaunch the installed app without Aaron explicitly requesting process control in that turn.

---

### Task 1: Remove transformed ancestors from draggable virtual item rows

**Files:**

- Create: `src/features/items/itemVirtualization.ts`
- Create: `src/features/items/__tests__/itemVirtualization.test.ts`
- Modify: `src/features/items/ItemColumn.tsx:238-246`

**Interfaces:**

- Consumes: TanStack Virtual's numeric `VirtualItem.start` offset.
- Produces: `virtualItemRowPosition(start: number): { top: number }` for transform-free absolute row placement.

- [ ] **Step 1: Write the failing regression test**

```ts
import { describe, expect, it } from 'vitest';
import { virtualItemRowPosition } from '../itemVirtualization';

describe('virtualItemRowPosition', () => {
    it('positions a virtual row without a transform ancestor', () => {
        const style = virtualItemRowPosition(128);

        expect(style).toEqual({ top: 128 });
        expect(style).not.toHaveProperty('transform');
    });
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
pnpm exec vitest run --project unit src/features/items/__tests__/itemVirtualization.test.ts
```

Expected: FAIL because `../itemVirtualization` does not exist.

- [ ] **Step 3: Implement transform-free row positioning**

Create `src/features/items/itemVirtualization.ts`:

```ts
export const virtualItemRowPosition = (
    start: number
): { top: number } => ({ top: start });
```

Import it in `ItemColumn.tsx` and replace:

```tsx
style={{ transform: `translateY(${item.start}px)` }}
```

with:

```tsx
style={virtualItemRowPosition(item.start)}
```

The existing absolutely positioned row keeps the same virtual offset without placing the draggable card beneath a transformed ancestor.

- [ ] **Step 4: Run the focused test and verify it passes**

Run:

```bash
pnpm exec vitest run --project unit src/features/items/__tests__/itemVirtualization.test.ts
```

Expected: PASS with one test.

---

### Task 2: Initialize the timeline one hour before the current time

**Files:**

- Modify: `src/features/timeline/timelineScale.ts`
- Modify: `src/features/timeline/__tests__/timelineScale.test.ts`
- Modify: `src/features/timeline/TimelineColumn.tsx:35-80`

**Interfaces:**

- Consumes: A local `Date` supplied to `initialTimelineMinute(now: Date)`.
- Produces: A non-negative minute-of-day used once to seed the timeline's top-minute ref and visible range.

- [ ] **Step 1: Write failing initial-minute tests**

Update `timelineScale.test.ts` to import `initialTimelineMinute` and add:

```ts
describe('initialTimelineMinute', () => {
    it('starts one hour before the current local time', () => {
        expect(initialTimelineMinute(new Date(2026, 7, 10, 14, 35))).toBe(
            13 * 60 + 35
        );
    });

    it('clamps the initial position to midnight', () => {
        expect(initialTimelineMinute(new Date(2026, 7, 10, 0, 45))).toBe(0);
    });
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
pnpm exec vitest run --project unit src/features/timeline/__tests__/timelineScale.test.ts
```

Expected: FAIL because `initialTimelineMinute` is not exported.

- [ ] **Step 3: Implement the pure initial-minute calculation**

Add to `timelineScale.ts`:

```ts
export function initialTimelineMinute(now: Date): number {
    return Math.max(0, now.getHours() * 60 + now.getMinutes() - 60);
}
```

- [ ] **Step 4: Seed TimelineColumn once and synchronize browser clamping**

Import `initialTimelineMinute` into `TimelineColumn.tsx`. Replace the fixed 6:00 AM ref and range with a lazy state value:

```tsx
const [initialTopMinute] = useState(() => initialTimelineMinute(new Date()));
const topMinuteRef = useRef(initialTopMinute);
const [visibleRange, setVisibleRange] = useState({
    end: initialTopMinute + hoursPerScreen * 60,
    start: initialTopMinute,
});
```

After assigning `element.scrollTop` in the layout effect, read the applied position back before updating the range:

```tsx
element.scrollTop = topMinuteRef.current * pixelsPerMinute;
const appliedTopMinute = element.scrollTop / pixelsPerMinute;
topMinuteRef.current = appliedTopMinute;
setVisibleRange({
    end: appliedTopMinute + hoursPerScreen * 60,
    start: appliedTopMinute,
});
```

Do not add a timer or include the current clock in any later scroll effect.

- [ ] **Step 5: Run the focused timeline test and verify it passes**

Run:

```bash
pnpm exec vitest run --project unit src/features/timeline/__tests__/timelineScale.test.ts
```

Expected: PASS for the existing scale tests and the two new initial-minute tests.

---

### Task 3: Verify the combined implementation

**Files:**

- Verify: `src/features/items/ItemColumn.tsx`
- Verify: `src/features/items/itemVirtualization.ts`
- Verify: `src/features/items/__tests__/itemVirtualization.test.ts`
- Verify: `src/features/timeline/TimelineColumn.tsx`
- Verify: `src/features/timeline/timelineScale.ts`
- Verify: `src/features/timeline/__tests__/timelineScale.test.ts`

**Interfaces:**

- Consumes: The completed drag-row and initial-scroll changes from Tasks 1 and 2.
- Produces: A statically verified candidate diff ready for Aaron's post-implementation decision audit.

- [ ] **Step 1: Run focused regression tests together**

Run:

```bash
pnpm exec vitest run --project unit src/features/items/__tests__/itemVirtualization.test.ts src/features/timeline/__tests__/timelineScale.test.ts
```

Expected: PASS for both files.

- [ ] **Step 2: Run repository checks**

Run:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

Expected: all commands exit successfully.

- [ ] **Step 3: Review the final diff**

Run:

```bash
git diff --check
git status --short
git diff -- src/features/items src/features/timeline
```

Expected: only the six implementation/test files listed above are changed or created.

- [ ] **Step 4: Stop for the post-implementation decision audit**

Keep implementation changes uncommitted. Present decisions, alternatives, confidence, remaining validation gaps, and the production pride gate to Aaron before committing, pushing, rebuilding, or relaunching.
