import React, { useCallback, useEffect, useRef, useState } from 'react';
import { marked } from 'marked';
import { applyAttachmentDraftMutation } from '../utils/attachments';
import AttachmentList from './AttachmentList';
import EditableText from './EditableText';
import { COPY, FONTS } from './atoms/tokens';

const TaskNotesEditor = ({ appActions, appData, task }) => {
    const {
        onCancelAttachmentUpload,
        onDismissFailedAttachmentUpload,
        onPasteTaskAttachments,
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
                isMultiLine
                margin={1}
                mode="prose"
                placeholder={COPY.EMPTY_NOTES}
                render={rawNotes => (
                    <div
                        className="markdown"
                        dangerouslySetInnerHTML={{
                            __html: marked(rawNotes),
                        }}
                    />
                )}
                value={task.notes || ''}
                onDraftValueChange={setDraft}
                onPasteFiles={handlePasteFiles}
                onSave={handleSaveNotes}
            />

            <AttachmentList
                attachments={task.attachments || []}
                failedUploads={taskFailures}
                progressByClientId={attachmentUploadProgressByClientId}
                removalStateById={attachmentRemovalStateById}
                taskId={task.id}
                onCancel={onCancelAttachmentUpload}
                onDismissFailure={onDismissFailedAttachmentUpload}
                onRemove={handleRemoveAttachment}
            />
        </>
    );
};

export default TaskNotesEditor;
