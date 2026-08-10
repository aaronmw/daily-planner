import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import type { IdentityId, ListId } from '../../../core/domain/ids';
import { PlannerDatabase } from '../../persistence/database';
import { generateListKey } from '../crypto';
import { CollaborationIdentityStore } from '../identityStore';

const databases: PlannerDatabase[] = [];

afterEach(async () => {
    await Promise.all(databases.map(database => database.delete()));
    databases.length = 0;
});

describe('CollaborationIdentityStore', () => {
    it('encrypts identities, list keys, and pending handoff secrets', async () => {
        const database = new PlannerDatabase(`identity-${crypto.randomUUID()}`);
        databases.push(database);
        const store = new CollaborationIdentityStore(database);
        const userId = crypto.randomUUID() as IdentityId;
        const listId = crypto.randomUUID() as ListId;
        const secret = 's'.repeat(48);
        const listKey = await generateListKey();

        const created = await store.create({
            email: 'private@example.test',
            isAnonymous: true,
            userId,
        });
        await store.saveListKey(listId, 1, listKey);
        await store.savePendingHandoff({
            expiresAt: new Date(Date.now() + 60_000).toISOString(),
            handoffId: crypto.randomUUID(),
            keys: [{ key: 'encrypted-list-key', keyVersion: 1, listId }],
            secret,
        });

        const raw = JSON.stringify(await database.records.toArray());
        expect(raw).not.toContain('private@example.test');
        expect(raw).not.toContain(secret);
        expect((await store.load())?.record.userId).toBe(created.record.userId);
        expect(await store.loadListKey(listId, 1)).not.toBeNull();
        expect(await store.loadPendingHandoff()).toMatchObject({ secret });
    });

    it('removes expired handoffs instead of returning them', async () => {
        const database = new PlannerDatabase(`identity-${crypto.randomUUID()}`);
        databases.push(database);
        const store = new CollaborationIdentityStore(database);
        await store.savePendingHandoff({
            expiresAt: new Date(Date.now() - 1_000).toISOString(),
            handoffId: crypto.randomUUID(),
            keys: [],
            secret: 'x'.repeat(48),
        });

        await expect(store.loadPendingHandoff()).resolves.toBeNull();
        expect(
            await database.records
                .filter(record =>
                    record.id.startsWith('collaboration-handoff-v5:')
                )
                .count()
        ).toBe(0);
    });
});
