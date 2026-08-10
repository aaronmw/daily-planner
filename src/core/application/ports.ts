import type { ListId, ItemId } from '../domain/ids';
import type { IdentityId } from '../domain/ids';
import type { PlannerCommandId } from './commandIds';
import type {
    PlannerList,
    PlannerPreferences,
    PlannerSnapshot,
    PlannerItem,
} from '../domain/types';
import type { CollaborationSnapshot } from '../collaboration/types';
import type {
    CollaborationComment,
    CollaborationInvitation,
    CollaborationMembership,
    CollaborationProfile,
} from '../collaboration/types';
import type {
    CollaborationCapability,
    CollaborationRole,
} from '../collaboration/roles';
import type { CollaborationConflict } from '../collaboration/types';

export type PlannerMutation =
    | { base: PlannerList | null; entity: PlannerList; type: 'put-list' }
    | { base: PlannerItem | null; entity: PlannerItem; type: 'put-item' }
    | { base: PlannerList; id: ListId; type: 'delete-list' }
    | { base: PlannerItem; id: ItemId; type: 'delete-item' };

export interface QueuedPlannerMutation {
    createdAt: string;
    id: string;
    listId: ListId | null;
    mutation: PlannerMutation;
}

export interface CollaborationPublishResult {
    applied: PlannerMutation[];
    conflicts: CollaborationConflict[];
}

export interface PlannerRepository {
    apply: (
        mutations: readonly PlannerMutation[],
        options?: { enqueueForSync?: boolean }
    ) => Promise<void>;
    deleteOutbox: (ids: readonly string[]) => Promise<void>;
    load: () => Promise<PlannerSnapshot>;
    loadOutbox: (limit?: number) => Promise<QueuedPlannerMutation[]>;
    replace: (snapshot: PlannerSnapshot) => Promise<void>;
}

export interface PreferenceRepository {
    load: () => PlannerPreferences;
    save: (preferences: PlannerPreferences) => void;
}

export interface NotificationGateway {
    disable(): Promise<void>;
    enable(): Promise<void>;
}

export interface PlannerAuthorization {
    canAccessList(listId: ListId, capability: CollaborationCapability): boolean;
}

export interface AttachmentGateway {
    delete: (attachmentId: string) => Promise<void>;
    load: (attachmentId: string) => Promise<Blob>;
    upload: (
        file: File,
        options: {
            attachmentId?: string;
            keyVersion: number;
            listId: ListId;
            onProgress(progress: number): void;
            signal: AbortSignal;
            syncEnabled: boolean;
            itemId: ItemId;
        }
    ) => Promise<{ attachmentKey: string; id: string; url: string }>;
}

export interface PlatformAdapter {
    readonly kind: 'desktop' | 'web';
    openExternal: (url: string) => Promise<void>;
    registerGlobalShortcuts: (
        shortcuts: Readonly<Record<PlannerCommandId, string>>,
        onCommand: (commandId: PlannerCommandId) => void
    ) => Promise<() => void>;
    showPlanner: () => Promise<void>;
}

export interface CollaborationGateway {
    continueAccountWithEmail(email: string): Promise<void>;
    continueAccountWithGoogle(): Promise<void>;
    createComment(options: {
        body: string;
        keyVersion: number;
        listId: ListId;
        memberships: readonly CollaborationMembership[];
        parentCommentId: string | null;
        profiles: readonly CollaborationProfile[];
        itemId: ItemId;
    }): Promise<CollaborationComment>;
    createInvitation(
        listId: ListId,
        role: Exclude<CollaborationRole, 'owner'>
    ): Promise<CollaborationInvitation>;
    connect(options: {
        onError: (error: Error) => void;
        onInvalidate: () => void;
        onPresence: (ids: ReadonlySet<IdentityId>) => void;
        signal: AbortSignal;
    }): Promise<void>;
    disconnect(): Promise<void>;
    deleteComment(comment: CollaborationComment): Promise<void>;
    enableSync(
        snapshot: PlannerSnapshot,
        captchaToken: string
    ): Promise<CollaborationSnapshot>;
    handleAuthCallback(value: string): Promise<void>;
    loadSnapshot(): Promise<CollaborationSnapshot>;
    leaveList(
        listId: ListId,
        membership: CollaborationMembership
    ): Promise<void>;
    markThreadRead(listId: ListId, itemId: ItemId): Promise<void>;
    publish(
        mutations: readonly PlannerMutation[]
    ): Promise<CollaborationPublishResult>;
    recoverSync(
        snapshot: PlannerSnapshot,
        recoveryCode: string
    ): Promise<CollaborationSnapshot>;
    redeemInvitation(invitationUrl: string): Promise<ListId>;
    removeMember(
        listId: ListId,
        member: CollaborationMembership
    ): Promise<void>;
    revokeInvitation(listId: ListId, invitationId: string): Promise<void>;
    setActiveList(listId: ListId | null): Promise<void>;
    signInExistingWithEmail(email: string, captchaToken: string): Promise<void>;
    signInExistingWithGoogle(): Promise<void>;
    transferOwnership(
        listId: ListId,
        newOwner: CollaborationMembership,
        formerOwnerRole: Exclude<CollaborationRole, 'owner'> | null
    ): Promise<void>;
    updateMemberRole(
        listId: ListId,
        member: CollaborationMembership,
        role: Exclude<CollaborationRole, 'owner'>
    ): Promise<void>;
}
