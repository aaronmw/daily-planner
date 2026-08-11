# Reverse Timeline Item Drag Design

## Goal

Allow a scheduled item card to be dragged from the timeline into the visible
Items column. The drop unschedules the item, transfers it to the currently
selected list, and inserts it at the position previewed during the drag.

## Interaction

- Keep the existing pointer-capture gesture and eight-pixel intent threshold.
- Keep one moving, in-app card ghost attached to the exact point where the
  card was grabbed.
- Preserve the timeline's outline preview snapped to five-minute increments.
- When the pointer enters a valid Items column, render a second, outline-only
  placeholder at the prospective insertion position.
- The placeholder occupies the card's eventual collection height and shifts
  neighbouring cards aside so the resulting order is unambiguous.
- Support insertion at the top, between existing cards, at the end, and into
  a list with no unscheduled items. The Create Item control is not an item and
  remains ahead of the first insertion position.
- Leaving all valid drop targets removes the destination preview. Releasing
  there cancels the drag without changing the item.

## Architecture

Replace the timeline-owned drag listener with a shared item-drag controller.
The controller remains the sole owner of pointer capture, the moving ghost,
click suppression, gesture cleanup, and the active item ID. Timeline and Items
register as drop targets and resolve their own destination previews from the
current pointer coordinates.

The Timeline target continues converting the pointer position into a
five-minute-snapped start minute and rendering its existing outline preview.
The Items target converts the pointer position within its virtualized surface
into a predecessor/successor pair. It temporarily adds a keyed placeholder to
the virtual collection so the preview occupies space without mounting a
functional duplicate item card.

Only one registered target may be active at a time. The controller commits the
active target on pointer release, then clears the ghost and preview state.

## Item-List Commit

Add a domain-level command dedicated to returning an item to a list. It accepts
the item ID, destination list ID, predecessor item ID, and successor item ID.
The command performs one persisted item mutation containing:

- `listId` set to the currently selected destination list;
- `orderKey` generated between the resolved neighbours; and
- `scheduledStartMinutes` set to `null`.

The command checks write access to both the source and destination lists. A
missing or read-only selected list is not a valid target, so it shows no
placeholder and cannot commit. Persistence completes before the store changes;
therefore, a rejected write leaves the original scheduled item intact. The
temporary drag UI is cleared whether the command succeeds or rejects.

## Preserved Behavior

- Item-card clicking, focus, keyboard shortcuts, selection, sizing, and label
  fitting remain unchanged.
- Dragging an unscheduled item onto the timeline retains its current behavior.
- Dragging a scheduled item within the timeline continues to reschedule it.
- Dropping into Items always targets the currently selected list, even when the
  item originated in another list.
- List cards themselves are not new drop targets in this change.
- Item-list edge auto-scrolling is outside this scope; insertion is available
  within the currently visible scroll viewport.

## Verification

- Add pure tests for resolving top, middle, end, and empty-list insertion
  positions from virtual row geometry.
- Add application-command tests proving the return operation updates list,
  order, and schedule atomically and enforces source/destination permissions.
- Preserve the existing drag-threshold and timeline-snap tests.
- Run formatting, lint, TypeScript, unit/node tests, React Doctor's changed-code
  regression scan, the web build, and the signed Tauri build.
- Install and reopen the exact desktop build automatically. Aaron performs the
  final WKWebView interaction check: moving ghost, insertion placeholder,
  neighbour reflow, persisted order, list transfer, and cancellation outside a
  target.
