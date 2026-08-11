import { createOrderKeyBetween } from '../domain/ordering';
import {
    createInitialPlannerSnapshot,
    createPlannerList,
    createPlannerItem,
} from '../domain/factories';
import type { ListId, ItemId } from '../domain/ids';
import type {
    PlannerList,
    PlannerPreferences,
    PlannerItem,
} from '../domain/types';
import type { PlannerStore } from '../store/plannerStore';
import type {
    PlannerMutation,
    PlannerAuthorization,
    PlannerRepository,
    PreferenceRepository,
} from './ports';

const updated = <Entity extends { revision: number; updatedAt: string }>(
    entity: Entity,
    changes: Partial<Entity>
): Entity => ({
    ...entity,
    ...changes,
    revision: entity.revision + 1,
    updatedAt: new Date().toISOString(),
});

const putList = (
    base: PlannerList | null,
    entity: PlannerList
): PlannerMutation => ({ base, entity, type: 'put-list' });

const putItem = (
    base: PlannerItem | null,
    entity: PlannerItem
): PlannerMutation => ({ base, entity, type: 'put-item' });

export interface PlannerCommands {
    archiveList: (id: ListId) => Promise<void>;
    archiveItem: (id: ItemId) => Promise<void>;
    cancelLabelEdit: (requestId: string | null) => void;
    completeLabelEdit: (requestId: string | null) => void;
    createList: (label?: string) => Promise<PlannerList>;
    createItem: (listId?: ListId, label?: string) => Promise<PlannerItem>;
    deleteList: (id: ListId) => Promise<void>;
    deleteItem: (id: ItemId) => Promise<void>;
    hydrate: () => Promise<void>;
    fulfillLabelEdit: (requestId: string) => void;
    moveItem: (
        id: ItemId,
        targetListId: ListId,
        beforeId: ItemId | null,
        afterId: ItemId | null
    ) => Promise<void>;
    returnItemToList: (
        id: ItemId,
        targetListId: ListId,
        previousId: ItemId | null,
        nextId: ItemId | null
    ) => Promise<void>;
    restoreList: (id: ListId) => Promise<void>;
    restoreItem: (id: ItemId) => Promise<void>;
    selectList: (id: ListId) => void;
    selectItem: (id: ItemId) => void;
    updateList: (id: ListId, changes: Partial<PlannerList>) => Promise<void>;
    updatePreferences: (changes: Partial<PlannerPreferences>) => void;
    updateItem: (id: ItemId, changes: Partial<PlannerItem>) => Promise<void>;
    updateItemWith: (
        id: ItemId,
        update: (item: PlannerItem) => Partial<PlannerItem>
    ) => Promise<void>;
}

