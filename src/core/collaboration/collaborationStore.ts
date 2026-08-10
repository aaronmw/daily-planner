import { createStore } from 'zustand/vanilla';
import type { IdentityId, ListId, ItemId } from '../domain/ids';
import type {
    CollaborationComment,
    CollaborationConflict,
    CollaborationInvitation,
    CollaborationMembership,
    CollaborationProfile,
    CollaborationSnapshot,
} from './types';

export interface CollaborationStoreState {
    commentsByItemId: Map<ItemId, CollaborationComment[]>;
    conflicts: CollaborationConflict[];
    identityId: IdentityId | null;
    identityEmail: string | null;
    identityIsAnonymous: boolean;
    recoveryCode: string | null;
    invitationsByListId: Map<ListId, CollaborationInvitation[]>;
    membershipsByListId: Map<ListId, CollaborationMembership[]>;
    pendingInvitationUrl: string | null;
    profilesByListId: Map<ListId, Map<IdentityId, CollaborationProfile>>;
    unreadCountByItemId: Map<ItemId, number>;
    applySnapshot: (snapshot: CollaborationSnapshot) => void;
    removeComment: (id: string, itemId: ItemId) => void;
    removeInvitation: (id: string, listId: ListId) => void;
    setConflicts: (conflicts: CollaborationConflict[]) => void;
    setPendingInvitationUrl: (value: string | null) => void;
    upsertComment: (comment: CollaborationComment) => void;
    upsertInvitation: (invitation: CollaborationInvitation) => void;
}

const groupBy = <Value, Key>(
    values: readonly Value[],
    keyFor: (value: Value) => Key
): Map<Key, Value[]> => {
    const groups = new Map<Key, Value[]>();
    values.forEach(value => {
        const key = keyFor(value);
        const group = groups.get(key) ?? [];
        group.push(value);
        groups.set(key, group);
    });
    return groups;
};

export const createCollaborationStore = () =>
    createStore<CollaborationStoreState>((set, get) => ({
        commentsByItemId: new Map(),
        conflicts: [],
        identityId: null,
        identityEmail: null,
        identityIsAnonymous: true,
        invitationsByListId: new Map(),
        membershipsByListId: new Map(),
        pendingInvitationUrl: null,
        profilesByListId: new Map(),
        recoveryCode: null,
        unreadCountByItemId: new Map(),
        applySnapshot: snapshot => {
            const profilesByListId = new Map<
                ListId,
                Map<IdentityId, CollaborationProfile>
            >();
            snapshot.profiles.forEach(profile => {
                const profiles =
                    profilesByListId.get(profile.listId) ??
                    new Map<IdentityId, CollaborationProfile>();
                profiles.set(profile.userId, profile);
                profilesByListId.set(profile.listId, profiles);
            });
            const latestReadByItemId = new Map<ItemId, string>();
            for (const read of snapshot.threadReads) {
                if (read.userId === snapshot.identity.userId)
                    latestReadByItemId.set(read.itemId, read.lastReadAt);
            }
            const unreadCountByItemId = new Map<ItemId, number>();
            snapshot.comments.forEach(comment => {
                if (comment.deletedAt) return;
                const lastRead = latestReadByItemId.get(comment.itemId);
                if (!lastRead || comment.createdAt > lastRead) {
                    unreadCountByItemId.set(
                        comment.itemId,
                        (unreadCountByItemId.get(comment.itemId) ?? 0) + 1
                    );
                }
            });
            const existingInvitations = get().invitationsByListId;
            const invitations = snapshot.invitations.map(invitation => ({
                ...invitation,
                url:
                    existingInvitations
                        .get(invitation.listId)
                        ?.find(candidate => candidate.id === invitation.id)
                        ?.url ?? invitation.url,
            }));
            set({
                commentsByItemId: groupBy(
                    snapshot.comments,
                    comment => comment.itemId
                ),
                identityId: snapshot.identity.userId,
                identityEmail: snapshot.identity.email,
                identityIsAnonymous: snapshot.identity.isAnonymous,
                invitationsByListId: groupBy(
                    invitations.filter(
                        invitation =>
                            !invitation.revokedAt &&
                            !invitation.usedAt &&
                            invitation.expiresAt > new Date().toISOString()
                    ),
                    invitation => invitation.listId
                ),
                membershipsByListId: groupBy(
                    snapshot.memberships,
                    membership => membership.listId
                ),
                profilesByListId,
                recoveryCode:
                    snapshot.identity.recoveryCode ?? get().recoveryCode,
                unreadCountByItemId,
            });
        },
        removeComment: (id, itemId) => {
            const commentsByItemId = new Map(get().commentsByItemId);
            commentsByItemId.set(
                itemId,
                (commentsByItemId.get(itemId) ?? []).filter(
                    comment => comment.id !== id
                )
            );
            set({ commentsByItemId });
        },
        removeInvitation: (id, listId) => {
            const invitationsByListId = new Map(get().invitationsByListId);
            invitationsByListId.set(
                listId,
                (invitationsByListId.get(listId) ?? []).filter(
                    invitation => invitation.id !== id
                )
            );
            set({ invitationsByListId });
        },
        setConflicts: conflicts => set({ conflicts }),
        setPendingInvitationUrl: pendingInvitationUrl =>
            set({ pendingInvitationUrl }),
        upsertComment: comment => {
            const commentsByItemId = new Map(get().commentsByItemId);
            const comments = commentsByItemId.get(comment.itemId) ?? [];
            commentsByItemId.set(comment.itemId, [
                ...comments.filter(value => value.id !== comment.id),
                comment,
            ]);
            set({ commentsByItemId });
        },
        upsertInvitation: invitation => {
            const invitationsByListId = new Map(get().invitationsByListId);
            const invitations =
                invitationsByListId.get(invitation.listId) ?? [];
            invitationsByListId.set(invitation.listId, [
                ...invitations.filter(value => value.id !== invitation.id),
                invitation,
            ]);
            set({ invitationsByListId });
        },
    }));

export type CollaborationStore = ReturnType<typeof createCollaborationStore>;
