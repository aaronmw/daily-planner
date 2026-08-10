import { createStore } from 'zustand/vanilla';
import type { ListId, ItemId } from '../domain/ids';
import { compareItemOrder } from '../domain/ordering';
import type {
    LabelEditSession,
    PlannerList,
    PlannerPreferences,
    PlannerSnapshot,
    PlannerItem,
    SyncStatus,
} from '../domain/types';
import { DEFAULT_DESKTOP_SHORTCUTS } from '../application/commandIds';

export const DEFAULT_PREFERENCES: PlannerPreferences = {
    columnVisibility: {
        details: true,
        lists: true,
        items: true,
        timeline: true,
    },
    desktopShortcuts: DEFAULT_DESKTOP_SHORTCUTS,
    focusAssistEnabled: true,
    highlightIncompleteSentencesEnabled: true,
    notificationsEnabled: false,
    relativeCardSizingEnabled: true,
    syncEnabled: false,
    themeMode: 'system',
    timelineHoursPerScreen: 10,
};

export interface PlannerStoreState {
    hydrated: boolean;
    labelEditSession: LabelEditSession;
    listIds: ListId[];
    listsById: Map<ListId, PlannerList>;
    preferences: PlannerPreferences;
    selectedListId: ListId | null;
    selectedItemId: ItemId | null;
    presentIdentityIds: Set<string>;
    scheduledItemIds: ItemId[];
    syncStatus: SyncStatus;
    itemIdsByListId: Map<ListId, ItemId[]>;
    itemsById: Map<ItemId, PlannerItem>;
    unscheduledItemIdsByListId: Map<ListId, ItemId[]>;
    version: number;
    applySnapshot: (snapshot: PlannerSnapshot) => void;
    removeList: (id: ListId) => void;
    removeItem: (id: ItemId) => void;
    setHydrated: (hydrated: boolean) => void;
    setLabelEditSession: (session: LabelEditSession) => void;
    setPreferences: (preferences: PlannerPreferences) => void;
    setPresentIdentityIds: (ids: ReadonlySet<string>) => void;
    setSelection: (listId: ListId | null, itemId: ItemId | null) => void;
    setSyncStatus: (status: SyncStatus) => void;
    upsertList: (list: PlannerList) => void;
    upsertItem: (item: PlannerItem) => void;
}

const buildSnapshotItemIndexes = (items: readonly PlannerItem[]) => {
    const groupedItems = new Map<ListId, PlannerItem[]>();
    const groupedUnscheduledItems = new Map<ListId, PlannerItem[]>();
    const scheduledItems: PlannerItem[] = [];
    const itemsById = new Map<ItemId, PlannerItem>();

    for (const item of items) {
        itemsById.set(item.id, item);
        if (item.isArchived) continue;

        const group = groupedItems.get(item.listId) ?? [];
        group.push(item);
        groupedItems.set(item.listId, group);

        if (item.scheduledStartMinutes === null) {
            const unscheduledGroup =
                groupedUnscheduledItems.get(item.listId) ?? [];
            unscheduledGroup.push(item);
            groupedUnscheduledItems.set(item.listId, unscheduledGroup);
        } else {
            scheduledItems.push(item);
        }
    }

    const toIdIndex = (groups: ReadonlyMap<ListId, PlannerItem[]>) =>
        new Map(
            Array.from(groups, ([listId, group]) => [
                listId,
                group.sort(compareItemOrder).map(item => item.id),
            ])
        );

    return {
        scheduledItemIds: scheduledItems
            .sort(
                (left, right) =>
                    (left.scheduledStartMinutes ?? Number.POSITIVE_INFINITY) -
                        (right.scheduledStartMinutes ??
                            Number.POSITIVE_INFINITY) ||
                    compareItemOrder(left, right)
            )
            .map(item => item.id),
        itemIdsByListId: toIdIndex(groupedItems),
        itemsById,
        unscheduledItemIdsByListId: toIdIndex(groupedUnscheduledItems),
    };
};

