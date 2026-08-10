import {
    ATTACHMENT_CHUNK_SIZE,
    createAttachmentMetadata,
    decryptAttachmentChunk,
    encryptAttachmentChunk,
    generateAttachmentKey,
} from '../collaboration/attachmentCrypto';
import {
    base64UrlToBytes,
    bytesToUtf8,
    utf8ToBytes,
} from '../collaboration/bytes';
import {
    decryptRecord,
    encryptRecord,
    exportListKey,
    importListKey,
} from '../collaboration/recordCrypto';
import { requireSupabaseClient } from './supabase';

export { ATTACHMENT_CHUNK_SIZE };

export const ENCRYPTED_ATTACHMENT_BUCKET =
    'daily-planner-encrypted-attachments';

const ATTACHMENT_RECORD_TYPE = 'attachment-manifest';
const DEFAULT_CONCURRENCY = 3;
const DEFAULT_RETRY_ATTEMPTS = 3;
const DELETE_BATCH_SIZE = 100;
const MAX_CONCURRENCY = 8;
const MAX_STORAGE_CHUNKS = 1_000_000;
const TRANSPORT_VERSION = 1;
const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const createAbortError = () => {
    if (typeof DOMException === 'function') {
        return new DOMException(
            'The encrypted attachment operation was cancelled.',
            'AbortError'
        );
    }

    const error = new Error(
        'The encrypted attachment operation was cancelled.'
    );
    error.name = 'AbortError';
    return error;
};

const throwIfAborted = signal => {
    if (signal?.aborted) throw createAbortError();
};

const throwOnError = result => {
    if (result?.error) throw result.error;
    return result?.data;
};

const assertUuid = (value, label) => {
    const normalized = String(value || '').toLowerCase();

    if (!UUID_PATTERN.test(normalized)) {
        throw new TypeError(`${label} must be a UUID.`);
    }

    return normalized;
};

const assertPositiveInteger = (value, label) => {
    if (!Number.isSafeInteger(value) || value < 1) {
        throw new TypeError(`${label} must be a positive integer.`);
    }

    return value;
};

const normalizeConcurrency = value => {
    const resolved = value ?? DEFAULT_CONCURRENCY;

    if (
        !Number.isSafeInteger(resolved) ||
        resolved < 1 ||
        resolved > MAX_CONCURRENCY
    ) {
        throw new RangeError(
            `Attachment concurrency must be between 1 and ${MAX_CONCURRENCY}.`
        );
    }

    return resolved;
};

const normalizeRetryAttempts = value => {
    const resolved = value ?? DEFAULT_RETRY_ATTEMPTS;

    if (!Number.isSafeInteger(resolved) || resolved < 1 || resolved > 10) {
        throw new RangeError(
            'Attachment retry attempts must be between 1 and 10.'
        );
    }

    return resolved;
};

const getAttachmentContext = ({ attachmentId, keyVersion, listId }) => ({
    keyVersion,
    listId,
    recordId: attachmentId,
    recordType: ATTACHMENT_RECORD_TYPE,
    revision: 1,
});

const serializeTransportObject = value => utf8ToBytes(JSON.stringify(value));

const parseTransportObject = value => {
    let parsed;

    try {
        parsed = JSON.parse(bytesToUtf8(value));
    } catch {
        throw new Error('Encrypted attachment object is malformed.');
    }

    if (
        parsed?.version !== TRANSPORT_VERSION ||
        !parsed.chunk ||
        parsed.chunk.version !== 1
    ) {
        throw new Error('Unsupported encrypted attachment object.');
    }

    return parsed;
};

const readFileChunk = async (file, start, end) => {
    const slice = file.slice(start, end);

    if (!slice || typeof slice.arrayBuffer !== 'function') {
        throw new TypeError('Attachment files must support sliced reads.');
    }

    return new Uint8Array(await slice.arrayBuffer());
};

const readDownloadedBytes = async value => {
    if (!value || typeof value.arrayBuffer !== 'function') {
        throw new Error('Supabase returned an invalid attachment object.');
    }

    return new Uint8Array(await value.arrayBuffer());
};

const runBounded = async ({ concurrency, count, signal, worker }) => {
    let nextIndex = 0;
    let firstError = null;
    let stopped = false;
    const runner = async () => {
        while (!stopped) {
            try {
                throwIfAborted(signal);
            } catch (error) {
                firstError ||= error;
                stopped = true;
                return;
            }

            const index = nextIndex;
            if (index >= count) return;
            nextIndex += 1;

            try {
                await worker(index);
            } catch (error) {
                firstError ||= error;
                stopped = true;
            }
        }
    };

    await Promise.all(
        Array.from({ length: Math.min(concurrency, count) }, runner)
    );

    if (firstError) throw firstError;
    throwIfAborted(signal);
};

