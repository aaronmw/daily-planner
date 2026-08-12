import type { ItemId, ListId } from '../../core/domain/ids';
import type { PlannerItem, PlannerList } from '../../core/domain/types';

export type DeletedItem =
    | { id: string; label: string; listId: string; type: 'list' }
    | {
          id: string;
          label: string;
          listArchived: boolean;
          listId: string;
          type: 'item';
      };

export function buildDeletedItems(
    lists: ReadonlyMap<ListId, PlannerList>,
    items: ReadonlyMap<ItemId, PlannerItem>
): DeletedItem[] {
    const deletedItems: DeletedItem[] = [];
    for (const list of lists.values()) {
        if (list.isArchived) {
            deletedItems.push({
                id: list.id,
                label: list.label || 'Untitled list',
                listId: list.id,
                type: 'list',
            });
        }
    }
    for (const item of items.values()) {
        if (item.isArchived) {
            deletedItems.push({
                id: item.id,
                label: item.label || 'Untitled item',
                listArchived: lists.get(item.listId)?.isArchived ?? false,
                listId: item.listId,
                type: 'item',
            });
        }
    }
    return deletedItems;
}
