import { webcrypto } from 'node:crypto';
import { generateListKey } from '../../collaboration/recordCrypto';
import {
    ATTACHMENT_CHUNK_SIZE,
    ENCRYPTED_ATTACHMENT_BUCKET,
    deleteCollaborationAttachment,
    downloadCollaborationAttachment,
    getCollaborationAttachmentObjectPath,
    stageCollaborationAttachmentMove,
    uploadCollaborationAttachment,
} from '../collaborationAttachments';

const LIST_ID = '11111111-1111-4111-8111-111111111111';
const TASK_ID = '22222222-2222-4222-8222-222222222222';
const ATTACHMENT_ID = '33333333-3333-4333-8333-333333333333';
const DESTINATION_LIST_ID = '44444444-4444-4444-8444-444444444444';

const exactBuffer = bytes =>
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

const createFile = (bytes, overrides = {}) => ({
    name: 'private-plans.png',
    size: bytes.byteLength,
    slice: (start, end) => {
        const chunk = bytes.slice(start, end);

        return { arrayBuffer: async () => exactBuffer(chunk) };
    },
    type: 'image/png',
    ...overrides,
});

const createMockSupabase = () => {
    const objects = new Map();
    const bucket = {
        download: jest.fn(async path => {
            const bytes = objects.get(path);

            if (!bytes) {
                return { data: null, error: new Error('Object not found') };
            }

            return {
                data: { arrayBuffer: async () => exactBuffer(bytes) },
                error: null,
            };
        }),
        remove: jest.fn(async paths => {
            paths.forEach(path => objects.delete(path));
            return { data: paths, error: null };
        }),
        upload: jest.fn(async (path, value) => {
            const bytes =
                value instanceof Uint8Array
                    ? value.slice()
                    : new Uint8Array(await value.arrayBuffer());
            objects.set(path, bytes);
            return { data: { path }, error: null };
        }),
    };
    const client = {
        rpc: jest.fn(async (name, params) => ({
            data:
                name === 'delete_encrypted_attachment'
                    ? params.p_expected_revision + 1
                    : params.p_attachment_id,
            error: null,
        })),
        storage: {
            from: jest.fn(bucketName => {
                expect(bucketName).toBe(ENCRYPTED_ATTACHMENT_BUCKET);
                return bucket;
            }),
        },
    };

    return { bucket, client, objects };
};

const readBlob = blob =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(reader.error);
        reader.onload = () => resolve(new Uint8Array(reader.result));
        reader.readAsArrayBuffer(blob);
    });