const waitBeforeRetry = (delay, signal) => {
    if (!delay) return Promise.resolve();

    return new Promise((resolve, reject) => {
        const cleanup = () => signal?.removeEventListener('abort', onAbort);
        const timeout = setTimeout(() => {
            cleanup();
            resolve();
        }, delay);
        const onAbort = () => {
            clearTimeout(timeout);
            cleanup();
            reject(createAbortError());
        };

        signal?.addEventListener('abort', onAbort, { once: true });
    });
};

const runWithRetries = async ({
    operation,
    retryAttempts,
    retryDelayMs,
    retryDetails,
    onRetry,
    signal,
}) => {
    for (let attempt = 1; attempt <= retryAttempts; attempt += 1) {
        throwIfAborted(signal);

        try {
            return throwOnError(await operation());
        } catch (error) {
            if (signal?.aborted) throw createAbortError();
            if (attempt === retryAttempts) throw error;

            const nextAttempt = attempt + 1;
            onRetry?.({
                ...retryDetails,
                attempt: nextAttempt,
                error,
            });
            const delay =
                typeof retryDelayMs === 'function'
                    ? retryDelayMs(nextAttempt, error)
                    : retryDelayMs;
            await waitBeforeRetry(delay, signal);
        }
    }

    throw new Error('Attachment retry loop ended unexpectedly.');
};

const getStorageBucket = supabase =>
    supabase.storage.from(ENCRYPTED_ATTACHMENT_BUCKET);

export const getCollaborationAttachmentObjectPath = ({
    attachmentId,
    chunkIndex,
    listId,
}) => {
    const safeListId = assertUuid(listId, 'List ID');
    const safeAttachmentId = assertUuid(attachmentId, 'Attachment ID');

    if (
        !Number.isSafeInteger(chunkIndex) ||
        chunkIndex < 0 ||
        chunkIndex >= MAX_STORAGE_CHUNKS
    ) {
        throw new RangeError('Attachment chunk index is out of range.');
    }

    return `${safeListId}/${safeAttachmentId}/${String(chunkIndex).padStart(
        6,
        '0'
    )}.bin`;
};

const removeAttachmentObjects = async ({
    attachmentId,
    chunkCount,
    listId,
    signal,
    storage,
}) => {
    for (let offset = 0; offset < chunkCount; offset += DELETE_BATCH_SIZE) {
        throwIfAborted(signal);
        const batchSize = Math.min(DELETE_BATCH_SIZE, chunkCount - offset);
        const paths = Array.from({ length: batchSize }, (_, batchOffset) =>
            getCollaborationAttachmentObjectPath({
                attachmentId,
                chunkIndex: offset + batchOffset,
                listId,
            })
        );
        throwOnError(await storage.remove(paths));
    }
};

const cleanupCreatedAttachment = async ({
    attachmentId,
    chunkCount,
    listId,
    supabase,
}) => {
    try {
        await removeAttachmentObjects({
            attachmentId,
            chunkCount,
            listId,
            storage: getStorageBucket(supabase),
        });

        throwOnError(
            await supabase.rpc('delete_encrypted_attachment', {
                p_attachment_id: attachmentId,
                p_expected_revision: 1,
                p_list_id: listId,
            })
        );
    } catch {
        // Keep the row active if object cleanup fails so a later retry remains
        // authorized by Storage RLS. The original upload error is more useful.
    }
};

