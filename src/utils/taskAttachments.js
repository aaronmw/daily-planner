import {
    removeAttachmentMarkdownByUrl,
    removeStaleUploadPlaceholders,
    removeUploadPlaceholder,
    replaceUploadPlaceholder,
} from './attachments';

const attachmentArray = task =>
    Array.isArray(task?.attachments) ? task.attachments : [];

export const normalizeTaskAttachments = task => ({
    ...task,
    attachments: attachmentArray(task).filter(
        attachment => attachment.status === 'ready'
    ),
    notes: removeStaleUploadPlaceholders(task?.notes),
});

export const normalizeTasksForHydration = tasks =>
    Array.isArray(tasks) ? tasks.map(normalizeTaskAttachments) : [];

export const beginTaskAttachmentUploads = (
    task,
    pendingAttachments,
    notes
) => ({
    ...task,
    attachments: attachmentArray(task).concat(pendingAttachments),
    notes,
});

export const resolveTaskAttachmentUpload = (
    task,
    clientId,
    readyAttachment
) => {
    const pendingAttachment = attachmentArray(task).find(
        attachment =>
            attachment.status === 'uploading' &&
            attachment.client_id === clientId
    );

    if (!pendingAttachment) {
        return task;
    }

    return {
        ...task,
        attachments: attachmentArray(task).map(attachment =>
            attachment === pendingAttachment ? readyAttachment : attachment
        ),
        notes: replaceUploadPlaceholder(
            task.notes,
            pendingAttachment.placeholder,
            readyAttachment.markdown
        ),
    };
};

export const rejectTaskAttachmentUpload = (task, clientId) => {
    const pendingAttachment = attachmentArray(task).find(
        attachment =>
            attachment.status === 'uploading' &&
            attachment.client_id === clientId
    );

    if (!pendingAttachment) {
        return task;
    }

    return {
        ...task,
        attachments: attachmentArray(task).filter(
            attachment => attachment !== pendingAttachment
        ),
        notes: removeUploadPlaceholder(
            task.notes,
            pendingAttachment.placeholder
        ),
    };
};

export const removeReadyTaskAttachment = (task, attachmentId) => {
    const readyAttachment = attachmentArray(task).find(
        attachment =>
            attachment.status === 'ready' && attachment.id === attachmentId
    );

    if (!readyAttachment) {
        return task;
    }

    return {
        ...task,
        attachments: attachmentArray(task).filter(
            attachment => attachment !== readyAttachment
        ),
        notes: removeAttachmentMarkdownByUrl(task.notes, readyAttachment.url),
    };
};
