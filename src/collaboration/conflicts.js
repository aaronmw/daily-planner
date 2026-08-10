const hasOwn = (value, field) =>
    Object.prototype.hasOwnProperty.call(value, field);

const valuesEqual = (left, right) => {
    if (Object.is(left, right)) {
        return true;
    }

    if (
        left === null ||
        right === null ||
        typeof left !== 'object' ||
        typeof right !== 'object'
    ) {
        return false;
    }

    if (Array.isArray(left) || Array.isArray(right)) {
        return (
            Array.isArray(left) &&
            Array.isArray(right) &&
            left.length === right.length &&
            left.every((value, index) => valuesEqual(value, right[index]))
        );
    }

    const leftKeys = Object.keys(left).sort();
    const rightKeys = Object.keys(right).sort();

    return (
        leftKeys.length === rightKeys.length &&
        leftKeys.every(
            (field, index) =>
                field === rightKeys[index] &&
                valuesEqual(left[field], right[field])
        )
    );
};

const fieldsEqual = (left, right, field) =>
    hasOwn(left, field) === hasOwn(right, field) &&
    (!hasOwn(left, field) || valuesEqual(left[field], right[field]));

const assignField = (target, source, field) => {
    if (hasOwn(source, field)) {
        target[field] = source[field];
    } else {
        delete target[field];
    }
};

const allFields = (...records) => [
    ...new Set(records.flatMap(record => Object.keys(record))),
];

const assertRecord = (value, name) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new TypeError(`${name} must be a record object.`);
    }
};

export const getChangedFields = (base, next) => {
    assertRecord(base, 'Base value');
    assertRecord(next, 'Next value');

    return allFields(base, next).filter(
        field => !fieldsEqual(base, next, field)
    );
};

export const rebaseRecord = ({ base, local, remote }) => {
    assertRecord(base, 'Base value');
    assertRecord(local, 'Local value');
    assertRecord(remote, 'Remote value');
    const merged = {};
    const conflicts = [];

    allFields(base, local, remote).forEach(field => {
        const localChanged = !fieldsEqual(base, local, field);
        const remoteChanged = !fieldsEqual(base, remote, field);

        if (!localChanged) {
            assignField(merged, remote, field);
            return;
        }

        if (!remoteChanged || fieldsEqual(local, remote, field)) {
            assignField(merged, local, field);
            return;
        }

        const conflict = { field };

        if (hasOwn(base, field)) conflict.base = base[field];
        if (hasOwn(local, field)) conflict.local = local[field];
        if (hasOwn(remote, field)) conflict.remote = remote[field];

        conflicts.push(conflict);
        assignField(merged, local, field);
    });

    return {
        canAutoMerge: conflicts.length === 0,
        conflicts,
        merged,
    };
};

export { valuesEqual };
