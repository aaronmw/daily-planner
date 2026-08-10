import { describe, expect, it } from 'vitest';
import {
    decryptCollaborationRecord,
    encryptCollaborationRecord,
    generateIdentityKeyPair,
    generateListKey,
    unwrapListKey,
    wrapListKey,
} from '../crypto';

const context = {
    keyVersion: 1,
    listId: crypto.randomUUID(),
    recordId: crypto.randomUUID(),
    recordType: 'item',
    revision: 2,
};

describe('collaboration crypto', () => {
    it('authenticates encrypted record context', async () => {
        const key = await generateListKey();
        const envelope = await encryptCollaborationRecord(key, context, {
            label: 'private canary',
        });
        expect(JSON.stringify(envelope)).not.toContain('private canary');
        await expect(
            decryptCollaborationRecord(
                key,
                { ...context, revision: 3 },
                envelope
            )
        ).rejects.toThrow();
        await expect(
            decryptCollaborationRecord(key, context, envelope)
        ).resolves.toEqual({ label: 'private canary' });
    });

    it('wraps list keys for an identity', async () => {
        const [listKey, identity] = await Promise.all([
            generateListKey(),
            generateIdentityKeyPair(),
        ]);
        const wrapped = await wrapListKey(listKey, identity.publicKey);
        const unwrapped = await unwrapListKey(wrapped, identity.privateKey);
        const envelope = await encryptCollaborationRecord(
            listKey,
            context,
            'ok'
        );
        await expect(
            decryptCollaborationRecord(unwrapped, context, envelope)
        ).resolves.toBe('ok');
    });
});
