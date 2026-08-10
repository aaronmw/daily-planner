# Item Card Shortcut Position Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Center each numbered item-card shortcut keycap over the midpoint of the card's left edge.

**Architecture:** Keep the existing shortcut markup and keyboard behavior unchanged. Use the item card's existing positioned button as the containing block, take the shortcut wrapper out of the flex layout with absolute positioning, and allow only item cards to show the portion that extends beyond their edge.

**Tech Stack:** React 19, TypeScript 6, Tailwind CSS 4 utilities, project CSS

## Global Constraints

- Preserve existing shortcut rendering, keyboard behavior, accessibility text, card sizing, drag behavior, and timeline/collection contexts.
- Do not change the `KeyboardKey` component or add new behavior.
- Do not add a regression test for this small styling-only change; use formatting, lint, TypeScript, and build checks.
- Hand visual review to Aaron before using browser automation.

---

### Task 1: Position the shortcut keycap over the item-card edge

**Files:**

- Modify: `src/styles/features.css:53-56`
- Modify: `src/styles/features.css:178-184`

**Interfaces:**

- Consumes: The existing `.planner-item-card`, `.planner-list-card`, and `.planner-item-card-shortcut` class names rendered by `ItemCard`.
- Produces: A shortcut wrapper centered at the item card's left-edge midpoint without participating in the card's flex layout.

- [ ] **Step 1: Separate list-card and item-card overflow behavior**

Replace the shared overflow rule:

```css
.planner-list-card,
.planner-item-card {
    overflow: hidden;
}
```

with:

```css
.planner-list-card {
    overflow: hidden;
}

.planner-item-card {
    overflow: visible;
}
```

This preserves list-card clipping while allowing half of the keycap to extend beyond the item card.

- [ ] **Step 2: Position the shortcut wrapper**

Add a dedicated rule before the shared shortcut/icon transition rule:

```css
.planner-item-card-shortcut {
    left: 0;
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    z-index: 1;
}
```

Keep the existing transition declarations so the element remains consistent with card motion styling.

- [ ] **Step 3: Run static verification**

Run:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm build
```

Expected: all commands exit successfully with no formatting, lint, type, or build errors.

- [ ] **Step 4: Review the final diff**

Run:

```bash
git diff --check
git diff -- src/styles/features.css
```

Expected: the diff contains only the overflow split and shortcut positioning rule described above.

- [ ] **Step 5: Hand off visual verification**

Ask Aaron to choose:

1. Looks good to me, keep going
2. Verify via automation

Do not start or manage a development server.
