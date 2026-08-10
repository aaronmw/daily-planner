import { z } from 'zod';
import { base64UrlToBytes, bytesToBase64Url, utf8ToBytes } from './bytes';

export const ATTACHMENT_CHUNK_SIZE = 4 * 1024 * 1024;

export const attachmentEncryptionMetadataSchema = z
    .object({
        byteLength: z.number().int().nonnegative(),
        chunkCount: z.number().int().nonnegative(),
        chunkSize: z.number().int().positive().max(ATTACHMENT_CHUNK_SIZE),
        fileId: z.uuid(),
        noncePrefix: z.string().min(1),
        version: z.literal(1),
    })
    .superRefine((metadata, context) => {
        if (
            metadata.chunkCount !==
            Math.max(1, Math.ceil(metadata.byteLength / metadata.chunkSize))
        ) {
            context.addIssue({
                code: 'custom',
                message: 'Attachment chunk geometry is invalid.',
            });
        }
        if (base64UrlToBytes(metadata.noncePrefix).byteLength !== 8) {
            context.addIssue({
                code: 'custom',
                message: 'Attachment nonce prefixes must contain 8 bytes.',
            });
        }
    });

export type AttachmentEncryptionMetadata = z.infer<
    typeof attachmentEncryptionMetadataSchema
>;

export const encryptedAttachmentChunkSchema = z.object({
    algorithm: z.literal('AES-256-GCM'),
    ciphertext: z.string().min(1),
    index: z.number().int().nonnegative(),
    plaintextSize: z.number().int().nonnegative(),
    version: z.literal(1),
});

export type EncryptedAttachmentChunk = z.infer<
    typeof encryptedAttachmentChunkSchema
>;

const expectedChunkLength = (
    rawMetadata: AttachmentEncryptionMetadata,
    chunkIndex: number
): number => {
    const metadata = attachmentEncryptionMetadataSchema.parse(rawMetadata);
    if (chunkIndex < 0 || chunkIndex >= metadata.chunkCount) {
        throw new RangeError('Attachment chunk index is out of range.');
    }
    return chunkIndex === metadata.chunkCount - 1
        ? metadata.byteLength - chunkIndex * metadata.chunkSize
        : metadata.chunkSize;
};

const chunkAdditionalData = (
    metadata: AttachmentEncryptionMetadata,
    chunkIndex: number,
    plaintextSize: number
): Uint8Array<ArrayBuffer> =>
    utf8ToBytes(
        JSON.stringify([
            'daily-planner-attachment-chunk',
            metadata.version,
            metadata.fileId,
            metadata.byteLength,
            metadata.chunkSize,
            metadata.chunkCount,
            chunkIndex,
            plaintextSize,
        ])
    );

const chunkIv = (
    metadata: AttachmentEncryptionMetadata,
    chunkIndex: number
): Uint8Array<ArrayBuffer> => {
    expectedChunkLength(metadata, chunkIndex);
    const iv = new Uint8Array(new ArrayBuffer(12));
    iv.set(base64UrlToBytes(metadata.noncePrefix), 0);
    new DataView(iv.buffer).setUint32(8, chunkIndex, false);
    return iv;
};

export const createAttachmentEncryptionMetadata = (
    fileId: string,
    byteLength: number
): AttachmentEncryptionMetadata =>
    attachmentEncryptionMetadataSchema.parse({
        byteLength,
        chunkCount: Math.max(1, Math.ceil(byteLength / ATTACHMENT_CHUNK_SIZE)),
        chunkSize: ATTACHMENT_CHUNK_SIZE,
        fileId,
        noncePrefix: bytesToBase64Url(
            crypto.getRandomValues(new Uint8Array(new ArrayBuffer(8)))
        ),
        version: 1,
    });

export const generateAttachmentKey = (): Promise<CryptoKey> =>
    crypto.subtle.generateKey({ length: 256, name: 'AES-GCM' }, true, [
        'decrypt',
        'encrypt',
    ]);

export const encryptAttachmentChunk = async (
    key: CryptoKey,
    metadata: AttachmentEncryptionMetadata,
    chunkIndex: number,
    plaintext: Uint8Array<ArrayBuffer>
): Promise<EncryptedAttachmentChunk> => {
    const requiredLength = expectedChunkLength(metadata, chunkIndex);
    if (plaintext.byteLength !== requiredLength) {
        throw new RangeError(
            `Attachment chunk ${chunkIndex} must contain ${requiredLength} bytes.`
        );
    }
    const ciphertext = await crypto.subtle.encrypt(
        {
            additionalData: chunkAdditionalData(
                metadata,
                chunkIndex,
                plaintext.byteLength
            ),
            iv: chunkIv(metadata, chunkIndex),
            name: 'AES-GCM',
            tagLength: 128,
        },
        key,
        plaintext
    );
    return {
        algorithm: 'AES-256-GCM',
        ciphertext: bytesToBase64Url(ciphertext),
        index: chunkIndex,
        plaintextSize: plaintext.byteLength,
        version: 1,
    };
};

export const decryptAttachmentChunk = async (
    key: CryptoKey,
    metadata: AttachmentEncryptionMetadata,
    chunkIndex: number,
    rawChunk: unknown
): Promise<Uint8Array<ArrayBuffer>> => {
    const chunk = encryptedAttachmentChunkSchema.parse(rawChunk);
    const requiredLength = expectedChunkLength(metadata, chunkIndex);
    if (chunk.index !== chunkIndex || chunk.plaintextSize !== requiredLength) {
        throw new Error('Encrypted attachment chunk context does not match.');
    }
    const plaintext = await crypto.subtle.decrypt(
        {
            additionalData: chunkAdditionalData(
                metadata,
                chunkIndex,
                chunk.plaintextSize
            ),
            iv: chunkIv(metadata, chunkIndex),
            name: 'AES-GCM',
            tagLength: 128,
        },
        key,
        base64UrlToBytes(chunk.ciphertext)
    );
    const bytes = new Uint8Array(plaintext);
    if (bytes.byteLength !== requiredLength) {
        throw new Error('Decrypted attachment chunk length does not match.');
    }
    return bytes;
};