export const createPlannerCommands = ({
    authorization = { canAccessList: () => true },
    preferences,
    repository,
    store,
}: {
    authorization?: PlannerAuthorization;
    preferences: PreferenceRepository;
    repository: PlannerRepository;
    store: PlannerStore;
}): PlannerCommands => {
    const entityWriteQueues = new Map<string, Promise<void>>();
    const serializeEntityWrite = async (
        id: string,
        operation: () => Promise<void>
    ): Promise<void> => {
        const previous = entityWriteQueues.get(id) ?? Promise.resolve();
        const next = previous.catch(() => undefined).then(operation);
        entityWriteQueues.set(id, next);
        try {
            await next;
        } finally {
            if (entityWriteQueues.get(id) === next)
                entityWriteQueues.delete(id);
        }
    };
    const persist = async (mutations: readonly PlannerMutation[]) => {
        const containsOnlyLocalCopies = mutations.every(
            mutation =>
                ('entity' in mutation ? mutation.entity : mutation.base)
                    .isPrivateCopy
        );
        await repository.apply(mutations, {
            enqueueForSync:
                store.getState().preferences.syncEnabled &&
                !containsOnlyLocalCopies,
        });
        mutations.forEach(mutation => {
            if (mutation.type === 'put-list') {
                store.getState().upsertList(mutation.entity);
            } else if (mutation.type === 'put-item') {
                store.getState().upsertItem(mutation.entity);
            } else if (mutation.type === 'delete-list') {
                store.getState().removeList(mutation.id);
            } else {
                store.getState().removeItem(mutation.id);
            }
        });
    };
    const requireListAccess = (
        id: ListId,
        capability: 'transfer-ownership' | 'write'
    ) => {
        if (!authorization.canAccessList(id, capability)) {
            throw new Error(
                capability === 'transfer-ownership'
                    ? 'Only the list owner can do that.'
                    : 'This list is read only.'
            );
        }
    };

    const commands: PlannerCommands = {
        archiveList: async id => {
            const state = store.getState();
            const list = state.listsById.get(id);
            if (!list) return;
            requireListAccess(id, 'transfer-ownership');
            const activeLists = state.listIds
                .map(listId => state.listsById.get(listId))
                .filter((candidate): candidate is PlannerList =>
                    Boolean(candidate && !candidate.isArchived)
                );
            const mutations: PlannerMutation[] = [
                putList(list, updated(list, { isArchived: true })),
            ];
            let replacement = activeLists.find(
                candidate => candidate.id !== id
            );
            if (!replacement) {
                replacement = createPlannerList({ label: '' });
                mutations.push(putList(null, replacement));
            }
            await persist(mutations);
            store.getState().setSelection(replacement.id, null);
            if (replacement.label === '') {
                store.getState().setLabelEditSession({
                    entityId: replacement.id,
                    entityType: 'list',
                    requestId: crypto.randomUUID(),
                    status: 'requested',
                });
            }
        },
        archiveItem: async id => {
            const item = store.getState().itemsById.get(id);
            if (!item) return;
            requireListAccess(item.listId, 'write');
            await persist([putItem(item, updated(item, { isArchived: true }))]);
            store.getState().setSelection(item.listId, null);
        },
        cancelLabelEdit: requestId => {
            const session = store.getState().labelEditSession;
            if (
                session.status !== 'idle' &&
                (requestId === null || session.requestId === requestId)
            ) {
                store.getState().setLabelEditSession({ status: 'idle' });
            }
        },
        completeLabelEdit: requestId => {
            const session = store.getState().labelEditSession;
            if (
                session.status !== 'idle' &&
                (requestId === null || session.requestId === requestId)
            ) {
                store.getState().setLabelEditSession({ status: 'idle' });
            }
        },
        createList: async (label = 'New List') => {
            const created = createPlannerList({ label });
            const list = store.getState().preferences.syncEnabled
                ? { ...created, revision: 1 }
                : created;
            await persist([putList(null, list)]);
            store.getState().setSelection(list.id, null);
            store.getState().setLabelEditSession({
                entityId: list.id,
                entityType: 'list',
                requestId: crypto.randomUUID(),
                status: 'requested',
            });
            return list;
        },
        createItem: async (listId, label = 'New Item') => {
            const state = store.getState();
            const targetListId = listId ?? state.selectedListId;
            if (!targetListId || !state.listsById.has(targetListId)) {
                throw new Error('A item requires an active list.');
            }
            requireListAccess(targetListId, 'write');
            const itemIds = state.itemIdsByListId.get(targetListId) ?? [];
            const lastItemId = itemIds.at(-1);
            const created = createPlannerItem({
                afterOrderKey: lastItemId
                    ? (state.itemsById.get(lastItemId)?.orderKey ?? null)
                    : null,
                label,
                listId: targetListId,
            });
            const item = state.preferences.syncEnabled
                ? { ...created, revision: 1 }
                : created;
            await persist([putItem(null, item)]);
            store.getState().setSelection(targetListId, item.id);
            store.getState().setLabelEditSession({
                entityId: item.id,
                entityType: 'item',
                requestId: crypto.randomUUID(),
                status: 'requested',
            });
            return item;
        },
        deleteList: async id => {
            const list = store.getState().listsById.get(id);
            if (!list) return;
            requireListAccess(id, 'transfer-ownership');
            await persist([{ base: list, id, type: 'delete-list' }]);
        },
        deleteItem: async id => {
            const item = store.getState().itemsById.get(id);
            if (!item) return;
            requireListAccess(item.listId, 'write');
            await persist([{ base: item, id, type: 'delete-item' }]);
        },
        hydrate: async () => {
            const snapshot = await repository.load();
            if (!snapshot.lists.some(list => !list.isArchived)) {
                const initial = createInitialPlannerSnapshot();
                await repository.apply([
                    ...initial.lists.map((entity): PlannerMutation =>
                        putList(null, entity)
                    ),
                    ...initial.items.map((entity): PlannerMutation =>
                        putItem(null, entity)
                    ),
                ]);
                snapshot.lists.push(...initial.lists);
                snapshot.items.push(...initial.items);
            }
            store.getState().applySnapshot(snapshot);
            store.getState().setPreferences(preferences.load());
        },
        fulfillLabelEdit: requestId => {
            const session = store.getState().labelEditSession;
            if (
                session.status === 'requested' &&
                session.requestId === requestId
            ) {
                store.getState().setLabelEditSession({
                    ...session,
                    status: 'editing',
                });
            }
        },
        moveItem: async (id, targetListId, beforeId, afterId) => {
            const state = store.getState();
            const item = state.itemsById.get(id);
            if (!item || !state.listsById.has(targetListId)) return;
            requireListAccess(item.listId, 'write');
            requireListAccess(targetListId, 'write');
            const before = beforeId
                ? (state.itemsById.get(beforeId) ?? null)
                : null;
            const after = afterId
                ? (state.itemsById.get(afterId) ?? null)
                : null;
            await persist([
                putItem(
                    item,
                    updated(item, {
                        listId: targetListId,
                        orderKey: createOrderKeyBetween(before, after),
                    })
                ),
            ]);
        },
        returnItemToList: async (id, targetListId, previousId, nextId) => {
            const state = store.getState();
            const item = state.itemsById.get(id);
            if (!item || !state.listsById.has(targetListId)) return;
            requireListAccess(item.listId, 'write');
            requireListAccess(targetListId, 'write');
            const previous = previousId
                ? (state.itemsById.get(previousId) ?? null)
                : null;
            const next = nextId ? (state.itemsById.get(nextId) ?? null) : null;
            await persist([
                putItem(
                    item,
                    updated(item, {
                        listId: targetListId,
                        orderKey: createOrderKeyBetween(previous, next),
                        scheduledStartMinutes: null,
                    })
                ),
            ]);
        },
        restoreList: async id => {
            const list = store.getState().listsById.get(id);
            if (!list) return;
            requireListAccess(id, 'transfer-ownership');
            await persist([
                putList(list, updated(list, { isArchived: false })),
            ]);
            store.getState().setSelection(id, null);
        },
        restoreItem: async id => {
            const state = store.getState();
            const item = state.itemsById.get(id);
            if (!item) return;
            const list = state.listsById.get(item.listId);
            requireListAccess(item.listId, 'write');
            if (list?.isArchived) {
                requireListAccess(item.listId, 'transfer-ownership');
            }
            const mutations: PlannerMutation[] = [];
            if (list?.isArchived) {
                mutations.push(
                    putList(list, updated(list, { isArchived: false }))
                );
            }
            mutations.push(putItem(item, updated(item, { isArchived: false })));
            await persist(mutations);
            store.getState().setSelection(item.listId, item.id);
        },
        selectList: id => {
            const state = store.getState();
            const list = state.listsById.get(id);
            if (list && !list.isArchived) state.setSelection(id, null);
        },
        selectItem: id => {
            const state = store.getState();
            const item = state.itemsById.get(id);
            if (item && !item.isArchived)
                state.setSelection(item.listId, item.id);
        },
        updateList: async (id, changes) => {
            const list = store.getState().listsById.get(id);
            if (!list) return;
            requireListAccess(id, 'write');
            await persist([putList(list, updated(list, changes))]);
        },
        updatePreferences: changes => {
            const next = { ...store.getState().preferences, ...changes };
            preferences.save(next);
            store.getState().setPreferences(next);
        },
        updateItem: async (id, changes) => {
            await serializeEntityWrite(id, async () => {
                const item = store.getState().itemsById.get(id);
                if (!item) return;
                requireListAccess(item.listId, 'write');
                await persist([putItem(item, updated(item, changes))]);
            });
        },
        updateItemWith: async (id, update) => {
            await serializeEntityWrite(id, async () => {
                const item = store.getState().itemsById.get(id);
                if (!item) return;
                requireListAccess(item.listId, 'write');
                await persist([putItem(item, updated(item, update(item)))]);
            });
        },
    };
    return commands;
};
