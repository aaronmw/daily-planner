import { z } from 'zod';
import type { AttachmentGateway } from '../../core/application/ports';
import {
    attachmentIdSchema,
    createAttachmentId,
    listIdSchema,
    itemIdSchema,
} from '../../core/domain/ids';
import {
    decryptCollaborationRecord,
    encryptCollaborationRecord,
    exportListKey,
    importListKey,
} from './crypto';
import {
    ATTACHMENT_CHUNK_SIZE,
    attachmentEncryptionMetadataSchema,
    createAttachmentEncryptionMetadata,
    decryptAttachmentChunk,
    encryptAttachmentChunk,
    encryptedAttachmentChunkSchema,
    generateAttachmentKey,
} from './attachmentCrypto';
import { base64UrlToBytes, bytesToUtf8, utf8ToBytes } from './bytes';
import { CollaborationIdentityStore } from './identityStore';
import { requireSupabaseClient } from './supabaseClient';

export const ENCRYPTED_ATTACHMENT_BUCKET =
    'daily-planner-encrypted-attachments';

const ATTACHMENT_RECORD_TYPE = 'attachment-manifest';
const CONCURRENCY = 3;
const RETRY_DELAYS = [0, 250, 750] as const;
const DELETE_BATCH_SIZE = 100;
const MAX_CHUNKS = 1_000_000;

const attachmentMetadataSchema = z.object({
    chunk_count: z.number().int().positive(),
    deleted_at: z.string().nullable(),
    id: attachmentIdSchema,
    key_version: z.number().int().positive(),
    list_id: listIdSchema,
    revision: z.number().int().positive(),
    item_id: itemIdSchema,
});

export type AttachmentMetadata = z.infer<typeof attachmentMetadataSchema>;

const manifestSchema = z.object({
    attachmentKey: z.string().min(1),
    encryption: attachmentEncryptionMetadataSchema,
    file: z.object({
        byteLength: z.number().int().nonnegative(),
        filename: z.string().min(1),
        mimeType: z.string().min(1),
    }),
    version: z.literal(1),
});

const transportObjectSchema = z.object({
    chunk: encryptedAttachmentChunkSchema,
    manifest: z.unknown().optional(),
    version: z.literal(1),
});

const attachmentContext = (metadata: AttachmentMetadata) => ({
    keyVersion: metadata.key_version,
    listId: metadata.list_id,
    recordId: metadata.id,
    recordType: ATTACHMENT_RECORD_TYPE,
    revision: 1,
});

export const attachmentObjectPath = (
    listId: string,
    attachmentId: string,
    chunkIndex: number
): string => {
    const safeListId = listIdSchema.parse(listId);
    const safeAttachmentId = attachmentIdSchema.parse(attachmentId);
    if (chunkIndex < 0 || chunkIndex >= MAX_CHUNKS) {
        throw new RangeError('Attachment chunk index is out of range.');
    }
    return `${safeListId}/${safeAttachmentId}/${String(chunkIndex).padStart(6, '0')}.bin`;
};

const throwIfAborted = (signal: AbortSignal): void => {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
};

const retry = async <Value>(
    operation: () => Promise<Value>,
    signal: AbortSignal
): Promise<Value> => {
    let lastError: unknown;
    for (const delay of RETRY_DELAYS) {
        throwIfAborted(signal);
        if (delay > 0) {
            await new Promise<void>((resolve, reject) => {
                const onAbort = () => {
                    clearTimeout(timeout);
                    reject(new DOMException('Aborted', 'AbortError'));
                };
                const timeout = setTimeout(() => {
                    signal.removeEventListener('abort', onAbort);
                    resolve();
                }, delay);
                signal.addEventListener('abort', onAbort, { once: true });
            });
        }
        try {
            return await operation();
        } catch (error) {
            lastError = error;
        }
    }
    throw lastError;
};

const runBounded = async (
    count: number,
    worker: (index: number) => Promise<void>
): Promise<void> => {
    let next = 0;
    let stopped = false;
    await Promise.all(
        Array.from({ length: Math.min(CONCURRENCY, count) }, async () => {
            while (!stopped && next < count) {
                const index = next;
                next += 1;
                try {
                    await worker(index);
                } catch (error) {
                    stopped = true;
                    throw error;
                }
            }
        })
    );
};

const parseTransportObject = async (blob: Blob) =>
    transportObjectSchema.parse(
        JSON.parse(bytesToUtf8(new Uint8Array(await blob.arrayBuffer())))
    );

const loadMetadata = async (
    attachmentId: string
): Promise<AttachmentMetadata> => {
    const result = await requireSupabaseClient()
        .from('encrypted_attachment_metadata')
        .select(
            'id,list_id,item_id,chunk_count,key_version,revision,deleted_at'
        )
        .eq('id', attachmentIdSchema.parse(attachmentId))
        .is('deleted_at', null)
        .single();
    if (result.error) throw result.error;
    return attachmentMetadataSchema.parse(result.data);
};

