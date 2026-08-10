# Timeline Drag and Initial Scroll Design

## Goals

1. Restore dragging unscheduled item cards onto the timeline in the macOS WKWebView app.
2. Open the timeline with the current time positioned one hour below the top of the viewport, without continuously locking or recentering the user's scroll position.

## Drag Regression

The current item column virtualizes rows by placing each row beneath a `transform: translateY(...)` ancestor. WebKit has a known drag-preview failure when a draggable element is affected by an ancestor transform. The observed copy cursor, missing card ghost, and inactive timeline drop target are consistent with the native custom drag session never starting correctly.

Keep the existing native `draggable` item card, custom item-ID payload, write-capability check, and timeline drop handler. Change only the virtual row placement from a transform to an absolute `top` value derived from the same virtual-item `start` coordinate. The row remains absolutely positioned and measured by the existing TanStack virtualizer, but the draggable card no longer sits beneath a transformed ancestor.

Do not add WebKit-only drag CSS or replace native drag and drop with a custom pointer system.

## Initial Timeline Position

Calculate the initial top minute once when `TimelineColumn` mounts:

```text
max(0, current local hour × 60 + current local minute − 60)
```

Use that value to initialize both the timeline's top-minute ref and visible range. The existing layout effect applies the position using the current minute scale. After assigning `scrollTop`, read the browser's actual scroll position back and use it for the visible range so viewport clamping near the end of the day stays consistent with rendered items.

Normal `scroll` events continue updating the top-minute ref. Later timeline scale changes preserve that latest user-controlled minute rather than recalculating from the clock. No timer or clock-following effect will recenter the timeline.

## Scope

- Modify virtual item-row positioning in `ItemColumn`.
- Add a small pure helper for calculating the initial timeline minute and use it in `TimelineColumn`.
- Preserve drag payloads, drop-time rounding, scheduling commands, permissions, virtualization, and keyboard behavior.
- Preserve manual timeline scrolling after the initial mount.
- Clamp pre-1:00 AM initialization to midnight.

## Verification

- Run focused unit coverage for the initial-minute calculation at midday and before 1:00 AM.
- Run formatting, lint, typecheck, and production build checks.
- Because the drag regression is specific to WKWebView rendering, verify the rebuilt installed app can drag an item card into the timeline and shows a drag ghost. Do not start, stop, rebuild, or relaunch the app unless Aaron explicitly requests process control in that turn.