export const uploadCollaborationAttachment = async ({
    attachmentId = cryptoImpl?.randomUUID?.() ||
        globalThis.crypto?.randomUUID?.(),
    concurrency,
    cryptoImpl,
    file,
    keyVersion,
    listId,
    listKey,
    onProgress,
    onRetry,
    retryAttempts,
    retryDelayMs = 0,
    signal,
    supabase = requireSupabaseClient(),
    taskId,
}) => {
    const safeAttachmentId = assertUuid(attachmentId, 'Attachment ID');
    const safeListId = assertUuid(listId, 'List ID');
    const safeTaskId = assertUuid(taskId, 'Task ID');
    const safeKeyVersion = assertPositiveInteger(keyVersion, 'Key version');
    const safeConcurrency = normalizeConcurrency(concurrency);
    const safeRetryAttempts = normalizeRetryAttempts(retryAttempts);

    if (!file || !Number.isSafeInteger(file.size) || file.size < 1) {
        throw new TypeError('Attachment file size must be a positive integer.');
    }
    if (!listKey) throw new TypeError('A versioned list key is required.');

    throwIfAborted(signal);
    const chunkCount = Math.ceil(file.size / ATTACHMENT_CHUNK_SIZE);
    if (chunkCount > MAX_STORAGE_CHUNKS) {
        throw new RangeError(
            'Attachment exceeds the Storage path chunk limit.'
        );
    }

    const attachmentKey = await generateAttachmentKey(cryptoImpl);
    const encryptionMetadata = createAttachmentMetadata(
        {
            byteLength: file.size,
            chunkSize: ATTACHMENT_CHUNK_SIZE,
            fileId: safeAttachmentId,
        },
        cryptoImpl
    );
    const encryptedManifest = await encryptRecord(
        listKey,
        getAttachmentContext({
            attachmentId: safeAttachmentId,
            keyVersion: safeKeyVersion,
            listId: safeListId,
        }),
        {
            attachmentKey: await exportListKey(attachmentKey, cryptoImpl),
            encryption: encryptionMetadata,
            file: {
                byteLength: file.size,
                filename: String(file.name || 'attachment'),
                mimeType: String(file.type || 'application/octet-stream'),
            },
            version: TRANSPORT_VERSION,
        },
        cryptoImpl
    );
    const encryptedByteSize =
        file.size +
        chunkCount * 16 +
        base64UrlToBytes(encryptedManifest.ciphertext).byteLength;

    throwOnError(
        await supabase.rpc('create_encrypted_attachment', {
            p_attachment_id: safeAttachmentId,
            p_chunk_count: chunkCount,
            p_encrypted_byte_size: encryptedByteSize,
            p_key_version: safeKeyVersion,
            p_list_id: safeListId,
            p_task_id: safeTaskId,
        })
    );

    const storage = getStorageBucket(supabase);
    let bytesUploaded = 0;
    let chunksUploaded = 0;

    try {
        await runBounded({
            concurrency: safeConcurrency,
            count: chunkCount,
            signal,
            worker: async chunkIndex => {
                const start = chunkIndex * ATTACHMENT_CHUNK_SIZE;
                const plaintext = await readFileChunk(
                    file,
                    start,
                    Math.min(start + ATTACHMENT_CHUNK_SIZE, file.size)
                );
                throwIfAborted(signal);
                const chunk = await encryptAttachmentChunk(
                    attachmentKey,
                    encryptionMetadata,
                    chunkIndex,
                    plaintext,
                    cryptoImpl
                );
                const object = serializeTransportObject({
                    chunk,
                    ...(chunkIndex === 0
                        ? { manifest: encryptedManifest }
                        : {}),
                    version: TRANSPORT_VERSION,
                });
                const path = getCollaborationAttachmentObjectPath({
                    attachmentId: safeAttachmentId,
                    chunkIndex,
                    listId: safeListId,
                });

                await runWithRetries({
                    onRetry,
                    operation: () =>
                        storage.upload(path, object, {
                            cacheControl: '0',
                            contentType: 'application/octet-stream',
                            upsert: true,
                        }),
                    retryAttempts: safeRetryAttempts,
                    retryDelayMs,
                    retryDetails: {
                        attachmentId: safeAttachmentId,
                        chunkIndex,
                        path,
                        phase: 'upload',
                    },
                    signal,
                });
                throwIfAborted(signal);

                bytesUploaded += plaintext.byteLength;
                chunksUploaded += 1;
                onProgress?.({
                    attachmentId: safeAttachmentId,
                    bytesTotal: file.size,
                    bytesUploaded,
                    chunkCount,
                    chunksUploaded,
                });
            },
        });
    } catch (error) {
        await cleanupCreatedAttachment({
            attachmentId: safeAttachmentId,
            chunkCount,
            listId: safeListId,
            supabase,
        });
        throw error;
    }

    return {
        byte_size: file.size,
        chunk_count: chunkCount,
        encrypted_byte_size: encryptedByteSize,
        filename: String(file.name || 'attachment'),
        id: safeAttachmentId,
        key_version: safeKeyVersion,
        list_id: safeListId,
        mime_type: String(file.type || 'application/octet-stream'),
        revision: 1,
        status: 'ready',
        task_id: safeTaskId,
    };
};

