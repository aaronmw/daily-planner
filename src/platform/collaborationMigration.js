import { loadCollaborationListKey } from './collaborationIdentityStore';
import {
    deleteCollaborationAttachment,
    uploadCollaborationAttachment,
} from './collaborationAttachments';
import { deleteStoredAttachment, loadLocalAttachment } from './attachments';
import { requireSupabaseClient } from './supabase';

const isCloudAttachment = attachment =>
    attachment?.encrypted && !attachment?.local_encrypted;

const loadLocalAttachmentFile = async attachment => {
    const blob = attachment.local_encrypted
        ? await loadLocalAttachment(attachment)
        : await fetch(attachment.url).then(response => {
              if (!response.ok) {
                  throw new Error(
                      `Could not read ${attachment.filename || 'attachment'} for encrypted import.`
                  );
              }
              return response.blob();
          });
    return new File([blob], attachment.filename || 'attachment', {
        type: attachment.mime_type || blob.type || 'application/octet-stream',
    });
};

const removePartialCloudUpload = async attachmentId => {
    const result = await requireSupabaseClient()
        .from('encrypted_attachment_metadata')
        .select('id,list_id,task_id,chunk_count,key_version,revision')
        .eq('id', attachmentId)
        .maybeSingle();
    if (result.error) throw result.error;
    if (result.data) {
        await deleteCollaborationAttachment({ attachment: result.data });
    }
};

export const migrateLocalAttachmentsToCollaboration = async ({
    identity,
    snapshot,
    syncEntity,
}) => {
    const migratedTasks = [];
    for (const initialTask of snapshot.tasks) {
        let task = initialTask;
        const localAttachments = (task.attachments || []).filter(
            attachment =>
                attachment.status === 'ready' && !isCloudAttachment(attachment)
        );
        for (const localAttachment of localAttachments) {
            const listKey = await loadCollaborationListKey({
                accountKey: identity.accountKey,
                keyVersion: task.key_version,
                listId: task.list_id,
            });
            if (!listKey) {
                throw new Error('The encrypted list key is unavailable.');
            }
            await removePartialCloudUpload(localAttachment.id);
            const file = await loadLocalAttachmentFile(localAttachment);
            const uploaded = await uploadCollaborationAttachment({
                attachmentId: localAttachment.id,
                file,
                keyVersion: task.key_version,
                listId: task.list_id,
                listKey,
                taskId: task.id,
            });
            const remoteAttachment = {
                ...uploaded,
                created_at:
                    localAttachment.created_at || new Date().toISOString(),
                encrypted: true,
                status: 'ready',
                url: `daily-planner-attachment:${uploaded.id}`,
            };
            const nextTask = {
                ...task,
                attachments: (task.attachments || []).map(attachment =>
                    attachment.id === localAttachment.id
                        ? remoteAttachment
                        : attachment
                ),
                notes: String(task.notes || '')
                    .split(localAttachment.url)
                    .join(remoteAttachment.url),
            };
            const synced = await syncEntity({
                base: task,
                entity: nextTask,
                identity,
                recordType: 'task',
            });
            if (synced.conflict) {
                throw new Error(
                    'A task changed while its attachment was being encrypted.'
                );
            }
            task = {
                ...nextTask,
                ...synced.entity,
                collaboration_revision: synced.revision,
            };
            await deleteStoredAttachment(localAttachment);
        }
        migratedTasks.push(task);
    }
    return { ...snapshot, tasks: migratedTasks };
};
