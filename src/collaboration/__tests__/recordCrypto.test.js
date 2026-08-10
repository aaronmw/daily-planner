import { webcrypto } from 'node:crypto';
import { base64UrlToBytes, bytesToBase64Url } from '../bytes';
import {
    decryptRecord,
    encryptRecord,
    exportListKey,
    generateListKey,
    importListKey,
} from '../recordCrypto';

const context = {
    listId: 'list-1',
    recordType: 'task',
    recordId: 'task-1',
    revision: 4,
    keyVersion: 2,
};

describe('encrypted collaboration records', () => {
    it('round-trips JSON records and portable list keys', async () => {
        const originalKey = await generateListKey(webcrypto);
        const importedKey = await importListKey(
            await exportListKey(originalKey, webcrypto),
            webcrypto
        );
        const value = { label: 'Write tests', nested: { done: false } };
        const envelope = await encryptRecord(
            importedKey,
            context,
            value,
            webcrypto
        );

        await expect(
            decryptRecord(importedKey, context, envelope, webcrypto)
        ).resolves.toEqual(value);
        expect(envelope).toMatchObject({
            algorithm: 'AES-256-GCM',
            keyVersion: 2,
            version: 1,
        });
    });

    it.each([
        ['listId', 'list-2'],
        ['recordType', 'list'],
        ['recordId', 'task-2'],
        ['revision', 5],
        ['keyVersion', 3],
    ])('rejects a changed %s context', async (field, value) => {
        const key = await generateListKey(webcrypto);
        const envelope = await encryptRecord(
            key,
            context,
            { label: 'Private' },
            webcrypto
        );

        await expect(
            decryptRecord(
                key,
                { ...context, [field]: value },
                envelope,
                webcrypto
            )
        ).rejects.toThrow();
    });

    it('rejects tampered ciphertext', async () => {
        const key = await generateListKey(webcrypto);
        const envelope = await encryptRecord(
            key,
            context,
            { label: 'Private' },
            webcrypto
        );
        const tamperedBytes = base64UrlToBytes(envelope.ciphertext);
        tamperedBytes[0] ^= 1;

        await expect(
            decryptRecord(
                key,
                context,
                {
                    ...envelope,
                    ciphertext: bytesToBase64Url(tamperedBytes),
                },
                webcrypto
            )
        ).rejects.toThrow();
    });
});
