import type { IdentityId, ListId, ItemId } from '../domain/ids';
import type { PlannerSnapshot } from '../domain/types';
import type { PlannerList, PlannerItem } from '../domain/types';
import type { CollaborationRole } from './roles';

export interface CollaborationIdentitySummary {
    email: string | null;
    isAnonymous: boolean;
    userId: IdentityId;
    recoveryCode: string | null;
}

export interface CollaborationMembership {
    joinedAt: string;
    listId: ListId;
    removedAt: string | null;
    revision: number;
    role: CollaborationRole;
    state: 'active' | 'removed';
    updatedAt: string;
    userId: IdentityId;
}

export interface CollaborationProfile {
    avatarSeed: string;
    displayName: string;
    email: string | null;
    isFormerCollaborator: boolean;
    listId: ListId;
    revision: number;
    userId: IdentityId;
}

export interface CollaborationComment {
    authorId: IdentityId;
    body: string;
    createdAt: string;
    deletedAt: string | null;
    id: string;
    listId: ListId;
    parentCommentId: string | null;
    revision: number;
    itemId: ItemId;
    updatedAt: string;
}

export interface CollaborationThreadRead {
    lastReadAt: string;
    listId: ListId;
    itemId: ItemId;
    userId: IdentityId;
}

export interface CollaborationInvitation {
    createdAt: string;
    expiresAt: string;
    id: string;
    listId: ListId;
    role: Exclude<CollaborationRole, 'owner'>;
    revokedAt: string | null;
    url: string | null;
    usedAt: string | null;
}

export interface CollaborationSnapshot {
    comments: CollaborationComment[];
    identity: CollaborationIdentitySummary;
    invitations: CollaborationInvitation[];
    memberships: CollaborationMembership[];
    planner: PlannerSnapshot;
    profiles: CollaborationProfile[];
    threadReads: CollaborationThreadRead[];
}

export type CollaborationConflict =
    | {
          entityId: string;
          entityType: 'list' | 'item';
          id: string;
          local: PlannerList | PlannerItem;
          remote: PlannerList | PlannerItem;
          status: 'field-conflict';
      }
    | {
          entityId: string;
          entityType: 'list' | 'item';
          id: string;
          local: PlannerList | PlannerItem;
          status: 'deleted-remotely';
      };
