import {
    base64UrlToBytes,
    buildInvitationUrl,
    createPlannerId,
    decryptRecord,
    encryptRecord,
    exportListKey,
    generateListKey,
    parseInvitationUrl,
    unwrapListKey,
    wrapListKey,
    rebaseRecord,
} from '../collaboration';
import {
    deleteCollaborationListKey,
    loadCollaborationIdentity,
    loadCollaborationListKey,
    saveCollaborationListKey,
} from './collaborationIdentityStore';
import {
    removeCollaborationAttachmentSourceAfterMove,
    stageCollaborationAttachmentMove,
} from './collaborationAttachments';
import {
    deleteEncryptedLocalRecord,
    loadEncryptedLocalRecords,
    saveEncryptedLocalRecord,
} from './encryptedPlannerStore';
import { getSupabaseConfiguration, requireSupabaseClient } from './supabase';

const throwOnError = result => {
    if (result.error) throw result.error;
    return result.data;
};

const sha256Hex = async value => {
    const digest = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(value)
    );
    return Array.from(new Uint8Array(digest), byte =>
        byte.toString(16).padStart(2, '0')
    ).join('');
};

const runWithConcurrency = async (items, concurrency, worker) => {
    let nextIndex = 0;
    const results = new Array(items.length);
    const run = async () => {
        while (nextIndex < items.length) {
            const index = nextIndex;
            nextIndex += 1;
            results[index] = await worker(items[index], index);
        }
    };

    await Promise.all(
        Array.from({ length: Math.min(concurrency, items.length) }, run)
    );
    return results;
};

const importExportedListKey = rawKey =>
    crypto.subtle.importKey(
        'raw',
        base64UrlToBytes(rawKey),
        { length: 256, name: 'AES-GCM' },
        true,
        ['encrypt', 'decrypt']
    );

const importPublicIdentityKey = publicKey =>
    crypto.subtle.importKey(
        'spki',
        base64UrlToBytes(publicKey),
        { hash: 'SHA-256', name: 'RSA-OAEP' },
        true,
        ['wrapKey']
    );

const selectAllPages = async (table, pageSize = 500) => {
    const supabase = requireSupabaseClient();
    const rows = [];
    for (let offset = 0; ; offset += pageSize) {
        const page = throwOnError(
            await supabase
                .from(table)
                .select('*')
                .range(offset, offset + pageSize - 1)
        );
        rows.push(...(page || []));
        if (!page || page.length < pageSize) break;
    }
    return rows;
};

const getRecordContext = ({
    keyVersion,
    listId,
    recordId,
    recordType,
    revision,
}) => ({
    keyVersion,
    listId: String(listId),
    recordId: String(recordId),
    recordType,
    revision,
});

const encryptEntity = (listKey, context, entity) =>
    encryptRecord(listKey, context, entity);

const omitKeys = (value, omittedKeys) =>
    Object.fromEntries(
        Object.entries(value).filter(
            ([key]) =>
                !omittedKeys.has(key) && !key.startsWith('collaboration_')
        )
    );

const serializeList = list =>
    omitKeys(
        list,
        new Set([
            'collaboration_content_key_version',
            'isArchived',
            'key_version',
            'owner_identity_id',
        ])
    );
const serializeTask = task =>
    omitKeys(
        task,
        new Set([
            'collaboration_content_key_version',
            'creator_identity_id',
            'isComplete',
            'key_version',
        ])
    );

export const ensureCollaborationSession = async ({ captchaToken } = {}) => {
    const supabase = requireSupabaseClient();
    const sessionResult = await supabase.auth.getSession();
    throwOnError(sessionResult);
    if (sessionResult.data.session) return sessionResult.data.session;
    if (!captchaToken) {
        throw new Error(
            'Complete the security check before enabling encrypted sync.'
        );
    }

    const signInResult = await supabase.auth.signInAnonymously({
        options: { captchaToken },
    });
    throwOnError(signInResult);
    return signInResult.data.session;
};

export const registerCollaborationIdentity = async identity => {
    const supabase = requireSupabaseClient();
    const protectedKey = identity.record.protectedAccountKey;
    return throwOnError(
        await supabase.rpc('register_collaboration_identity', {
            p_account_key_iv: protectedKey?.iv || null,
            p_encrypted_account_key: protectedKey?.ciphertext || null,
            p_encrypted_private_key: identity.record.wrappedPrivateKey,
            p_private_key_iv: 'aes-kw',
            p_public_key: identity.publicKey,
            p_recovery_iv: protectedKey?.iv || null,
            p_recovery_salt: protectedKey?.salt || null,
        })
    );
};

const getProfile = identity => ({
    avatar_seed: identity.record.userId,
    avatar_url: null,
    display_name:
        identity.record.email?.split('@')[0] ||
        `Planner ${identity.record.userId.slice(0, 6)}`,
    former_collaborator: false,
});

