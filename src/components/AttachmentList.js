import React from 'react';
import cx from '../utils/cx';
import ArmedIconButton from './atoms/ArmedIconButton';
import { ICONS } from './atoms/tokens';

const AttachmentStatusSlot = ({ status }) => (
    <span
        aria-hidden="true"
        className={cx(
            'planner-attachment-icon-slot',
            status === 'uploading' && 'planner-spin',
            status === 'failed' && 'text-planner-danger'
        )}
    >
        {status === 'uploading'
            ? ICONS.SPINNER
            : status === 'failed'
              ? ICONS.WARNING
              : ICONS.PAPERCLIP}
    </span>
);

const AttachmentLabel = ({ attachment, progress }) => (
    <span className="planner-attachment-label">
        <span className="min-w-0 truncate">{attachment.filename}</span>
        {attachment.status === 'uploading' ? (
            <span className="shrink-0 text-planner-text-faded">
                {progress ?? 0}%
            </span>
        ) : null}
    </span>
);

const AttachmentRow = ({
    attachment,
    attachmentIndex,
    progress,
    removalState,
    onCancel,
    onDismissFailure,
    onRemove,
}) => {
    const isFailed = attachment.status === 'failed';
    const isUploading = attachment.status === 'uploading';
    const isRemoving = ['pending', 'removing'].includes(removalState?.status);
    const removalError = removalState?.error || null;
    const actionLabel = isUploading
        ? `Cancel upload of ${attachment.filename}`
        : isFailed
          ? `Dismiss failed upload of ${attachment.filename}`
          : `Remove ${attachment.filename}`;
    const handleConfirm = isUploading
        ? () => onCancel(attachment.client_id)
        : isFailed
          ? () => onDismissFailure(attachment.client_id)
          : () => onRemove(attachment, attachmentIndex);
    const rowError = attachment.error || removalError;

    return (
        <div
            aria-live={rowError ? 'polite' : undefined}
            className={cx(
                'planner-attachment-row',
                isFailed && 'planner-attachment-row-error',
                removalState?.status === 'removing' &&
                    'planner-attachment-row-removing'
            )}
            data-status={attachment.status}
            title={rowError || undefined}
        >
            {isUploading ? (
                <span
                    aria-hidden="true"
                    className="planner-attachment-progress"
                    style={{
                        '--planner-upload-progress': (progress ?? 0) / 100,
                    }}
                />
            ) : null}
            {attachment.status === 'ready' ? (
                <a
                    className="planner-attachment-link"
                    href={attachment.url}
                    rel="noopener noreferrer"
                    target="_blank"
                >
                    <AttachmentStatusSlot status={attachment.status} />
                    <AttachmentLabel attachment={attachment} />
                </a>
            ) : (
                <span className="planner-attachment-link">
                    <AttachmentStatusSlot status={attachment.status} />
                    <AttachmentLabel
                        attachment={attachment}
                        progress={progress}
                    />
                </span>
            )}

            <ArmedIconButton
                confirmLabel={
                    isFailed
                        ? 'Click again to dismiss'
                        : isUploading
                          ? 'Click again to cancel upload'
                          : 'Click again to remove attachment'
                }
                error={rowError}
                label={actionLabel}
                pending={isRemoving}
                onConfirm={handleConfirm}
            >
                {ICONS.END_ZONE}
            </ArmedIconButton>
        </div>
    );
};

const AttachmentList = ({
    attachments = [],
    failedUploads = [],
    progressByClientId = {},
    removalStateById = {},
    taskId,
    onCancel,
    onDismissFailure,
    onRemove,
}) => {
    const removingAttachments = Object.values(removalStateById)
        .filter(
            removalState =>
                removalState.status === 'removing' &&
                removalState.task_id === taskId &&
                !attachments.some(
                    attachment => attachment.id === removalState.attachment?.id
                )
        )
        .sort((a, b) => a.attachment_index - b.attachment_index);
    const attachmentRows = attachments.slice();

    removingAttachments.forEach(removalState => {
        attachmentRows.splice(
            Math.min(removalState.attachment_index, attachmentRows.length),
            0,
            removalState.attachment
        );
    });

    const rows = attachmentRows.concat(failedUploads);

    if (!rows.length) {
        return null;
    }

    return (
        <div className="planner-attachment-list" role="list">
            {rows.map((attachment, attachmentIndex) => (
                <div
                    key={attachment.id || attachment.client_id}
                    role="listitem"
                >
                    <AttachmentRow
                        attachment={attachment}
                        attachmentIndex={attachmentIndex}
                        progress={progressByClientId[attachment.client_id]}
                        removalState={removalStateById[attachment.id]}
                        onCancel={onCancel}
                        onDismissFailure={onDismissFailure}
                        onRemove={onRemove}
                    />
                </div>
            ))}
        </div>
    );
};

export default AttachmentList;
