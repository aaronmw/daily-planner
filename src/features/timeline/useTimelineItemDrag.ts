import { type RefObject, useEffect, useState } from 'react';
import { usePlannerCommands } from '../../core/application/plannerContext';
import type { ItemId } from '../../core/domain/ids';
import { usePlannerSelector } from '../../core/store/plannerContext';
import { hasCrossedItemDragThreshold } from '../items/itemDragSession';
import { snapTimelineDragMinute } from './timelineScale';

interface PointerDrag {
    active: boolean;
    ghost: HTMLElement | null;
    grabOffsetX: number;
    grabOffsetY: number;
    grabRatioY: number;
    id: ItemId;
    pointerId: number;
    source: HTMLElement;
    startX: number;
    startY: number;
}

const positionDragGhost = (
    ghost: HTMLElement,
    clientX: number,
    clientY: number,
    grabOffsetX: number,
    grabOffsetY: number
) => {
    ghost.style.transform = `translate3d(${clientX - grabOffsetX}px, ${clientY - grabOffsetY}px, 0)`;
};

const createDragGhost = (
    source: HTMLElement,
    bounds: DOMRect,
    clientX: number,
    clientY: number,
    grabOffsetX: number,
    grabOffsetY: number
): HTMLElement => {
    const ghost = source.cloneNode(true) as HTMLElement;
    ghost.classList.add('planner-item-card-drag-ghost');
    ghost.dataset.active = 'false';
    ghost.dataset.pointerDragGhost = 'true';
    ghost.removeAttribute('data-item-id');
    ghost.setAttribute('aria-hidden', 'true');
    ghost.setAttribute('inert', '');
    ghost.setAttribute('tabindex', '-1');
    ghost.style.height = `${bounds.height}px`;
    ghost.style.width = `${bounds.width}px`;
    positionDragGhost(ghost, clientX, clientY, grabOffsetX, grabOffsetY);
    (source.closest('.planner-root') ?? document.body).append(ghost);
    return ghost;
};

