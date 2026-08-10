import Dexie, { type EntityTable } from 'dexie';

export type EncryptedRecordKind =
    | 'attachment'
    | 'comment'
    | 'identity-keyring'
    | 'list'
    | 'member-profile'
    | 'outbox'
    | 'item';

export interface StoredKey {
    id: string;
    key: CryptoKey;
}

export interface StoredEncryptedRecord {
    ciphertext: Uint8Array<ArrayBuffer>;
    id: string;
    iv: Uint8Array<ArrayBuffer>;
    keyVersion: number;
    kind: EncryptedRecordKind;
    listId: string | null;
    revision: number;
    updatedAt: string;
}

export interface StoredAttachmentChunk {
    attachmentId: string;
    ciphertext: Uint8Array<ArrayBuffer>;
    id: string;
    index: number;
    iv: Uint8Array<ArrayBuffer>;
    keyVersion: number;
    revision: number;
}

export interface StoredOutboxOperation {
    ciphertext: Uint8Array<ArrayBuffer>;
    createdAt: string;
    id: string;
    iv: Uint8Array<ArrayBuffer>;
    keyVersion: number;
    listId: string | null;
    recordId: string;
    revision: number;
}

export class PlannerDatabase extends Dexie {
    attachmentChunks!: EntityTable<StoredAttachmentChunk, 'id'>;
    keys!: EntityTable<StoredKey, 'id'>;
    outbox!: EntityTable<StoredOutboxOperation, 'id'>;
    records!: EntityTable<StoredEncryptedRecord, 'id'>;

    constructor(name = 'daily-planner-v5') {
        super(name);
        this.version(1).stores({
            attachmentChunks: 'id, attachmentId, [attachmentId+index]',
            keys: 'id',
            outbox: '++id, recordId, listId, createdAt',
            records: 'id, kind, listId, [kind+listId], updatedAt',
        });
        this.version(2)
            .stores({
                attachmentChunks: 'id, attachmentId, [attachmentId+index]',
                keys: 'id',
                outbox: 'id, recordId, listId, createdAt',
                records: 'id, kind, listId, [kind+listId], updatedAt',
            })
            .upgrade(transaction => transaction.table('outbox').clear());
        this.version(3).stores({
            attachmentChunks: 'id, attachmentId, [attachmentId+index]',
            keys: 'id',
            outbox: 'id, recordId, listId, createdAt',
            records: 'id, kind, listId, [kind+listId], updatedAt',
        });
    }
}

export const plannerDatabase = new PlannerDatabase();