const normalizeAttachmentRecord = attachment => ({
    attachmentId: assertUuid(attachment?.id, 'Attachment ID'),
    chunkCount: assertPositiveInteger(
        attachment?.chunk_count ?? attachment?.chunkCount,
        'Chunk count'
    ),
    keyVersion: assertPositiveInteger(
        attachment?.key_version ?? attachment?.keyVersion,
        'Key version'
    ),
    listId: assertUuid(attachment?.list_id ?? attachment?.listId, 'List ID'),
    revision: assertPositiveInteger(attachment?.revision, 'Revision'),
});

const downloadObject = async ({
    attachmentId,
    chunkIndex,
    listId,
    onRetry,
    retryAttempts,
    retryDelayMs,
    signal,
    storage,
}) => {
    const path = getCollaborationAttachmentObjectPath({
        attachmentId,
        chunkIndex,
        listId,
    });
    const data = await runWithRetries({
        onRetry,
        operation: () => storage.download(path, {}, { signal }),
        retryAttempts,
        retryDelayMs,
        retryDetails: {
            attachmentId,
            chunkIndex,
            path,
            phase: 'download',
        },
        signal,
    });

    return parseTransportObject(await readDownloadedBytes(data));
};

export const downloadCollaborationAttachment = async ({
    attachment,
    concurrency,
    cryptoImpl,
    listKey,
    onProgress,
    onRetry,
    retryAttempts,
    retryDelayMs = 0,
    signal,
    supabase = requireSupabaseClient(),
}) => {
    const { attachmentId, chunkCount, keyVersion, listId } =
        normalizeAttachmentRecord(attachment);
    const safeConcurrency = normalizeConcurrency(concurrency);
    const safeRetryAttempts = normalizeRetryAttempts(retryAttempts);
    if (chunkCount > MAX_STORAGE_CHUNKS) {
        throw new RangeError('Attachment chunk count exceeds Storage limits.');
    }
    if (!listKey) throw new TypeError('A versioned list key is required.');

    throwIfAborted(signal);
    const storage = getStorageBucket(supabase);
    const firstObject = await downloadObject({
        attachmentId,
        chunkIndex: 0,
        listId,
        onRetry,
        retryAttempts: safeRetryAttempts,
        retryDelayMs,
        signal,
        storage,
    });
    if (!firstObject.manifest) {
        throw new Error('Encrypted attachment manifest is missing.');
    }

    const manifest = await decryptRecord(
        listKey,
        getAttachmentContext({ attachmentId, keyVersion, listId }),
        firstObject.manifest,
        cryptoImpl
    );
    const metadata = manifest?.encryption;
    const fileMetadata = manifest?.file;
    if (
        manifest?.version !== TRANSPORT_VERSION ||
        metadata?.fileId !== attachmentId ||
        metadata?.chunkSize !== ATTACHMENT_CHUNK_SIZE ||
        metadata?.chunkCount !== chunkCount ||
        fileMetadata?.byteLength !== metadata?.byteLength ||
        typeof fileMetadata?.filename !== 'string' ||
        !fileMetadata.filename ||
        typeof fileMetadata?.mimeType !== 'string' ||
        !fileMetadata.mimeType
    ) {
        throw new Error(
            'Encrypted attachment manifest does not match metadata.'
        );
    }

    const attachmentKey = await importListKey(
        manifest.attachmentKey,
        cryptoImpl
    );
    const plaintextChunks = new Array(chunkCount);
    let bytesDownloaded = 0;
    let chunksDownloaded = 0;
    const decryptObject = async (chunkIndex, object) => {
        const plaintext = await decryptAttachmentChunk(
            attachmentKey,
            metadata,
            chunkIndex,
            object.chunk,
            cryptoImpl
        );
        plaintextChunks[chunkIndex] = plaintext;
        bytesDownloaded += plaintext.byteLength;
        chunksDownloaded += 1;
        onProgress?.({
            attachmentId,
            bytesDownloaded,
            bytesTotal: metadata.byteLength,
            chunkCount,
            chunksDownloaded,
        });
    };

    await decryptObject(0, firstObject);
    if (chunkCount > 1) {
        await runBounded({
            concurrency: safeConcurrency,
            count: chunkCount - 1,
            signal,
            worker: async offset => {
                const chunkIndex = offset + 1;
                const object = await downloadObject({
                    attachmentId,
                    chunkIndex,
                    listId,
                    onRetry,
                    retryAttempts: safeRetryAttempts,
                    retryDelayMs,
                    signal,
                    storage,
                });
                await decryptObject(chunkIndex, object);
            },
        });
    }
    throwIfAborted(signal);

    return {
        blob: new Blob(plaintextChunks, { type: fileMetadata.mimeType }),
        byteSize: metadata.byteLength,
        filename: fileMetadata.filename,
        mimeType: fileMetadata.mimeType,
    };
};