export const useTimelineItemDrag = (
    containerRef: RefObject<HTMLDivElement | null>,
    pixelsPerMinute: number
) => {
    const commands = usePlannerCommands();
    const itemsById = usePlannerSelector(state => state.itemsById);
    const [dropPreviewMinute, setDropPreviewMinute] = useState<number | null>(
        null
    );
    const [draggedItemId, setDraggedItemId] = useState<ItemId | null>(null);

    useEffect(() => {
        let drag: PointerDrag | null = null;
        let clickSuppressionTimer: number | null = null;
        let suppressClickFrom: HTMLElement | null = null;

        const minuteAtPosition = (
            clientX: number,
            clientY: number,
            durationMinutes: number,
            grabRatioY: number
        ) => {
            const element = containerRef.current;
            if (!element) return null;
            const bounds = element.getBoundingClientRect();
            const isInsideTimeline =
                clientX >= bounds.left &&
                clientX <= bounds.right &&
                clientY >= bounds.top &&
                clientY <= bounds.bottom;
            if (!isInsideTimeline) return null;
            const rawMinute =
                (element.scrollTop + clientY - bounds.top) / pixelsPerMinute -
                durationMinutes * grabRatioY;
            return snapTimelineDragMinute(rawMinute, durationMinutes);
        };
        const updateDropPreview = (
            currentDrag: PointerDrag,
            clientX: number,
            clientY: number
        ) => {
            const item = itemsById.get(currentDrag.id);
            const minute = item
                ? minuteAtPosition(
                      clientX,
                      clientY,
                      item.durationMinutes,
                      currentDrag.grabRatioY
                  )
                : null;
            setDropPreviewMinute(current =>
                current === minute ? current : minute
            );
        };

        const resetDrag = (updateReactState = true) => {
            const currentDrag = drag;
            drag = null;
            currentDrag?.ghost?.remove();
            if (currentDrag) {
                delete currentDrag.source.dataset.pointerDragging;
                if (
                    currentDrag.source.hasPointerCapture(currentDrag.pointerId)
                ) {
                    currentDrag.source.releasePointerCapture(
                        currentDrag.pointerId
                    );
                }
            }
            delete document.documentElement.dataset.itemDragging;
            if (updateReactState) {
                setDraggedItemId(null);
                setDropPreviewMinute(null);
            }
        };

        const handlePointerDown = (event: PointerEvent) => {
            if (!event.isPrimary || event.button !== 0 || drag) return;
            const target = event.target;
            const card =
                target instanceof Element
                    ? target.closest<HTMLElement>(
                          '[data-item-id][data-draggable="true"]'
                      )
                    : null;
            const rawId = card?.dataset.itemId;
            if (!rawId) return;

            const bounds = card.getBoundingClientRect();
            drag = {
                active: false,
                ghost: null,
                grabOffsetX: event.clientX - bounds.left,
                grabOffsetY: event.clientY - bounds.top,
                grabRatioY:
                    bounds.height > 0
                        ? Math.max(
                              0,
                              Math.min(
                                  1,
                                  (event.clientY - bounds.top) / bounds.height
                              )
                          )
                        : 0,
                id: rawId as ItemId,
                pointerId: event.pointerId,
                source: card,
                startX: event.clientX,
                startY: event.clientY,
            };
            try {
                card.setPointerCapture(event.pointerId);
            } catch {
                // Document listeners still keep the drag functional when
                // pointer capture is unavailable in an older webview.
            }
        };

        const handlePointerMove = (event: PointerEvent) => {
            const currentDrag = drag;
            if (event.pointerId !== currentDrag?.pointerId) {
                return;
            }

            if (
                !currentDrag.active &&
                !hasCrossedItemDragThreshold(
                    currentDrag.startX,
                    currentDrag.startY,
                    event.clientX,
                    event.clientY
                )
            ) {
                return;
            }

            if (!currentDrag.active) {
                const bounds = currentDrag.source.getBoundingClientRect();
                currentDrag.active = true;
                currentDrag.ghost = createDragGhost(
                    currentDrag.source,
                    bounds,
                    event.clientX,
                    event.clientY,
                    currentDrag.grabOffsetX,
                    currentDrag.grabOffsetY
                );
                currentDrag.source.dataset.pointerDragging = 'true';
                document.documentElement.dataset.itemDragging = 'true';
                setDraggedItemId(currentDrag.id);
            } else if (currentDrag.ghost) {
                positionDragGhost(
                    currentDrag.ghost,
                    event.clientX,
                    event.clientY,
                    currentDrag.grabOffsetX,
                    currentDrag.grabOffsetY
                );
            }

            event.preventDefault();
            updateDropPreview(currentDrag, event.clientX, event.clientY);
        };

        const handlePointerUp = (event: PointerEvent) => {
            const currentDrag = drag;
            if (event.pointerId !== currentDrag?.pointerId) {
                return;
            }

            const item = itemsById.get(currentDrag.id);
            const minute =
                currentDrag.active && item
                    ? minuteAtPosition(
                          event.clientX,
                          event.clientY,
                          item.durationMinutes,
                          currentDrag.grabRatioY
                      )
                    : null;
            const source = currentDrag.source;
            const id = currentDrag.id;
            const wasActive = currentDrag.active;
            resetDrag();

            if (!wasActive) return;
            event.preventDefault();
            suppressClickFrom = source;
            if (clickSuppressionTimer !== null) {
                window.clearTimeout(clickSuppressionTimer);
            }
            clickSuppressionTimer = window.setTimeout(() => {
                suppressClickFrom = null;
                clickSuppressionTimer = null;
            }, 0);
            if (minute !== null) {
                void commands.updateItem(id, {
                    scheduledStartMinutes: minute,
                });
            }
        };

        const handlePointerCancel = (event: PointerEvent) => {
            if (event.pointerId === drag?.pointerId) resetDrag();
        };
        const handleClick = (event: MouseEvent) => {
            const target = event.target;
            if (
                !suppressClickFrom ||
                !(target instanceof Node) ||
                !suppressClickFrom.contains(target)
            ) {
                return;
            }
            event.preventDefault();
            event.stopImmediatePropagation();
            suppressClickFrom = null;
        };
        const handleWindowBlur = () => resetDrag();
        const pointerMoveOptions = { capture: true, passive: false } as const;

        document.addEventListener('pointerdown', handlePointerDown, true);
        document.addEventListener(
            'pointermove',
            handlePointerMove,
            pointerMoveOptions
        );
        document.addEventListener('pointerup', handlePointerUp, true);
        document.addEventListener('pointercancel', handlePointerCancel, true);
        document.addEventListener('click', handleClick, true);
        window.addEventListener('blur', handleWindowBlur);
        return () => {
            document.removeEventListener(
                'pointerdown',
                handlePointerDown,
                true
            );
            document.removeEventListener(
                'pointermove',
                handlePointerMove,
                pointerMoveOptions
            );
            document.removeEventListener('pointerup', handlePointerUp, true);
            document.removeEventListener(
                'pointercancel',
                handlePointerCancel,
                true
            );
            document.removeEventListener('click', handleClick, true);
            window.removeEventListener('blur', handleWindowBlur);
            if (clickSuppressionTimer !== null) {
                window.clearTimeout(clickSuppressionTimer);
            }
            resetDrag(false);
        };
    }, [commands, containerRef, itemsById, pixelsPerMinute]);

    return { draggedItemId, dropPreviewMinute };
};
