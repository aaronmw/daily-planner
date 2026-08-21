import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createPlannerList } from '../../../core/domain/factories';
import { PlannerDatabase } from '../../persistence/database';
import { EncryptedDexiePlannerRepository } from '../../persistence/plannerRepository';
import {
    exportLegacyOrigin,
    type KeyValueStorage,
} from '../legacyOriginMigration';
import {
    HOSTED_MIGRATION_MARKER,
    prepareHostedOrigin,
} from '../prepareHostedOrigin';

class MemoryStorage implements KeyValueStorage {
    readonly #values = new Map<string, string>();

    get length(): number {
        return this.#values.size;
    }

    getItem(key: string): string | null {
        return this.#values.get(key) ?? null;
    }

    key(index: number): string | null {
        return [...this.#values.keys()][index] ?? null;
    }

    setItem(key: string, value: string): void {
        this.#values.set(key, value);
    }
}

const databases: PlannerDatabase[] = [];

const createDatabase = (prefix: string): PlannerDatabase => {
    const database = new PlannerDatabase(`${prefix}-${crypto.randomUUID()}`);
    databases.push(database);
    return database;
};

afterEach(async () => {
    await Promise.all(databases.map(database => database.delete()));
    databases.length = 0;
});

describe('hosted-origin preparation', () => {
    it('waits for the local bridge, imports its payload, and acknowledges completion', async () => {
        const source = createDatabase('legacy-source');
        const destination = createDatabase('hosted-destination');
        const sourceStorage = new MemoryStorage();
        const destinationStorage = new MemoryStorage();
        const list = createPlannerList({ label: 'Hosted migration' });
        await new EncryptedDexiePlannerRepository(source).apply([
            { base: null, entity: list, type: 'put-list' },
        ]);
        sourceStorage.setItem('daily-planner:v5:preferences', 'preferences');
        const payload = await exportLegacyOrigin(source, sourceStorage);
        const invoke = vi.fn(async (command: string) => {
            if (command === 'claim_legacy_migration') {
                return { payload, status: 'ready' };
            }
            if (command === 'complete_legacy_migration') return null;
            throw new Error(`Unexpected command: ${command}`);
        });

        const result = await prepareHostedOrigin({
            database: destination,
            invoke,
            isDesktop: true,
            location: new URL('https://aaronmw.github.io/daily-planner/'),
            pollIntervalMs: 0,
            storage: destinationStorage,
        });

        expect(result).toBe('migrated');
        expect(
            await new EncryptedDexiePlannerRepository(destination).load()
        ).toEqual({ items: [], lists: [list] });
        expect(
            destinationStorage.getItem(HOSTED_MIGRATION_MARKER)
        ).not.toBeNull();
        expect(invoke).toHaveBeenLastCalledWith('complete_legacy_migration');
    });

    it('does not initialize or mutate storage outside the hosted desktop origin', async () => {
        const destination = createDatabase('browser-destination');
        const storage = new MemoryStorage();
        const invoke = vi.fn();

        await expect(
            prepareHostedOrigin({
                database: destination,
                invoke,
                isDesktop: false,
                location: new URL('https://aaronmw.github.io/daily-planner/'),
                storage,
            })
        ).resolves.toBe('not-required');
        await expect(
            prepareHostedOrigin({
                database: destination,
                invoke,
                isDesktop: true,
                location: new URL('http://127.0.0.1:1420/'),
                storage,
            })
        ).resolves.toBe('not-required');
        expect(invoke).not.toHaveBeenCalled();
        expect(storage.getItem(HOSTED_MIGRATION_MARKER)).toBeNull();
    });

    it('blocks startup when the local bridge reports a decryption failure', async () => {
        const destination = createDatabase('hosted-destination');
        const storage = new MemoryStorage();

        await expect(
            prepareHostedOrigin({
                database: destination,
                invoke: vi.fn().mockResolvedValue({
                    message: 'The legacy vault key could not decrypt a record.',
                    status: 'error',
                }),
                isDesktop: true,
                location: new URL('https://aaronmw.github.io/daily-planner/'),
                pollIntervalMs: 0,
                storage,
            })
        ).rejects.toThrow('legacy vault key could not decrypt');
        expect(storage.getItem(HOSTED_MIGRATION_MARKER)).toBeNull();
        expect(await destination.records.count()).toBe(0);
    });
});
