import { describe, expect, it } from 'vitest';
import { createPlannerList, createPlannerItem } from '../../domain/factories';
import { createPlannerStore } from '../plannerStore';

describe('planner store', () => {
    it('indexes item IDs by list and updates only the changed entity', () => {
        const list = createPlannerList();
        const first = createPlannerItem({ listId: list.id });
        const second = createPlannerItem({
            afterOrderKey: first.orderKey,
            listId: list.id,
        });
        const store = createPlannerStore();
        store
            .getState()
            .applySnapshot({ lists: [list], items: [second, first] });

        expect(store.getState().itemIdsByListId.get(list.id)).toEqual([
            first.id,
            second.id,
        ]);

        const originalSecond = store.getState().itemsById.get(second.id);
        store.getState().upsertItem({ ...first, label: 'Changed' });
        expect(store.getState().itemsById.get(second.id)).toBe(originalSecond);
    });

    it('clears impossible item selection when removing a list', () => {
        const list = createPlannerList();
        const item = createPlannerItem({ listId: list.id });
        const store = createPlannerStore();
        store.getState().applySnapshot({ lists: [list], items: [item] });
        store.getState().setSelection(list.id, item.id);
        store.getState().removeList(list.id);

        expect(store.getState().selectedListId).toBeNull();
        expect(store.getState().selectedItemId).toBeNull();
    });
});
