# Optimistic Drag Handoff Design

Date: 2026-08-11
Status: Approved direction; implementation planning pending review

## Goal

Make a successful drag feel continuous from pointer release to persisted state. The source card must not reappear while the repository is saving, and the destination must not briefly reset to its pre-drag state.

If persistence fails, the card returns to its source. When motion is allowed, that rollback should animate smoothly rather than snap.

## Root Cause

`ItemDragProvider` currently clears the moving ghost, source-hiding attribute, active item, and destination preview before invoking the asynchronous drop command. Planner commands intentionally await `repository.apply(...)` before updating the planner store. During that repository-first gap, React can only render the unchanged pre-drag store, so the source card flashes back before the persisted update appears.

The persistence ordering is valuable: failed writes never enter the planner store, and collaboration/outbox behavior remains transactional. This design therefore keeps the data path unchanged and makes the visual handoff optimistic instead.

## Chosen Approach

Use a visual optimistic projection owned by `ItemDragProvider`:

1. During pointer movement, keep the existing full moving ghost and outline-only destination preview.
2. On a valid release, end the pointer gesture but preserve the source-hiding state, active item, and active destination preview.
3. Settle the full ghost onto the rendered destination preview while the existing asynchronous target commit runs.
4. On success, wait until the command has synchronously updated the planner store and React has had a paint opportunity, then remove the visual projection. The real card is already rendered at the destination, so there is no pre-drag flash.
5. On failure, redirect the ghost from its current presentation position back to the source card, then clear the preview and restore the source.

This is visually optimistic but does not mutate or roll back planner data speculatively.

## Drag State Machine

The shared controller has these conceptual states:

- `idle`: no pointer drag or pending drop.
- `tracking`: pointer is captured but has not crossed the drag threshold.
- `dragging`: full ghost follows the pointer; source is hidden; a valid target may render an outline preview.
- `settling`: pointer capture and grabbing cursor are released; the source remains hidden; the destination preview remains active; the ghost settles onto it while persistence is pending.
- `rolling-back`: persistence failed; the ghost returns from its current presentation position to the source.

Transitions:

- `tracking -> idle`: click, cancel, blur, or invalid release before activation.
- `dragging -> idle`: active drag released outside a current visible target.
- `dragging -> settling`: active drag released onto its current visible target.
- `settling -> idle`: persistence succeeds and the committed store state has rendered.
- `settling -> rolling-back -> idle`: persistence rejects or throws.

Only one shared drag or pending drop may exist at a time. A second pointer-down is ignored until settling or rollback completes.

## Pointer and Visual Handoff

A valid release immediately:

- prevents the follow-up click;
- releases pointer capture;
- removes the global grabbing cursor state;
- stops document pointer movement from repositioning the ghost;
- keeps the source card's drag-hiding attribute;
- keeps `activeItemId` and the exact rendered `activeDrop` so the destination outline stays mounted.

The active target supplies the bounds of its rendered preview through a target-level preview-bounds contract. Timeline and Items targets own refs to their existing outline elements, so the shared provider does not query target-specific class names or duplicate destination geometry.

The ghost settles from its current on-screen rectangle to the preview rectangle. The animation may update fixed-position transform, width, and height, but must not change document layout or intercept hit testing.

## Success Handoff

Target commits retain their current signatures and repository-first semantics. The controller awaits the returned promise.

After a successful commit:

1. The command has already applied the mutation to the planner store.
2. The controller allows at least one animation frame for the destination's real card to render.
3. It removes the projected ghost and clears the active preview/source-hiding state together.

The destination real card therefore replaces the projection without exposing the old source layout.

## Failure and Rollback

If the target commit throws or rejects:

1. Keep the pre-drag store untouched; no data rollback is required.
2. Keep the source hidden while rollback begins.
3. Re-measure the connected source card and animate the ghost from its current presentation rectangle back to that source rectangle.
4. At animation completion, remove the ghost, clear the destination preview, and restore the source card.
5. Preserve the existing error logging behavior.

If the source is no longer connected or cannot be measured, clear the projection immediately and restore ordinary rendering rather than leaving stale drag UI.

With `prefers-reduced-motion: reduce`, settling and rollback complete without spatial animation. The visual state contract remains the same.

## Animation Character

- Settle should be short and restrained: approximately 120–180 ms with no decorative bounce.
- Rollback should be approximately 180–220 ms and ease smoothly into the source.
- Use the Web Animations API or an equivalent cancellable browser primitive already available in the WebView; do not add a motion dependency for this interaction.
- Rollback begins from the ghost's current presentation rectangle, so an early failure does not jump to an assumed endpoint before returning.
- Provider unmount cancels animations and removes all DOM/global drag artifacts.

## Concurrency and Validity

The release-time safeguards remain unchanged: the current target, exact target identity, current item, visible rendered preview, pointer hit ownership, permissions, and preview value must still validate before settling begins.

While settling:

- ignore new pointer-down attempts;
- do not re-resolve the destination from later pointer events;
- let the committed command finish even if the window blurs;
- clean up DOM safely if the provider unmounts;
- do not allow target replacement to redirect an already committed pending drop.

## Accessibility

- The projected ghost remains `aria-hidden`, inert, and pointer-inert.
- Existing card and column accessible names do not change.
- Reduced-motion users receive the same immediate state continuity without travel animations.
- No spinner or loading label is added: the settled card projection is the pending feedback inside the same spatial unit.

## Testing

Add focused Chromium coverage using deferred commit promises:

1. Valid release preserves the hidden source, destination preview, and projected card while the commit is pending.
2. Resolving the commit after updating the store removes the projection without rendering the source in its old location.
3. Rejecting the commit animates or completes rollback, restores the source, clears the preview, and logs the failure.
4. A second pointer-down is ignored while a drop is pending.
5. Reduced-motion mode skips travel animation but preserves success and failure state ordering.
6. Invalid/outside releases still clean up immediately and never enter settling.

Retain the existing reverse-drop bridge, target replacement, occlusion, item-map update, cleanup, atomic command, and both authorization-side regressions.

## Scope

In scope:

- shared drag-controller pending/rollback lifecycle;
- target preview-bounds refs/contracts;
- projection and rollback animation styling/helpers;
- focused browser regressions;
- rebuilt and reinstalled desktop app for Aaron's validation.

Out of scope:

- speculative planner-store mutation or general command optimism;
- collaboration/outbox protocol changes;
- undo history, retry queues, or new error-toast infrastructure;
- edge autoscroll, list-card drop targets, or momentum-based destination selection;
- unrelated React Doctor cleanup.

## Decision Summary

- Preserve repository-first persistence and make only the visual layer optimistic.
- Keep the source hidden and destination preview mounted until persistence settles.
- Settle the full ghost into the preview on release.
- Smoothly return the ghost to the source on failure when motion is allowed.
- Block another drag during the pending handoff.
- Keep all current release validity and atomic persistence guarantees.

