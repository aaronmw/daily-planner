import { useEffect, useRef, useState } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import type { PlannerItem, ItemAttachment } from '../../core/domain/types';
import { attachmentIdSchema } from '../../core/domain/ids';
import { usePlannerCommands } from '../../core/application/plannerContext';
import { usePlannerSelector } from '../../core/store/plannerContext';
import { EditableText } from '../editor/EditableText';
import {
    attachmentMarkdown,
    insertUploadPlaceholders,
    removeAttachmentMarkdown,
    removeUploadPlaceholder,
    replaceUploadPlaceholder,
    uploadPlaceholder,
} from '../attachments/attachmentMarkdown';
import { attachmentUploadManager } from '../attachments/attachmentUploadManager';
import { EncryptedAttachmentImage } from '../attachments/EncryptedAttachmentContent';
import {
    attachmentIdFromUrl,
    openEncryptedAttachment,
} from '../attachments/encryptedAttachmentUrl';
import { AdaptiveAttachmentGateway } from '../../platform/persistence/adaptiveAttachmentGateway';
import { IconButton } from '../shell/IconButton';

const markdownComponents: Components = {
    a: ({ children, href = '' }) =>
        attachmentIdFromUrl(href) ? (
            <button
                className="underline"
                onClick={() => void openEncryptedAttachment(href)}
                type="button"
            >
                {children}
            </button>
        ) : (
            <a href={href} rel="noreferrer" target="_blank">
                {children}
            </a>
        ),
    img: ({ alt = '', src = '' }) =>
        attachmentIdFromUrl(src) ? (
            <EncryptedAttachmentImage alt={alt} url={src} />
        ) : (
            <img alt={alt} src={src} />
        ),
};

const attachmentGateway = new AdaptiveAttachmentGateway();