export const stageCollaborationAttachmentMove = async ({
    attachment,
    concurrency,
    cryptoImpl,
    destinationKeyVersion,
    destinationListId,
    destinationListKey,
    onProgress,
    retryAttempts,
    retryDelayMs = 0,
    signal,
    sourceListKey,
    supabase = requireSupabaseClient(),
}) => {
    const { attachmentId, chunkCount, keyVersion, listId } =
        normalizeAttachmentRecord(attachment);
    const safeDestinationListId = assertUuid(
        destinationListId,
        'Destination list ID'
    );
    const safeDestinationKeyVersion = assertPositiveInteger(
        destinationKeyVersion,
        'Destination key version'
    );
    const safeConcurrency = normalizeConcurrency(concurrency);
    const safeRetryAttempts = normalizeRetryAttempts(retryAttempts);
    if (safeDestinationListId === listId) {
        throw new TypeError('Attachment moves require two different lists.');
    }
    if (!sourceListKey || !destinationListKey) {
        throw new TypeError('Both versioned list keys are required.');
    }

    const storage = getStorageBucket(supabase);
    const firstObject = await downloadObject({
        attachmentId,
        chunkIndex: 0,
        listId,
        retryAttempts: safeRetryAttempts,
        retryDelayMs,
        signal,
        storage,
    });
    if (!firstObject.manifest) {
        throw new Error('Encrypted attachment manifest is missing.');
    }
    const manifest = await decryptRecord(
        sourceListKey,
        getAttachmentContext({ attachmentId, keyVersion, listId }),
        firstObject.manifest,
        cryptoImpl
    );
    const movedManifest = await encryptRecord(
        destinationListKey,
        getAttachmentContext({
            attachmentId,
            keyVersion: safeDestinationKeyVersion,
            listId: safeDestinationListId,
        }),
        manifest,
        cryptoImpl
    );
    let chunksStaged = 0;

    await runBounded({
        concurrency: safeConcurrency,
        count: chunkCount,
        signal,
        worker: async chunkIndex => {
            const object =
                chunkIndex === 0
                    ? { ...firstObject, manifest: movedManifest }
                    : await downloadObject({
                          attachmentId,
                          chunkIndex,
                          listId,
                          retryAttempts: safeRetryAttempts,
                          retryDelayMs,
                          signal,
                          storage,
                      });
            const path = getCollaborationAttachmentObjectPath({
                attachmentId,
                chunkIndex,
                listId: safeDestinationListId,
            });
            await runWithRetries({
                operation: () =>
                    storage.upload(path, serializeTransportObject(object), {
                        cacheControl: '0',
                        contentType: 'application/octet-stream',
                        upsert: true,
                    }),
                retryAttempts: safeRetryAttempts,
                retryDelayMs,
                retryDetails: {
                    attachmentId,
                    chunkIndex,
                    path,
                    phase: 'move',
                },
                signal,
            });
            chunksStaged += 1;
            onProgress?.({ attachmentId, chunkCount, chunksStaged });
        },
    });

    return {
        ...attachment,
        key_version: safeDestinationKeyVersion,
        list_id: safeDestinationListId,
        revision: attachment.revision + 1,
    };
};

export const removeCollaborationAttachmentSourceAfterMove = async ({
    attachment,
    signal,
    supabase = requireSupabaseClient(),
}) => {
    const { attachmentId, chunkCount, listId } =
        normalizeAttachmentRecord(attachment);
    return removeAttachmentObjects({
        attachmentId,
        chunkCount,
        listId,
        signal,
        storage: getStorageBucket(supabase),
    });
};

export const deleteCollaborationAttachment = async ({
    attachment,
    signal,
    supabase = requireSupabaseClient(),
}) => {
    const { attachmentId, chunkCount, listId, revision } =
        normalizeAttachmentRecord({
            key_version: 1,
            ...attachment,
        });
    if (chunkCount > MAX_STORAGE_CHUNKS) {
        throw new RangeError('Attachment chunk count exceeds Storage limits.');
    }

    throwIfAborted(signal);
    await removeAttachmentObjects({
        attachmentId,
        chunkCount,
        listId,
        signal,
        storage: getStorageBucket(supabase),
    });
    throwIfAborted(signal);

    return throwOnError(
        await supabase.rpc('delete_encrypted_attachment', {
            p_attachment_id: attachmentId,
            p_expected_revision: revision,
            p_list_id: listId,
        })
    );
};
