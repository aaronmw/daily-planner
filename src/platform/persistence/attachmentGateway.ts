import { z } from 'zod';
import type { AttachmentGateway } from '../../core/application/ports';
import {
    attachmentIdSchema,
    createAttachmentId,
    type AttachmentId,
    type ListId,
    type ItemId,
} from '../../core/domain/ids';
import { type PlannerDatabase, plannerDatabase } from './database';
import {
    decryptBytes,
    decryptRecord,
    encryptBytes,
    encryptRecord,
} from './recordCrypto';
import { getOrCreateVaultKey } from './plannerRepository';

const CHUNK_SIZE = 4 * 1024 * 1024;

const metadataSchema = z.object({
    byteSize: z.number().nonnegative(),
    chunkCount: z.number().int().nonnegative(),
    filename: z.string(),
    mimeType: z.string(),
});

type AttachmentMetadata = z.infer<typeof metadataSchema>;

export class EncryptedDexieAttachmentGateway implements AttachmentGateway {
    readonly #database: PlannerDatabase;

    constructor(database: PlannerDatabase = plannerDatabase) {
        this.#database = database;
    }

    async has(attachmentId: string): Promise<boolean> {
        return Boolean(await this.#database.records.get(attachmentId));
    }

    async delete(attachmentId: string): Promise<void> {
        await this.#database.transaction(
            'rw',
            this.#database.attachmentChunks,
            this.#database.records,
            async () => {
                await this.#database.attachmentChunks
                    .where('attachmentId')
                    .equals(attachmentId)
                    .delete();
                await this.#database.records.delete(attachmentId);
            }
        );
    }

    async load(attachmentId: string): Promise<Blob> {
        const [record, chunks, key] = await Promise.all([
            this.#database.records.get(attachmentId),
            this.#database.attachmentChunks
                .where('attachmentId')
                .equals(attachmentId)
                .sortBy('index'),
            getOrCreateVaultKey(this.#database),
        ]);
        if (record?.kind !== 'attachment') {
            throw new Error('The attachment is unavailable.');
        }
        const metadata = metadataSchema.parse(
            await decryptRecord<AttachmentMetadata>({
                envelope: record,
                id: attachmentId,
                key,
                kind: 'attachment',
            })
        );
        if (chunks.length !== metadata.chunkCount) {
            throw new Error('The attachment is incomplete.');
        }
        const plaintext = await Promise.all(
            chunks.map(chunk =>
                decryptBytes({
                    envelope: chunk,
                    id: chunk.id,
                    key,
                    kind: 'attachment-chunk',
                })
            )
        );
        return new Blob(plaintext, { type: metadata.mimeType });
    }

    async upload(
        file: File,
        options: {
            attachmentId?: string;
            keyVersion: number;
            listId: ListId;
            onProgress: (progress: number) => void;
            signal: AbortSignal;
            syncEnabled: boolean;
            itemId: ItemId;
        }
    ): Promise<{ attachmentKey: string; id: string; url: string }> {
        const id: AttachmentId = options.attachmentId
            ? attachmentIdSchema.parse(options.attachmentId)
            : createAttachmentId();
        const key = await getOrCreateVaultKey(this.#database);
        const chunkCount = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));
        try {
            for (let index = 0; index < chunkCount; index += 1) {
                if (options.signal.aborted)
                    throw new DOMException('Aborted', 'AbortError');
                const source = new Uint8Array(
                    await file
                        .slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE)
                        .arrayBuffer()
                );
                const chunkId = `${id}:${index}`;
                const encrypted = await encryptBytes({
                    bytes: source,
                    id: chunkId,
                    key,
                    keyVersion: 1,
                    kind: 'attachment-chunk',
                    revision: 0,
                });
                await this.#database.attachmentChunks.put({
                    ...encrypted,
                    attachmentId: id,
                    id: chunkId,
                    index,
                });
                options.onProgress((index + 1) / Math.max(1, chunkCount));
            }
            const metadata: AttachmentMetadata = {
                byteSize: file.size,
                chunkCount,
                filename: file.name || 'attachment',
                mimeType: file.type || 'application/octet-stream',
            };
            const envelope = await encryptRecord({
                id,
                key,
                keyVersion: 1,
                kind: 'attachment',
                revision: 0,
                value: metadata,
            });
            await this.#database.records.put({
                ...envelope,
                id,
                kind: 'attachment',
                listId: options.listId,
                updatedAt: new Date().toISOString(),
            });
            return {
                attachmentKey: 'local-vault-v1',
                id,
                url: `daily-planner-attachment://${id}`,
            };
        } catch (error) {
            await this.delete(id);
            throw error;
        }
    }
}
