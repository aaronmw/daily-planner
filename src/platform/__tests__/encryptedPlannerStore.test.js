import 'fake-indexeddb/auto';
import { webcrypto } from 'node:crypto';
import {
    clearEncryptedPlannerStoreForTests,
    loadEncryptedPlannerData,
    migratePlannerDataToEncryptedStore,
} from '../encryptedPlannerStore';

const DATABASE_NAME = 'daily-planner-vault';

const requestValue = request =>
    new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

const transactionDone = transaction =>
    new Promise((resolve, reject) => {
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
    });

const openVault = async () => {
    const request = indexedDB.open(DATABASE_NAME, 3);
    return requestValue(request);
};

describe('encrypted planner persistence', () => {
    beforeAll(() => {
        Object.defineProperty(globalThis, 'crypto', {
            configurable: true,
            value: webcrypto,
        });
        Object.defineProperty(globalThis, 'structuredClone', {
            configurable: true,
            value: value => value,
        });
    });

    beforeEach(async () => {
        localStorage.clear();
        await clearEncryptedPlannerStoreForTests();
    });

    afterAll(async () => {
        await clearEncryptedPlannerStoreForTests();
    });

    it('verifies encrypted UUID migration before removing plaintext state', async () => {
        localStorage.setItem(
            'daily-planner:v2:lists',
            JSON.stringify([
                {
                    id: 1,
                    isArchived: false,
                    label: 'PLAINTEXT-LIST-CANARY',
                },
            ])
        );
        localStorage.setItem(
            'daily-planner:v2:tasks',
            JSON.stringify([
                {
                    id: 2,
                    label: 'PLAINTEXT-TASK-CANARY',
                    list_id: 1,
                },
            ])
        );

        const result = await migratePlannerDataToEncryptedStore({
            defaultLists: [],
            defaultTasks: [],
            normalizeLists: value => value,
            normalizeTasks: value => value,
            selectedListId: 1,
            selectedTaskId: 2,
        });

        expect(result.lists[0].id).toMatch(/^[0-9a-f-]{36}$/i);
        expect(result.tasks[0]).toMatchObject({
            list_id: result.lists[0].id,
        });
        expect(result.selectedListId).toBe(result.lists[0].id);
        expect(result.selectedTaskId).toBe(result.tasks[0].id);
        expect(localStorage.getItem('daily-planner:v2:lists')).toBeNull();
        expect(localStorage.getItem('daily-planner:v2:tasks')).toBeNull();

        const database = await openVault();
        const transaction = database.transaction('records', 'readonly');
        const stored = await requestValue(
            transaction.objectStore('records').get('planner-data')
        );
        await transactionDone(transaction);
        database.close();
        expect(JSON.stringify(stored)).not.toContain('PLAINTEXT');
        await expect(loadEncryptedPlannerData()).resolves.toEqual({
            lists: result.lists,
            tasks: result.tasks,
        });
    });

    it('rejects ciphertext tampering', async () => {
        await migratePlannerDataToEncryptedStore({
            defaultLists: [
                {
                    id: crypto.randomUUID(),
                    isArchived: false,
                    label: 'Protected',
                },
            ],
            defaultTasks: [],
            normalizeLists: value => value,
            normalizeTasks: value => value,
            selectedListId: null,
            selectedTaskId: null,
        });
        const database = await openVault();
        const transaction = database.transaction('records', 'readwrite');
        const store = transaction.objectStore('records');
        const stored = await requestValue(store.get('planner-data'));
        const last = stored.ciphertext.at(-1);
        store.put({
            ...stored,
            ciphertext: `${stored.ciphertext.slice(0, -1)}${last === 'A' ? 'B' : 'A'}`,
        });
        await transactionDone(transaction);
        database.close();

        await expect(loadEncryptedPlannerData()).rejects.toThrow();
    });
});
