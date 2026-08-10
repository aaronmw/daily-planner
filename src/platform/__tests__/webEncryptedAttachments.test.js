import 'fake-indexeddb/auto';
import { webcrypto } from 'node:crypto';
import { TextEncoder } from 'node:util';
import {
    deleteStoredAttachment,
    loadWebAttachment,
    uploadWebAttachment,
} from '../attachments';
import { clearEncryptedPlannerStoreForTests } from '../encryptedPlannerStore';

const readBlob = blob =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(reader.error);
        reader.onload = () => resolve(new Uint8Array(reader.result));
        reader.readAsArrayBuffer(blob);
    });

const createFile = bytes => ({
    name: 'private.txt',
    size: bytes.length,
    slice: (start, end) => ({
        arrayBuffer: async () => bytes.slice(start, end).buffer,
    }),
    type: 'text/plain',
});

describe('encrypted browser attachment storage', () => {
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
        delete window.__TAURI_INTERNALS__;
        await clearEncryptedPlannerStoreForTests();
    });

    afterAll(() => clearEncryptedPlannerStoreForTests());

    it('round-trips encrypted chunks without a plaintext server upload', async () => {
        const plaintext = new TextEncoder().encode(
            'BROWSER-ATTACHMENT-PLAINTEXT-CANARY'
        );
        const attachment = await uploadWebAttachment(createFile(plaintext));

        expect(attachment).toMatchObject({
            encrypted: true,
            local_encrypted: true,
            storage: 'indexeddb',
        });
        const restored = await loadWebAttachment(attachment);
        expect(await readBlob(restored)).toEqual(plaintext);
        expect(restored.type).toBe('text/plain');

        await deleteStoredAttachment(attachment);
        await expect(loadWebAttachment(attachment)).rejects.toThrow(
            'chunk is missing'
        );
    });
});
