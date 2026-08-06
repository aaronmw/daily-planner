# Timeline Zoom Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the existing timeline zoom slider into the bottom of the Options popover while preserving its persisted value and live timeline behavior.

**Architecture:** `usePlannerApp` remains the owner of zoom state. `OptionsMenu` consumes the existing state/action pair and renders the control inside a non-modal settings dialog; `Timeline` only consumes the value for layout calculations. The existing CSS variables and range styling remain the visual source of truth.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, app-level CSS, Jest

## Global Constraints

- Preserve `timeline-hours-per-screen`, its normalization, and its `4`–`24` range with a step of `1`.
- Keep the popover open while zoom changes and keep current outside-pointer and Escape dismissal.
- Keep lighting-mode selection mutually exclusive and preserve its current close-on-select behavior.
- Do not start, stop, or restart Aaron's local server.
- Do not add a component test harness for this focused UI move; use the existing tests, build, React Doctor, and Aaron's visual review.

---

### Task 1: Move Timeline Zoom Into Options

**Files:**

- Modify: `src/components/atoms/tokens.js`
- Modify: `src/components/OptionsMenu.js`
- Modify: `src/components/Timeline.js`
- Modify: `app/globals.css`

**Interfaces:**

- Consumes: `appData.timelineHoursPerScreen: number`
- Consumes: `appActions.onChangeTimelineHoursPerScreen(nextValue: string): void`
- Consumes: `TIMELINE_HOURS_PER_SCREEN_MIN`, `TIMELINE_HOURS_PER_SCREEN_MAX`, and `TIMELINE_HOURS_PER_SCREEN_STEP`
- Produces: one labelled range input inside the Options dialog; no new public component or state interface

- [ ] **Step 1: Move the zoom constants and action ownership to `OptionsMenu`**

Add `COPY.LABEL_FOR_TIMELINE_SETTINGS = 'Timeline'`. Import the range constants beside the existing tokens, read `timelineHoursPerScreen` from `appData`, and read `onChangeTimelineHoursPerScreen` from `appActions`:

```js
import {
    COPY,
    ICONS,
    THEME_MODES,
    TIMELINE_HOURS_PER_SCREEN_MAX,
    TIMELINE_HOURS_PER_SCREEN_MIN,
    TIMELINE_HOURS_PER_SCREEN_STEP,
} from './atoms/tokens';

const { onChangeThemeMode, onChangeTimelineHoursPerScreen } = appActions;
const { themeMode, timelineHoursPerScreen } = appData;
```

- [ ] **Step 2: Give the mixed-control popover dialog and radio-group semantics**

Generate stable label/input IDs with `useId`. Change the trigger to `aria-haspopup="dialog"`, replace the surface with a native non-modal `<dialog>`, open it with `show()`, and close it after the existing 150ms exit transition. Extend `OptionsMenuGroup` to accept `labelId`, `role`, and `hasSlots`, then expose Lighting Mode as a slotted `radiogroup` and each theme button as `role="radio"`.

Keep closed controls out of tab order with the existing `isOpen` prop and make the checked lighting radio the group's only tab stop. Support Arrow keys plus Home/End through the same selection path. Move focus to the selected lighting radio when the dialog opens, return focus to the gear trigger after Escape or lighting selection, and allow an outside pointer action to receive focus normally. Preserve `aria-checked`, the visible check slot, outside-pointer dismissal, Escape dismissal, and close-on-theme-selection.

- [ ] **Step 3: Render the Timeline group after Lighting Mode**

Add the final group and slider row inside `.planner-options-menu-content`:

```jsx
<OptionsMenuGroup
    label={COPY.LABEL_FOR_TIMELINE_SETTINGS}
    labelId={timelineGroupLabelId}
    role="group"
>
    <div className="planner-options-menu-zoom-row">
        <label htmlFor={zoomInputId}>{COPY.LABEL_FOR_TIMELINE_ZOOM}</label>
        <input
            id={zoomInputId}
            aria-valuetext={`${timelineHoursPerScreen} hours visible`}
            className="planner-options-menu-zoom-slider"
            max={TIMELINE_HOURS_PER_SCREEN_MAX}
            min={TIMELINE_HOURS_PER_SCREEN_MIN}
            step={TIMELINE_HOURS_PER_SCREEN_STEP}
            tabIndex={isOpen ? undefined : -1}
            type="range"
            value={timelineHoursPerScreen}
            onChange={evt => onChangeTimelineHoursPerScreen(evt.target.value)}
        />
        <span className="planner-options-menu-zoom-value">
            {timelineHoursPerScreen}h
        </span>
    </div>
</OptionsMenuGroup>
```

Use the new `Timeline` copy token as the section heading; keep `Zoom` as the field label.

- [ ] **Step 4: Remove the floating control from `Timeline`**

Delete the range-constant imports, `onChangeTimelineHoursPerScreen` destructuring, and `.planner-timeline-zoom-control` JSX. Keep `timelineHoursPerScreen` because timeline cards, markers, grid rows, and drop zones still consume it.

- [ ] **Step 5: Restyle the moved slider as the final menu section**

In `app/globals.css`:

```css
.planner-options-menu-group + .planner-options-menu-group {
    box-shadow: inset 0 1px 0 var(--planner-border);
}

.planner-options-menu-zoom-row {
    align-items: center;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    min-height: var(--planner-options-item-slot-size);
    padding-inline: var(--planner-options-item-pad);
}

.planner-options-menu-zoom-row label {
    padding-right: calc(var(--spacing-grid) * 0.4);
}

.planner-options-menu-zoom-value {
    font-variant-numeric: tabular-nums;
    justify-self: end;
    padding-left: calc(var(--spacing-grid) * 0.4);
}
```

Give unslotted group headings ordinary child-owned inline padding while preserving the Lighting group's 40px leading/check columns. Rename `.planner-timeline-zoom-slider` and its browser thumb selectors to `.planner-options-menu-zoom-slider`, make the input fill its grid track with `min-width: 0; width: 100%`, and add a visible `:focus-visible` outline using `var(--planner-contrast)`.

- [ ] **Step 6: Format and run existing tests**

Run:

```bash
npx prettier --write src/components/OptionsMenu.js src/components/Timeline.js app/globals.css
npm test -- --runInBand
```

Expected: all existing Jest suites pass with zero failures.

- [ ] **Step 7: Verify the production build and React diagnostics**

Run:

```bash
npm run build
npx react-doctor@latest --verbose --scope changed --include-untracked --yes
git diff --check
```

Expected: Next.js completes its production build, React Doctor remains at `100 / 100`, and `git diff --check` reports no whitespace errors.

- [ ] **Step 8: Hand off visual verification**

Do not touch the existing server. Ask Aaron to inspect the Options dialog at `localhost:3010` and choose:

1. Looks good to me, keep going
2. Verify via automation
