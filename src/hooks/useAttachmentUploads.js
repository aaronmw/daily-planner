import Uppy from '@uppy/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    uploadDesktopAttachment,
    uploadWebAttachment,
} from '../platform/attachments';
import { uploadCollaborationAttachment } from '../platform/collaborationAttachments';
import { isDesktopRuntime } from '../platform/runtime';
import { buildAttachmentMarkdown } from '../utils/attachments';

const DESKTOP_UPLOAD_LIMIT = 3;

const percentageForProgress = progress => {
    if (!progress?.bytesTotal) {
        return 0;
    }

    return Math.min(
        100,
        Math.round((progress.bytesUploaded / progress.bytesTotal) * 100)
    );
};

export default function useAttachmentUploads({
    collaborationUpload,
    onReject,
    onResolve,
}) {
    const [draftMutations, setDraftMutations] = useState([]);
    const [failedUploads, setFailedUploads] = useState([]);
    const [progressByClientId, setProgressByClientId] = useState({});
    const uppyRef = useRef(null);
    const desktopEnqueueRef = useRef(null);
    const desktopCancelRef = useRef(null);
    const contextsByClientIdRef = useRef(new Map());
    const fileIdByClientIdRef = useRef(new Map());
    const cancelledClientIdsRef = useRef(new Set());
    const mutationIdRef = useRef(0);
    const onRejectRef = useRef(onReject);
    const onResolveRef = useRef(onResolve);
    const collaborationUploadRef = useRef(collaborationUpload);

    useEffect(() => {
        onRejectRef.current = onReject;
        onResolveRef.current = onResolve;
        collaborationUploadRef.current = collaborationUpload;
    }, [collaborationUpload, onReject, onResolve]);

    useEffect(() => {
        const uppy = new Uppy({
            allowMultipleUploadBatches: true,
            autoProceed: false,
            restrictions: {},
        });
        uppyRef.current = uppy;
        return () => {
            uppyRef.current = null;
            uppy.destroy();
        };
    }, []);

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
        const removeProgress = clientId => {
            setProgressByClientId(currentProgress => {
                const nextProgress = { ...currentProgress };
                delete nextProgress[clientId];
                return nextProgress;
            });
        };
        const cleanUpload = clientId => {
            const fileId = fileIdByClientIdRef.current.get(clientId);
            if (fileId && uppyRef.current?.getFile(fileId)) {
                uppyRef.current.removeFile(fileId);
            }
            contextsByClientIdRef.current.delete(clientId);
            fileIdByClientIdRef.current.delete(clientId);
            cancelledClientIdsRef.current.delete(clientId);
            removeProgress(clientId);
        };
        const resolveUpload = (clientId, metadata) => {
            const context = contextsByClientIdRef.current.get(clientId);

            if (!context || cancelledClientIdsRef.current.has(clientId)) {
                return;
            }

            const readyAttachment = {
                ...metadata,
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
        };
        const rejectUpload = (clientId, error) => {
            const context = contextsByClientIdRef.current.get(clientId);

            if (!context || cancelledClientIdsRef.current.has(clientId)) {
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
        };

        if (collaborationUpload?.enabled) {
            const abortControllers = new Map();
            let activeUploadCount = 0;
            let isDisposed = false;
            let queuedClientIds = [];

            const pumpQueue = () => {
                while (
                    !isDisposed &&
                    activeUploadCount < DESKTOP_UPLOAD_LIMIT &&
                    queuedClientIds.length
                ) {
                    const clientId = queuedClientIds.shift();
                    const context = contextsByClientIdRef.current.get(clientId);
                    if (!context) continue;
                    const controller = new AbortController();
                    abortControllers.set(clientId, controller);
                    activeUploadCount += 1;

                    Promise.resolve(
                        collaborationUploadRef.current.getContext(
                            context.taskId
                        )
                    )
                        .then(uploadContext =>
                            uploadCollaborationAttachment({
                                ...uploadContext,
                                attachmentId: context.pending.client_id,
                                file: context.file,
                                onProgress: progress => {
                                    setProgressByClientId(current => ({
                                        ...current,
                                        [clientId]: percentageForProgress({
                                            bytesTotal: progress.bytesTotal,
                                            bytesUploaded:
                                                progress.bytesUploaded,
                                        }),
                                    }));
                                },
                                signal: controller.signal,
                                taskId: context.taskId,
                            })
                        )
                        .then(metadata =>
                            resolveUpload(clientId, {
                                ...metadata,
                                encrypted: true,
                                url: `daily-planner-attachment:${metadata.id}`,
                            })
                        )
                        .catch(error => rejectUpload(clientId, error))
                        .finally(() => {
                            abortControllers.delete(clientId);
                            activeUploadCount -= 1;
                            cleanUpload(clientId);
                            pumpQueue();
                        });
                }
            };

            desktopEnqueueRef.current = clientIds => {
                queuedClientIds = queuedClientIds.concat(clientIds);
                pumpQueue();
            };
            desktopCancelRef.current = clientId => {
                const context = contextsByClientIdRef.current.get(clientId);
                if (!context) return;
                cancelledClientIdsRef.current.add(clientId);
                queuedClientIds = queuedClientIds.filter(id => id !== clientId);
                abortControllers.get(clientId)?.abort();
                onRejectRef.current(context.taskId, clientId);
                pushDraftMutation({
                    placeholder: context.pending.placeholder,
                    replacement: '',
                    task_id: context.taskId,
                    type: 'replace-placeholder',
                });
                cleanUpload(clientId);
            };

            return () => {
                isDisposed = true;
                abortControllers.forEach(controller => controller.abort());
                queuedClientIds = [];
                abortControllers.clear();
                desktopEnqueueRef.current = null;
                desktopCancelRef.current = null;
            };
        }

        {
            const uploadLocalAttachment = isDesktopRuntime()
                ? uploadDesktopAttachment
                : uploadWebAttachment;
            const abortControllers = new Map();
            let activeUploadCount = 0;
            let isDisposed = false;
            let queuedClientIds = [];

            const pumpQueue = () => {
                while (
                    !isDisposed &&
                    activeUploadCount < DESKTOP_UPLOAD_LIMIT &&
                    queuedClientIds.length
                ) {
                    const clientId = queuedClientIds.shift();
                    const context = contextsByClientIdRef.current.get(clientId);

                    if (!context) {
                        continue;
                    }

                    const controller = new AbortController();
                    abortControllers.set(clientId, controller);
                    activeUploadCount += 1;

                    uploadLocalAttachment(context.file, {
                        onProgress: progress => {
                            setProgressByClientId(currentProgress => ({
                                ...currentProgress,
                                [clientId]: percentageForProgress(progress),
                            }));
                        },
                        signal: controller.signal,
                    })
                        .then(metadata => resolveUpload(clientId, metadata))
                        .catch(error => rejectUpload(clientId, error))
                        .finally(() => {
                            abortControllers.delete(clientId);
                            activeUploadCount -= 1;
                            cleanUpload(clientId);
                            pumpQueue();
                        });
                }
            };

            desktopEnqueueRef.current = clientIds => {
                queuedClientIds = queuedClientIds.concat(clientIds);
                pumpQueue();
            };
            desktopCancelRef.current = clientId => {
                const context = contextsByClientIdRef.current.get(clientId);

                if (!context) {
                    return;
                }

                cancelledClientIdsRef.current.add(clientId);
                queuedClientIds = queuedClientIds.filter(
                    queuedClientId => queuedClientId !== clientId
                );
                abortControllers.get(clientId)?.abort();
                onRejectRef.current(context.taskId, clientId);
                pushDraftMutation({
                    placeholder: context.pending.placeholder,
                    replacement: '',
                    task_id: context.taskId,
                    type: 'replace-placeholder',
                });
                cleanUpload(clientId);
            };

            return () => {
                isDisposed = true;
                queuedClientIds.forEach(clientId => {
                    contextsByClientIdRef.current.delete(clientId);
                    cancelledClientIdsRef.current.add(clientId);
                });
                abortControllers.forEach((controller, clientId) => {
                    contextsByClientIdRef.current.delete(clientId);
                    cancelledClientIdsRef.current.add(clientId);
                    controller.abort();
                });
                queuedClientIds = [];
                abortControllers.clear();
                desktopEnqueueRef.current = null;
                desktopCancelRef.current = null;
            };
        }
    }, [collaborationUpload?.enabled, pushDraftMutation]);

    const rejectBeforeQueue = useCallback(
        (taskId, pending, errorMessage) => {
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
                    error: errorMessage,
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
        },
        [pushDraftMutation]
    );

    const queueUploads = useCallback(
        (taskId, uploadEntries) => {
            uploadEntries.forEach(({ file, pending }) => {
                let fileId;
                try {
                    fileId = uppyRef.current?.addFile({
                        data: file,
                        meta: {
                            client_id: pending.client_id,
                            task_id: String(taskId),
                        },
                        name: pending.filename,
                        size: pending.byte_size,
                        source: 'clipboard',
                        type: pending.mime_type,
                    });
                } catch (error) {
                    rejectBeforeQueue(
                        taskId,
                        pending,
                        error?.message || 'Upload failed.'
                    );
                    return;
                }
                if (fileId) {
                    fileIdByClientIdRef.current.set(pending.client_id, fileId);
                }
                contextsByClientIdRef.current.set(pending.client_id, {
                    file,
                    pending,
                    taskId,
                });
                setProgressByClientId(currentProgress => ({
                    ...currentProgress,
                    [pending.client_id]: 0,
                }));
            });

            if (desktopEnqueueRef.current) {
                desktopEnqueueRef.current(
                    uploadEntries.map(entry => entry.pending.client_id)
                );
            } else {
                uploadEntries.forEach(({ pending }) =>
                    rejectBeforeQueue(
                        taskId,
                        pending,
                        'Encrypted attachment storage is not ready.'
                    )
                );
            }
        },
        [rejectBeforeQueue]
    );

    const cancelUpload = useCallback(
        clientId => {
            if (desktopCancelRef.current) {
                desktopCancelRef.current(clientId);
                return;
            }

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
