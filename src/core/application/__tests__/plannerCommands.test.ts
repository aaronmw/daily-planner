import { describe, expect, it } from 'vitest';
import type {
    PlannerMutation,
    PlannerRepository,
    PreferenceRepository,
} from '../ports';
import { createPlannerCommands } from '../plannerCommands';
import { createPlannerList, createPlannerItem } from '../../domain/factories';
import {
    DEFAULT_PREFERENCES,
    createPlannerStore,
} from '../../store/plannerStore';

class MemoryRepository implements PlannerRepository {
    mutations: PlannerMutation[] = [];
    enqueueValues: boolean[] = [];
    async apply(
        mutations: readonly PlannerMutation[],
        options?: { enqueueForSync?: boolean }
    ) {
        this.mutations.push(...mutations);
        this.enqueueValues.push(options?.enqueueForSync ?? false);
    }
    async deleteOutbox() {}
    async load() {
        return { lists: [], items: [] };
    }
    async loadOutbox() {
        return [];
    }
    async replace() {}
}

const preferenceRepository: PreferenceRepository = {
    load: () => DEFAULT_PREFERENCES,
    save: () => undefined,
};

describe('planner commands', () => {
    it('hydrates an empty vault with the user manual', async () => {
        const repository = new MemoryRepository();
        const store = createPlannerStore();
        const commands = createPlannerCommands({
            preferences: preferenceRepository,
            repository,
            store,
        });

        await commands.hydrate();

        expect(store.getState().listIds).toHaveLength(1);
        expect(store.getState().selectedListId).not.toBeNull();
        expect(store.getState().itemsById.size).toBeGreaterThan(0);
    });

    it('archives the final list and atomically creates a blank replacement', async () => {
        const repository = new MemoryRepository();
        const store = createPlannerStore();
        const commands = createPlannerCommands({
            preferences: preferenceRepository,
            repository,
            store,
        });
        await commands.hydrate();
        const originalId = store.getState().selectedListId!;

        await commands.archiveList(originalId);

        const selected = store
            .getState()
            .listsById.get(store.getState().selectedListId!);
        expect(selected?.label).toBe('');
        expect(store.getState().labelEditSession.status).toBe('requested');
    });

    it('creates a item in the active list and requests its label editor', async () => {
        const repository = new MemoryRepository();
        const store = createPlannerStore();
        const commands = createPlannerCommands({
            preferences: preferenceRepository,
            repository,
            store,
        });
        await commands.hydrate();

        const item = await commands.createItem();

        expect(store.getState().selectedItemId).toBe(item.id);
        expect(store.getState().labelEditSession).toMatchObject({
            entityId: item.id,
            entityType: 'item',
            status: 'requested',
        });
    });

    it('never queues private-copy mutations for collaboration', async () => {
        const repository = new MemoryRepository();
        const store = createPlannerStore();
        const list = { ...createPlannerList(), isPrivateCopy: true };
        const item = {
            ...createPlannerItem({ listId: list.id }),
            isPrivateCopy: true,
        };
        store.getState().applySnapshot({ lists: [list], items: [item] });
        store.getState().setPreferences({
            ...DEFAULT_PREFERENCES,
            syncEnabled: true,
        });
        const commands = createPlannerCommands({
            preferences: preferenceRepository,
            repository,
            store,
        });

        await commands.updateItem(item.id, { label: 'Private edit' });
        await commands.deleteItem(item.id);

        expect(repository.enqueueValues).toEqual([false, false]);
        expect(repository.mutations.at(-1)).toMatchObject({
            base: { id: item.id, isPrivateCopy: true },
            id: item.id,
            type: 'delete-item',
        });
    });

    it('rejects unauthorized item mutations before local persistence', async () => {
        const repository = new MemoryRepository();
        const store = createPlannerStore();
        const list = createPlannerList();
        const item = createPlannerItem({ listId: list.id });
        store.getState().applySnapshot({ lists: [list], items: [item] });
        const commands = createPlannerCommands({
            authorization: { canAccessList: () => false },
            preferences: preferenceRepository,
            repository,
            store,
        });

        await expect(
            commands.updateItem(item.id, { label: 'Unauthorized edit' })
        ).rejects.toThrow('read only');

        expect(repository.mutations).toHaveLength(0);
        expect(store.getState().itemsById.get(item.id)?.label).toBe(item.label);
    });

    it('atomically returns a scheduled item into an ordered destination list', async () => {
        const repository = new MemoryRepository();
        const store = createPlannerStore();
        const sourceList = createPlannerList({ label: 'Source' });
        const destinationList = createPlannerList({ label: 'Destination' });
        const previous = createPlannerItem({ listId: destinationList.id });
        const next = createPlannerItem({
            afterOrderKey: previous.orderKey,
            listId: destinationList.id,
        });
        const scheduled = {
            ...createPlannerItem({ listId: sourceList.id }),
            scheduledStartMinutes: 9 * 60,
        };
        store.getState().applySnapshot({
            lists: [sourceList, destinationList],
            items: [previous, next, scheduled],
        });
        const commands = createPlannerCommands({
            preferences: preferenceRepository,
            repository,
            store,
        });

        await commands.returnItemToList(
            scheduled.id,
            destinationList.id,
            previous.id,
            next.id
        );

        const returned = store.getState().itemsById.get(scheduled.id)!;
        expect(returned).toMatchObject({
            listId: destinationList.id,
            scheduledStartMinutes: null,
        });
        expect(returned.orderKey > previous.orderKey).toBe(true);
        expect(returned.orderKey < next.orderKey).toBe(true);
        expect(repository.mutations).toHaveLength(1);
        expect(repository.mutations[0]).toMatchObject({
            base: { id: scheduled.id, listId: sourceList.id },
            entity: {
                id: scheduled.id,
                listId: destinationList.id,
                scheduledStartMinutes: null,
            },
            type: 'put-item',
        });
    });

    it('requires write access to the destination before returning an item', async () => {
        const repository = new MemoryRepository();
        const store = createPlannerStore();
        const sourceList = createPlannerList({ label: 'Source' });
        const destinationList = createPlannerList({ label: 'Destination' });
        const scheduled = {
            ...createPlannerItem({ listId: sourceList.id }),
            scheduledStartMinutes: 9 * 60,
        };
        store.getState().applySnapshot({
            lists: [sourceList, destinationList],
            items: [scheduled],
        });
        const commands = createPlannerCommands({
            authorization: {
                canAccessList: id => id === sourceList.id,
            },
            preferences: preferenceRepository,
            repository,
            store,
        });

        await expect(
            commands.returnItemToList(
                scheduled.id,
                destinationList.id,
                null,
                null
            )
        ).rejects.toThrow('read only');
        expect(repository.mutations).toHaveLength(0);
        expect(store.getState().itemsById.get(scheduled.id)).toEqual(scheduled);
    });

    it('requires write access to the source before returning an item', async () => {
        const repository = new MemoryRepository();
        const store = createPlannerStore();
        const sourceList = createPlannerList({ label: 'Source' });
        const destinationList = createPlannerList({ label: 'Destination' });
        const scheduled = {
            ...createPlannerItem({ listId: sourceList.id }),
            scheduledStartMinutes: 9 * 60,
        };
        store.getState().applySnapshot({
            lists: [sourceList, destinationList],
            items: [scheduled],
        });
        const commands = createPlannerCommands({
            authorization: {
                canAccessList: id => id === destinationList.id,
            },
            preferences: preferenceRepository,
            repository,
            store,
        });

        await expect(
            commands.returnItemToList(
                scheduled.id,
                destinationList.id,
                null,
                null
            )
        ).rejects.toThrow('read only');
        expect(repository.mutations).toHaveLength(0);
        expect(store.getState().itemsById.get(scheduled.id)).toEqual(scheduled);
    });
});