const upsertOwnProfile = async ({ identity, keyVersion, listId, listKey }) => {
    const supabase = requireSupabaseClient();
    const existing = throwOnError(
        await supabase
            .from('encrypted_member_profiles')
            .select('revision')
            .eq('list_id', listId)
            .eq('user_id', identity.record.userId)
            .maybeSingle()
    );
    const expectedRevision = existing?.revision || 0;
    const nextRevision = expectedRevision + 1;
    const profileEnvelope = await encryptEntity(
        listKey,
        getRecordContext({
            keyVersion,
            listId,
            recordId: identity.record.userId,
            recordType: 'profile',
            revision: nextRevision,
        }),
        getProfile(identity)
    );
    return throwOnError(
        await supabase.rpc('upsert_encrypted_member_profile', {
            p_ciphertext: profileEnvelope.ciphertext,
            p_expected_revision: expectedRevision,
            p_iv: profileEnvelope.iv,
            p_key_version: keyVersion,
            p_list_id: listId,
        })
    );
};

const importList = async ({ identity, list, tasks }) => {
    const supabase = requireSupabaseClient();
    const listKey = await generateListKey();
    const keyVersion = 1;
    const listEnvelope = await encryptEntity(
        listKey,
        getRecordContext({
            keyVersion,
            listId: list.id,
            recordId: list.id,
            recordType: 'list',
            revision: 1,
        }),
        serializeList(list)
    );
    const publicKey = await importPublicIdentityKey(identity.publicKey);
    const wrappedListKey = await wrapListKey(listKey, publicKey);

    throwOnError(
        await supabase.rpc('create_encrypted_list', {
            p_ciphertext: listEnvelope.ciphertext,
            p_iv: listEnvelope.iv,
            p_list_id: list.id,
            p_wrapped_key: wrappedListKey,
            p_wrapped_key_iv: 'rsa-oaep',
        })
    );
    await saveCollaborationListKey({
        accountKey: identity.accountKey,
        keyVersion,
        listId: list.id,
        listKey,
    });

    await upsertOwnProfile({
        identity,
        keyVersion,
        listId: list.id,
        listKey,
    });

    const taskRevisions = await runWithConcurrency(tasks, 3, async task => {
        const taskEnvelope = await encryptEntity(
            listKey,
            getRecordContext({
                keyVersion,
                listId: list.id,
                recordId: task.id,
                recordType: 'task',
                revision: 1,
            }),
            serializeTask(task)
        );
        throwOnError(
            await supabase.rpc('create_encrypted_task', {
                p_ciphertext: taskEnvelope.ciphertext,
                p_iv: taskEnvelope.iv,
                p_key_version: keyVersion,
                p_list_id: list.id,
                p_task_id: task.id,
            })
        );
        const revision = task.isComplete
            ? throwOnError(
                  await supabase.rpc('set_encrypted_task_deleted', {
                      p_deleted: true,
                      p_expected_revision: 1,
                      p_list_id: list.id,
                      p_task_id: task.id,
                  })
              )
            : 1;
        return { id: task.id, revision };
    });

    const revision = list.isArchived
        ? throwOnError(
              await supabase.rpc('set_encrypted_list_deleted', {
                  p_deleted: true,
                  p_expected_revision: 1,
                  p_list_id: list.id,
              })
          )
        : 1;

    return { keyVersion, listId: list.id, revision, taskRevisions };
};

const loadOrUnwrapListKey = async ({ identity, keyVersion, listId }) => {
    let listKey = await loadCollaborationListKey({
        accountKey: identity.accountKey,
        keyVersion,
        listId,
    });
    if (listKey) return listKey;

    const envelope = throwOnError(
        await requireSupabaseClient()
            .from('list_key_envelopes')
            .select('wrapped_key')
            .eq('list_id', listId)
            .eq('key_version', keyVersion)
            .eq('user_id', identity.record.userId)
            .single()
    );
    listKey = await unwrapListKey(envelope.wrapped_key, identity.privateKey);
    await saveCollaborationListKey({
        accountKey: identity.accountKey,
        keyVersion,
        listId,
        listKey,
    });
    return listKey;
};

