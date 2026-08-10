import { webcrypto } from 'node:crypto';
import { base64UrlToBytes, bytesToBase64Url, utf8ToBytes } from '../bytes';
import {
    ATTACHMENT_CHUNK_SIZE,
    createAttachmentMetadata,
    decryptAttachmentChunk,
    deriveAttachmentChunkIv,
    encryptAttachmentChunk,
    generateAttachmentKey,
    splitAttachmentBytes,
} from '../attachmentCrypto';

describe('encrypted attachment chunks', () => {
    it('splits attachments into fixed 4 MiB chunks', () => {
        const bytes = new Uint8Array(ATTACHMENT_CHUNK_SIZE + 3);
        const chunks = splitAttachmentBytes(bytes);

        expect(chunks).toHaveLength(2);
        expect(chunks[0]).toHaveLength(4 * 1024 * 1024);
        expect(chunks[1]).toHaveLength(3);
    });

    it('derives deterministic non-repeating nonces by chunk index', () => {
        const metadata = {
            byteLength: 6,
            chunkCount: 2,
            chunkSize: 3,
            fileId: 'file-1',
            noncePrefix: 'AAECAwQFBgc',
            version: 1,
        };

        expect(deriveAttachmentChunkIv(metadata, 0)).toEqual(
            deriveAttachmentChunkIv(metadata, 0)
        );
        expect(deriveAttachmentChunkIv(metadata, 0)).not.toEqual(
            deriveAttachmentChunkIv(metadata, 1)
        );
        expect(deriveAttachmentChunkIv(metadata, 0)).toHaveLength(12);
    });

    it('rejects files requiring more than the 32-bit nonce index space', () => {
        expect(() =>
            createAttachmentMetadata(
                {
                    fileId: 'too-many-chunks',
                    byteLength: 0x100000001,
                    chunkSize: 1,
                },
                webcrypto
            )
        ).toThrow(/too many chunks/i);
    });

    it('round-trips chunks and rejects changed order or ciphertext', async () => {
        const plaintext = utf8ToBytes('abcdef');
        const key = await generateAttachmentKey(webcrypto);
        const metadata = createAttachmentMetadata(
            { fileId: 'file-1', byteLength: plaintext.length, chunkSize: 3 },
            webcrypto
        );
        const chunks = splitAttachmentBytes(plaintext, metadata.chunkSize);
        const encrypted = await Promise.all(
            chunks.map((chunk, index) =>
                encryptAttachmentChunk(key, metadata, index, chunk, webcrypto)
            )
        );

        await expect(
            decryptAttachmentChunk(key, metadata, 0, encrypted[0], webcrypto)
        ).resolves.toEqual(chunks[0]);
        await expect(
            decryptAttachmentChunk(key, metadata, 0, encrypted[1], webcrypto)
        ).rejects.toThrow(/index/i);

        const tamperedBytes = base64UrlToBytes(encrypted[0].ciphertext);
        tamperedBytes[0] ^= 1;
        const tampered = {
            ...encrypted[0],
            ciphertext: bytesToBase64Url(tamperedBytes),
        };
        await expect(
            decryptAttachmentChunk(key, metadata, 0, tampered, webcrypto)
        ).rejects.toThrow();
    });

    it('rejects attachment context from another file', async () => {
        const key = await generateAttachmentKey(webcrypto);
        const metadata = createAttachmentMetadata(
            { fileId: 'file-1', byteLength: 3, chunkSize: 3 },
            webcrypto
        );
        const encrypted = await encryptAttachmentChunk(
            key,
            metadata,
            0,
            new Uint8Array([1, 2, 3]),
            webcrypto
        );

        await expect(
            decryptAttachmentChunk(
                key,
                { ...metadata, fileId: 'file-2' },
                0,
                encrypted,
                webcrypto
            )
        ).rejects.toThrow();
    });
});
