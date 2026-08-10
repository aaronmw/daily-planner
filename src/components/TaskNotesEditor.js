import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { applyAttachmentDraftMutation } from '../utils/attachments';
import AttachmentList from './AttachmentList';
import EditableText from './EditableText';
import { COPY, FONTS } from './atoms/tokens';

const isEncryptedAttachmentUrl = value =>
    String(value || '').startsWith('daily-planner-attachment:');

const safeMarkdownUrl = value => {
    const url = String(value || '');
    return /^(?:https?:|mailto:|blob:|data:image\/|\/|#)/i.test(url) ||
        isEncryptedAttachmentUrl(url)
        ? url
        : '';
};

const EncryptedAttachmentImage = ({ alt, attachment, onLoad }) => {
    const [source, setSource] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        let disposed = false;
        let revoke = () => {};
        if (!attachment || !onLoad) return undefined;
        void onLoad(attachment)
            .then(result => {
                if (disposed) {
                    result.revoke();
                    return;
                }
                revoke = result.revoke;
                setSource(result.url);
            })
            .catch(caught => {
                if (!disposed) setError(caught);
            });
        return () => {
            disposed = true;
            revoke();
        };
    }, [attachment, onLoad]);

    if (error) return <span role="alert">Encrypted image unavailable.</span>;
    if (!source) return <span aria-label="Decrypting image">...</span>;
    return <img alt={alt || attachment.filename} src={source} />;
};

const TaskNotesEditor = ({ appActions, appData, isEditable = true, task }) => {
    const {
        onCancelAttachmentUpload,
        onDismissFailedAttachmentUpload,
        onPasteTaskAttachments,
        onLoadTaskAttachment,
        onOpenTaskAttachment,
        onRemoveTaskAttachment,
        onUpdateTask,
    } = appActions;
    const {
        attachmentDraftMutations = [],
        attachmentRemovalStateById = {},
        attachmentUploadProgressByClientId = {},
        failedAttachmentUploads = [],
        focusAssistEnabled,
        highlightIncompleteSentencesEnabled,
    } = appData;
    const [draft, setDraft] = useState(task.notes || '');
    const appliedMutationIdsRef = useRef(new Set());
    const taskFailures = failedAttachmentUploads.filter(
        upload => upload.task_id === task.id
    );

    useEffect(() => {
        const pendingMutations = attachmentDraftMutations.filter(
            mutation =>
                mutation.task_id === task.id &&
                !appliedMutationIdsRef.current.has(mutation.id)
        );

        if (!pendingMutations.length) {
            return;
        }

        pendingMutations.forEach(mutation => {
            appliedMutationIdsRef.current.add(mutation.id);
        });
        setDraft(currentDraft =>
            pendingMutations.reduce(
                (nextDraft, mutation) =>
                    applyAttachmentDraftMutation(nextDraft, mutation),
                currentDraft
            )
        );
    }, [attachmentDraftMutations, task.id]);

    const handlePasteFiles = useCallback(
        (files, editorState) =>
            onPasteTaskAttachments(task.id, files, editorState),
        [onPasteTaskAttachments, task.id]
    );
    const handleRemoveAttachment = useCallback(
        (attachment, attachmentIndex) =>
            onRemoveTaskAttachment(task.id, attachment, attachmentIndex),
        [onRemoveTaskAttachment, task.id]
    );
    const handleSaveNotes = useCallback(
        nextNotes => onUpdateTask(task.id, { notes: nextNotes }),
        [onUpdateTask, task.id]
    );

    return (
        <>
            <EditableText
                canvasStyles={{
                    bottom: 0,
                    fontSize: FONTS.LARGE.SIZE,
                    left: 0,
                    overflow: 'auto',
                    position: 'absolute',
                    right: 0,
                    top: 0,
                }}
                draftValue={draft}
                focusAssistEnabled={focusAssistEnabled}
                highlightIncompleteSentencesEnabled={
                    highlightIncompleteSentencesEnabled
                }
                isFlexible
                isEditable={isEditable}
                isMultiLine
                margin={1}
                mode="prose"
                placeholder={COPY.EMPTY_NOTES}
                render={rawNotes => (
                    <div className="markdown">
                        <ReactMarkdown
                            urlTransform={safeMarkdownUrl}
                            components={{
                                a: ({ children, href }) => {
                                    const attachment = (
                                        task.attachments || []
                                    ).find(item => item.url === href);
                                    return (
                                        <a
                                            href={href}
                                            rel="noopener noreferrer"
                                            target="_blank"
                                            onClick={event => {
                                                if (!attachment?.encrypted)
                                                    return;
                                                event.preventDefault();
                                                void onOpenTaskAttachment?.(
                                                    attachment
                                                );
                                            }}
                                        >
                                            {children}
                                        </a>
                                    );
                                },
                                img: ({ alt, src }) => {
                                    const attachment = (
                                        task.attachments || []
                                    ).find(item => item.url === src);
                                    return attachment?.encrypted ? (
                                        <EncryptedAttachmentImage
                                            alt={alt}
                                            attachment={attachment}
                                            onLoad={onLoadTaskAttachment}
                                        />
                                    ) : (
                                        <img alt={alt || ''} src={src} />
                                    );
                                },
                            }}
                        >
                            {rawNotes}
                        </ReactMarkdown>
                    </div>
                )}
                value={task.notes || ''}
                onDraftValueChange={setDraft}
                onPasteFiles={isEditable ? handlePasteFiles : undefined}
                onSave={handleSaveNotes}
            />

            <AttachmentList
                attachments={task.attachments || []}
                failedUploads={taskFailures}
                progressByClientId={attachmentUploadProgressByClientId}
                removalStateById={attachmentRemovalStateById}
                taskId={task.id}
                showActions={isEditable}
                onCancel={onCancelAttachmentUpload}
                onDismissFailure={onDismissFailedAttachmentUpload}
                onOpen={onOpenTaskAttachment}
                onRemove={isEditable ? handleRemoveAttachment : undefined}
            />
        </>
    );
};

export default TaskNotesEditor;