export const importPlannerToCollaboration = async ({
    identity,
    lists,
    tasks,
}) => {
    const tasksByListId = new Map();
    tasks.forEach(task => {
        const listTasks = tasksByListId.get(task.list_id) || [];
        listTasks.push(task);
        tasksByListId.set(task.list_id, listTasks);
    });

    const supabase = requireSupabaseClient();
    const [existingLists, existingTasks] = await Promise.all([
        throwOnError(
            await supabase
                .from('encrypted_lists')
                .select('id,current_key_version,deleted_at,revision')
        ),
        throwOnError(
            await supabase
                .from('encrypted_tasks')
                .select('id,list_id,deleted_at,revision')
        ),
    ]);
    const listRowById = new Map(
        (existingLists || []).map(row => [row.id, row])
    );
    const taskRowById = new Map(
        (existingTasks || []).map(row => [row.id, row])
    );

    return runWithConcurrency(lists, 2, async list => {
        const existingList = listRowById.get(list.id);
        const listTasks = tasksByListId.get(list.id) || [];
        if (!existingList) {
            return importList({ identity, list, tasks: listTasks });
        }

        const keyVersion = existingList.current_key_version;
        const listKey = await loadOrUnwrapListKey({
            identity,
            keyVersion,
            listId: list.id,
        });
        await upsertOwnProfile({
            identity,
            keyVersion,
            listId: list.id,
            listKey,
        });
        const listResult = await writeEncryptedEntity({
            base: { isArchived: Boolean(existingList.deleted_at) },
            entity: {
                ...list,
                collaboration_revision: existingList.revision,
                key_version: keyVersion,
            },
            identity,
            recordType: 'list',
        });
        const taskRevisions = await runWithConcurrency(
            listTasks,
            3,
            async task => {
                const existingTask = taskRowById.get(task.id);
                if (!existingTask) {
                    const created = await createCollaborationTask({
                        identity,
                        task: { ...task, key_version: keyVersion },
                    });
                    return { id: task.id, revision: created.revision };
                }
                const updated = await writeEncryptedEntity({
                    base: { isComplete: Boolean(existingTask.deleted_at) },
                    entity: {
                        ...task,
                        collaboration_revision: existingTask.revision,
                        key_version: keyVersion,
                    },
                    identity,
                    recordType: 'task',
                });
                return { id: task.id, revision: updated.revision };
            }
        );

        return {
            keyVersion,
            listId: list.id,
            revision: listResult.revision,
            taskRevisions,
        };
    });
};

export const createCollaborationTask = async ({ identity, task }) => {
    const keyVersion = task.key_version || 1;
    const listKey = await getListKeyForEntity({
        identity,
        keyVersion,
        listId: task.list_id,
    });
    const envelope = await encryptEntity(
        listKey,
        getRecordContext({
            keyVersion,
            listId: task.list_id,
            recordId: task.id,
            recordType: 'task',
            revision: 1,
        }),
        serializeTask(task)
    );
    throwOnError(
        await requireSupabaseClient().rpc('create_encrypted_task', {
            p_ciphertext: envelope.ciphertext,
            p_iv: envelope.iv,
            p_key_version: keyVersion,
            p_list_id: task.list_id,
            p_task_id: task.id,
        })
    );
    return {
        entity: {
            ...task,
            collaboration_content_key_version: keyVersion,
            creator_identity_id: identity.record.userId,
            key_version: keyVersion,
        },
        revision: 1,
    };
};

export const loadCollaborationSnapshot = async () => {
    const identity = await loadCollaborationIdentity();
    if (!identity) return null;

    const [
        listRows,
        memberships,
        envelopes,
        taskRows,
        profileRows,
        commentRows,
        threadReads,
        invitations,
    ] = await Promise.all([
        selectAllPages('encrypted_lists'),
        selectAllPages('list_memberships'),
        selectAllPages('list_key_envelopes'),
        selectAllPages('encrypted_tasks'),
        selectAllPages('encrypted_member_profiles'),
        selectAllPages('encrypted_comments'),
        selectAllPages('thread_reads'),
        selectAllPages('list_invitations'),
    ]);
    const keys = new Map();

    for (const envelope of envelopes) {
        const keyId = `${envelope.list_id}:${envelope.key_version}`;
        const listKey = await loadOrUnwrapListKey({
            identity,
            keyVersion: envelope.key_version,
            listId: envelope.list_id,
        });
        keys.set(keyId, listKey);
    }

    const decryptRow = async (row, recordType, recordId = row.id) => {
        const contentKeyVersion = row.content_key_version || row.key_version;
        const listKey = keys.get(
            `${row.list_id || row.id}:${contentKeyVersion}`
        );
        if (!listKey) throw new Error('A shared list key is unavailable.');
        return decryptRecord(
            listKey,
            getRecordContext({
                keyVersion: contentKeyVersion,
                listId: row.list_id || row.id,
                recordId,
                recordType,
                revision: row.revision,
            }),
            {
                algorithm: 'AES-256-GCM',
                ciphertext: row.ciphertext,
                iv: row.iv,
                keyVersion: contentKeyVersion,
                version: 1,
            }
        );
    };

    const currentKeyVersionByListId = new Map(
        listRows.map(row => [row.id, row.current_key_version])
    );
    const lists = await Promise.all(
        listRows.map(async row => ({
            ...(await decryptRow(row, 'list')),
            collaboration_content_key_version: row.key_version,
            collaboration_revision: row.revision,
            isArchived: Boolean(row.deleted_at),
            key_version: row.current_key_version,
            owner_identity_id: row.owner_id,
        }))
    );
    const tasks = await Promise.all(
        taskRows.map(async row => ({
            ...(await decryptRow(row, 'task')),
            collaboration_content_key_version: row.key_version,
            collaboration_revision: row.revision,
            creator_identity_id: row.creator_id,
            isComplete: Boolean(row.deleted_at),
            key_version:
                currentKeyVersionByListId.get(row.list_id) || row.key_version,
        }))
    );
    const membershipStateByProfileId = new Map(
        memberships.map(member => [
            `${member.list_id}:${member.user_id}`,
            member.state,
        ])
    );
    const profiles = await Promise.all(
        profileRows.map(async row => ({
            ...(await decryptRow(row, 'profile', row.user_id)),
            former_collaborator:
                membershipStateByProfileId.get(
                    `${row.list_id}:${row.user_id}`
                ) === 'removed',
            identity_id: row.user_id,
            list_id: row.list_id,
        }))
    );
    const comments = await Promise.all(
        commentRows
            .filter(row => !row.deleted_at)
            .map(async row => ({
                ...(await decryptRow(row, 'comment')),
                author_id: row.author_id,
                created_at: row.created_at,
                id: row.id,
                list_id: row.list_id,
                parent_comment_id: row.parent_comment_id,
                revision: row.revision,
                task_id: row.task_id,
            }))
    );

    return {
        comments,
        identity,
        invitations,
        lists,
        memberships,
        profiles,
        tasks,
        threadReads,
    };
};

