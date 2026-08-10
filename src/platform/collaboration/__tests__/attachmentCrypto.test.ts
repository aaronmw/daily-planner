import { describe, expect, it } from 'vitest';
import { bytesToBase64Url } from '../bytes';
import {
    attachmentEncryptionMetadataSchema,
    createAttachmentEncryptionMetadata,
    decryptAttachmentChunk,
    encryptAttachmentChunk,
    generateAttachmentKey,
} from '../attachmentCrypto';

const metadataFor = (byteLength: number, chunkSize: number) =>
    attachmentEncryptionMetadataSchema.parse({
        byteLength,
        chunkCount: Math.max(1, Math.ceil(byteLength / chunkSize)),
        chunkSize,
        fileId: crypto.randomUUID(),
        noncePrefix: bytesToBase64Url(
            crypto.getRandomValues(new Uint8Array(8))
        ),
        version: 1,
    });

describe('encrypted attachment chunks', () => {
    it('represents an empty file as one authenticated empty chunk', async () => {
        const metadata = createAttachmentEncryptionMetadata(
            crypto.randomUUID(),
            0
        );
        const key = await generateAttachmentKey();
        const chunk = await encryptAttachmentChunk(
            key,
            metadata,
            0,
            new Uint8Array()
        );

        expect(metadata.chunkCount).toBe(1);
        await expect(
            decryptAttachmentChunk(key, metadata, 0, chunk)
        ).resolves.toHaveLength(0);
    });

    it('round-trips independent chunks and rejects changed context', async () => {
        const metadata = metadataFor(7, 4);
        const key = await generateAttachmentKey();
        const first = Uint8Array.from([1, 2, 3, 4]);
        const second = Uint8Array.from([5, 6, 7]);
        const encrypted = await Promise.all([
            encryptAttachmentChunk(key, metadata, 0, first),
            encryptAttachmentChunk(key, metadata, 1, second),
        ]);

        await expect(
            decryptAttachmentChunk(key, metadata, 0, encrypted[0])
        ).resolves.toEqual(first);
        await expect(
            decryptAttachmentChunk(key, metadata, 1, encrypted[1])
        ).resolves.toEqual(second);
        await expect(
            decryptAttachmentChunk(
                key,
                { ...metadata, fileId: crypto.randomUUID() },
                0,
                encrypted[0]
            )
        ).rejects.toThrow();
        await expect(
            decryptAttachmentChunk(key, metadata, 1, encrypted[0])
        ).rejects.toThrow('context does not match');
    });
});
