import {
    type EncryptedRecordKind,
    type PlannerDatabase,
    type StoredAttachmentChunk,
    type StoredEncryptedRecord,
    type StoredOutboxOperation,
} from '../persistence/database';
import { getOrCreateVaultKey } from '../persistence/plannerRepository';
import {
    decryptBytes,
    decryptRecord,
    encryptBytes,
    encryptRecord,
} from '../persistence/recordCrypto';

const APP_STORAGE_PREFIX = 'daily-planner:';

export interface KeyValueStorage {
    readonly length: number;
    getItem(key: string): string | null;
    key(index: number): string | null;
    setItem(key: string, value: string): void;
}

interface LegacyRecord {
    id: string;
    keyVersion: number;
    kind: EncryptedRecordKind;
    listId: string | null;
    revision: number;
    updatedAt: string;
    value: unknown;
}

interface LegacyOutboxOperation {
    createdAt: string;
    id: string;
    keyVersion: number;
    listId: string | null;
    recordId: string;
    revision: number;
    value: unknown;
}

interface LegacyAttachmentChunk {
    attachmentId: string;
    bytes: string;
    id: string;
    index: number;
    keyVersion: number;
    revision: number;
}

export interface LegacyOriginPayload {
    attachmentChunks: LegacyAttachmentChunk[];
    exportedAt: string;
    localStorage: Record<string, string>;
    outbox: LegacyOutboxOperation[];
    records: LegacyRecord[];
    version: number;
}

const bytesToBase64 = (bytes: Uint8Array<ArrayBuffer>): string => {
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
};

const base64ToBytes = (value: string): Uint8Array<ArrayBuffer> => {
    const binary = atob(value);
    return Uint8Array.from(binary, character => character.charCodeAt(0));
};

const exportAppStorage = (storage: KeyValueStorage): Record<string, string> => {
    const values: Record<string, string> = {};
    for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);
        if (!key?.startsWith(APP_STORAGE_PREFIX)) continue;
        const value = storage.getItem(key);
        if (value !== null) values[key] = value;
    }
    return values;
};

export const exportLegacyOrigin = async (
    database: PlannerDatabase,
    storage: KeyValueStorage
): Promise<LegacyOriginPayload> => {
    const [storedRecords, storedOutbox, storedChunks] = await Promise.all([
        database.records.toArray(),
        database.outbox.toArray(),
        database.attachmentChunks.toArray(),
    ]);
    if (
        storedRecords.length === 0 &&
        storedOutbox.length === 0 &&
        storedChunks.length === 0
    ) {
        return {
            attachmentChunks: [],
            exportedAt: new Date().toISOString(),
            localStorage: exportAppStorage(storage),
            outbox: [],
            records: [],
            version: 1,
        };
    }
    const key = await getOrCreateVaultKey(database);
    const [records, outbox, attachmentChunks] = await Promise.all([
        Promise.all(
            storedRecords.map(async record => ({
                id: record.id,
                keyVersion: record.keyVersion,
                kind: record.kind,
                listId: record.listId,
                revision: record.revision,
                updatedAt: record.updatedAt,
                value: await decryptRecord<unknown>({
                    envelope: record,
                    id: record.id,
                    key,
                    kind: record.kind,
                }),
            }))
        ),
        Promise.all(
            storedOutbox.map(async operation => ({
                createdAt: operation.createdAt,
                id: operation.id,
                keyVersion: operation.keyVersion,
                listId: operation.listId,
                recordId: operation.recordId,
                revision: operation.revision,
                value: await decryptRecord<unknown>({
                    envelope: operation,
                    id: operation.id,
                    key,
                    kind: 'outbox',
                }),
            }))
        ),
        Promise.all(
            storedChunks.map(async chunk => ({
                attachmentId: chunk.attachmentId,
                bytes: bytesToBase64(
                    await decryptBytes({
                        envelope: chunk,
                        id: chunk.id,
                        key,
                        kind: 'attachment-chunk',
                    })
                ),
                id: chunk.id,
                index: chunk.index,
                keyVersion: chunk.keyVersion,
                revision: chunk.revision,
            }))
        ),
    ]);

    return {
        attachmentChunks,
        exportedAt: new Date().toISOString(),
        localStorage: exportAppStorage(storage),
        outbox,
        records,
        version: 1,
    };
};

export const importLegacyOrigin = async (
    payload: LegacyOriginPayload,
    database: PlannerDatabase,
    storage: KeyValueStorage
): Promise<void> => {
    if (payload.version !== 1) {
        throw new Error('The legacy migration payload version is unsupported.');
    }
    const [recordCount, outboxCount, chunkCount] = await Promise.all([
        database.records.count(),
        database.outbox.count(),
        database.attachmentChunks.count(),
    ]);
    if (recordCount + outboxCount + chunkCount > 0) {
        throw new Error(
            'The hosted origin already contains encrypted planner data.'
        );
    }

    const key = await getOrCreateVaultKey(database);
    const [records, outbox, attachmentChunks] = await Promise.all([
        Promise.all(
            payload.records.map(async record => ({
                ...(await encryptRecord({
                    id: record.id,
                    key,
                    keyVersion: record.keyVersion,
                    kind: record.kind,
                    revision: record.revision,
                    value: record.value,
                })),
                id: record.id,
                kind: record.kind,
                listId: record.listId,
                updatedAt: record.updatedAt,
            }))
        ),
        Promise.all(
            payload.outbox.map(async operation => ({
                ...(await encryptRecord({
                    id: operation.id,
                    key,
                    keyVersion: operation.keyVersion,
                    kind: 'outbox',
                    revision: operation.revision,
                    value: operation.value,
                })),
                createdAt: operation.createdAt,
                id: operation.id,
                listId: operation.listId,
                recordId: operation.recordId,
            }))
        ),
        Promise.all(
            payload.attachmentChunks.map(async chunk => ({
                ...(await encryptBytes({
                    bytes: base64ToBytes(chunk.bytes),
                    id: chunk.id,
                    key,
                    keyVersion: chunk.keyVersion,
                    kind: 'attachment-chunk',
                    revision: chunk.revision,
                })),
                attachmentId: chunk.attachmentId,
                id: chunk.id,
                index: chunk.index,
            }))
        ),
    ]);

    await database.transaction(
        'rw',
        database.records,
        database.outbox,
        database.attachmentChunks,
        async () => {
            await database.records.bulkAdd(
                records satisfies StoredEncryptedRecord[]
            );
            await database.outbox.bulkAdd(
                outbox satisfies StoredOutboxOperation[]
            );
            await database.attachmentChunks.bulkAdd(
                attachmentChunks satisfies StoredAttachmentChunk[]
            );
        }
    );
    for (const [storageKey, value] of Object.entries(payload.localStorage)) {
        if (storageKey.startsWith(APP_STORAGE_PREFIX)) {
            storage.setItem(storageKey, value);
        }
    }
};
