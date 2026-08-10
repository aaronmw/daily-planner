import {
    ATTACHMENT_REQUEST_HEADER,
    ATTACHMENT_REQUEST_HEADER_VALUE,
} from '../utils/attachments';
import {
    ATTACHMENT_CHUNK_SIZE,
    base64UrlToBytes,
    bytesToBase64Url,
    createAttachmentMetadata,
    decryptAttachmentChunk,
    encryptAttachmentChunk,
    exportListKey,
    generateAttachmentKey,
    importListKey,
} from '../collaboration';
import {
    deleteEncryptedAttachmentChunks,
    loadEncryptedAttachmentChunk,
    saveEncryptedAttachmentChunk,
} from './encryptedPlannerStore';
import { isDesktopRuntime } from './runtime';

const ATTACHMENT_DIRECTORY = 'encrypted-attachments';
const LEGACY_ATTACHMENT_DIRECTORY = 'attachments';
const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const abortError = () =>
    new DOMException('The attachment upload was cancelled.', 'AbortError');

const chunkFilename = index => `${String(index).padStart(6, '0')}.bin`;

const removeDesktopDirectory = async (remove, BaseDirectory, directory) => {
    try {
        await remove(directory, {
            baseDir: BaseDirectory.AppData,
            recursive: true,
        });
    } catch {
        // The folder may not exist if setup failed before the first write.
    }
};

export const uploadDesktopAttachment = async (
    file,
    { onProgress, signal } = {}
) => {
    if (!isDesktopRuntime()) {
        throw new Error('Desktop attachment storage is unavailable.');
    }

    const fs = await import('@tauri-apps/plugin-fs');
    const id = globalThis.crypto.randomUUID();
    const directory = `${ATTACHMENT_DIRECTORY}/${id}`;
    const temporaryDirectory = `${ATTACHMENT_DIRECTORY}/.${id}.pending`;

    try {
        if (signal?.aborted) {
            throw abortError();
        }
        if (!Number.isSafeInteger(file.size) || file.size < 1) {
            throw new TypeError('Attachment file size must be positive.');
        }

        await fs.mkdir(temporaryDirectory, {
            baseDir: fs.BaseDirectory.AppData,
            recursive: true,
        });
        const attachmentKey = await generateAttachmentKey();
        const encryption = createAttachmentMetadata({
            byteLength: file.size,
            chunkSize: ATTACHMENT_CHUNK_SIZE,
            fileId: id,
        });
        let bytesUploaded = 0;
        for (
            let chunkIndex = 0;
            chunkIndex < encryption.chunkCount;
            chunkIndex += 1
        ) {
            if (signal?.aborted) {
                throw abortError();
            }
            const start = chunkIndex * ATTACHMENT_CHUNK_SIZE;
            const end = Math.min(start + ATTACHMENT_CHUNK_SIZE, file.size);
            const plaintext = new Uint8Array(
                await file.slice(start, end).arrayBuffer()
            );
            const encrypted = await encryptAttachmentChunk(
                attachmentKey,
                encryption,
                chunkIndex,
                plaintext
            );
            await fs.writeFile(
                `${temporaryDirectory}/${chunkFilename(chunkIndex)}`,
                base64UrlToBytes(encrypted.ciphertext),
                { baseDir: fs.BaseDirectory.AppData }
            );
            bytesUploaded += plaintext.byteLength;
            onProgress?.({ bytesTotal: file.size, bytesUploaded });
        }

        if (signal?.aborted) {
            throw abortError();
        }
        await fs.rename(temporaryDirectory, directory, {
            newPathBaseDir: fs.BaseDirectory.AppData,
            oldPathBaseDir: fs.BaseDirectory.AppData,
        });

        return {
            attachment_key: await exportListKey(attachmentKey),
            byte_size: Number(file.size) || 0,
            chunk_count: encryption.chunkCount,
            created_at: new Date().toISOString(),
            encrypted: true,
            encryption,
            filename: file.name || 'attachment',
            id,
            local_encrypted: true,
            mime_type: file.type || 'application/octet-stream',
            url: `daily-planner-local-attachment:${id}`,
        };
    } catch (error) {
        await removeDesktopDirectory(
            fs.remove,
            fs.BaseDirectory,
            temporaryDirectory
        );
        throw error;
    }
};

export const loadDesktopAttachment = async attachment => {
    if (!isDesktopRuntime() || !attachment?.local_encrypted) {
        throw new Error('Encrypted desktop attachment storage is unavailable.');
    }
    if (!UUID_PATTERN.test(String(attachment.id || ''))) {
        throw new Error('The attachment identifier is invalid.');
    }
    const fs = await import('@tauri-apps/plugin-fs');
    const key = await importListKey(attachment.attachment_key);
    const plaintextChunks = [];
    for (
        let chunkIndex = 0;
        chunkIndex < attachment.encryption.chunkCount;
        chunkIndex += 1
    ) {
        const ciphertext = await fs.readFile(
            `${ATTACHMENT_DIRECTORY}/${attachment.id}/${chunkFilename(chunkIndex)}`,
            { baseDir: fs.BaseDirectory.AppData }
        );
        plaintextChunks.push(
            await decryptAttachmentChunk(
                key,
                attachment.encryption,
                chunkIndex,
                {
                    algorithm: 'AES-256-GCM',
                    ciphertext: bytesToBase64Url(ciphertext),
                    index: chunkIndex,
                    plaintextSize:
                        chunkIndex === attachment.encryption.chunkCount - 1
                            ? attachment.encryption.byteLength -
                              chunkIndex * attachment.encryption.chunkSize
                            : attachment.encryption.chunkSize,
                    version: 1,
                }
            )
        );
    }
    return new Blob(plaintextChunks, {
        type: attachment.mime_type || 'application/octet-stream',
    });
};

