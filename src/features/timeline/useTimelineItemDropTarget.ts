import { type RefObject, useMemo } from 'react';
import { usePlannerCommands } from '../../core/application/plannerContext';
import { useItemDragState, useItemDropTarget } from '../items/ItemDragProvider';
import {
    isElementHitAtPoint,
    type ItemDropTarget,
} from '../items/itemDropTargets';
import { snapTimelineDragMinute } from './timelineScale';

export const useTimelineItemDropTarget = (
    containerRef: RefObject<HTMLDivElement | null>,
    pixelsPerMinute: number,
    previewRef: RefObject<HTMLDivElement | null>
) => {
    const commands = usePlannerCommands();
    const target = useMemo<ItemDropTarget>(
        () => ({
            commit: async (itemId, preview) => {
                if (preview.kind !== 'timeline') return;
                await commands.updateItem(itemId, {
                    scheduledStartMinutes: preview.minute,
                });
            },
            getPreviewBounds: preview =>
                preview.kind === 'timeline'
                    ? (previewRef.current?.getBoundingClientRect() ?? null)
                    : null,
            id: 'timeline',
            resolve: (pointer, item) => {
                const element = containerRef.current;
                if (!element) return null;
                const bounds = element.getBoundingClientRect();
                if (
                    !isElementHitAtPoint(
                        element,
                        pointer.clientX,
                        pointer.clientY
                    )
                ) {
                    return null;
                }
                const rawMinute =
                    (element.scrollTop + pointer.clientY - bounds.top) /
                        pixelsPerMinute -
                    item.durationMinutes * pointer.grabRatioY;
                return {
                    kind: 'timeline',
                    minute: snapTimelineDragMinute(
                        rawMinute,
                        item.durationMinutes
                    ),
                };
            },
        }),
        [commands, containerRef, pixelsPerMinute, previewRef]
    );
    useItemDropTarget(target);

    const { activeDrop, activeItemId } = useItemDragState();
    const dropPreviewMinute =
        activeDrop?.targetId === 'timeline' &&
        activeDrop.preview.kind === 'timeline'
            ? activeDrop.preview.minute
            : null;
    return { draggedItemId: activeItemId, dropPreviewMinute };
};