const getListKeyForEntity = async ({ identity, keyVersion, listId }) => {
    const listKey = await loadCollaborationListKey({
        accountKey: identity.accountKey,
        keyVersion,
        listId,
    });
    if (!listKey) throw new Error('The encrypted list key is unavailable.');
    return listKey;
};

const decryptDatabaseRow = async ({ identity, row, recordType }) => {
    const listId = row.list_id || row.id;
    const keyVersion = row.content_key_version || row.key_version;
    const listKey = await getListKeyForEntity({
        identity,
        keyVersion,
        listId,
    });
    return decryptRecord(
        listKey,
        getRecordContext({
            keyVersion,
            listId,
            recordId: row.id,
            recordType,
            revision: row.revision,
        }),
        {
            algorithm: 'AES-256-GCM',
            ciphertext: row.ciphertext,
            iv: row.iv,
            keyVersion,
            version: 1,
        }
    );
};

const readRemoteEntity = async ({ entityId, identity, recordType }) => {
    const table = recordType === 'list' ? 'encrypted_lists' : 'encrypted_tasks';
    const result = await requireSupabaseClient()
        .from(table)
        .select('*')
        .eq('id', entityId)
        .single();
    const row = throwOnError(result);
    const value = await decryptDatabaseRow({ identity, recordType, row });
    return {
        row,
        value: {
            ...value,
            ...(recordType === 'list'
                ? { isArchived: Boolean(row.deleted_at) }
                : { isComplete: Boolean(row.deleted_at) }),
        },
    };
};

const moveEncryptedTask = async ({ base, entity, identity }) => {
    const supabase = requireSupabaseClient();
    const sourceListId = base.list_id;
    const destinationListId = entity.list_id;
    const [destinationResult, commentsResult, attachmentsResult] =
        await Promise.all([
            supabase
                .from('encrypted_lists')
                .select('id,current_key_version')
                .eq('id', destinationListId)
                .single(),
            supabase
                .from('encrypted_comments')
                .select('*')
                .eq('list_id', sourceListId)
                .eq('task_id', entity.id),
            supabase
                .from('encrypted_attachment_metadata')
                .select('*')
                .eq('list_id', sourceListId)
                .eq('task_id', entity.id),
        ]);
    const destination = throwOnError(destinationResult);
    const commentRows = throwOnError(commentsResult) || [];
    const attachmentRows = throwOnError(attachmentsResult) || [];
    const destinationKeyVersion = destination.current_key_version;
    const destinationListKey = await getListKeyForEntity({
        identity,
        keyVersion: destinationKeyVersion,
        listId: destinationListId,
    });
    const movedAttachments = new Map();

    for (const attachment of attachmentRows.filter(row => !row.deleted_at)) {
        const sourceListKey = await getListKeyForEntity({
            identity,
            keyVersion: attachment.key_version,
            listId: sourceListId,
        });
        movedAttachments.set(
            attachment.id,
            await stageCollaborationAttachmentMove({
                attachment,
                destinationKeyVersion,
                destinationListId,
                destinationListKey,
                sourceListKey,
            })
        );
    }

    const movedEntity = {
        ...entity,
        attachments: (entity.attachments || []).map(attachment =>
            movedAttachments.has(attachment.id)
                ? {
                      ...attachment,
                      ...movedAttachments.get(attachment.id),
                      key_version: destinationKeyVersion,
                      list_id: destinationListId,
                  }
                : attachment
        ),
        collaboration_content_key_version: destinationKeyVersion,
        key_version: destinationKeyVersion,
    };
    const expectedRevision = entity.collaboration_revision || 1;
    const taskEnvelope = await encryptEntity(
        destinationListKey,
        getRecordContext({
            keyVersion: destinationKeyVersion,
            listId: destinationListId,
            recordId: entity.id,
            recordType: 'task',
            revision: expectedRevision + 1,
        }),
        serializeTask(movedEntity)
    );
    const movedComments = [];
    const commentEnvelopes = [];
    for (const row of commentRows) {
        const value = await decryptDatabaseRow({
            identity,
            recordType: 'comment',
            row,
        });
        const envelope = await encryptEntity(
            destinationListKey,
            getRecordContext({
                keyVersion: destinationKeyVersion,
                listId: destinationListId,
                recordId: row.id,
                recordType: 'comment',
                revision: row.revision + 1,
            }),
            value
        );
        commentEnvelopes.push({
            ciphertext: envelope.ciphertext,
            expected_revision: row.revision,
            id: row.id,
            iv: envelope.iv,
            key_version: destinationKeyVersion,
        });
        movedComments.push({
            ...value,
            author_id: row.author_id,
            created_at: row.created_at,
            id: row.id,
            list_id: destinationListId,
            parent_comment_id: row.parent_comment_id,
            revision: row.revision + 1,
            task_id: row.task_id,
        });
    }

    const revision = throwOnError(
        await supabase.rpc('move_encrypted_task', {
            p_attachment_ids: attachmentRows.map(row => row.id),
            p_ciphertext: taskEnvelope.ciphertext,
            p_comments: commentEnvelopes,
            p_destination_list_id: destinationListId,
            p_expected_revision: expectedRevision,
            p_iv: taskEnvelope.iv,
            p_key_version: destinationKeyVersion,
            p_source_list_id: sourceListId,
            p_task_id: entity.id,
        })
    );

    await Promise.allSettled(
        attachmentRows
            .filter(row => !row.deleted_at)
            .map(attachment =>
                removeCollaborationAttachmentSourceAfterMove({ attachment })
            )
    );

    return { entity: movedEntity, movedComments, revision };
};

