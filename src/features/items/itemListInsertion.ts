import type { ItemId } from '../../core/domain/ids';

export interface ItemListRowGeometry {
    id: ItemId;
    size: number;
    start: number;
}

export interface ItemListInsertion {
    index: number;
    nextId: ItemId | null;
    previousId: ItemId | null;
}

export function resolveItemListInsertion(
    pointerOffsetY: number,
    itemIds: readonly ItemId[],
    rows: readonly ItemListRowGeometry[]
): ItemListInsertion {
    const nextRow = rows.find(
        row => pointerOffsetY < row.start + row.size / 2
    );
    const lastRow = rows.at(-1) ?? null;
    const rawIndex = nextRow
        ? itemIds.indexOf(nextRow.id)
        : lastRow
          ? itemIds.indexOf(lastRow.id) + 1
          : 0;
    const index = Math.max(0, Math.min(itemIds.length, rawIndex));
    return {
        index,
        nextId: itemIds[index] ?? null,
        previousId: itemIds[index - 1] ?? null,
    };
}
