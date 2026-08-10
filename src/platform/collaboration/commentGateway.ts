import type {
    CollaborationComment,
    CollaborationMembership,
    CollaborationProfile,
} from '../../core/collaboration/types';
import type { IdentityId, ListId, ItemId } from '../../core/domain/ids';
import { encryptCollaborationRecord } from './crypto';
import type { CollaborationIdentity } from './identityStore';
import { type CollaborationRecordGateway } from './recordGateway';
import { requireSupabaseClient } from './supabaseClient';

const dataOrThrow = <Value>(result: {
    data: Value;
    error: Error | null;
}): Value => {
    if (result.error) throw result.error;
    return result.data;
};

export class CollaborationCommentGateway {
    readonly #records: CollaborationRecordGateway;

    constructor(records: CollaborationRecordGateway) {
        this.#records = records;
    }

    async createComment(
        identity: CollaborationIdentity,
        options: {
            body: string;
            keyVersion: number;
            listId: ListId;
            memberships: readonly CollaborationMembership[];
            parentCommentId: string | null;
            profiles: readonly CollaborationProfile[];
            itemId: ItemId;
        }
    ): Promise<CollaborationComment> {
        const id = crypto.randomUUID();
        const key = await this.#records.loadListKey(
            identity,
            options.listId,
            options.keyVersion
        );
        const envelope = await encryptCollaborationRecord(
            key,
            {
                keyVersion: options.keyVersion,
                listId: options.listId,
                recordId: id,
                recordType: 'comment',
                revision: 1,
            },
            { body: options.body }
        );
        const profileByUserId = new Map(
            options.profiles.map(profile => [profile.userId, profile])
        );
        const mentionedUserIds: IdentityId[] = [];
        for (const member of options.memberships) {
            const displayName = profileByUserId.get(member.userId)?.displayName;
            if (
                member.state === 'active' &&
                displayName &&
                options.body.includes(`@${displayName}`)
            ) {
                mentionedUserIds.push(member.userId);
            }
        }
        dataOrThrow(
            await requireSupabaseClient().rpc('create_encrypted_comment', {
                p_ciphertext: envelope.ciphertext,
                p_comment_id: id,
                p_iv: envelope.iv,
                p_key_version: options.keyVersion,
                p_list_id: options.listId,
                p_mentioned_user_ids: mentionedUserIds,
                p_parent_comment_id: options.parentCommentId,
                p_item_id: options.itemId,
            })
        );
        const now = new Date().toISOString();
        return {
            authorId: identity.record.userId,
            body: options.body,
            createdAt: now,
            deletedAt: null,
            id,
            listId: options.listId,
            parentCommentId: options.parentCommentId,
            revision: 1,
            itemId: options.itemId,
            updatedAt: now,
        };
    }

    async deleteComment(comment: CollaborationComment): Promise<void> {
        dataOrThrow(
            await requireSupabaseClient().rpc('delete_encrypted_comment', {
                p_comment_id: comment.id,
                p_expected_revision: comment.revision,
                p_list_id: comment.listId,
            })
        );
    }

    async markThreadRead(listId: ListId, itemId: ItemId): Promise<void> {
        dataOrThrow(
            await requireSupabaseClient().rpc('mark_comment_thread_read', {
                p_list_id: listId,
                p_item_id: itemId,
            })
        );
    }
}
