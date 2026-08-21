import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import {
    createPlannerList,
    createPlannerItem,
} from '../../../core/domain/factories';
import { createItemId } from '../../../core/domain/ids';
import { EncryptedDexieAttachmentGateway } from '../../persistence/attachmentGateway';
import { PlannerDatabase } from '../../persistence/database';
import {
    EncryptedDexiePlannerRepository,
    getOrCreateVaultKey,
} from '../../persistence/plannerRepository';
import {
    exportLegacyOrigin,
    importLegacyOrigin,
    type KeyValueStorage,
} from '../legacyOriginMigration';

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

describe('legacy Tauri origin migration', () => {
    it('does not create a legacy WebCrypto key when the old origin is empty', async () => {
        const source = createDatabase('empty-legacy-source');

        const payload = await exportLegacyOrigin(source, new MemoryStorage());

        expect(payload.records).toEqual([]);
        expect(payload.outbox).toEqual([]);
        expect(payload.attachmentChunks).toEqual([]);
        expect(await source.keys.count()).toBe(0);
    });

    it('re-encrypts planner records, outbox, attachments, and app preferences under the hosted origin', async () => {
        const source = createDatabase('legacy-source');
        const destination = createDatabase('hosted-destination');
        const sourceStorage = new MemoryStorage();
        const destinationStorage = new MemoryStorage();
        const list = createPlannerList({ label: 'Migrated list' });
        const item = createPlannerItem({
            label: 'Migrated item',
            listId: list.id,
        });
        const sourceRepository = new EncryptedDexiePlannerRepository(source);
        await sourceRepository.apply(
            [
                { base: null, entity: list, type: 'put-list' },
                { base: null, entity: item, type: 'put-item' },
            ],
            { enqueueForSync: true }
        );
        const sourceAttachments = new EncryptedDexieAttachmentGateway(source);
        const attachment = await sourceAttachments.upload(
            new File(['migrated attachment'], 'migration.txt', {
                type: 'text/plain',
            }),
            {
                keyVersion: 1,
                listId: list.id,
                onProgress: () => undefined,
                signal: new AbortController().signal,
                syncEnabled: false,
                itemId: createItemId(),
            }
        );
        sourceStorage.setItem(
            'daily-planner:v5:preferences',
            JSON.stringify({ themeMode: 'dark' })
        );
        sourceStorage.setItem('sb-project-auth-token', 'do-not-migrate');
        sourceStorage.setItem('unrelated', 'do-not-migrate');
        const sourceKey = await getOrCreateVaultKey(source);

        const payload = await exportLegacyOrigin(source, sourceStorage);
        await importLegacyOrigin(payload, destination, destinationStorage);

        const destinationRepository = new EncryptedDexiePlannerRepository(
            destination
        );
        expect(await destinationRepository.load()).toEqual({
            items: [item],
            lists: [list],
        });
        expect(await destinationRepository.loadOutbox()).toHaveLength(2);
        expect(
            await (
                await new EncryptedDexieAttachmentGateway(destination).load(
                    attachment.id
                )
            ).text()
        ).toBe('migrated attachment');
        expect(destinationStorage.getItem('daily-planner:v5:preferences')).toBe(
            JSON.stringify({ themeMode: 'dark' })
        );
        expect(destinationStorage.getItem('sb-project-auth-token')).toBeNull();
        expect(destinationStorage.getItem('unrelated')).toBeNull();
        expect(await getOrCreateVaultKey(destination)).not.toBe(sourceKey);
        expect(
            JSON.stringify(await destination.records.toArray())
        ).not.toContain('Migrated item');
    });

    it('refuses to merge into a non-empty hosted database', async () => {
        const source = createDatabase('legacy-source');
        const destination = createDatabase('hosted-destination');
        const sourceList = createPlannerList({ label: 'Legacy' });
        const destinationList = createPlannerList({ label: 'Hosted' });
        await new EncryptedDexiePlannerRepository(source).apply([
            { base: null, entity: sourceList, type: 'put-list' },
        ]);
        await new EncryptedDexiePlannerRepository(destination).apply([
            { base: null, entity: destinationList, type: 'put-list' },
        ]);

        const payload = await exportLegacyOrigin(source, new MemoryStorage());

        await expect(
            importLegacyOrigin(payload, destination, new MemoryStorage())
        ).rejects.toThrow('already contains encrypted planner data');
        expect(
            await new EncryptedDexiePlannerRepository(destination).load()
        ).toEqual({ items: [], lists: [destinationList] });
    });
});