export const uploadWebAttachment = async (
    file,
    { onProgress, signal } = {}
) => {
    if (isDesktopRuntime() || typeof indexedDB === 'undefined') {
        throw new Error('Browser attachment storage is unavailable.');
    }
    if (!Number.isSafeInteger(file?.size) || file.size < 1) {
        throw new TypeError('Attachment file size must be positive.');
    }
    const id = globalThis.crypto.randomUUID();
    const attachmentKey = await generateAttachmentKey();
    const encryption = createAttachmentMetadata({
        byteLength: file.size,
        chunkSize: ATTACHMENT_CHUNK_SIZE,
        fileId: id,
    });
    try {
        let bytesUploaded = 0;
        for (
            let chunkIndex = 0;
            chunkIndex < encryption.chunkCount;
            chunkIndex += 1
        ) {
            if (signal?.aborted) throw abortError();
            const start = chunkIndex * ATTACHMENT_CHUNK_SIZE;
            const end = Math.min(start + ATTACHMENT_CHUNK_SIZE, file.size);
            const plaintext = new Uint8Array(
                await file.slice(start, end).arrayBuffer()
            );
            const encrypted = await encryptAttachmentChunk(
                attachmentKey,
                encryption,
                chunkIndex,
                plaintext
            );
            await saveEncryptedAttachmentChunk({
                attachmentId: id,
                chunkIndex,
                ciphertext: base64UrlToBytes(encrypted.ciphertext),
            });
            bytesUploaded += plaintext.byteLength;
            onProgress?.({ bytesTotal: file.size, bytesUploaded });
        }
        if (signal?.aborted) throw abortError();
        return {
            attachment_key: await exportListKey(attachmentKey),
            byte_size: Number(file.size),
            chunk_count: encryption.chunkCount,
            created_at: new Date().toISOString(),
            encrypted: true,
            encryption,
            filename: file.name || 'attachment',
            id,
            local_encrypted: true,
            mime_type: file.type || 'application/octet-stream',
            storage: 'indexeddb',
            url: `daily-planner-local-attachment:${id}`,
        };
    } catch (error) {
        await deleteEncryptedAttachmentChunks(id);
        throw error;
    }
};

export const loadWebAttachment = async attachment => {
    if (
        isDesktopRuntime() ||
        !attachment?.local_encrypted ||
        attachment.storage !== 'indexeddb'
    ) {
        throw new Error('Encrypted browser attachment storage is unavailable.');
    }
    const key = await importListKey(attachment.attachment_key);
    const plaintextChunks = [];
    for (
        let chunkIndex = 0;
        chunkIndex < attachment.encryption.chunkCount;
        chunkIndex += 1
    ) {
        const ciphertext = await loadEncryptedAttachmentChunk({
            attachmentId: attachment.id,
            chunkIndex,
        });
        if (!ciphertext) {
            throw new Error('An encrypted attachment chunk is missing.');
        }
        plaintextChunks.push(
            await decryptAttachmentChunk(
                key,
                attachment.encryption,
                chunkIndex,
                {
                    algorithm: 'AES-256-GCM',
                    ciphertext: bytesToBase64Url(ciphertext),
                    index: chunkIndex,
                    plaintextSize:
                        chunkIndex === attachment.encryption.chunkCount - 1
                            ? attachment.encryption.byteLength -
                              chunkIndex * attachment.encryption.chunkSize
                            : attachment.encryption.chunkSize,
                    version: 1,
                }
            )
        );
    }
    return new Blob(plaintextChunks, {
        type: attachment.mime_type || 'application/octet-stream',
    });
};

export const loadLocalAttachment = attachment =>
    isDesktopRuntime()
        ? loadDesktopAttachment(attachment)
        : loadWebAttachment(attachment);

const deleteDesktopAttachment = async attachment => {
    if (!UUID_PATTERN.test(String(attachment?.id || ''))) {
        throw new Error('The attachment identifier is invalid.');
    }

    const { BaseDirectory, remove } = await import('@tauri-apps/plugin-fs');
    const directory = attachment.local_encrypted
        ? ATTACHMENT_DIRECTORY
        : LEGACY_ATTACHMENT_DIRECTORY;
    await remove(`${directory}/${attachment.id}`, {
        baseDir: BaseDirectory.AppData,
        recursive: true,
    });
};

const deleteWebAttachment = async attachment => {
    const response = await fetch(attachment.url, {
        headers: {
            [ATTACHMENT_REQUEST_HEADER]: ATTACHMENT_REQUEST_HEADER_VALUE,
        },
        method: 'DELETE',
    });

    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'The attachment could not be removed.');
    }
};

export const deleteStoredAttachment = attachment =>
    attachment?.local_encrypted && !isDesktopRuntime()
        ? deleteEncryptedAttachmentChunks(attachment.id)
        : isDesktopRuntime()
          ? deleteDesktopAttachment(attachment)
          : deleteWebAttachment(attachment);
