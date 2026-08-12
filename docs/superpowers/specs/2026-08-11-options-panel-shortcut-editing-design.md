# Options Panel and Shortcut Editing Design

## Goal

Refine the Options experience so desktop shortcuts can be edited reliably, the panel behaves like a lightweight anchored popover, and related settings are grouped and presented more clearly.

## Shortcut rows

Each Desktop shortcuts row uses four regions:

1. The existing command icon.
2. The command label.
3. Right-aligned shortcut keycaps.
4. A fixed-width pencil icon button.

The row itself is informational rather than the recording control. The pencil button has a descriptive accessible label and starts a shortcut-recording session for only that command.

While idle, the row always shows its configured desktop shortcut keycaps. While recording, that keycap area renders the keys currently held so the user receives immediate feedback. When no keys are held, it falls back to the shortcut snapshot rather than leaving the row blank. Modifier-only input does not finish or cancel recording. A supported non-modifier key combined with at least one modifier forms a candidate chord.

## Recording lifecycle

Shortcut recording is coordinated by the app-level shortcut system rather than by a row-local `keydown` handler. A single active recording session receives keyboard events before ordinary app shortcut dispatch, preventing an existing app command from consuming the candidate chord.

Starting a session snapshots the command's current shortcut. A valid candidate is checked against the complete desktop shortcut map and registered through the existing desktop shortcut coordinator. The preference is persisted and recording ends only after registration succeeds.

If registration fails or the chord conflicts, the existing shortcut remains authoritative, the row stays in listening mode, and an inline error is shown. Escape, outside interaction, focus leaving the recording control, panel closure, window blur, or page hiding cancels the session and restores the snapshot. Pressing and releasing only modifiers leaves the session active.

The recording API exposes the currently pressed key labels to the row. Key-up events remove released keys from the live preview. Closing or cancelling clears all transient key state.

## Options popover

The standalone Options heading and internal close button are removed. The settings launcher and panel share a relatively positioned wrapper in the Item Details header. The panel is a non-modal dialog positioned directly beneath and right-aligned to the launcher.

The launcher remains in place while open and crossfades its gear icon to an X icon using the existing fast motion token. Clicking it toggles the panel. Escape and pointer interaction outside the wrapper close the panel. Opening moves focus into the panel; closing returns focus to the launcher when appropriate. Closing also cancels an active shortcut-recording session.

The panel retains its viewport-constrained width and scrolling behavior. It does not add a modal backdrop or block interaction with the rest of the planner.

## Grouping and deleted items

Settings sections own their top separators. The separator appears before a section label, not between the label and that section's first row. This makes labels such as “Sync & Sharing” visually belong to the content below them. The first section does not need a redundant top separator.

The Planner group label is removed. Deleted Items becomes a subtle `GhostButton` rendered only when at least one archived list or item exists. It contains a trash icon on the left, the label in the middle, and the deleted-entry count on the right. The count matches the entries shown by the existing Deleted Items view. Activating it closes Options and opens that view.

## Component boundaries

- `ShortcutProvider` owns the exclusive recording session, live pressed-key state, cancellation cleanup, and suppression of normal shortcut dispatch during recording.
- A focused hook exposes start/cancel state and live keys to a shortcut row without coupling Options to provider internals.
- `ShortcutRow` owns presentation, async registration feedback, and the pencil control.
- `OptionsMenu` owns launcher/panel disclosure, outside-click handling, anchored layout, and section presentation.
- The existing desktop shortcut parser, validator, coordinator, `KeyboardKey`, `IconButton`, and `GhostButton` remain the shared primitives.

## Verification

Focused automated coverage should verify:

- recording takes priority over normal contextual shortcut dispatch;
- live modifier and key labels update on keydown and keyup;
- modifier-only input keeps listening;
- valid chords persist only after successful desktop registration;
- conflicts and registration errors preserve the original shortcut;
- Escape, outside click, focus loss, panel close, blur, and hidden-page transitions cancel cleanly;
- the launcher toggles and exposes the correct accessible state;
- the panel is anchored without an internal header or close button;
- section separators precede their labels;
- Deleted Items is absent at zero, otherwise shows the correct count and opens the existing view.

Run focused tests, lint, typecheck, and the production web build. Use the existing user-managed Tauri HMR session for visual review without starting or stopping it.
