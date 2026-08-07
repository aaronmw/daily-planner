import {
    beginTaskAttachmentUploads,
    normalizeTaskAttachments,
    rejectTaskAttachmentUpload,
    removeReadyTaskAttachment,
    resolveTaskAttachmentUpload,
} from '../taskAttachments';
import {
    buildAttachmentMarkdown,
    createPendingAttachment,
} from '../attachments';

const makePending = clientId =>
    createPendingAttachment(
        new File([clientId], `${clientId}.txt`, { type: 'text/plain' }),
        clientId
    );

const makeReady = (pending, id) => {
    const ready = {
        byte_size: pending.byte_size,
        created_at: '2026-08-06T00:00:00.000Z',
        filename: pending.filename,
        id,
        mime_type: pending.mime_type,
        status: 'ready',
        url: `/api/attachments/${id}`,
    };

    return {
        ...ready,
        markdown: buildAttachmentMarkdown(ready),
    };
};

describe('task attachment state', () => {
    it('defaults missing attachments and clears interrupted uploads', () => {
        const pending = makePending('stale');
        const normalized = normalizeTaskAttachments({
            id: 1,
            notes: `Text\n${pending.placeholder}`,
            attachments: [pending],
        });

        expect(normalized.attachments).toEqual([]);
        expect(normalized.notes).toBe('Text');
        expect(
            normalizeTaskAttachments({ id: 2, notes: '' }).attachments
        ).toEqual([]);
    });

    it('resolves concurrent uploads out of order without overwriting either', () => {
        const first = makePending('first');
        const second = makePending('second');
        const started = beginTaskAttachmentUploads(
            { id: 1, notes: '', attachments: [] },
            [first, second],
            `${first.placeholder}\n${second.placeholder}`
        );
        const secondReady = makeReady(second, 'second-ready');
        const firstReady = makeReady(first, 'first-ready');
        const withSecond = resolveTaskAttachmentUpload(
            started,
            second.client_id,
            secondReady
        );
        const complete = resolveTaskAttachmentUpload(
            withSecond,
            first.client_id,
            firstReady
        );

        expect(complete.attachments).toEqual([firstReady, secondReady]);
        expect(complete.notes).toBe(
            `${firstReady.markdown}\n${secondReady.markdown}`
        );
    });

    it('rejects one upload without disturbing a sibling upload', () => {
        const first = makePending('first');
        const second = makePending('second');
        const started = beginTaskAttachmentUploads(
            { id: 1, notes: '', attachments: [] },
            [first, second],
            `${first.placeholder}\n${second.placeholder}`
        );
        const rejected = rejectTaskAttachmentUpload(started, first.client_id);

        expect(rejected.attachments).toEqual([second]);
        expect(rejected.notes).toBe(second.placeholder);
    });

    it('removes only the selected ready attachment and its Markdown', () => {
        const firstPending = makePending('first');
        const secondPending = makePending('second');
        const first = makeReady(firstPending, 'first-ready');
        const second = makeReady(secondPending, 'second-ready');
        const task = {
            id: 1,
            attachments: [first, second],
            notes: `${first.markdown}\n${second.markdown}`,
        };
        const nextTask = removeReadyTaskAttachment(task, first.id);

        expect(nextTask.attachments).toEqual([second]);
        expect(nextTask.notes).toBe(second.markdown);
    });
});
