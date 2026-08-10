import { base64UrlToBytes, bytesToBase64Url } from '../collaboration/bytes';
import {
    exportPublicIdentityKey,
    generateIdentityKeyPair,
} from '../collaboration/identityCrypto';
import {
    generateAccountKey,
    generateVaultKey,
    protectAccountKey,
    recoverAccountKey,
    unwrapAccountKeyWithVault,
    wrapAccountKeyWithVault,
} from '../collaboration/vault';

const DATABASE_NAME = 'daily-planner-vault';
const DATABASE_VERSION = 3;
const KEY_STORE = 'keys';
const RECORD_STORE = 'records';
const ATTACHMENT_STORE = 'attachment-chunks';
const VAULT_KEY_ID = 'collaboration-vault-key';
const IDENTITY_RECORD_ID = 'collaboration-identity';
const LIST_KEY_RECORD_PREFIX = 'collaboration-list-key';
const RSA_ALGORITHM = {
    hash: 'SHA-256',
    name: 'RSA-OAEP',
};

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

const readRecord = async (storeName, id) => {
    const database = await openDatabase();
    const transaction = database.transaction(storeName, 'readonly');
    const value = await requestValue(
        transaction.objectStore(storeName).get(id)
    );
    await transactionDone(transaction);
    database.close();
    return value || null;
};

const writeRecord = async (storeName, value) => {
    const database = await openDatabase();
    const transaction = database.transaction(storeName, 'readwrite');
    transaction.objectStore(storeName).put(value);
    await transactionDone(transaction);
    database.close();
};

const getOrCreateVaultKey = async () => {
    const stored = await readRecord(KEY_STORE, VAULT_KEY_ID);
    if (stored?.key) return stored.key;

    const key = await generateVaultKey();
    await writeRecord(KEY_STORE, { id: VAULT_KEY_ID, key });
    return key;
};

const wrapPrivateKey = async (privateKey, accountKey) => {
    const wrapped = await crypto.subtle.wrapKey(
        'pkcs8',
        privateKey,
        accountKey,
        'AES-KW'
    );
    return bytesToBase64Url(wrapped);
};

const unwrapPrivateKey = (wrappedPrivateKey, accountKey) =>
    crypto.subtle.unwrapKey(
        'pkcs8',
        base64UrlToBytes(wrappedPrivateKey),
        accountKey,
        'AES-KW',
        RSA_ALGORITHM,
        false,
        ['unwrapKey']
    );

export const createCollaborationIdentity = async ({
    email = null,
    isAnonymous,
    userId,
}) => {
    const [vaultKey, accountKey, keyPair] = await Promise.all([
        getOrCreateVaultKey(),
        generateAccountKey(),
        generateIdentityKeyPair(),
    ]);
    const [publicKey, wrappedAccountKey, wrappedPrivateKey] = await Promise.all(
        [
            exportPublicIdentityKey(keyPair.publicKey),
            wrapAccountKeyWithVault(accountKey, vaultKey),
            wrapPrivateKey(keyPair.privateKey, accountKey),
        ]
    );
    const recovery = isAnonymous ? null : await protectAccountKey(accountKey);
    const record = {
        createdAt: new Date().toISOString(),
        email,
        id: IDENTITY_RECORD_ID,
        isAnonymous: Boolean(isAnonymous),
        protectedAccountKey: recovery?.protectedKey || null,
        publicKey,
        userId,
        wrappedAccountKey,
        wrappedPrivateKey,
    };

    await writeRecord(RECORD_STORE, record);

    return {
        accountKey,
        privateKey: keyPair.privateKey,
        publicKey,
        record,
        recoveryCode: recovery?.recoveryCode || null,
    };
};

export const loadCollaborationIdentity = async () => {
    const record = await readRecord(RECORD_STORE, IDENTITY_RECORD_ID);
    if (!record) return null;

    const vaultKey = await getOrCreateVaultKey();
    const accountKey = await unwrapAccountKeyWithVault(
        record.wrappedAccountKey,
        vaultKey
    );
    const privateKey = await unwrapPrivateKey(
        record.wrappedPrivateKey,
        accountKey
    );

    return { accountKey, privateKey, publicKey: record.publicKey, record };
};

export const recoverCollaborationIdentity = async ({
    email,
    encryptedPrivateKey,
    protectedAccountKey,
    publicKey,
    recoveryCode,
    userId,
}) => {
    const [vaultKey, accountKey] = await Promise.all([
        getOrCreateVaultKey(),
        recoverAccountKey(protectedAccountKey, recoveryCode),
    ]);
    const privateKey = await unwrapPrivateKey(encryptedPrivateKey, accountKey);
    const wrappedAccountKey = await wrapAccountKeyWithVault(
        accountKey,
        vaultKey
    );
    const record = {
        createdAt: new Date().toISOString(),
        email: email || null,
        id: IDENTITY_RECORD_ID,
        isAnonymous: false,
        protectedAccountKey,
        publicKey,
        userId,
        wrappedAccountKey,
        wrappedPrivateKey: encryptedPrivateKey,
    };
    await writeRecord(RECORD_STORE, record);
    return { accountKey, privateKey, publicKey, record };
};

export const updateCollaborationIdentityRecord = async updates => {
    const current = await readRecord(RECORD_STORE, IDENTITY_RECORD_ID);
    if (!current) throw new Error('No collaboration identity is stored.');
    const next = { ...current, ...updates, id: IDENTITY_RECORD_ID };
    await writeRecord(RECORD_STORE, next);
    return next;
};

export const saveCollaborationListKey = async ({
    accountKey,
    keyVersion,
    listId,
    listKey,
}) => {
    const wrapped = await crypto.subtle.wrapKey(
        'raw',
        listKey,
        accountKey,
        'AES-KW'
    );
    const id = `${LIST_KEY_RECORD_PREFIX}:${listId}:${keyVersion}`;
    await writeRecord(RECORD_STORE, {
        id,
        keyVersion,
        listId,
        wrappedKey: bytesToBase64Url(wrapped),
    });
};

export const loadCollaborationListKey = async ({
    accountKey,
    keyVersion,
    listId,
}) => {
    const id = `${LIST_KEY_RECORD_PREFIX}:${listId}:${keyVersion}`;
    const record = await readRecord(RECORD_STORE, id);
    if (!record) return null;

    return crypto.subtle.unwrapKey(
        'raw',
        base64UrlToBytes(record.wrappedKey),
        accountKey,
        'AES-KW',
        { length: 256, name: 'AES-GCM' },
        true,
        ['encrypt', 'decrypt']
    );
};

export const deleteCollaborationListKey = async ({ keyVersion, listId }) => {
    const id = `${LIST_KEY_RECORD_PREFIX}:${listId}:${keyVersion}`;
    const database = await openDatabase();
    const transaction = database.transaction(RECORD_STORE, 'readwrite');
    transaction.objectStore(RECORD_STORE).delete(id);
    await transactionDone(transaction);
    database.close();
};

export const clearCollaborationIdentityForTests = async () => {
    const database = await openDatabase();
    const transaction = database.transaction(
        [KEY_STORE, RECORD_STORE],
        'readwrite'
    );
    transaction.objectStore(KEY_STORE).delete(VAULT_KEY_ID);
    transaction.objectStore(RECORD_STORE).delete(IDENTITY_RECORD_ID);
    await transactionDone(transaction);
    database.close();
};