const removeObjects = async (
    metadata: AttachmentMetadata,
    signal: AbortSignal
): Promise<void> => {
    const storage = requireSupabaseClient().storage.from(
        ENCRYPTED_ATTACHMENT_BUCKET
    );
    for (
        let offset = 0;
        offset < metadata.chunk_count;
        offset += DELETE_BATCH_SIZE
    ) {
        throwIfAborted(signal);
        const paths = Array.from(
            {
                length: Math.min(
                    DELETE_BATCH_SIZE,
                    metadata.chunk_count - offset
                ),
            },
            (_, index) =>
                attachmentObjectPath(
                    metadata.list_id,
                    metadata.id,
                    offset + index
                )
        );
        const result = await storage.remove(paths);
        if (result.error) throw result.error;
    }
};

export class SupabaseEncryptedAttachmentGateway implements AttachmentGateway {
    readonly #identities = new CollaborationIdentityStore();

    async delete(attachmentId: string): Promise<void> {
        const metadata = await loadMetadata(attachmentId);
        const result = await requireSupabaseClient().rpc(
            'delete_encrypted_attachment',
            {
                p_attachment_id: metadata.id,
                p_expected_revision: metadata.revision,
                p_list_id: metadata.list_id,
            }
        );
        if (result.error) throw result.error;
        await removeObjects(metadata, new AbortController().signal).catch(
            error => {
                console.warn(
                    'Encrypted attachment objects remain queued for cleanup.',
                    error
                );
            }
        );
    }

