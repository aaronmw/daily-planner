import { migratePlannerIds } from '../collaboration/idMigration';
import {
    base64UrlToBytes,
    bytesToBase64Url,
    bytesToUtf8,
    utf8ToBytes,
} from '../collaboration/bytes';

const DATABASE_NAME = 'daily-planner-vault';
const DATABASE_VERSION = 3;
const KEY_STORE = 'keys';
const RECORD_STORE = 'records';
const ATTACHMENT_STORE = 'attachment-chunks';
const VAULT_KEY_ID = 'planner-vault-key';
const PLANNER_DATA_ID = 'planner-data';
const plannerDataAdditionalData = () =>
    utf8ToBytes('daily-planner:v3:planner-data');
const localRecordAdditionalData = id =>
    utf8ToBytes(`daily-planner:v3:local-record:${id}`);

const requestValue = request =>
    new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

const transactionDone = transaction =>
    new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
    });

const openDatabase = () =>
    new Promise((resolve, reject) => {
        const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
        request.onupgradeneeded = () => {
            const database = request.result;
            if (!database.objectStoreNames.contains(KEY_STORE)) {
                database.createObjectStore(KEY_STORE, { keyPath: 'id' });
            }
            if (!database.objectStoreNames.contains(RECORD_STORE)) {
                database.createObjectStore(RECORD_STORE, { keyPath: 'id' });
            }
            if (!database.objectStoreNames.contains(ATTACHMENT_STORE)) {
                const attachments = database.createObjectStore(
                    ATTACHMENT_STORE,
                    { keyPath: 'id' }
                );
                attachments.createIndex('attachmentId', 'attachmentId');
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

const getOrCreateVaultKey = async () => {
    const database = await openDatabase();
    const readTransaction = database.transaction(KEY_STORE, 'readonly');
    const stored = await requestValue(
        readTransaction.objectStore(KEY_STORE).get(VAULT_KEY_ID)
    );
    await transactionDone(readTransaction);

    if (stored?.key) {
        database.close();
        return stored.key;
    }

    const key = await crypto.subtle.generateKey(
        { length: 256, name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
    );
    const writeTransaction = database.transaction(KEY_STORE, 'readwrite');
    writeTransaction.objectStore(KEY_STORE).put({ id: VAULT_KEY_ID, key });
    await transactionDone(writeTransaction);
    database.close();
    return key;
};

export const saveEncryptedPlannerData = async data => {
    const [database, key] = await Promise.all([
        openDatabase(),
        getOrCreateVaultKey(),
    ]);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt(
        {
            additionalData: plannerDataAdditionalData(),
            iv,
            name: 'AES-GCM',
        },
        key,
        utf8ToBytes(JSON.stringify(data))
    );
    const transaction = database.transaction(RECORD_STORE, 'readwrite');
    transaction.objectStore(RECORD_STORE).put({
        ciphertext: bytesToBase64Url(new Uint8Array(ciphertext)),
        id: PLANNER_DATA_ID,
        iv: bytesToBase64Url(iv),
        updatedAt: new Date().toISOString(),
    });
    await transactionDone(transaction);
    database.close();
};

export const loadEncryptedPlannerData = async () => {
    const database = await openDatabase();
    const transaction = database.transaction(RECORD_STORE, 'readonly');
    const stored = await requestValue(
        transaction.objectStore(RECORD_STORE).get(PLANNER_DATA_ID)
    );
    await transactionDone(transaction);
    database.close();

    if (!stored) return null;
    const key = await getOrCreateVaultKey();
    const plaintext = await crypto.subtle.decrypt(
        {
            additionalData: plannerDataAdditionalData(),
            iv: base64UrlToBytes(stored.iv),
            name: 'AES-GCM',
        },
        key,
        base64UrlToBytes(stored.ciphertext)
    );
    return JSON.parse(bytesToUtf8(plaintext));
};

export const saveEncryptedLocalRecord = async (id, value) => {
    const [database, key] = await Promise.all([
        openDatabase(),
        getOrCreateVaultKey(),
    ]);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt(
        {
            additionalData: localRecordAdditionalData(id),
            iv,
            name: 'AES-GCM',
        },
        key,
        utf8ToBytes(JSON.stringify(value))
    );
    const transaction = database.transaction(RECORD_STORE, 'readwrite');
    transaction.objectStore(RECORD_STORE).put({
        ciphertext: bytesToBase64Url(ciphertext),
        id,
        iv: bytesToBase64Url(iv),
        kind: 'encrypted-local-record',
        updatedAt: new Date().toISOString(),
    });
    await transactionDone(transaction);
    database.close();
};

export const loadEncryptedLocalRecords = async prefix => {
    const database = await openDatabase();
    const transaction = database.transaction(RECORD_STORE, 'readonly');
    const records = await requestValue(
        transaction.objectStore(RECORD_STORE).getAll()
    );
    await transactionDone(transaction);
    database.close();
    const key = await getOrCreateVaultKey();

    return Promise.all(
        records
            .filter(
                record =>
                    record.kind === 'encrypted-local-record' &&
                    record.id.startsWith(prefix)
            )
            .map(async record => {
                const plaintext = await crypto.subtle.decrypt(
                    {
                        additionalData: localRecordAdditionalData(record.id),
                        iv: base64UrlToBytes(record.iv),
                        name: 'AES-GCM',
                    },
                    key,
                    base64UrlToBytes(record.ciphertext)
                );
                return {
                    id: record.id,
                    value: JSON.parse(bytesToUtf8(plaintext)),
                };
            })
    );
};

export const deleteEncryptedLocalRecord = async id => {
    const database = await openDatabase();
    const transaction = database.transaction(RECORD_STORE, 'readwrite');
    transaction.objectStore(RECORD_STORE).delete(id);
    await transactionDone(transaction);
    database.close();
};

export const saveEncryptedAttachmentChunk = async ({
    attachmentId,
    chunkIndex,
    ciphertext,
}) => {
    const database = await openDatabase();
    const transaction = database.transaction(ATTACHMENT_STORE, 'readwrite');
    transaction.objectStore(ATTACHMENT_STORE).put({
        attachmentId,
        chunkIndex,
        ciphertext,
        id: `${attachmentId}:${chunkIndex}`,
    });
    await transactionDone(transaction);
    database.close();
};

export const loadEncryptedAttachmentChunk = async ({
    attachmentId,
    chunkIndex,
}) => {
    const database = await openDatabase();
    const transaction = database.transaction(ATTACHMENT_STORE, 'readonly');
    const record = await requestValue(
        transaction
            .objectStore(ATTACHMENT_STORE)
            .get(`${attachmentId}:${chunkIndex}`)
    );
    await transactionDone(transaction);
    database.close();
    return record?.ciphertext || null;
};

export const deleteEncryptedAttachmentChunks = async attachmentId => {
    const database = await openDatabase();
    const transaction = database.transaction(ATTACHMENT_STORE, 'readwrite');
    const store = transaction.objectStore(ATTACHMENT_STORE);
    const keys = await requestValue(
        store.index('attachmentId').getAllKeys(attachmentId)
    );
    keys.forEach(key => store.delete(key));
    await transactionDone(transaction);
    database.close();
};

export const migratePlannerDataToEncryptedStore = async ({
    defaultLists,
    defaultTasks,
    normalizeLists,
    normalizeTasks,
    selectedListId,
    selectedTaskId,
}) => {
    const encrypted = await loadEncryptedPlannerData();
    const listsKey = 'daily-planner:v2:lists';
    const tasksKey = 'daily-planner:v2:tasks';
    const savedLists = encrypted ? null : localStorage.getItem(listsKey);
    const savedTasks = encrypted ? null : localStorage.getItem(tasksKey);
    const source = encrypted || {
        lists:
            savedLists && savedLists !== 'undefined'
                ? JSON.parse(savedLists)
                : defaultLists,
        tasks:
            savedTasks && savedTasks !== 'undefined'
                ? JSON.parse(savedTasks)
                : defaultTasks,
    };
    const normalizedLists = normalizeLists(source.lists);
    const normalizedTasks = normalizeTasks(source.tasks);
    const listIds = new Set(normalizedLists.map(list => list.id));
    const taskIds = new Set(normalizedTasks.map(task => task.id));
    const migrated = migratePlannerIds({
        lists: normalizedLists,
        selectedListId: listIds.has(selectedListId) ? selectedListId : null,
        selectedTaskId: taskIds.has(selectedTaskId) ? selectedTaskId : null,
        tasks: normalizedTasks,
    });
    const data = { lists: migrated.lists, tasks: migrated.tasks };

    await saveEncryptedPlannerData(data);
    const verified = await loadEncryptedPlannerData();
    if (JSON.stringify(verified) !== JSON.stringify(data)) {
        throw new Error('Encrypted planner migration could not be verified.');
    }

    localStorage.removeItem(listsKey);
    localStorage.removeItem(tasksKey);
    return {
        ...data,
        selectedListId: migrated.selectedListId,
        selectedTaskId: migrated.selectedTaskId,
    };
};

export const clearEncryptedPlannerStoreForTests = () =>
    new Promise((resolve, reject) => {
        const request = indexedDB.deleteDatabase(DATABASE_NAME);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
        request.onblocked = () => reject(new Error('Planner vault is busy.'));
    });