const buildListSnapshot = (lists: readonly PlannerList[]) => {
    const listIds: ListId[] = [];
    const listsById = new Map<ListId, PlannerList>();
    let activeList: PlannerList | null = null;

    for (const list of lists) {
        listsById.set(list.id, list);
        if (list.isArchived) continue;
        activeList ??= list;
        listIds.push(list.id);
    }

    return { activeList, listIds, listsById };
};

const compareStoredItemIds = (
    itemsById: ReadonlyMap<ItemId, PlannerItem>,
    leftId: ItemId,
    rightId: ItemId
): number => {
    const left = itemsById.get(leftId);
    const right = itemsById.get(rightId);
    if (!left) return right ? 1 : 0;
    if (!right) return -1;
    return compareItemOrder(left, right);
};

const compareScheduledItemIds = (
    itemsById: ReadonlyMap<ItemId, PlannerItem>,
    leftId: ItemId,
    rightId: ItemId
): number => {
    const left = itemsById.get(leftId);
    const right = itemsById.get(rightId);
    if (!left) return right ? 1 : 0;
    if (!right) return -1;
    return (
        (left.scheduledStartMinutes ?? Number.POSITIVE_INFINITY) -
            (right.scheduledStartMinutes ?? Number.POSITIVE_INFINITY) ||
        compareItemOrder(left, right)
    );
};