const writeEncryptedEntity = async ({ base, entity, identity, recordType }) => {
    const supabase = requireSupabaseClient();
    const listId = recordType === 'list' ? entity.id : entity.list_id;
    const keyVersion = entity.key_version || 1;
    let expectedRevision = entity.collaboration_revision || 1;
    const deletedField = recordType === 'list' ? 'isArchived' : 'isComplete';
    const wasDeleted = Boolean(base?.[deletedField]);
    const isDeleted = Boolean(entity[deletedField]);
    if (wasDeleted) {
        expectedRevision = throwOnError(
            await supabase.rpc(`set_encrypted_${recordType}_deleted`, {
                p_deleted: false,
                p_expected_revision: expectedRevision,
                p_list_id: listId,
                ...(recordType === 'task' ? { p_task_id: entity.id } : {}),
            })
        );
    }
    const nextRevision = expectedRevision + 1;
    const listKey = await getListKeyForEntity({
        identity,
        keyVersion,
        listId,
    });
    const serialized =
        recordType === 'list' ? serializeList(entity) : serializeTask(entity);
    const envelope = await encryptEntity(
        listKey,
        getRecordContext({
            keyVersion,
            listId,
            recordId: entity.id,
            recordType,
            revision: nextRevision,
        }),
        serialized
    );
    const result = await supabase.rpc(`update_encrypted_${recordType}`, {
        p_ciphertext: envelope.ciphertext,
        p_expected_revision: expectedRevision,
        p_iv: envelope.iv,
        p_key_version: keyVersion,
        p_list_id: listId,
        ...(recordType === 'task' ? { p_task_id: entity.id } : {}),
    });
    const revision = throwOnError(result);

    if (isDeleted) {
        const deleteResult = await supabase.rpc(
            `set_encrypted_${recordType}_deleted`,
            {
                p_deleted: true,
                p_expected_revision: revision,
                p_list_id: listId,
                ...(recordType === 'task' ? { p_task_id: entity.id } : {}),
            }
        );
        return { entity, revision: throwOnError(deleteResult) };
    }

    return { entity: { ...entity, [deletedField]: isDeleted }, revision };
};

export const syncCollaborationEntity = async ({
    base,
    entity,
    identity,
    recordType,
}) => {
    const writeEntity = options =>
        options.recordType === 'task' &&
        options.base?.list_id &&
        options.base.list_id !== options.entity.list_id
            ? moveEncryptedTask(options)
            : writeEncryptedEntity(options);
    try {
        return await writeEntity({
            base,
            entity,
            identity,
            recordType,
        });
    } catch (error) {
        if (error?.code !== '40001') throw error;

        const remote = await readRemoteEntity({
            entityId: entity.id,
            identity,
            recordType,
        });
        if (
            (recordType === 'list' && remote.value.isArchived) ||
            (recordType === 'task' && remote.value.isComplete)
        ) {
            return {
                conflict: {
                    base,
                    kind: 'deleted-while-editing',
                    local: entity,
                    recordType,
                    remote: remote.value,
                    remoteKeyVersion: remote.row.current_key_version,
                    remoteRevision: remote.row.revision,
                },
            };
        }
        const rebased = rebaseRecord({
            base: base || remote.value,
            local: entity,
            remote: remote.value,
        });
        if (!rebased.canAutoMerge) {
            return {
                conflict: {
                    ...rebased,
                    kind: 'field-conflict',
                    local: entity,
                    recordType,
                    remote: remote.value,
                    remoteKeyVersion:
                        remote.row.current_key_version ||
                        entity.key_version ||
                        remote.row.key_version,
                    remoteRevision: remote.row.revision,
                },
            };
        }

        return writeEntity({
            base: remote.value,
            entity: {
                ...rebased.merged,
                collaboration_revision: remote.row.revision,
                key_version:
                    remote.row.current_key_version ||
                    entity.key_version ||
                    remote.row.key_version,
            },
            identity,
            recordType,
        });
    }
};

