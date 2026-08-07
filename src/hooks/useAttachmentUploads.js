import Uppy from '@uppy/core';
import XHRUpload from '@uppy/xhr-upload';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ATTACHMENT_REQUEST_HEADER,
    ATTACHMENT_REQUEST_HEADER_VALUE,
    buildAttachmentMarkdown,
} from '../utils/attachments';

const percentageForProgress = progress => {
    if (!progress?.bytesTotal) {
        return 0;
    }

    return Math.min(
        100,
        Math.round((progress.bytesUploaded / progress.bytesTotal) * 100)
    );
};

export default function useAttachmentUploads({ onReject, onResolve }) {
    const [draftMutations, setDraftMutations] = useState([]);
    const [failedUploads, setFailedUploads] = useState([]);
    const [progressByClientId, setProgressByClientId] = useState({});
    const uppyRef = useRef(null);
    const contextsByClientIdRef = useRef(new Map());
    const fileIdByClientIdRef = useRef(new Map());
    const cancelledClientIdsRef = useRef(new Set());
    const mutationIdRef = useRef(0);
    const onRejectRef = useRef(onReject);
    const onResolveRef = useRef(onResolve);

    useEffect(() => {
        onRejectRef.current = onReject;
        onResolveRef.current = onResolve;
    }, [onReject, onResolve]);

    const pushDraftMutation = useCallback(mutation => {
        mutationIdRef.current += 1;
        setDraftMutations(currentMutations =>
            currentMutations.concat({
                ...mutation,
                id: mutationIdRef.current,
            })
        );
    }, []);

    useEffect(() => {
        const uppy = new Uppy({
            allowMultipleUploadBatches: true,
            autoProceed: true,
            restrictions: {},
        }).use(XHRUpload, {
            allowedMetaFields: false,
            endpoint: '/api/attachments',
            fieldName: 'file',
            headers: {
                [ATTACHMENT_REQUEST_HEADER]: ATTACHMENT_REQUEST_HEADER_VALUE,
            },
            limit: 3,
            getResponseData: xhr => {
                try {
                    return JSON.parse(xhr.responseText);
                } catch {
                    return {};
                }
            },
        });

        const cleanUpload = clientId => {
            const fileId = fileIdByClientIdRef.current.get(clientId);

            if (fileId && uppy.getFile(fileId)) {
                uppy.removeFile(fileId);
            }

            contextsByClientIdRef.current.delete(clientId);
            fileIdByClientIdRef.current.delete(clientId);
            cancelledClientIdsRef.current.delete(clientId);
            setProgressByClientId(currentProgress => {
                const nextProgress = { ...currentProgress };
                delete nextProgress[clientId];
                return nextProgress;
            });
        };

        uppy.on('upload-progress', (file, progress) => {
            const clientId = file?.meta?.client_id;

            if (!clientId) {
                return;
            }

            setProgressByClientId(currentProgress => ({
                ...currentProgress,
                [clientId]: percentageForProgress(progress),
            }));
        });

        uppy.on('upload-success', (file, response) => {
            const clientId = file?.meta?.client_id;
            const context = contextsByClientIdRef.current.get(clientId);

            if (
                !clientId ||
                !context ||
                cancelledClientIdsRef.current.has(clientId)
            ) {
                return;
            }

            const metadata = response.body || {};
            const readyAttachment = {
                byte_size: metadata.byte_size,
                created_at: metadata.created_at,
                filename: metadata.filename || context.pending.filename,
                id: metadata.id,
                mime_type: metadata.mime_type || context.pending.mime_type,
                status: 'ready',
                url: metadata.url,
            };
            readyAttachment.markdown = buildAttachmentMarkdown(readyAttachment);

            onResolveRef.current(context.taskId, clientId, readyAttachment);
            pushDraftMutation({
                placeholder: context.pending.placeholder,
                replacement: readyAttachment.markdown,
                task_id: context.taskId,
                type: 'replace-placeholder',
            });
            cleanUpload(clientId);
        });

        uppy.on('upload-error', (file, error) => {
            const clientId = file?.meta?.client_id;
            const context = contextsByClientIdRef.current.get(clientId);

            if (
                !clientId ||
                !context ||
                cancelledClientIdsRef.current.has(clientId)
            ) {
                return;
            }

            onRejectRef.current(context.taskId, clientId);
            pushDraftMutation({
                placeholder: context.pending.placeholder,
                replacement: '',
                task_id: context.taskId,
                type: 'replace-placeholder',
            });
            setFailedUploads(currentFailures =>
                currentFailures.concat({
                    ...context.pending,
                    error: error?.message || 'Upload failed.',
                    status: 'failed',
                    task_id: context.taskId,
                })
            );
            cleanUpload(clientId);
        });

        uppyRef.current = uppy;

        return () => {
            uppyRef.current = null;
            uppy.destroy();
        };
    }, [pushDraftMutation]);

    const queueUploads = useCallback(
        (taskId, uploadEntries) => {
            const uppy = uppyRef.current;

            uploadEntries.forEach(({ file, pending }) => {
                contextsByClientIdRef.current.set(pending.client_id, {
                    file,
                    pending,
                    taskId,
                });
                setProgressByClientId(currentProgress => ({
                    ...currentProgress,
                    [pending.client_id]: 0,
                }));

                if (!uppy) {
                    onRejectRef.current(taskId, pending.client_id);
                    pushDraftMutation({
                        placeholder: pending.placeholder,
                        replacement: '',
                        task_id: taskId,
                        type: 'replace-placeholder',
                    });
                    setFailedUploads(currentFailures =>
                        currentFailures.concat({
                            ...pending,
                            error: 'The uploader is not ready.',
                            status: 'failed',
                            task_id: taskId,
                        })
                    );
                    contextsByClientIdRef.current.delete(pending.client_id);
                    setProgressByClientId(currentProgress => {
                        const nextProgress = { ...currentProgress };
                        delete nextProgress[pending.client_id];
                        return nextProgress;
                    });
                    return;
                }

                try {
                    const fileId = uppy.addFile({
                        data: file,
                        meta: {
                            client_id: pending.client_id,
                            relativePath: pending.client_id,
                            task_id: String(taskId),
                        },
                        name: pending.filename,
                        size: pending.byte_size,
                        source: 'clipboard',
                        type: pending.mime_type,
                    });
                    fileIdByClientIdRef.current.set(pending.client_id, fileId);
                } catch (error) {
                    onRejectRef.current(taskId, pending.client_id);
                    pushDraftMutation({
                        placeholder: pending.placeholder,
                        replacement: '',
                        task_id: taskId,
                        type: 'replace-placeholder',
                    });
                    setFailedUploads(currentFailures =>
                        currentFailures.concat({
                            ...pending,
                            error: error?.message || 'Upload failed.',
                            status: 'failed',
                            task_id: taskId,
                        })
                    );
                    contextsByClientIdRef.current.delete(pending.client_id);
                    setProgressByClientId(currentProgress => {
                        const nextProgress = { ...currentProgress };
                        delete nextProgress[pending.client_id];
                        return nextProgress;
                    });
                }
            });
        },
        [pushDraftMutation]
    );

    const cancelUpload = useCallback(
        clientId => {
            const context = contextsByClientIdRef.current.get(clientId);

            if (!context) {
                return;
            }

            cancelledClientIdsRef.current.add(clientId);
            const fileId = fileIdByClientIdRef.current.get(clientId);

            if (fileId && uppyRef.current?.getFile(fileId)) {
                uppyRef.current.removeFile(fileId);
            }

            onRejectRef.current(context.taskId, clientId);
            pushDraftMutation({
                placeholder: context.pending.placeholder,
                replacement: '',
                task_id: context.taskId,
                type: 'replace-placeholder',
            });
            contextsByClientIdRef.current.delete(clientId);
            fileIdByClientIdRef.current.delete(clientId);
            setProgressByClientId(currentProgress => {
                const nextProgress = { ...currentProgress };
                delete nextProgress[clientId];
                return nextProgress;
            });
        },
        [pushDraftMutation]
    );

    const dismissFailedUpload = useCallback(clientId => {
        setFailedUploads(currentFailures =>
            currentFailures.filter(
                failedUpload => failedUpload.client_id !== clientId
            )
        );
    }, []);

    return {
        cancelUpload,
        dismissFailedUpload,
        draftMutations,
        failedUploads,
        progressByClientId,
        pushDraftMutation,
        queueUploads,
    };
}
