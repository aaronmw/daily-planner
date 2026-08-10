import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { createListId, createItemId } from '../../../core/domain/ids';
import { EncryptedDexieAttachmentGateway } from '../attachmentGateway';
import { PlannerDatabase } from '../database';

const databases: PlannerDatabase[] = [];

afterEach(async () => {
    await Promise.all(databases.map(database => database.delete()));
    databases.length = 0;
});

describe('EncryptedDexieAttachmentGateway', () => {
    it('round trips encrypted chunks without plaintext metadata', async () => {
        const database = new PlannerDatabase(
            `attachment-${crypto.randomUUID()}`
        );
        databases.push(database);
        const gateway = new EncryptedDexieAttachmentGateway(database);
        const file = new File(
            ['plaintext attachment canary'],
            'secret-name.txt',
            {
                type: 'text/plain',
            }
        );
        const result = await gateway.upload(file, {
            keyVersion: 1,
            listId: createListId(),
            onProgress: () => undefined,
            signal: new AbortController().signal,
            syncEnabled: false,
            itemId: createItemId(),
        });

        expect(JSON.stringify(await database.records.toArray())).not.toContain(
            'secret-name.txt'
        );
        expect(
            JSON.stringify(await database.attachmentChunks.toArray())
        ).not.toContain('plaintext attachment canary');
        expect(await (await gateway.load(result.id)).text()).toBe(
            'plaintext attachment canary'
        );

        await gateway.delete(result.id);
        await expect(gateway.load(result.id)).rejects.toThrow(
            'attachment is unavailable'
        );
    });

    it('cleans partial storage when cancelled', async () => {
        const database = new PlannerDatabase(
            `attachment-${crypto.randomUUID()}`
        );
        databases.push(database);
        const gateway = new EncryptedDexieAttachmentGateway(database);
        const controller = new AbortController();
        controller.abort();

        await expect(
            gateway.upload(new File(['content'], 'cancelled.txt'), {
                keyVersion: 1,
                listId: createListId(),
                onProgress: () => undefined,
                signal: controller.signal,
                syncEnabled: false,
                itemId: createItemId(),
            })
        ).rejects.toMatchObject({ name: 'AbortError' });
        expect(await database.attachmentChunks.count()).toBe(0);
        expect(
            await database.records.where('kind').equals('attachment').count()
        ).toBe(0);
    });

    it('round-trips an empty attachment and preserves a supplied ID', async () => {
        const database = new PlannerDatabase(`test-${crypto.randomUUID()}`);
        databases.push(database);
        const gateway = new EncryptedDexieAttachmentGateway(database);
        const listId = createListId();
        const itemId = createItemId();
        const attachmentId = crypto.randomUUID();
        const uploaded = await gateway.upload(
            new File([], 'empty.txt', { type: 'text/plain' }),
            {
                attachmentId,
                keyVersion: 1,
                listId,
                onProgress: () => undefined,
                signal: new AbortController().signal,
                syncEnabled: false,
                itemId,
            }
        );

        expect(uploaded.id).toBe(attachmentId);
        const loaded = await gateway.load(attachmentId);
        expect(loaded.size).toBe(0);
        expect(loaded.type).toBe('text/plain');
        expect(await database.attachmentChunks.count()).toBe(1);
    });
});