export const createEncryptedComment = async ({
    body,
    identity,
    listId,
    mentionedUserIds = [],
    parentCommentId = null,
    taskId,
    keyVersion = 1,
}) => {
    const supabase = requireSupabaseClient();
    const commentId = createPlannerId();
    const listKey = await getListKeyForEntity({
        identity,
        keyVersion,
        listId,
    });
    const envelope = await encryptEntity(
        listKey,
        getRecordContext({
            keyVersion,
            listId,
            recordId: commentId,
            recordType: 'comment',
            revision: 1,
        }),
        { body }
    );
    throwOnError(
        await supabase.rpc('create_encrypted_comment', {
            p_ciphertext: envelope.ciphertext,
            p_comment_id: commentId,
            p_iv: envelope.iv,
            p_key_version: keyVersion,
            p_list_id: listId,
            p_mentioned_user_ids: mentionedUserIds,
            p_parent_comment_id: parentCommentId,
            p_task_id: taskId,
        })
    );
    return {
        author_id: identity.record.userId,
        body,
        created_at: new Date().toISOString(),
        id: commentId,
        list_id: listId,
        parent_comment_id: parentCommentId,
        revision: 1,
        task_id: taskId,
    };
};

export const deleteEncryptedComment = async ({ comment, listId }) =>
    throwOnError(
        await requireSupabaseClient().rpc('delete_encrypted_comment', {
            p_comment_id: comment.id,
            p_expected_revision: comment.revision,
            p_list_id: listId,
        })
    );

export const markEncryptedCommentThreadRead = async ({ listId, taskId }) =>
    throwOnError(
        await requireSupabaseClient().rpc('mark_comment_thread_read', {
            p_list_id: listId,
            p_task_id: taskId,
        })
    );

export const createCollaborationInvitation = async ({
    identity,
    keyVersion,
    listId,
    role,
}) => {
    const supabase = requireSupabaseClient();
    const invitationId = createPlannerId();
    const secret = bytesToSecret(crypto.getRandomValues(new Uint8Array(32)));
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    throwOnError(
        await supabase.rpc('create_list_invitation', {
            p_expires_at: expiresAt.toISOString(),
            p_invitation_id: invitationId,
            p_list_id: listId,
            p_role: role,
            p_secret_hash: await sha256Hex(secret),
        })
    );
    const { appUrl } = getSupabaseConfiguration();
    const listKeys = [];
    for (let version = 1; version <= keyVersion; version += 1) {
        const listKey = await loadOrUnwrapListKey({
            identity,
            keyVersion: version,
            listId,
        });
        listKeys.push({
            key: await exportListKey(listKey),
            keyVersion: version,
        });
    }
    return {
        expires_at: expiresAt.toISOString(),
        id: invitationId,
        role,
        url: buildInvitationUrl({
            inviteSecret: `${invitationId}.${secret}`,
            listId,
            listKeys,
            origin: appUrl || window.location.origin,
        }),
    };
};

const bytesToSecret = bytes =>
    Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');

const HANDOFF_RECORD_PREFIX = 'collaboration-handoff:';

const loadPendingIdentityHandoff = async () => {
    const records = await loadEncryptedLocalRecords(HANDOFF_RECORD_PREFIX);
    return (
        records
            .map(record => ({ id: record.id, ...record.value }))
            .filter(record => new Date(record.expiresAt).getTime() > Date.now())
            .sort((left, right) =>
                right.expiresAt.localeCompare(left.expiresAt)
            )[0] || null
    );
};

export const hasPendingCollaborationIdentityHandoff = async () =>
    Boolean(await loadPendingIdentityHandoff());

export const createCollaborationIdentityHandoff = async identity => {
    const supabase = requireSupabaseClient();
    const handoffId = createPlannerId();
    const secret = bytesToSecret(crypto.getRandomValues(new Uint8Array(32)));
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const envelopes = throwOnError(
        await supabase
            .from('list_key_envelopes')
            .select('list_id,key_version')
            .eq('user_id', identity.record.userId)
    );
    const keys = await Promise.all(
        (envelopes || []).map(async envelope => ({
            key: await exportListKey(
                await loadOrUnwrapListKey({
                    identity,
                    keyVersion: envelope.key_version,
                    listId: envelope.list_id,
                })
            ),
            keyVersion: envelope.key_version,
            listId: envelope.list_id,
        }))
    );
    throwOnError(
        await supabase.rpc('create_identity_handoff', {
            p_expires_at: expiresAt.toISOString(),
            p_handoff_id: handoffId,
            p_secret_hash: await sha256Hex(secret),
        })
    );
    const recordId = `${HANDOFF_RECORD_PREFIX}${handoffId}`;
    await saveEncryptedLocalRecord(recordId, {
        expiresAt: expiresAt.toISOString(),
        handoffId,
        keys,
        secret,
    });
    return { expiresAt, handoffId };
};

