import { type RefObject, useMemo } from 'react';
import { usePlannerCommands } from '../../core/application/plannerContext';
import type { ItemId, ListId } from '../../core/domain/ids';
import { useItemDragState, useItemDropTarget } from './ItemDragProvider';
import type { ItemDropTarget } from './itemDropTargets';
import {
    resolveItemListInsertion,
    type ItemListInsertion,
} from './itemListInsertion';

interface UseItemListDropTargetOptions {
    canWrite: boolean;
    containerRef: RefObject<HTMLDivElement | null>;
    itemIds: readonly ItemId[];
    selectedListId: ListId | null;
}

export function useItemListDropTarget({
    canWrite,
    containerRef,
    itemIds,
    selectedListId,
}: UseItemListDropTargetOptions): {
    activeItemId: ItemId | null;
    insertion: ItemListInsertion | null;
} {
    const commands = usePlannerCommands();
    const target = useMemo<ItemDropTarget>(
        () => ({
            commit: async (itemId, preview) => {
                if (preview.kind !== 'items') return;
                await commands.returnItemToList(
                    itemId,
                    preview.listId,
                    preview.previousId,
                    preview.nextId
                );
            },
            id: 'items',
            resolve: (pointer, item) => {
                if (
                    item.scheduledStartMinutes === null ||
                    !selectedListId ||
                    !canWrite
                ) {
                    return null;
                }

                const element = containerRef.current;
                if (!element) return null;
                const bounds = element.getBoundingClientRect();
                const isInsideItems =
                    pointer.clientX >= bounds.left &&
                    pointer.clientX <= bounds.right &&
                    pointer.clientY >= bounds.top &&
                    pointer.clientY <= bounds.bottom;
                if (!isInsideItems) return null;

                const pointerOffsetY =
                    element.scrollTop + pointer.clientY - bounds.top;
                const rows = Array.from(
                    element.querySelectorAll<HTMLElement>(
                        '[data-item-list-row-id]'
                    )
                ).map(row => ({
                    id: row.dataset.itemListRowId as ItemId,
                    size: row.offsetHeight,
                    start: row.offsetTop,
                }));
                const insertion = resolveItemListInsertion(
                    pointerOffsetY,
                    itemIds,
                    rows
                );
                return {
                    ...insertion,
                    kind: 'items',
                    listId: selectedListId,
                };
            },
        }),
        [canWrite, commands, containerRef, itemIds, selectedListId]
    );
    useItemDropTarget(target);

    const { activeDrop, activeItemId } = useItemDragState();
    const insertion: ItemListInsertion | null =
        activeDrop?.targetId === 'items' && activeDrop.preview.kind === 'items'
            ? activeDrop.preview
            : null;
    return { activeItemId, insertion };
}
