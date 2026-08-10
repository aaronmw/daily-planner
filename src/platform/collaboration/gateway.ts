import type { CollaborationGateway } from '../../core/application/ports';
import type { IdentityId, ListId } from '../../core/domain/ids';
import type { PlannerMutation } from '../../core/application/ports';
import type { PlannerSnapshot } from '../../core/domain/types';
import type { CollaborationSnapshot } from '../../core/collaboration/types';
import type {
    CollaborationComment,
    CollaborationMembership,
    CollaborationProfile,
} from '../../core/collaboration/types';
import type { CollaborationRole } from '../../core/collaboration/roles';
import type { ItemId } from '../../core/domain/ids';
import { CollaborationAuthGateway } from './authGateway';
import type { CollaborationIdentity } from './identityStore';
import { CollaborationRealtimeGateway } from './realtimeGateway';
import { CollaborationRecordGateway } from './recordGateway';
import { CollaborationAccessGateway } from './accessGateway';
import { CollaborationCommentGateway } from './commentGateway';

export class SupabaseCollaborationGateway implements CollaborationGateway {
    readonly #auth = new CollaborationAuthGateway();
    readonly #realtime = new CollaborationRealtimeGateway();
    readonly #records = new CollaborationRecordGateway();
    readonly #access = new CollaborationAccessGateway(this.#records);
    readonly #comments = new CollaborationCommentGateway(this.#records);
    #finalizePromise: Promise<CollaborationIdentity> | null = null;
    #finalizingUserId: string | null = null;
    #identity: CollaborationIdentity | null = null;
    #onInvalidate: (() => void) | null = null;
    #unsubscribeAuth: (() => void) | null = null;

    async connect(options: {
        onError: (error: Error) => void;
        onInvalidate: () => void;
        onPresence: (ids: ReadonlySet<IdentityId>) => void;
        signal: AbortSignal;
    }): Promise<void> {
        const session = await this.#auth.ensureSession();
        this.#identity = await this.#records.ensureIdentity(session);
        this.#onInvalidate = options.onInvalidate;
        this.#unsubscribeAuth?.();
        this.#unsubscribeAuth = this.#auth.subscribe((_event, nextSession) => {
            if (!nextSession || nextSession.user.is_anonymous) return;
            void this.#finalizeAccount(nextSession).catch(error =>
                options.onError(
                    error instanceof Error
                        ? error
                        : new Error('Account sign-in failed.')
                )
            );
        });
        await this.#realtime.connect({
            ...options,
            userId: this.#identity.record.userId,
        });
    }

    async disconnect(): Promise<void> {
        await this.#realtime.disconnect();
        this.#unsubscribeAuth?.();
        this.#unsubscribeAuth = null;
        this.#onInvalidate = null;
        this.#identity = null;
    }

    async enableSync(
        snapshot: PlannerSnapshot,
        captchaToken: string
    ): Promise<CollaborationSnapshot> {
        const session = await this.#auth.ensureSession(captchaToken);
        this.#identity = await this.#records.ensureIdentity(session);
        return this.#records.importSnapshot(this.#identity, snapshot);
    }

    async recoverSync(snapshot: PlannerSnapshot, recoveryCode: string) {
        const session = await this.#auth.ensureSession();
        this.#identity = await this.#records.recoverIdentity(
            session,
            recoveryCode
        );
        return this.#records.importSnapshot(this.#identity, snapshot);
    }

    async continueAccountWithEmail(email: string) {
        await this.#auth.continueWithEmail(email);
    }

    async continueAccountWithGoogle() {
        await this.#auth.continueWithGoogle();
    }

    async signInExistingWithEmail(email: string, captchaToken: string) {
        await this.#records.createIdentityHandoff();
        await this.#auth.signInExistingWithEmail(email, captchaToken);
    }

    async signInExistingWithGoogle() {
        await this.#records.createIdentityHandoff();
        await this.#auth.signInExistingWithGoogle();
    }

    async handleAuthCallback(value: string) {
        const session = await this.#auth.exchangeCallback(value);
        if (session && !session.user.is_anonymous) {
            await this.#finalizeAccount(session);
        }
    }

    async loadSnapshot(): Promise<CollaborationSnapshot> {
        if (!this.#identity) throw new Error('Collaboration is not connected.');
        return this.#records.loadSnapshot(this.#identity);
    }

    async publish(mutations: readonly PlannerMutation[]) {
        if (!this.#identity) throw new Error('Collaboration is not connected.');
        return this.#records.publish(this.#identity, mutations);
    }

    async setActiveList(listId: ListId | null): Promise<void> {
        await this.#realtime.setActiveList(listId);
    }

    async createInvitation(
        listId: ListId,
        role: Exclude<CollaborationRole, 'owner'>
    ) {
        return this.#access.createInvitation(
            this.#requireIdentity(),
            listId,
            role
        );
    }

    async revokeInvitation(listId: ListId, invitationId: string) {
        await this.#access.revokeInvitation(listId, invitationId);
    }

    async updateMemberRole(
        listId: ListId,
        member: CollaborationMembership,
        role: Exclude<CollaborationRole, 'owner'>
    ) {
        await this.#access.updateMemberRole(listId, member, role);
    }

    async removeMember(listId: ListId, member: CollaborationMembership) {
        await this.#access.removeMember(
            this.#requireIdentity(),
            listId,
            member
        );
    }

    async leaveList(listId: ListId, membership: CollaborationMembership) {
        await this.#access.leaveList(
            this.#requireIdentity(),
            listId,
            membership
        );
    }

    async transferOwnership(
        listId: ListId,
        newOwner: CollaborationMembership,
        formerOwnerRole: Exclude<CollaborationRole, 'owner'> | null
    ) {
        await this.#access.transferOwnership(
            this.#requireIdentity(),
            listId,
            newOwner,
            formerOwnerRole
        );
    }

    async redeemInvitation(invitationUrl: string) {
        return this.#access.redeemInvitation(
            this.#requireIdentity(),
            invitationUrl
        );
    }

    async createComment(options: {
        body: string;
        keyVersion: number;
        listId: ListId;
        memberships: readonly CollaborationMembership[];
        parentCommentId: string | null;
        profiles: readonly CollaborationProfile[];
        itemId: ItemId;
    }) {
        return this.#comments.createComment(this.#requireIdentity(), options);
    }

    async deleteComment(comment: CollaborationComment) {
        await this.#comments.deleteComment(comment);
    }

    async markThreadRead(listId: ListId, itemId: ItemId) {
        await this.#comments.markThreadRead(listId, itemId);
    }

    #requireIdentity(): CollaborationIdentity {
        if (!this.#identity) throw new Error('Collaboration is not connected.');
        return this.#identity;
    }

    #finalizeAccount(
        session: Parameters<CollaborationRecordGateway['finalizeAccount']>[0]
    ) {
        if (
            this.#finalizePromise &&
            this.#finalizingUserId !== session.user.id
        ) {
            throw new Error(
                'Another account sign-in is already being finalized.'
            );
        }
        this.#finalizingUserId = session.user.id;
        this.#finalizePromise ??= this.#records
            .finalizeAccount(session)
            .then(identity => {
                this.#identity = identity;
                this.#onInvalidate?.();
                return identity;
            })
            .finally(() => {
                this.#finalizePromise = null;
                this.#finalizingUserId = null;
            });
        return this.#finalizePromise;
    }
}
