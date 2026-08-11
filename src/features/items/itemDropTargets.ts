import type { ItemId, ListId } from '../../core/domain/ids';
import type { PlannerItem } from '../../core/domain/types';

export interface ItemDropPointer {
    clientX: number;
    clientY: number;
    grabRatioY: number;
}

export type ItemDropPreview =
    | { kind: 'timeline'; minute: number }
    | {
          index: number;
          kind: 'items';
          listId: ListId;
          nextId: ItemId | null;
          previousId: ItemId | null;
      };

export interface ItemDropTarget {
    commit: (itemId: ItemId, preview: ItemDropPreview) => Promise<void> | void;
    id: string;
    resolve: (
        pointer: ItemDropPointer,
        item: PlannerItem
    ) => ItemDropPreview | null;
}

export interface ActiveItemDrop {
    preview: ItemDropPreview;
    targetId: string;
}

export function resolveRegisteredItemDrop(
    targets: readonly ItemDropTarget[],
    pointer: ItemDropPointer,
    item: PlannerItem
): ActiveItemDrop | null {
    for (const target of targets) {
        const preview = target.resolve(pointer, item);
        if (preview) return { preview, targetId: target.id };
    }
    return null;
}

export function areActiveItemDropsEqual(
    left: ActiveItemDrop | null,
    right: ActiveItemDrop | null
): boolean {
    if (left === right) return true;
    if (!left || !right) return false;
    if (left.targetId !== right.targetId) return false;
    const leftPreview = left.preview;
    const rightPreview = right.preview;
    if (leftPreview.kind !== rightPreview.kind) return false;
    if (leftPreview.kind === 'timeline' && rightPreview.kind === 'timeline') {
        return leftPreview.minute === rightPreview.minute;
    }
    if (leftPreview.kind === 'items' && rightPreview.kind === 'items') {
        return (
            leftPreview.index === rightPreview.index &&
            leftPreview.listId === rightPreview.listId &&
            leftPreview.nextId === rightPreview.nextId &&
            leftPreview.previousId === rightPreview.previousId
        );
    }
    return false;
}
