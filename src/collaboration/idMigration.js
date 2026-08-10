const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isPlannerUuid = value =>
    typeof value === 'string' && UUID_PATTERN.test(value);

const fallbackRandomUuid = cryptoImpl => {
    const bytes = cryptoImpl.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    const hex = Array.from(bytes, byte =>
        byte.toString(16).padStart(2, '0')
    ).join('');

    return [
        hex.slice(0, 8),
        hex.slice(8, 12),
        hex.slice(12, 16),
        hex.slice(16, 20),
        hex.slice(20),
    ].join('-');
};

export const createPlannerId = (cryptoImpl = globalThis.crypto) => {
    if (typeof cryptoImpl?.randomUUID === 'function') {
        return cryptoImpl.randomUUID();
    }

    if (typeof cryptoImpl?.getRandomValues === 'function') {
        return fallbackRandomUuid(cryptoImpl);
    }

    throw new Error('Web Crypto is required to create planner IDs.');
};

const assertUniqueIds = (records, recordType) => {
    const ids = new Set();

    records.forEach(record => {
        if (ids.has(record.id)) {
            throw new Error(`Duplicate ${recordType} ID: ${record.id}`);
        }

        ids.add(record.id);
    });
};

const assertNoSharedUuid = (lists, tasks) => {
    const listUuids = new Set(lists.map(list => list.id).filter(isPlannerUuid));
    const duplicate = tasks
        .map(task => task.id)
        .find(id => isPlannerUuid(id) && listUuids.has(id));

    if (duplicate) {
        throw new Error(`Duplicate planner UUID: ${duplicate}`);
    }
};

const nextUniqueId = (createId, reservedIds) => {
    for (let attempt = 0; attempt < 100; attempt += 1) {
        const candidate = createId();

        if (!isPlannerUuid(candidate)) {
            throw new TypeError('Planner ID factories must return UUIDs.');
        }

        if (!reservedIds.has(candidate)) {
            reservedIds.add(candidate);
            return candidate;
        }
    }

    throw new Error('Unable to generate a unique planner ID.');
};

const mapSelection = (id, idMap, selectionType) => {
    if (id === null || id === undefined) {
        return id ?? null;
    }

    if (!idMap.has(id)) {
        throw new Error(`Selected ${selectionType} references an unknown ID.`);
    }

    return idMap.get(id);
};

export const migratePlannerIds = (
    state,
    { createId = () => createPlannerId() } = {}
) => {
    const lists = Array.isArray(state?.lists) ? state.lists : [];
    const tasks = Array.isArray(state?.tasks) ? state.tasks : [];
    assertUniqueIds(lists, 'list');
    assertUniqueIds(tasks, 'task');
    assertNoSharedUuid(lists, tasks);

    const reservedIds = new Set(
        [...lists, ...tasks].map(record => record.id).filter(isPlannerUuid)
    );
    const listIdMap = new Map();
    const taskIdMap = new Map();

    const migratedLists = lists.map(list => {
        const id = isPlannerUuid(list.id)
            ? list.id
            : nextUniqueId(createId, reservedIds);
        listIdMap.set(list.id, id);

        return { ...list, id };
    });

    const migratedTasks = tasks.map(task => {
        if (!listIdMap.has(task.list_id)) {
            throw new Error(
                `Task ${task.id} references an unknown list ID: ${task.list_id}`
            );
        }

        const id = isPlannerUuid(task.id)
            ? task.id
            : nextUniqueId(createId, reservedIds);
        taskIdMap.set(task.id, id);

        return {
            ...task,
            id,
            list_id: listIdMap.get(task.list_id),
        };
    });

    return {
        ...state,
        listIdMap,
        lists: migratedLists,
        selectedListId: mapSelection(state?.selectedListId, listIdMap, 'list'),
        selectedTaskId: mapSelection(state?.selectedTaskId, taskIdMap, 'task'),
        taskIdMap,
        tasks: migratedTasks,
    };
};
