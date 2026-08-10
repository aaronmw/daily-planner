const mockDeleteCollaborationAttachment = jest.fn();
const mockDeleteStoredAttachment = jest.fn();
const mockLoadCollaborationListKey = jest.fn();
const mockLoadLocalAttachment = jest.fn();
const mockMaybeSingle = jest.fn();
const mockUploadCollaborationAttachment = jest.fn();

jest.mock('../collaborationIdentityStore', () => ({
    loadCollaborationListKey: (...args) =>
        mockLoadCollaborationListKey(...args),
}));
jest.mock('../collaborationAttachments', () => ({
    deleteCollaborationAttachment: (...args) =>
        mockDeleteCollaborationAttachment(...args),
    uploadCollaborationAttachment: (...args) =>
        mockUploadCollaborationAttachment(...args),
}));
jest.mock('../attachments', () => ({
    deleteStoredAttachment: (...args) => mockDeleteStoredAttachment(...args),
    loadLocalAttachment: (...args) => mockLoadLocalAttachment(...args),
}));
jest.mock('../supabase', () => ({
    requireSupabaseClient: () => ({
        from: () => ({
            select: () => ({
                eq: () => ({ maybeSingle: mockMaybeSingle }),
            }),
        }),
    }),
}));

import { migrateLocalAttachmentsToCollaboration } from '../collaborationMigration';

describe('local attachment collaboration migration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockLoadCollaborationListKey.mockResolvedValue({ key: true });
        mockLoadLocalAttachment.mockResolvedValue(
            new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' })
        );
        mockMaybeSingle.mockResolvedValue({ data: null, error: null });
        mockUploadCollaborationAttachment.mockResolvedValue({
            byte_size: 3,
            chunk_count: 1,
            filename: 'image.png',
            id: '20000000-0000-4000-8000-000000000001',
            key_version: 1,
            list_id: '10000000-0000-4000-8000-000000000001',
            mime_type: 'image/png',
            revision: 1,
            task_id: '30000000-0000-4000-8000-000000000001',
        });
    });

    it('uploads, commits the encrypted reference, then removes local storage', async () => {
        const attachment = {
            attachment_key: 'local-key',
            encrypted: true,
            filename: 'image.png',
            id: '20000000-0000-4000-8000-000000000001',
            local_encrypted: true,
            mime_type: 'image/png',
            status: 'ready',
            url: 'daily-planner-local-attachment:20000000-0000-4000-8000-000000000001',
        };
        const task = {
            attachments: [attachment],
            collaboration_revision: 1,
            id: '30000000-0000-4000-8000-000000000001',
            key_version: 1,
            list_id: '10000000-0000-4000-8000-000000000001',
            notes: `![image](${attachment.url})`,
        };
        const syncEntity = jest.fn(async ({ entity }) => ({
            entity,
            revision: 2,
        }));

        const result = await migrateLocalAttachmentsToCollaboration({
            identity: { accountKey: {} },
            snapshot: { lists: [], tasks: [task] },
            syncEntity,
        });

        expect(syncEntity).toHaveBeenCalledTimes(1);
        expect(mockDeleteStoredAttachment).toHaveBeenCalledWith(attachment);
        expect(result.tasks[0]).toMatchObject({
            collaboration_revision: 2,
            notes: '![image](daily-planner-attachment:20000000-0000-4000-8000-000000000001)',
        });
        expect(result.tasks[0].attachments[0]).toMatchObject({
            encrypted: true,
            url: 'daily-planner-attachment:20000000-0000-4000-8000-000000000001',
        });
        expect(result.tasks[0].attachments[0]).not.toHaveProperty(
            'local_encrypted'
        );
    });

    it('leaves already-cloud attachments untouched', async () => {
        const attachment = {
            encrypted: true,
            id: '20000000-0000-4000-8000-000000000001',
            status: 'ready',
            url: 'daily-planner-attachment:20000000-0000-4000-8000-000000000001',
        };
        const snapshot = {
            lists: [],
            tasks: [{ attachments: [attachment], id: 'task' }],
        };
        const result = await migrateLocalAttachmentsToCollaboration({
            identity: {},
            snapshot,
            syncEntity: jest.fn(),
        });

        expect(result.tasks[0].attachments[0]).toBe(attachment);
        expect(mockUploadCollaborationAttachment).not.toHaveBeenCalled();
    });
});
