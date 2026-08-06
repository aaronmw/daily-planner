# Timeline Zoom Settings Design

**Goal:** Move the timeline zoom slider from its floating timeline overlay to the bottom of the Options popover without changing how zoom is stored or applied.

**Approved direction:** Add one inline Timeline section after Lighting Mode and remove the timeline overlay.

## Interaction

- The Options popover contains Lighting Mode first and Timeline second.
- The Timeline section contains a Zoom label, the existing range input, and the current value in hours.
- The popover remains open while the slider is adjusted so multiple changes are easy.
- Selecting a lighting mode continues to close the popover.
- Outside pointer interaction and Escape continue to close the popover.

## Components And Data Flow

- `OptionsMenu` reads `timelineHoursPerScreen` from `appData` and calls `onChangeTimelineHoursPerScreen` from `appActions`.
- The existing minimum, maximum, and step constants move with the control into `OptionsMenu`.
- `Timeline` continues to read `timelineHoursPerScreen` for sizing tasks, grid rows, drop zones, and the current-time marker, but no longer renders or handles the control.
- Persistence and normalization remain in `usePlannerApp`; no state keys or stored values change.

## Semantics And Accessibility

- Treat the Options popover as a non-modal settings dialog because it contains both radio choices and a range input.
- Change the trigger's popup type and the surface role from `menu` to `dialog`.
- Present Lighting Mode as a labelled radio group while retaining the existing button-based rows and selected checkmarks.
- Associate the Zoom label with the range input and keep its spoken value in hours.
- Preserve keyboard access to every option and the slider.

## Visual Treatment

- Reuse the existing menu width, frame, typography, theme variables, and 40px option-row geometry.
- Place the Timeline section at the bottom with an internal divider; the parent menu remains the sole owner of its outer border and corners.
- Give the slider row enough internal horizontal space for the label, flexible track, and stable tabular value without introducing parent padding.
- Reuse the existing range thumb and track styling.

## Error Handling

The control has no new failure state. Existing zoom normalization handles invalid persisted values, and the constrained range input emits only supported values.

## Verification

- Run the existing unit tests.
- Run a production Next.js build.
- Run React Doctor against changed files.
- Hand visual review to Aaron on the existing local server before using browser automation.

## Non-Goals

- No change to zoom limits, increments, persistence, or timeline calculations.
- No nested submenu or duplicate zoom control.
- No broader Options popover redesign.
