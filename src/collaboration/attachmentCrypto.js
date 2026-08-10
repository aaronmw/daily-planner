import {
    asBytes,
    base64UrlToBytes,
    bytesToBase64Url,
    utf8ToBytes,
} from './bytes';
import { getWebCrypto } from './webCrypto';

export const ATTACHMENT_CHUNK_SIZE = 4 * 1024 * 1024;

const assertMetadata = metadata => {
    if (metadata?.version !== 1 || !String(metadata?.fileId || '')) {
        throw new TypeError('Invalid attachment encryption metadata.');
    }

    if (
        !Number.isSafeInteger(metadata.byteLength) ||
        metadata.byteLength < 0 ||
        !Number.isSafeInteger(metadata.chunkSize) ||
        metadata.chunkSize < 1 ||
        metadata.chunkSize > ATTACHMENT_CHUNK_SIZE ||
        metadata.chunkCount !==
            Math.ceil(metadata.byteLength / metadata.chunkSize)
    ) {
        throw new TypeError('Invalid attachment chunk geometry.');
    }

    if (metadata.chunkCount > 0x100000000) {
        throw new RangeError('Attachment requires too many chunks.');
    }

    if (base64UrlToBytes(metadata.noncePrefix).length !== 8) {
        throw new TypeError('Attachment nonce prefixes must contain 8 bytes.');
    }
};

const expectedChunkLength = (metadata, chunkIndex) => {
    if (
        !Number.isSafeInteger(chunkIndex) ||
        chunkIndex < 0 ||
        chunkIndex >= metadata.chunkCount
    ) {
        throw new RangeError('Attachment chunk index is out of range.');
    }

    return chunkIndex === metadata.chunkCount - 1
        ? metadata.byteLength - chunkIndex * metadata.chunkSize
        : metadata.chunkSize;
};

const buildChunkAdditionalData = (metadata, chunkIndex, plaintextSize) =>
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

export const generateAttachmentKey = cryptoImpl => {
    const webCrypto = getWebCrypto(cryptoImpl);

    return webCrypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
};

export const createAttachmentMetadata = (
    { fileId, byteLength, chunkSize = ATTACHMENT_CHUNK_SIZE },
    cryptoImpl
) => {
    const webCrypto = getWebCrypto(cryptoImpl);
    const metadata = {
        byteLength,
        chunkCount: Math.ceil(byteLength / chunkSize),
        chunkSize,
        fileId: String(fileId || ''),
        noncePrefix: bytesToBase64Url(
            webCrypto.getRandomValues(new Uint8Array(8))
        ),
        version: 1,
    };

    assertMetadata(metadata);

    return metadata;
};

export const splitAttachmentBytes = (
    value,
    chunkSize = ATTACHMENT_CHUNK_SIZE
) => {
    const bytes = asBytes(value);

    if (
        !Number.isSafeInteger(chunkSize) ||
        chunkSize < 1 ||
        chunkSize > ATTACHMENT_CHUNK_SIZE
    ) {
        throw new RangeError('Attachment chunk size is invalid.');
    }

    const chunks = [];

    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
        chunks.push(bytes.slice(offset, offset + chunkSize));
    }

    return chunks;
};

export const deriveAttachmentChunkIv = (metadata, chunkIndex) => {
    assertMetadata(metadata);
    expectedChunkLength(metadata, chunkIndex);
    const iv = new Uint8Array(12);

    iv.set(base64UrlToBytes(metadata.noncePrefix), 0);
    new DataView(iv.buffer).setUint32(8, chunkIndex, false);

    return iv;
};

export const encryptAttachmentChunk = async (
    key,
    metadata,
    chunkIndex,
    value,
    cryptoImpl
) => {
    const webCrypto = getWebCrypto(cryptoImpl);
    const plaintext = asBytes(value);
    const requiredLength = expectedChunkLength(metadata, chunkIndex);

    if (plaintext.length !== requiredLength) {
        throw new RangeError(
            `Attachment chunk ${chunkIndex} must contain ${requiredLength} bytes.`
        );
    }

    const ciphertext = await webCrypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: deriveAttachmentChunkIv(metadata, chunkIndex),
            additionalData: buildChunkAdditionalData(
                metadata,
                chunkIndex,
                plaintext.length
            ),
            tagLength: 128,
        },
        key,
        plaintext
    );

    return {
        algorithm: 'AES-256-GCM',
        ciphertext: bytesToBase64Url(ciphertext),
        index: chunkIndex,
        plaintextSize: plaintext.length,
        version: 1,
    };
};

export const decryptAttachmentChunk = async (
    key,
    metadata,
    expectedIndex,
    encryptedChunk,
    cryptoImpl
) => {
    const webCrypto = getWebCrypto(cryptoImpl);
    const requiredLength = expectedChunkLength(metadata, expectedIndex);

    if (encryptedChunk?.index !== expectedIndex) {
        throw new Error('Encrypted attachment chunk index does not match.');
    }

    if (
        encryptedChunk.version !== 1 ||
        encryptedChunk.algorithm !== 'AES-256-GCM' ||
        encryptedChunk.plaintextSize !== requiredLength
    ) {
        throw new Error('Unsupported encrypted attachment chunk.');
    }

    const plaintext = await webCrypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: deriveAttachmentChunkIv(metadata, expectedIndex),
            additionalData: buildChunkAdditionalData(
                metadata,
                expectedIndex,
                encryptedChunk.plaintextSize
            ),
            tagLength: 128,
        },
        key,
        base64UrlToBytes(encryptedChunk.ciphertext)
    );
    const bytes = new Uint8Array(plaintext);

    if (bytes.length !== requiredLength) {
        throw new Error('Decrypted attachment chunk length does not match.');
    }

    return bytes;
};