describe('encrypted Supabase attachment transport', () => {
    it('encrypts display metadata, uses opaque paths, and downloads a Blob', async () => {
        const { bucket, client, objects } = createMockSupabase();
        const listKey = await generateListKey(webcrypto);
        const bytes = new Uint8Array([1, 2, 3, 4, 5]);

        const uploaded = await uploadCollaborationAttachment({
            attachmentId: ATTACHMENT_ID,
            cryptoImpl: webcrypto,
            file: createFile(bytes),
            keyVersion: 3,
            listId: LIST_ID,
            listKey,
            supabase: client,
            taskId: TASK_ID,
        });

        expect(client.rpc).toHaveBeenCalledWith('create_encrypted_attachment', {
            p_attachment_id: ATTACHMENT_ID,
            p_chunk_count: 1,
            p_encrypted_byte_size: expect.any(Number),
            p_key_version: 3,
            p_list_id: LIST_ID,
            p_task_id: TASK_ID,
        });
        expect(uploaded).toMatchObject({
            byte_size: bytes.byteLength,
            chunk_count: 1,
            filename: 'private-plans.png',
            id: ATTACHMENT_ID,
            key_version: 3,
            list_id: LIST_ID,
            mime_type: 'image/png',
            revision: 1,
            task_id: TASK_ID,
        });

        const expectedPath = `${LIST_ID}/${ATTACHMENT_ID}/000000.bin`;
        expect(bucket.upload).toHaveBeenCalledWith(
            expectedPath,
            expect.anything(),
            expect.objectContaining({
                contentType: 'application/octet-stream',
                upsert: true,
            })
        );
        expect(Array.from(objects.keys())).toEqual([expectedPath]);

        const serializedObject = Buffer.from(
            objects.get(expectedPath)
        ).toString('utf8');
        expect(serializedObject).not.toContain('private-plans.png');
        expect(serializedObject).not.toContain('image/png');
        expect(JSON.stringify(client.rpc.mock.calls)).not.toContain(
            'private-plans.png'
        );

        const downloaded = await downloadCollaborationAttachment({
            attachment: uploaded,
            cryptoImpl: webcrypto,
            listKey,
            supabase: client,
        });

        expect(downloaded.filename).toBe('private-plans.png');
        expect(downloaded.mimeType).toBe('image/png');
        expect(downloaded.blob).toBeInstanceOf(Blob);
        await expect(readBlob(downloaded.blob)).resolves.toEqual(bytes);
    });

    it('restores chunk order and rejects changed chunk context', async () => {
        const { client, objects } = createMockSupabase();
        const listKey = await generateListKey(webcrypto);
        const bytes = new Uint8Array(ATTACHMENT_CHUNK_SIZE + 3);
        bytes[0] = 7;
        bytes[ATTACHMENT_CHUNK_SIZE] = 8;

        const attachment = await uploadCollaborationAttachment({
            attachmentId: ATTACHMENT_ID,
            cryptoImpl: webcrypto,
            file: createFile(bytes),
            keyVersion: 1,
            listId: LIST_ID,
            listKey,
            supabase: client,
            taskId: TASK_ID,
        });

        const downloaded = await downloadCollaborationAttachment({
            attachment,
            concurrency: 2,
            cryptoImpl: webcrypto,
            listKey,
            supabase: client,
        });
        await expect(readBlob(downloaded.blob)).resolves.toEqual(bytes);

        const secondPath = getCollaborationAttachmentObjectPath({
            attachmentId: ATTACHMENT_ID,
            chunkIndex: 1,
            listId: LIST_ID,
        });
        const secondObject = JSON.parse(
            Buffer.from(objects.get(secondPath)).toString('utf8')
        );
        secondObject.chunk.index = 0;
        objects.set(
            secondPath,
            new Uint8Array(Buffer.from(JSON.stringify(secondObject)))
        );

        await expect(
            downloadCollaborationAttachment({
                attachment,
                cryptoImpl: webcrypto,
                listKey,
                supabase: client,
            })
        ).rejects.toThrow(/index/i);
    }, 15_000);

    it('re-wraps the manifest for a destination list before a task move', async () => {
        const { client } = createMockSupabase();
        const sourceListKey = await generateListKey(webcrypto);
        const destinationListKey = await generateListKey(webcrypto);
        const bytes = new Uint8Array(ATTACHMENT_CHUNK_SIZE + 3);
        bytes[0] = 11;
        bytes[ATTACHMENT_CHUNK_SIZE] = 12;
        const attachment = await uploadCollaborationAttachment({
            attachmentId: ATTACHMENT_ID,
            cryptoImpl: webcrypto,
            file: createFile(bytes),
            keyVersion: 2,
            listId: LIST_ID,
            listKey: sourceListKey,
            supabase: client,
            taskId: TASK_ID,
        });

        const movedAttachment = await stageCollaborationAttachmentMove({
            attachment,
            cryptoImpl: webcrypto,
            destinationKeyVersion: 7,
            destinationListId: DESTINATION_LIST_ID,
            destinationListKey,
            sourceListKey,
            supabase: client,
        });

        await expect(
            downloadCollaborationAttachment({
                attachment: movedAttachment,
                cryptoImpl: webcrypto,
                listKey: destinationListKey,
                supabase: client,
            }).then(value => readBlob(value.blob))
        ).resolves.toEqual(bytes);
        await expect(
            downloadCollaborationAttachment({
                attachment: movedAttachment,
                cryptoImpl: webcrypto,
                listKey: sourceListKey,
                supabase: client,
            })
        ).rejects.toThrow();
        expect(movedAttachment).toMatchObject({
            key_version: 7,
            list_id: DESTINATION_LIST_ID,
            revision: 2,
        });
    }, 15_000);

    it('retries a stable chunk path without changing its opaque identity', async () => {
        const { bucket, client } = createMockSupabase();
        const listKey = await generateListKey(webcrypto);
        const originalUpload = bucket.upload.getMockImplementation();
        const onRetry = jest.fn();

        bucket.upload
            .mockImplementationOnce(async () => ({
                data: null,
                error: new Error('Temporary storage failure'),
            }))
            .mockImplementation(originalUpload);

        await uploadCollaborationAttachment({
            attachmentId: ATTACHMENT_ID,
            cryptoImpl: webcrypto,
            file: createFile(new Uint8Array([1, 2, 3])),
            keyVersion: 1,
            listId: LIST_ID,
            listKey,
            onRetry,
            retryAttempts: 2,
            supabase: client,
            taskId: TASK_ID,
        });

        expect(bucket.upload).toHaveBeenCalledTimes(2);
        expect(bucket.upload.mock.calls[0][0]).toBe(
            bucket.upload.mock.calls[1][0]
        );
        expect(onRetry).toHaveBeenCalledWith(
            expect.objectContaining({ attempt: 2, chunkIndex: 0 })
        );
    });

    it('cancels before another chunk is scheduled and cleans up', async () => {
        const { bucket, client } = createMockSupabase();
        const listKey = await generateListKey(webcrypto);
        const controller = new AbortController();
        const originalUpload = bucket.upload.getMockImplementation();
        let releaseUpload;
        let markUploadStarted;
        const uploadStarted = new Promise(resolve => {
            markUploadStarted = resolve;
        });

        bucket.upload.mockImplementationOnce(async (...args) => {
            markUploadStarted();
            await new Promise(resolve => {
                releaseUpload = resolve;
            });
            return originalUpload(...args);
        });

        const promise = uploadCollaborationAttachment({
            attachmentId: ATTACHMENT_ID,
            concurrency: 1,
            cryptoImpl: webcrypto,
            file: createFile(new Uint8Array(ATTACHMENT_CHUNK_SIZE + 1)),
            keyVersion: 1,
            listId: LIST_ID,
            listKey,
            signal: controller.signal,
            supabase: client,
            taskId: TASK_ID,
        });

        await uploadStarted;
        controller.abort();
        releaseUpload();

        await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
        expect(bucket.upload).toHaveBeenCalledTimes(1);
        expect(bucket.remove).toHaveBeenCalledWith([
            `${LIST_ID}/${ATTACHMENT_ID}/000000.bin`,
            `${LIST_ID}/${ATTACHMENT_ID}/000001.bin`,
        ]);
        expect(client.rpc).toHaveBeenLastCalledWith(
            'delete_encrypted_attachment',
            {
                p_attachment_id: ATTACHMENT_ID,
                p_expected_revision: 1,
                p_list_id: LIST_ID,
            }
        );
    });

    it('removes chunk objects before deleting authorized metadata', async () => {
        const { bucket, client } = createMockSupabase();

        await expect(
            deleteCollaborationAttachment({
                attachment: {
                    chunk_count: 2,
                    id: ATTACHMENT_ID,
                    list_id: LIST_ID,
                    revision: 4,
                },
                supabase: client,
            })
        ).resolves.toBe(5);

        expect(bucket.remove).toHaveBeenCalledWith([
            `${LIST_ID}/${ATTACHMENT_ID}/000000.bin`,
            `${LIST_ID}/${ATTACHMENT_ID}/000001.bin`,
        ]);
        expect(client.rpc).toHaveBeenCalledWith('delete_encrypted_attachment', {
            p_attachment_id: ATTACHMENT_ID,
            p_expected_revision: 4,
            p_list_id: LIST_ID,
        });
        expect(bucket.remove.mock.invocationCallOrder[0]).toBeLessThan(
            client.rpc.mock.invocationCallOrder[0]
        );
    });
});