    async load(attachmentId: string): Promise<Blob> {
        const metadata = await loadMetadata(attachmentId);
        const listKey = await this.#identities.loadListKey(
            metadata.list_id,
            metadata.key_version
        );
        if (!listKey) throw new Error('The attachment key is unavailable.');
        const storage = requireSupabaseClient().storage.from(
            ENCRYPTED_ATTACHMENT_BUCKET
        );
        const signal = new AbortController().signal;
        const download = async (index: number) => {
            return retry(async () => {
                const result = await storage.download(
                    attachmentObjectPath(metadata.list_id, metadata.id, index),
                    {},
                    { signal }
                );
                if (result.error) throw result.error;
                return parseTransportObject(result.data);
            }, signal);
        };
        const first = await download(0);
        if (!first.manifest) {
            throw new Error('Encrypted attachment manifest is missing.');
        }
        const manifest = manifestSchema.parse(
            await decryptCollaborationRecord(
                listKey,
                attachmentContext(metadata),
                first.manifest
            )
        );
        if (
            manifest.encryption.fileId !== metadata.id ||
            manifest.encryption.chunkCount !== metadata.chunk_count ||
            manifest.file.byteLength !== manifest.encryption.byteLength
        ) {
            throw new Error('Encrypted attachment manifest does not match.');
        }
        const attachmentKey = await importListKey(manifest.attachmentKey);
        const chunks = new Array<Uint8Array<ArrayBuffer>>(metadata.chunk_count);
        chunks[0] = await decryptAttachmentChunk(
            attachmentKey,
            manifest.encryption,
            0,
            first.chunk
        );
        await runBounded(metadata.chunk_count - 1, async offset => {
            const index = offset + 1;
            const object = await download(index);
            chunks[index] = await decryptAttachmentChunk(
                attachmentKey,
                manifest.encryption,
                index,
                object.chunk
            );
        });
        return new Blob(chunks, { type: manifest.file.mimeType });
    }

    async upload(
        file: File,
        options: Parameters<AttachmentGateway['upload']>[1]
    ): Promise<{ attachmentKey: string; id: string; url: string }> {
        const attachmentId = options.attachmentId
            ? attachmentIdSchema.parse(options.attachmentId)
            : createAttachmentId();
        const itemId = itemIdSchema.parse(options.itemId);
        const listKey = await this.#identities.loadListKey(
            options.listId,
            options.keyVersion
        );
        if (!listKey)
            throw new Error('The list encryption key is unavailable.');
        const attachmentKey = await generateAttachmentKey();
        const encryption = createAttachmentEncryptionMetadata(
            attachmentId,
            file.size
        );
        if (encryption.chunkCount < 1 || encryption.chunkCount > MAX_CHUNKS) {
            throw new RangeError('The attachment size is unsupported.');
        }
        const metadata: AttachmentMetadata = {
            chunk_count: encryption.chunkCount,
            deleted_at: null,
            id: attachmentId,
            key_version: options.keyVersion,
            list_id: options.listId,
            revision: 1,
            item_id: itemId,
        };
        const manifest = await encryptCollaborationRecord(
            listKey,
            attachmentContext(metadata),
            {
                attachmentKey: await exportListKey(attachmentKey),
                encryption,
                file: {
                    byteLength: file.size,
                    filename: file.name || 'attachment',
                    mimeType: file.type || 'application/octet-stream',
                },
                version: 1,
            }
        );
        const encryptedByteSize =
            file.size +
            encryption.chunkCount * 16 +
            base64UrlToBytes(manifest.ciphertext).byteLength;
        const client = requireSupabaseClient();
        const created = await client.rpc('create_encrypted_attachment', {
            p_attachment_id: attachmentId,
            p_chunk_count: encryption.chunkCount,
            p_encrypted_byte_size: encryptedByteSize,
            p_key_version: options.keyVersion,
            p_list_id: options.listId,
            p_item_id: itemId,
        });
        if (created.error) throw created.error;
        const storage = client.storage.from(ENCRYPTED_ATTACHMENT_BUCKET);
        let uploadedBytes = 0;
        try {
            await runBounded(encryption.chunkCount, async index => {
                throwIfAborted(options.signal);
                const start = index * ATTACHMENT_CHUNK_SIZE;
                const plaintext = new Uint8Array(
                    await file
                        .slice(
                            start,
                            Math.min(start + ATTACHMENT_CHUNK_SIZE, file.size)
                        )
                        .arrayBuffer()
                );
                const chunk = await encryptAttachmentChunk(
                    attachmentKey,
                    encryption,
                    index,
                    plaintext
                );
                const body = utf8ToBytes(
                    JSON.stringify({
                        chunk,
                        ...(index === 0 ? { manifest } : {}),
                        version: 1,
                    })
                );
                await retry(async () => {
                    const result = await storage.upload(
                        attachmentObjectPath(
                            options.listId,
                            attachmentId,
                            index
                        ),
                        body,
                        {
                            cacheControl: '0',
                            contentType: 'application/octet-stream',
                            upsert: true,
                        }
                    );
                    if (result.error) throw result.error;
                }, options.signal);
                uploadedBytes += plaintext.byteLength;
                options.onProgress(
                    file.size === 0 ? 1 : uploadedBytes / file.size
                );
            });
        } catch (error) {
            await removeObjects(metadata, new AbortController().signal).catch(
                () => undefined
            );
            try {
                await client.rpc('delete_encrypted_attachment', {
                    p_attachment_id: attachmentId,
                    p_expected_revision: 1,
                    p_list_id: options.listId,
                });
            } catch {
                // The failed upload remains encrypted and inaccessible.
            }
            throw error;
        }
        return {
            attachmentKey: 'supabase-encrypted-v1',
            id: attachmentId,
            url: `daily-planner-attachment://${attachmentId}`,
        };
    }

    async stageMove(
        attachmentId: string,
        destinationListId: string,
        destinationKeyVersion: number,
        signal: AbortSignal
    ): Promise<AttachmentMetadata> {
        const source = await loadMetadata(attachmentId);
        const safeDestinationListId = listIdSchema.parse(destinationListId);
        const [sourceListKey, destinationListKey] = await Promise.all([
            this.#identities.loadListKey(source.list_id, source.key_version),
            this.#identities.loadListKey(
                safeDestinationListId,
                destinationKeyVersion
            ),
        ]);
        if (!sourceListKey || !destinationListKey) {
            throw new Error('The attachment move keys are unavailable.');
        }
        const storage = requireSupabaseClient().storage.from(
            ENCRYPTED_ATTACHMENT_BUCKET
        );
        await runBounded(source.chunk_count, async index => {
            throwIfAborted(signal);
            const downloaded = await retry(async () => {
                const result = await storage.download(
                    attachmentObjectPath(source.list_id, source.id, index),
                    {},
                    { signal }
                );
                if (result.error) throw result.error;
                return parseTransportObject(result.data);
            }, signal);
            const transport =
                index === 0
                    ? {
                          ...downloaded,
                          manifest: await encryptCollaborationRecord(
                              destinationListKey,
                              attachmentContext({
                                  ...source,
                                  key_version: destinationKeyVersion,
                                  list_id: safeDestinationListId,
                              }),
                              await decryptCollaborationRecord(
                                  sourceListKey,
                                  attachmentContext(source),
                                  downloaded.manifest
                              )
                          ),
                      }
                    : downloaded;
            const body = utf8ToBytes(JSON.stringify(transport));
            await retry(async () => {
                const result = await storage.upload(
                    attachmentObjectPath(
                        safeDestinationListId,
                        source.id,
                        index
                    ),
                    body,
                    {
                        cacheControl: '0',
                        contentType: 'application/octet-stream',
                        upsert: true,
                    }
                );
                if (result.error) throw result.error;
            }, signal);
        });
        return source;
    }

    async removeMoveSource(
        metadata: AttachmentMetadata,
        signal: AbortSignal
    ): Promise<void> {
        await removeObjects(metadata, signal);
    }

    async removeMoveDestination(
        metadata: AttachmentMetadata,
        destinationListId: string,
        signal: AbortSignal
    ): Promise<void> {
        await removeObjects(
            {
                ...metadata,
                list_id: listIdSchema.parse(destinationListId),
            },
            signal
        );
    }
}
