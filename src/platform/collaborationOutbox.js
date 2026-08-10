import { createPlannerId } from '../collaboration/idMigration';
import {
    deleteEncryptedLocalRecord,
    loadEncryptedLocalRecords,
    saveEncryptedLocalRecord,
} from './encryptedPlannerStore';

const OUTBOX_PREFIX = 'collaboration-outbox:';

export const enqueueCollaborationOperation = async operation => {
    const operationId = operation.id || createPlannerId();
    const id = `${OUTBOX_PREFIX}${operationId}`;
    await saveEncryptedLocalRecord(id, {
        ...operation,
        createdAt: operation.createdAt || new Date().toISOString(),
        id: operationId,
    });
    return operationId;
};

export const loadCollaborationOutbox = async () => {
    const records = await loadEncryptedLocalRecords(OUTBOX_PREFIX);
    return records
        .map(record => record.value)
        .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
};

export const removeCollaborationOperation = operationId =>
    deleteEncryptedLocalRecord(`${OUTBOX_PREFIX}${operationId}`);
