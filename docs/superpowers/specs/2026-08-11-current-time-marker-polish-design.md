# Current-Time Marker Polish Design

## Goal

Turn the timeline's current-time marker into a legible, synchronized status surface: a current-time badge aligned with the existing hour labels, a digital-clock colon blink, and one restrained diagonal sheen per second.

## Scope

This change applies only to the current-time marker in the timeline column. It does not animate or fill the timeline column itself, alter timeline scrolling, change drag-and-drop behavior, or add seconds to the displayed time.

## Visual Design

- The marker is a slim, filled rectangle using the existing current-time red treatment.
- The filled marker begins at the timeline-content boundary, to the right of the 72px time-label gutter, and continues to the right edge of the timeline.
- A filled red badge is vertically centered over the marker's left edge in the time-label gutter.
- The badge displays the local current time as `h:mm AM/PM`, with tabular numerals and no seconds.
- The minute and meridiem are shaped as one text run with a normal space so their optical spacing matches the ordinary timeline labels; only the colon is isolated for blinking.
- The badge's time text shares the same right alignment as the ordinary hourly labels. Its outer positioning compensates for its right-side badge padding so the glyphs align rather than the two surfaces' edges.
- The colon keeps its layout width while hidden so the badge never changes width or shifts when it blinks.

## Timing and Synchronization

One wall-clock-aligned clock source owns all three second-based updates:

1. Recalculate the marker's vertical position from the current local time.
2. Alternate the colon between visible and hidden on consecutive whole seconds, producing one second on and one second off.
3. Start one 500ms marker-sheen pass at the whole-second boundary.

The clock uses chained timeouts aligned to the next real second rather than an unconstrained interval. Each callback reads the current time again and schedules the following boundary, preventing accumulated timer drift. When the document returns from a hidden or suspended state, the marker resynchronizes immediately from the current wall clock.

## Sheen Motion

- The sheen is clipped to the marker surface to the right of the badge; it never passes through the badge or the time-label gutter.
- Each pass contains one full-surface white streak with transparent edges. Its centerline runs exactly from the marker's bottom-left corner to its top-right corner, using the live surface aspect ratio (`atan2(height, width)`) rather than a fixed angle.
- At the second boundary, the gradient begins outside the marker's left clipping edge at zero opacity.
- Its opacity reaches 100% when the full-width streak is centered over the marker, ensuring that neither edge crops the fully opaque streak.
- It travels across and fades out at the far edge within 500ms.
- No sheen is present for the remaining 500ms before the next second boundary.
- Motion uses compositor-friendly transforms and opacity rather than animating layout geometry.

## Component Boundaries

`CurrentTimeMarker` remains responsible for rendering the marker, badge, colon, and sheen. A small wall-clock hook or helper provides the current `Date` and a stable whole-second identifier. Formatting and second-boundary scheduling remain independently testable so the timeline component does not accumulate timing arithmetic inline.

The existing `currentTimelineMinute` calculation remains the source of vertical marker positioning, including seconds. No planner-store state or persistence changes are needed.

## Accessibility

- The current-time surface remains pointer-events-free and does not interfere with timeline dragging or scrolling.
- Its accessible label exposes the current minute in plain text without describing the decorative blink or sheen.
- Under `prefers-reduced-motion: reduce`, the marker continues to move with real time, the colon remains visible, and the moving sheen is omitted.
- Hiding the colon changes opacity only; assistive output and layout remain stable.

## Verification

- Focused tests cover minute-only local-time formatting, whole-second phase alternation, and clock resynchronization without accumulated drift.
- Component coverage confirms that the badge, marker surface, and sheen are scoped and labeled correctly.
- Run formatting, lint, TypeScript, the relevant tests, and the production build.
- Use the project's installed-app workflow to rebuild, transactionally replace, stop only the exact Daily Planner process, and reopen the signed app for manual animation review.

## Success Criteria

- The badge shows the current local time as `h:mm AM/PM`, aligned by its text edge with the hourly labels.
- The colon alternates visible and hidden once per whole second without moving the surrounding text.
- The marker advances on the same second boundary that changes the colon and launches the sheen.
- Exactly one diagonal white sheen crosses only the post-badge marker surface during the first 500ms of each second.
- The sheen fades in fully only after clearing the left clipping edge.
- Backgrounding, sleep, and timer delay do not leave the marker, colon, and sheen permanently out of phase.
- Reduced-motion users see an accurate marker and stable time badge without ambient movement.