export const createPlannerStore = () =>
    createStore<PlannerStoreState>((set, get) => ({
        hydrated: false,
        labelEditSession: { status: 'idle' },
        listIds: [],
        listsById: new Map(),
        preferences: DEFAULT_PREFERENCES,
        selectedListId: null,
        selectedItemId: null,
        presentIdentityIds: new Set(),
        scheduledItemIds: [],
        syncStatus: { status: 'local-only' },
        itemIdsByListId: new Map(),
        itemsById: new Map(),
        unscheduledItemIdsByListId: new Map(),
        version: 0,
        applySnapshot: snapshot => {
            const { activeList, listIds, listsById } = buildListSnapshot(
                snapshot.lists
            );
            const itemIndexes = buildSnapshotItemIndexes(snapshot.items);
            set(state => ({
                hydrated: true,
                listIds,
                listsById,
                selectedListId: activeList?.id ?? null,
                selectedItemId: null,
                ...itemIndexes,
                version: state.version + 1,
            }));
        },
        removeList: id => {
            const state = get();
            const listsById = new Map(state.listsById);
            const itemsById = new Map(state.itemsById);
            const itemIdsByListId = new Map(state.itemIdsByListId);
            const unscheduledItemIdsByListId = new Map(
                state.unscheduledItemIdsByListId
            );
            listsById.delete(id);
            const listIds = state.listIds.filter(listId => listId !== id);
            const itemIds = state.itemIdsByListId.get(id) ?? [];
            itemIds.forEach(itemId => itemsById.delete(itemId));
            itemIdsByListId.delete(id);
            unscheduledItemIdsByListId.delete(id);
            const removedItemIds = new Set(itemIds);
            set({
                listIds,
                listsById,
                selectedListId:
                    state.selectedListId === id ? null : state.selectedListId,
                selectedItemId:
                    state.selectedItemId &&
                    removedItemIds.has(state.selectedItemId)
                        ? null
                        : state.selectedItemId,
                scheduledItemIds: state.scheduledItemIds.filter(
                    itemId => !removedItemIds.has(itemId)
                ),
                itemIdsByListId,
                itemsById,
                unscheduledItemIdsByListId,
                version: state.version + 1,
            });
        },
        removeItem: id => {
            const state = get();
            const item = state.itemsById.get(id);
            if (!item) return;
            const itemsById = new Map(state.itemsById);
            const itemIdsByListId = new Map(state.itemIdsByListId);
            const unscheduledItemIdsByListId = new Map(
                state.unscheduledItemIdsByListId
            );
            itemsById.delete(id);
            itemIdsByListId.set(
                item.listId,
                (state.itemIdsByListId.get(item.listId) ?? []).filter(
                    itemId => itemId !== id
                )
            );
            unscheduledItemIdsByListId.set(
                item.listId,
                (
                    state.unscheduledItemIdsByListId.get(item.listId) ?? []
                ).filter(itemId => itemId !== id)
            );
            set({
                selectedItemId:
                    state.selectedItemId === id ? null : state.selectedItemId,
                scheduledItemIds: state.scheduledItemIds.filter(
                    itemId => itemId !== id
                ),
                itemIdsByListId,
                itemsById,
                unscheduledItemIdsByListId,
                version: state.version + 1,
            });
        },
        setHydrated: hydrated => set({ hydrated }),
        setLabelEditSession: labelEditSession => set({ labelEditSession }),
        setPreferences: preferences => set({ preferences }),
        setPresentIdentityIds: ids => set({ presentIdentityIds: new Set(ids) }),
        setSelection: (selectedListId, selectedItemId) =>
            set({ selectedListId, selectedItemId }),
        setSyncStatus: syncStatus => set({ syncStatus }),
        upsertList: list => {
            const state = get();
            const listsById = new Map(state.listsById);
            listsById.set(list.id, list);
            const listIds = list.isArchived
                ? state.listIds.filter(id => id !== list.id)
                : state.listIds.includes(list.id)
                  ? state.listIds
                  : [...state.listIds, list.id];
            set({ listIds, listsById, version: state.version + 1 });
        },
        upsertItem: item => {
            const state = get();
            const previous = state.itemsById.get(item.id);
            const itemsById = new Map(state.itemsById);
            const itemIdsByListId = new Map(state.itemIdsByListId);
            const unscheduledItemIdsByListId = new Map(
                state.unscheduledItemIdsByListId
            );
            itemsById.set(item.id, item);
            if (previous) {
                itemIdsByListId.set(
                    previous.listId,
                    (state.itemIdsByListId.get(previous.listId) ?? []).filter(
                        itemId => itemId !== item.id
                    )
                );
                unscheduledItemIdsByListId.set(
                    previous.listId,
                    (
                        unscheduledItemIdsByListId.get(previous.listId) ?? []
                    ).filter(itemId => itemId !== item.id)
                );
            }
            const itemIds = [...(itemIdsByListId.get(item.listId) ?? [])];
            if (!item.isArchived && !itemIds.includes(item.id))
                itemIds.push(item.id);
            itemIds.sort((leftId, rightId) =>
                compareStoredItemIds(itemsById, leftId, rightId)
            );
            itemIdsByListId.set(item.listId, itemIds);
            if (!item.isArchived && item.scheduledStartMinutes === null) {
                const unscheduledItemIds = [
                    ...(unscheduledItemIdsByListId.get(item.listId) ?? []),
                    item.id,
                ];
                unscheduledItemIds.sort((leftId, rightId) =>
                    compareStoredItemIds(itemsById, leftId, rightId)
                );
                unscheduledItemIdsByListId.set(item.listId, unscheduledItemIds);
            }
            const scheduledItemIds = state.scheduledItemIds.filter(
                itemId => itemId !== item.id
            );
            if (!item.isArchived && item.scheduledStartMinutes !== null) {
                scheduledItemIds.push(item.id);
                scheduledItemIds.sort((leftId, rightId) =>
                    compareScheduledItemIds(itemsById, leftId, rightId)
                );
            }
            set({
                scheduledItemIds,
                itemIdsByListId,
                itemsById,
                unscheduledItemIdsByListId,
                version: state.version + 1,
            });
        },
    }));

export type PlannerStore = ReturnType<typeof createPlannerStore>;
