import { webcrypto } from 'node:crypto';
import {
    exportIdentityKeyPair,
    generateIdentityKeyPair,
    importIdentityKeyPair,
    unwrapListKey,
    wrapListKey,
} from '../identityCrypto';
import { decryptRecord, encryptRecord, generateListKey } from '../recordCrypto';

const context = {
    listId: 'list-identity',
    recordType: 'list',
    recordId: 'list-identity',
    revision: 1,
    keyVersion: 1,
};

describe('RSA identity keys', () => {
    it('exports and imports a 3072-bit RSA-OAEP identity', async () => {
        const pair = await generateIdentityKeyPair(webcrypto);
        const exported = await exportIdentityKeyPair(pair, webcrypto);
        const imported = await importIdentityKeyPair(exported, webcrypto);

        expect(imported.publicKey.algorithm).toMatchObject({
            name: 'RSA-OAEP',
            modulusLength: 3072,
        });
        expect(exported.publicKey).toMatch(/^[A-Za-z0-9_-]+$/);
        expect(exported.privateKey).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('wraps a list key for an identity and rejects another identity', async () => {
        const recipient = await generateIdentityKeyPair(webcrypto);
        const outsider = await generateIdentityKeyPair(webcrypto);
        const listKey = await generateListKey(webcrypto);
        const wrapped = await wrapListKey(
            listKey,
            recipient.publicKey,
            webcrypto
        );
        const unwrapped = await unwrapListKey(
            wrapped,
            recipient.privateKey,
            webcrypto
        );
        const envelope = await encryptRecord(
            unwrapped,
            context,
            { label: 'Shared list' },
            webcrypto
        );

        await expect(
            decryptRecord(unwrapped, context, envelope, webcrypto)
        ).resolves.toEqual({ label: 'Shared list' });
        await expect(
            unwrapListKey(wrapped, outsider.privateKey, webcrypto)
        ).rejects.toThrow();
    });
});
