import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import {
    createPlannerList,
    createPlannerItem,
} from '../../../core/domain/factories';
import { PlannerDatabase } from '../database';
import { EncryptedDexiePlannerRepository } from '../plannerRepository';

const databases: PlannerDatabase[] = [];

afterEach(async () => {
    await Promise.all(databases.map(database => database.delete()));
    databases.length = 0;
});

describe('EncryptedDexiePlannerRepository', () => {
    it('persists independently encrypted list and item records', async () => {
        const database = new PlannerDatabase(`test-${crypto.randomUUID()}`);
        databases.push(database);
        const repository = new EncryptedDexiePlannerRepository(database);
        const list = createPlannerList({ label: 'Plaintext canary' });
        const item = createPlannerItem({
            label: 'Secret item canary',
            listId: list.id,
        });

        await repository.apply([
            { base: null, entity: list, type: 'put-list' },
            { base: null, entity: item, type: 'put-item' },
        ]);

        const stored = await database.records.toArray();
        expect(stored).toHaveLength(2);
        expect(JSON.stringify(stored)).not.toContain('Plaintext canary');
        expect(JSON.stringify(stored)).not.toContain('Secret item canary');
        expect(await repository.load()).toEqual({
            lists: [list],
            items: [item],
        });
    });

    it('authenticates record context and rejects tampering', async () => {
        const database = new PlannerDatabase(`test-${crypto.randomUUID()}`);
        databases.push(database);
        const repository = new EncryptedDexiePlannerRepository(database);
        const list = createPlannerList();
        await repository.apply([
            { base: null, entity: list, type: 'put-list' },
        ]);
        const stored = await database.records.get(list.id);
        expect(stored).toBeDefined();
        await database.records.update(list.id, { revision: 99 });

        await expect(repository.load()).rejects.toThrow();
    });

    it('writes sync outbox entries in the same repository transaction', async () => {
        const database = new PlannerDatabase(`test-${crypto.randomUUID()}`);
        databases.push(database);
        const repository = new EncryptedDexiePlannerRepository(database);
        const list = createPlannerList({ label: 'Outbox plaintext canary' });
        await repository.apply(
            [{ base: null, entity: list, type: 'put-list' }],
            {
                enqueueForSync: true,
            }
        );

        expect(await database.outbox.count()).toBe(1);
        expect(JSON.stringify(await database.outbox.toArray())).not.toContain(
            'Outbox plaintext canary'
        );
        const queued = await repository.loadOutbox();
        expect(queued).toHaveLength(1);
        expect(queued[0]?.mutation).toEqual({
            base: null,
            entity: list,
            type: 'put-list',
        });
        await repository.deleteOutbox(queued.map(operation => operation.id));
        expect(await database.outbox.count()).toBe(0);
    });
});