export const claimPendingCollaborationIdentityHandoff = async identity => {
    const pending = await loadPendingIdentityHandoff();
    if (!pending) return null;
    const publicKey = await importPublicIdentityKey(identity.publicKey);
    const rewrappedKeys = await Promise.all(
        pending.keys.map(async entry => ({
            key_version: entry.keyVersion,
            list_id: entry.listId,
            wrapped_key: await wrapListKey(
                await importExportedListKey(entry.key),
                publicKey
            ),
            wrapped_key_iv: 'rsa-oaep',
        }))
    );
    const currentKeyByListId = new Map();
    pending.keys.forEach(entry => {
        const current = currentKeyByListId.get(entry.listId);
        if (!current || entry.keyVersion > current.keyVersion) {
            currentKeyByListId.set(entry.listId, entry);
        }
    });
    const reencryptedProfiles = await Promise.all(
        Array.from(currentKeyByListId.values()).map(async entry => {
            const profile = await encryptEntity(
                await importExportedListKey(entry.key),
                getRecordContext({
                    keyVersion: entry.keyVersion,
                    listId: entry.listId,
                    recordId: identity.record.userId,
                    recordType: 'profile',
                    revision: 1,
                }),
                getProfile(identity)
            );
            return {
                ciphertext: profile.ciphertext,
                iv: profile.iv,
                key_version: entry.keyVersion,
                list_id: entry.listId,
            };
        })
    );
    const sourceUserId = throwOnError(
        await requireSupabaseClient().rpc('claim_identity_handoff', {
            p_handoff_id: pending.handoffId,
            p_reencrypted_profiles: reencryptedProfiles,
            p_rewrapped_keys: rewrappedKeys,
            p_secret: pending.secret,
        })
    );
    for (const entry of pending.keys) {
        await saveCollaborationListKey({
            accountKey: identity.accountKey,
            keyVersion: entry.keyVersion,
            listId: entry.listId,
            listKey: await importExportedListKey(entry.key),
        });
    }
    await deleteEncryptedLocalRecord(pending.id);
    return sourceUserId;
};

export const revokeCollaborationInvitation = async (listId, invitationId) =>
    throwOnError(
        await requireSupabaseClient().rpc('revoke_list_invitation', {
            p_invitation_id: invitationId,
            p_list_id: listId,
        })
    );

const loadActiveListAccess = async listId => {
    const supabase = requireSupabaseClient();
    const [list, memberships] = await Promise.all([
        throwOnError(
            await supabase
                .from('encrypted_lists')
                .select('id,current_key_version,revision')
                .eq('id', listId)
                .single()
        ),
        throwOnError(
            await supabase
                .from('list_memberships')
                .select('list_id,user_id,role,state,revision')
                .eq('list_id', listId)
                .eq('state', 'active')
        ),
    ]);
    return { list, memberships: memberships || [] };
};

const createMemberKeyEnvelopes = async ({
    excludedUserId = null,
    listId,
    listKey,
    memberships,
}) => {
    const recipients = memberships.filter(
        member => member.user_id !== excludedUserId
    );
    if (!recipients.length) return [];
    const identities = throwOnError(
        await requireSupabaseClient()
            .from('collaboration_identities')
            .select('user_id,public_key')
            .in(
                'user_id',
                recipients.map(member => member.user_id)
            )
    );
    const publicKeyByUserId = new Map(
        (identities || []).map(value => [value.user_id, value.public_key])
    );
    if (publicKeyByUserId.size !== recipients.length) {
        throw new Error('A collaborator public key is unavailable.');
    }

    return Promise.all(
        recipients.map(async member => ({
            user_id: member.user_id,
            wrapped_key: await wrapListKey(
                listKey,
                await importPublicIdentityKey(
                    publicKeyByUserId.get(member.user_id)
                )
            ),
            wrapped_key_iv: 'rsa-oaep',
        }))
    );
};

const prepareListKeyRotation = async ({ excludedUserId, listId }) => {
    const access = await loadActiveListAccess(listId);
    const keyVersion = access.list.current_key_version + 1;
    const listKey = await generateListKey();
    const envelopes = await createMemberKeyEnvelopes({
        excludedUserId,
        listId,
        listKey,
        memberships: access.memberships,
    });
    return { ...access, envelopes, keyVersion, listKey };
};

export const updateCollaborationMemberRole = async ({ listId, member, role }) =>
    throwOnError(
        await requireSupabaseClient().rpc('set_list_member_role', {
            p_expected_revision: member.revision,
            p_list_id: listId,
            p_role: role,
            p_user_id: member.user_id,
        })
    );

export const removeCollaborationMember = async ({
    identity,
    listId,
    member,
}) => {
    const rotation = await prepareListKeyRotation({
        excludedUserId: member.user_id,
        listId,
    });
    const revision = throwOnError(
        await requireSupabaseClient().rpc('remove_list_member', {
            p_envelopes: rotation.envelopes,
            p_expected_list_revision: rotation.list.revision,
            p_expected_member_revision: member.revision,
            p_list_id: listId,
            p_new_key_version: rotation.keyVersion,
            p_user_id: member.user_id,
        })
    );
    await saveCollaborationListKey({
        accountKey: identity.accountKey,
        keyVersion: rotation.keyVersion,
        listId,
        listKey: rotation.listKey,
    });
    return { keyVersion: rotation.keyVersion, revision };
};