export function ItemNotesEditor({
    focusAssistEnabled,
    highlightIncompleteSentencesEnabled,
    isEditable,
    item,
}: {
    focusAssistEnabled: boolean;
    highlightIncompleteSentencesEnabled: boolean;
    isEditable: boolean;
    item: PlannerItem;
}) {
    const commands = usePlannerCommands();
    const syncEnabled = usePlannerSelector(
        state => state.preferences.syncEnabled
    );
    const [draft, setDraft] = useState(item.notes);
    const [armedClientId, setArmedClientId] = useState<string | null>(null);
    const draftRef = useRef(draft);
    const timerRef = useRef<number | null>(null);

    const commitDraft = (next: string) => {
        if (timerRef.current !== null) window.clearTimeout(timerRef.current);
        timerRef.current = null;
        draftRef.current = next;
        setDraft(next);
        void commands.updateItem(item.id, { notes: next });
    };

    useEffect(
        () => () => {
            if (timerRef.current !== null) {
                window.clearTimeout(timerRef.current);
                void commands.updateItem(item.id, { notes: draftRef.current });
            }
        },
        [commands, item.id]
    );

    return (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <EditableText
                ariaLabel="Item notes"
                className="planner-item-notes-editor min-h-[200px] min-w-0 flex-1 text-[1rem] leading-[1.6]"
                draftValue={draft}
                focusAssistEnabled={focusAssistEnabled}
                highlightIncompleteSentencesEnabled={
                    highlightIncompleteSentencesEnabled
                }
                isEditable={isEditable}
                mode="prose"
                multiline
                onDraftValueChange={next => {
                    draftRef.current = next;
                    setDraft(next);
                    if (timerRef.current !== null)
                        window.clearTimeout(timerRef.current);
                    timerRef.current = window.setTimeout(
                        () => commitDraft(draftRef.current),
                        300
                    );
                }}
                onPasteFiles={(files, context) => {
                    const pending = files.map(file => {
                        const clientId = crypto.randomUUID();
                        return {
                            attachment: {
                                byteSize: file.size,
                                clientId,
                                filename: file.name || 'attachment',
                                mimeType:
                                    file.type || 'application/octet-stream',
                                placeholderToken: uploadPlaceholder(clientId),
                                progress: 0,
                                status: 'uploading',
                            } satisfies ItemAttachment,
                            file,
                        };
                    });
                    const result = insertUploadPlaceholders(
                        context.text,
                        context.selection,
                        pending.map(item => item.attachment.placeholderToken)
                    );
                    commitDraft(result.text);
                    void commands.updateItemWith(item.id, current => ({
                        attachments: [
                            ...current.attachments,
                            ...pending.map(item => item.attachment),
                        ],
                        notes: result.text,
                    }));
                    pending.forEach(({ attachment, file }) => {
                        const placeholder = attachment.placeholderToken;
                        void attachmentUploadManager
                            .enqueue(file, {
                                clientId: attachment.clientId,
                                keyVersion: item.keyVersion,
                                listId: item.listId,
                                onProgress: progress => {
                                    void commands.updateItemWith(
                                        item.id,
                                        current => ({
                                            attachments:
                                                current.attachments.map(item =>
                                                    item.clientId ===
                                                        attachment.clientId &&
                                                    item.status === 'uploading'
                                                        ? { ...item, progress }
                                                        : item
                                                ),
                                        })
                                    );
                                },
                                syncEnabled,
                                itemId: item.id,
                            })
                            .then(result => {
                                const markdown = attachmentMarkdown({
                                    filename: attachment.filename,
                                    mimeType: attachment.mimeType,
                                    url: result.url,
                                });
                                const nextDraft = replaceUploadPlaceholder(
                                    draftRef.current,
                                    placeholder,
                                    markdown
                                );
                                commitDraft(nextDraft);
                                void commands.updateItemWith(
                                    item.id,
                                    current => ({
                                        attachments: current.attachments.map(
                                            item =>
                                                item.clientId ===
                                                attachment.clientId
                                                    ? {
                                                          ...attachment,
                                                          attachmentKey:
                                                              result.attachmentKey,
                                                          createdAt:
                                                              new Date().toISOString(),
                                                          id: attachmentIdSchema.parse(
                                                              result.id
                                                          ),
                                                          markdown,
                                                          status: 'ready',
                                                          url: result.url,
                                                      }
                                                    : item
                                        ),
                                        notes: replaceUploadPlaceholder(
                                            current.notes,
                                            placeholder,
                                            markdown
                                        ),
                                    })
                                );
                            })
                            .catch(error => {
                                const nextDraft = removeUploadPlaceholder(
                                    draftRef.current,
                                    placeholder
                                );
                                commitDraft(nextDraft);
                                void commands.updateItemWith(
                                    item.id,
                                    current => ({
                                        attachments: current.attachments.map(
                                            item =>
                                                item.clientId ===
                                                attachment.clientId
                                                    ? {
                                                          ...attachment,
                                                          error:
                                                              error instanceof
                                                              Error
                                                                  ? error.message
                                                                  : 'Upload failed',
                                                          status: 'failed',
                                                      }
                                                    : item
                                        ),
                                        notes: removeUploadPlaceholder(
                                            current.notes,
                                            placeholder
                                        ),
                                    })
                                );
                            });
                    });
                    return result;
                }}
                onSave={commitDraft}
                placeholder="…notes?"
                render={value => (
                    <div className="markdown">
                        <ReactMarkdown components={markdownComponents}>
                            {value}
                        </ReactMarkdown>
                    </div>
                )}
                value={item.notes}
            />
            {item.attachments.length > 0 && (
                <div className="mt-4 max-h-[188px] shrink-0 overflow-auto border-[length:var(--planner-stroke-width)] border-planner-border">
                    {item.attachments.map(attachment => {
                        const armed = armedClientId === attachment.clientId;
                        const remove = async () => {
                            if (attachment.status === 'uploading') {
                                attachmentUploadManager.cancel(
                                    attachment.clientId
                                );
                            } else if (attachment.status === 'ready') {
                                await attachmentGateway.delete(attachment.id);
                            }
                            const nextDraft =
                                attachment.status === 'ready'
                                    ? removeAttachmentMarkdown(
                                          draftRef.current,
                                          attachment.url
                                      )
                                    : removeUploadPlaceholder(
                                          draftRef.current,
                                          attachment.placeholderToken
                                      );
                            commitDraft(nextDraft);
                            await commands.updateItemWith(item.id, current => ({
                                attachments: current.attachments.filter(
                                    item =>
                                        item.clientId !== attachment.clientId
                                ),
                                notes:
                                    attachment.status === 'ready'
                                        ? removeAttachmentMarkdown(
                                              current.notes,
                                              attachment.url
                                          )
                                        : removeUploadPlaceholder(
                                              current.notes,
                                              attachment.placeholderToken
                                          ),
                            }));
                        };
                        return (
                            <div
                                aria-busy={
                                    attachment.status === 'uploading' ||
                                    undefined
                                }
                                className="grid min-h-[45px] grid-cols-[45px_minmax(0,1fr)_45px] items-center border-b-[length:var(--planner-stroke-width)] border-planner-border last:border-b-0"
                                key={attachment.clientId}
                            >
                                <span className="grid size-[45px] place-items-center">
                                    <i
                                        aria-hidden="true"
                                        className={`fa-solid ${attachment.status === 'uploading' ? 'fa-spinner planner-spin' : 'fa-paperclip'}`}
                                    />
                                </span>
                                {attachment.status === 'ready' ? (
                                    <button
                                        className="min-w-0 truncate pr-3 text-left underline"
                                        onClick={() =>
                                            void openEncryptedAttachment(
                                                attachment.url
                                            )
                                        }
                                        type="button"
                                    >
                                        {attachment.filename}
                                    </button>
                                ) : (
                                    <span className="min-w-0 truncate pr-3">
                                        {attachment.filename}
                                        {attachment.status === 'uploading' && (
                                            <span className="ml-2 text-planner-text-faded">
                                                {Math.round(
                                                    attachment.progress * 100
                                                )}
                                                %
                                            </span>
                                        )}
                                    </span>
                                )}
                                {isEditable ? (
                                    <IconButton
                                        className={
                                            armed
                                                ? 'bg-planner-danger text-white'
                                                : ''
                                        }
                                        icon="trash"
                                        label={
                                            armed
                                                ? `Remove ${attachment.filename}; click again`
                                                : `Remove ${attachment.filename}`
                                        }
                                        onBlur={() => setArmedClientId(null)}
                                        onClick={() => {
                                            if (!armed) {
                                                setArmedClientId(
                                                    attachment.clientId
                                                );
                                                return;
                                            }
                                            setArmedClientId(null);
                                            void remove();
                                        }}
                                        onPointerLeave={() =>
                                            setArmedClientId(null)
                                        }
                                    />
                                ) : (
                                    <span />
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