export const leaveCollaborationList = async ({ identity, listId }) => {
    const rotation = await prepareListKeyRotation({
        excludedUserId: identity.record.userId,
        listId,
    });
    const member = rotation.memberships.find(
        value => value.user_id === identity.record.userId
    );
    await requireSupabaseClient()
        .rpc('leave_list', {
            p_envelopes: rotation.envelopes,
            p_expected_list_revision: rotation.list.revision,
            p_expected_member_revision: member.revision,
            p_list_id: listId,
            p_new_key_version: rotation.keyVersion,
        })
        .then(throwOnError);
};

export const transferCollaborationOwnership = async ({
    formerOwnerRole,
    identity,
    listId,
    newOwner,
}) => {
    const removesFormerOwner = formerOwnerRole === null;
    const rotation = removesFormerOwner
        ? await prepareListKeyRotation({
              excludedUserId: identity.record.userId,
              listId,
          })
        : await loadActiveListAccess(listId);
    const revision = throwOnError(
        await requireSupabaseClient().rpc('transfer_list_ownership', {
            p_envelopes: removesFormerOwner ? rotation.envelopes : null,
            p_expected_list_revision: rotation.list.revision,
            p_expected_new_owner_revision: newOwner.revision,
            p_former_owner_role: formerOwnerRole,
            p_list_id: listId,
            p_new_key_version: removesFormerOwner ? rotation.keyVersion : null,
            p_new_owner_id: newOwner.user_id,
        })
    );
    return {
        keyVersion: removesFormerOwner
            ? rotation.keyVersion
            : rotation.list.current_key_version,
        revision,
    };
};

export const redeemCollaborationInvitation = async ({
    identity,
    invitationUrl,
}) => {
    const invitation = parseInvitationUrl(invitationUrl);
    if (!invitation) throw new Error('This sharing link is incomplete.');
    const [invitationId, secret] = invitation.inviteSecret.split('.', 2);
    if (!invitationId || !secret) {
        throw new Error('This sharing link is invalid.');
    }
    const exportedKeys = invitation.listKeys || [
        { key: invitation.listKey, keyVersion: 1 },
    ];
    const publicKey = await importPublicIdentityKey(identity.publicKey);
    const importedKeys = await Promise.all(
        exportedKeys.map(async entry => ({
            ...entry,
            listKey: await importExportedListKey(entry.key),
        }))
    );
    const keyEnvelopes = await Promise.all(
        importedKeys.map(async entry => ({
            key_version: entry.keyVersion,
            wrapped_key: await wrapListKey(entry.listKey, publicKey),
            wrapped_key_iv: 'rsa-oaep',
        }))
    );
    const newlySavedKeyVersions = [];
    for (const entry of importedKeys) {
        const existingKey = await loadCollaborationListKey({
            accountKey: identity.accountKey,
            keyVersion: entry.keyVersion,
            listId: invitation.listId,
        });
        if (!existingKey) {
            await saveCollaborationListKey({
                accountKey: identity.accountKey,
                keyVersion: entry.keyVersion,
                listId: invitation.listId,
                listKey: entry.listKey,
            });
            newlySavedKeyVersions.push(entry.keyVersion);
        }
    }

    const supabase = requireSupabaseClient();
    const redemption = await supabase.rpc('redeem_list_invitation', {
        p_invitation_id: invitationId,
        p_key_envelopes: keyEnvelopes,
        p_secret: secret,
    });
    let result;
    if (redemption.error) {
        const membership = await supabase
            .from('list_memberships')
            .select('list_id,role,state')
            .eq('list_id', invitation.listId)
            .eq('user_id', identity.record.userId)
            .eq('state', 'active')
            .maybeSingle();
        if (membership.error || !membership.data) {
            await Promise.all(
                newlySavedKeyVersions.map(keyVersion =>
                    deleteCollaborationListKey({
                        keyVersion,
                        listId: invitation.listId,
                    })
                )
            );
            throw redemption.error;
        }
        for (const keyVersion of newlySavedKeyVersions) {
            await deleteCollaborationListKey({
                keyVersion,
                listId: invitation.listId,
            });
            await loadOrUnwrapListKey({
                identity,
                keyVersion,
                listId: invitation.listId,
            });
        }
        result = {
            key_version: Math.max(
                ...importedKeys.map(entry => entry.keyVersion)
            ),
            list_id: membership.data.list_id,
            member_role: membership.data.role,
        };
    } else {
        result = redemption.data;
    }
    const redeemed = Array.isArray(result) ? result[0] : result;
    return {
        keyVersion: redeemed?.key_version,
        listId: redeemed?.list_id || invitation.listId,
        role: redeemed?.member_role,
    };
};

export { getRecordContext, runWithConcurrency };
