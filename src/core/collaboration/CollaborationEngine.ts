import type {
    CollaborationGateway,
    NotificationGateway,
    PlannerRepository,
    PreferenceRepository,
    QueuedPlannerMutation,
} from '../application/ports';
import type { PlannerStore } from '../store/plannerStore';
import type { CollaborationStore } from './collaborationStore';
import type { CollaborationSnapshot } from './types';
import type { CollaborationComment, CollaborationMembership } from './types';
import type { CollaborationRole } from './roles';
import type { ListId, ItemId } from '../domain/ids';
import { createListId, createItemId } from '../domain/ids';
import type { PlannerList, PlannerItem } from '../domain/types';

export class CollaborationEngine {
    readonly #gateway: CollaborationGateway;
    readonly #collaborationStore: CollaborationStore;
    readonly #notifications: NotificationGateway;
    readonly #preferences: PreferenceRepository;
    readonly #repository: PlannerRepository;
    readonly #store: PlannerStore;
    #abortController: AbortController | null = null;
    #refreshTimer: number | null = null;
    #replayTimer: number | null = null;
    #storeUnsubscribe: (() => void) | null = null;
    #started = false;

    constructor(options: {
        gateway: CollaborationGateway;
        collaborationStore: CollaborationStore;
        preferences: PreferenceRepository;
        repository: PlannerRepository;
        store: PlannerStore;
        notifications?: NotificationGateway;
    }) {
        this.#gateway = options.gateway;
        this.#collaborationStore = options.collaborationStore;
        this.#notifications = options.notifications ?? {
            disable: async () => {
                const notifications =
                    await import('../../platform/collaboration/notificationGateway');
                await notifications.disableNotifications();
            },
            enable: async () => {
                const notifications =
                    await import('../../platform/collaboration/notificationGateway');
                await notifications.enableNotifications();
            },
        };
        this.#preferences = options.preferences;
        this.#repository = options.repository;
        this.#store = options.store;
    }

    async start(): Promise<void> {
        if (this.#started || !this.#store.getState().preferences.syncEnabled) {
            return;
        }
        this.#started = true;
        this.#abortController = new AbortController();
        this.#store.getState().setSyncStatus({ status: 'connecting' });
        try {
            await this.#gateway.connect({
                onError: error =>
                    this.#store.getState().setSyncStatus({
                        error: error.message,
                        status: 'error',
                    }),
                onInvalidate: () => this.#scheduleRefresh(),
                onPresence: ids =>
                    this.#store.getState().setPresentIdentityIds(ids),
                signal: this.#abortController.signal,
            });
            let selectedListId = this.#store.getState().selectedListId;
            await this.#gateway.setActiveList(selectedListId);
            this.#storeUnsubscribe = this.#store.subscribe(state => {
                if (state.selectedListId !== selectedListId) {
                    selectedListId = state.selectedListId;
                    void this.#gateway.setActiveList(selectedListId);
                }
            });
            await this.#replayOutbox();
            await this.refresh();
            this.#scheduleReplay();
        } catch (error) {
            this.#started = false;
            this.#store.getState().setSyncStatus({
                error: error instanceof Error ? error.message : 'Sync failed.',
                status: 'error',
            });
        }
    }

    async enableSync(captchaToken: string): Promise<void> {
        this.#store.getState().setSyncStatus({ status: 'connecting' });
        try {
            const local = await this.#repository.load();
            let snapshot = await this.#gateway.enableSync(local, captchaToken);
            await this.#applySnapshot(snapshot);
            if (await this.#migrateLocalAttachments(snapshot)) {
                snapshot = await this.#gateway.loadSnapshot();
                await this.#applySnapshot(snapshot);
            }
            const preferences = {
                ...this.#store.getState().preferences,
                syncEnabled: true,
            };
            this.#preferences.save(preferences);
            this.#store.getState().setPreferences(preferences);
            this.#store.getState().setSyncStatus({
                status: 'synced',
                syncedAt: new Date().toISOString(),
            });
            await this.start();
        } catch (error) {
            this.#store.getState().setSyncStatus({
                error: error instanceof Error ? error.message : 'Sync failed.',
                status: 'error',
            });
            throw error;
        }
    }

    async recoverSync(recoveryCode: string): Promise<void> {
        this.#store.getState().setSyncStatus({ status: 'connecting' });
        try {
            const local = await this.#repository.load();
            const snapshot = await this.#gateway.recoverSync(
                local,
                recoveryCode
            );
            await this.#applySnapshot(snapshot);
            const preferences = {
                ...this.#store.getState().preferences,
                syncEnabled: true,
            };
            this.#preferences.save(preferences);
            this.#store.getState().setPreferences(preferences);
            await this.start();
        } catch (error) {
            this.#store.getState().setSyncStatus({
                error:
                    error instanceof Error ? error.message : 'Recovery failed.',
                status: 'error',
            });
            throw error;
        }
    }

    async continueAccountWithEmail(email: string): Promise<void> {
        await this.#gateway.continueAccountWithEmail(email);
    }

    async continueAccountWithGoogle(): Promise<void> {
        await this.#gateway.continueAccountWithGoogle();
    }

    async signInExistingWithEmail(
        email: string,
        captchaToken: string
    ): Promise<void> {
        await this.#gateway.signInExistingWithEmail(email, captchaToken);
    }

    async signInExistingWithGoogle(): Promise<void> {
        await this.#gateway.signInExistingWithGoogle();
    }

    async handleAuthCallback(value: string): Promise<void> {
        await this.#gateway.handleAuthCallback(value);
    }

    async setNotificationsEnabled(enabled: boolean): Promise<void> {
        if (enabled) {
            await this.#notifications.enable();
        } else {
            await this.#notifications.disable();
        }
        const preferences = {
            ...this.#store.getState().preferences,
            notificationsEnabled: enabled,
        };
        this.#preferences.save(preferences);
        this.#store.getState().setPreferences(preferences);
    }

    async refresh(): Promise<void> {
        if (!this.#started) return;
        this.#store.getState().setSyncStatus({ status: 'syncing' });
        const snapshot = await this.#gateway.loadSnapshot();
        await this.#applySnapshot(snapshot);
        this.#store.getState().setSyncStatus({
            status: 'synced',
            syncedAt: new Date().toISOString(),
        });
    }

    async createInvitation(
        listId: ListId,
        role: Exclude<CollaborationRole, 'owner'>
    ) {
        const invitation = await this.#gateway.createInvitation(listId, role);
        await this.refresh();
        this.#collaborationStore.getState().upsertInvitation(invitation);
        return invitation;
    }

    async revokeInvitation(listId: ListId, invitationId: string) {
        await this.#gateway.revokeInvitation(listId, invitationId);
        this.#collaborationStore
            .getState()
            .removeInvitation(invitationId, listId);
    }

    async updateMemberRole(
        listId: ListId,
        member: CollaborationMembership,
        role: Exclude<CollaborationRole, 'owner'>
    ) {
        await this.#gateway.updateMemberRole(listId, member, role);
        await this.refresh();
    }

    async removeMember(listId: ListId, member: CollaborationMembership) {
        await this.#gateway.removeMember(listId, member);
        await this.refresh();
    }

    async leaveList(listId: ListId, membership: CollaborationMembership) {
        await this.#gateway.leaveList(listId, membership);
        await this.refresh();
    }

    async transferOwnership(
        listId: ListId,
        newOwner: CollaborationMembership,
        formerOwnerRole: Exclude<CollaborationRole, 'owner'> | null
    ) {
        await this.#gateway.transferOwnership(
            listId,
            newOwner,
            formerOwnerRole
        );
        await this.refresh();
    }

    async acceptInvitation(invitationUrl: string, captchaToken: string) {
        if (!this.#store.getState().preferences.syncEnabled) {
            await this.enableSync(captchaToken);
        } else if (!this.#started) {
            await this.start();
        }
        const listId = await this.#gateway.redeemInvitation(invitationUrl);
        await this.refresh();
        this.#store.getState().setSelection(listId, null);
        return listId;
    }

    async createComment(
        itemId: ItemId,
        body: string,
        parentCommentId: string | null
    ) {
        const item = this.#store.getState().itemsById.get(itemId);
        if (!item) throw new Error('That item is unavailable.');
        const collaboration = this.#collaborationStore.getState();
        const comment = await this.#gateway.createComment({
            body,
            keyVersion: item.keyVersion,
            listId: item.listId,
            memberships:
                collaboration.membershipsByListId.get(item.listId) ?? [],
            parentCommentId,
            profiles: [
                ...(collaboration.profilesByListId.get(item.listId)?.values() ??
                    []),
            ],
            itemId,
        });
        collaboration.upsertComment(comment);
        await this.#gateway.markThreadRead(item.listId, item.id);
        return comment;
    }

    async deleteComment(comment: CollaborationComment) {
        await this.#gateway.deleteComment(comment);
        this.#collaborationStore
            .getState()
            .removeComment(comment.id, comment.itemId);
    }

    async markThreadRead(itemId: ItemId) {
        const item = this.#store.getState().itemsById.get(itemId);
        if (!item) return;
        await this.#gateway.markThreadRead(item.listId, item.id);
    }

    async resolveConflict(
        conflictId: string,
        resolution: 'discard' | 'merge' | 'mine' | 'private-copy' | 'theirs',
        merged?: PlannerList | PlannerItem
    ): Promise<void> {
        const collaboration = this.#collaborationStore.getState();
        const conflict = collaboration.conflicts.find(
            candidate => candidate.id === conflictId
        );
        if (!conflict) return;
        const outbox = await this.#repository.loadOutbox(5000);
        const conflictingOperationIds: string[] = [];
        for (const operation of outbox) {
            const mutation = operation.mutation;
            const entityId =
                'entity' in mutation ? mutation.entity.id : mutation.id;
            if (entityId === conflict.entityId)
                conflictingOperationIds.push(operation.id);
        }
        await this.#repository.deleteOutbox(conflictingOperationIds);

        if (conflict.status === 'deleted-remotely') {
            if (resolution === 'private-copy') {
                const timestamp = new Date().toISOString();
                if (conflict.entityType === 'list') {
                    const source = conflict.local as PlannerList;
                    const copy: PlannerList = {
                        ...source,
                        createdAt: timestamp,
                        id: createListId(),
                        isArchived: false,
                        isPrivateCopy: true,
                        keyVersion: 1,
                        ownerIdentityId: null,
                        revision: 0,
                        updatedAt: timestamp,
                    };
                    await this.#repository.apply([
                        { base: null, entity: copy, type: 'put-list' },
                    ]);
                    this.#store.getState().upsertList(copy);
                } else {
                    const source = conflict.local as PlannerItem;
                    const copy: PlannerItem = {
                        ...source,
                        createdAt: timestamp,
                        creatorIdentityId: null,
                        id: createItemId(),
                        isArchived: false,
                        isPrivateCopy: true,
                        keyVersion: 1,
                        revision: 0,
                        updatedAt: timestamp,
                    };
                    await this.#repository.apply([
                        { base: null, entity: copy, type: 'put-item' },
                    ]);
                    this.#store.getState().upsertItem(copy);
                }
            } else if (conflict.entityType === 'list') {
                await this.#repository.apply([
                    {
                        base: conflict.local as PlannerList,
                        id: conflict.entityId as ListId,
                        type: 'delete-list',
                    },
                ]);
                this.#store.getState().removeList(conflict.entityId as ListId);
            } else {
                await this.#repository.apply([
                    {
                        base: conflict.local as PlannerItem,
                        id: conflict.entityId as ItemId,
                        type: 'delete-item',
                    },
                ]);
                this.#store.getState().removeItem(conflict.entityId as ItemId);
            }
        } else {
            const remote = conflict.remote;
            const selected =
                resolution === 'theirs'
                    ? remote
                    : resolution === 'merge' && merged
                      ? merged
                      : conflict.local;
            const entity = {
                ...selected,
                id: remote.id,
                isPrivateCopy: false,
                revision: remote.revision + 1,
                updatedAt: new Date().toISOString(),
            } as PlannerList | PlannerItem;
            if (resolution === 'theirs') {
                const mutation =
                    conflict.entityType === 'list'
                        ? ({
                              base: remote as PlannerList,
                              entity: remote as PlannerList,
                              type: 'put-list',
                          } as const)
                        : ({
                              base: remote as PlannerItem,
                              entity: remote as PlannerItem,
                              type: 'put-item',
                          } as const);
                await this.#repository.apply([mutation]);
                if (mutation.type === 'put-list')
                    this.#store.getState().upsertList(mutation.entity);
                else this.#store.getState().upsertItem(mutation.entity);
            } else {
                const mutation =
                    conflict.entityType === 'list'
                        ? ({
                              base: remote as PlannerList,
                              entity: entity as PlannerList,
                              type: 'put-list',
                          } as const)
                        : ({
                              base: remote as PlannerItem,
                              entity: entity as PlannerItem,
                              type: 'put-item',
                          } as const);
                await this.#repository.apply([mutation], {
                    enqueueForSync: true,
                });
                if (mutation.type === 'put-list')
                    this.#store.getState().upsertList(mutation.entity);
                else this.#store.getState().upsertItem(mutation.entity);
            }
        }
        collaboration.setConflicts(
            collaboration.conflicts.filter(value => value.id !== conflictId)
        );
        if (resolution !== 'theirs' && resolution !== 'discard') {
            await this.#replayOutbox();
        }
    }

    async stop(): Promise<void> {
        this.#started = false;
        this.#abortController?.abort();
        this.#abortController = null;
        this.#storeUnsubscribe?.();
        this.#storeUnsubscribe = null;
        if (this.#refreshTimer !== null)
            window.clearTimeout(this.#refreshTimer);
        if (this.#replayTimer !== null) window.clearTimeout(this.#replayTimer);
        this.#refreshTimer = null;
        this.#replayTimer = null;
        await this.#gateway.disconnect();
    }

    async #applySnapshot(snapshot: CollaborationSnapshot): Promise<void> {
        const previous = this.#store.getState();
        const [pending, local] = await Promise.all([
            this.#repository.loadOutbox(5000),
            this.#repository.load(),
        ]);
        const lists = new Map(
            snapshot.planner.lists.map(list => [list.id, list])
        );
        const items = new Map(
            snapshot.planner.items.map(item => [item.id, item])
        );
        for (const list of local.lists) {
            if (list.isPrivateCopy) lists.set(list.id, list);
        }
        for (const item of local.items) {
            if (item.isPrivateCopy) items.set(item.id, item);
        }
        pending.forEach(operation => {
            const mutation = operation.mutation;
            if (mutation.type === 'put-list') {
                lists.set(mutation.entity.id, mutation.entity);
            } else if (mutation.type === 'put-item') {
                items.set(mutation.entity.id, mutation.entity);
            } else if (mutation.type === 'delete-list') {
                lists.delete(mutation.id);
            } else {
                items.delete(mutation.id);
            }
        });
        const planner = {
            lists: [...lists.values()],
            items: [...items.values()],
        };
        await this.#repository.replace(planner);
        this.#store.getState().applySnapshot(planner);
        this.#collaborationStore.getState().applySnapshot(snapshot);
        const next = this.#store.getState();
        const listId =
            previous.selectedListId &&
            next.listsById.get(previous.selectedListId)?.isArchived === false
                ? previous.selectedListId
                : next.selectedListId;
        const itemId =
            previous.selectedItemId &&
            next.itemsById.get(previous.selectedItemId)?.listId === listId
                ? previous.selectedItemId
                : null;
        next.setSelection(listId, itemId);
    }

    async #migrateLocalAttachments(
        snapshot: CollaborationSnapshot
    ): Promise<boolean> {
        const items = snapshot.planner.items.filter(item =>
            item.attachments.some(
                attachment =>
                    attachment.status === 'ready' &&
                    attachment.attachmentKey === 'local-vault-v1'
            )
        );
        if (items.length === 0) return false;
        const [{ EncryptedDexieAttachmentGateway }, cloudModule] =
            await Promise.all([
                import('../../platform/persistence/attachmentGateway'),
                import('../../platform/collaboration/cloudAttachmentGateway'),
            ]);
        const localGateway = new EncryptedDexieAttachmentGateway();
        const cloudGateway =
            new cloudModule.SupabaseEncryptedAttachmentGateway();
        for (const item of items) {
            let current = item;
            for (const attachment of item.attachments) {
                if (
                    attachment.status !== 'ready' ||
                    attachment.attachmentKey !== 'local-vault-v1'
                ) {
                    continue;
                }
                const blob = await localGateway.load(attachment.id);
                const uploaded = await cloudGateway.upload(
                    new File([blob], attachment.filename, {
                        type: attachment.mimeType,
                    }),
                    {
                        attachmentId: attachment.id,
                        keyVersion: current.keyVersion,
                        listId: current.listId,
                        onProgress: () => undefined,
                        signal: new AbortController().signal,
                        syncEnabled: true,
                        itemId: current.id,
                    }
                );
                const next: PlannerItem = {
                    ...current,
                    attachments: current.attachments.map(candidate =>
                        candidate.status === 'ready' &&
                        candidate.id === attachment.id
                            ? {
                                  ...candidate,
                                  attachmentKey: uploaded.attachmentKey,
                                  id: attachment.id,
                                  url: uploaded.url,
                              }
                            : candidate
                    ),
                    updatedAt: new Date().toISOString(),
                };
                const result = await this.#gateway.publish([
                    { base: current, entity: next, type: 'put-item' },
                ]);
                if (
                    result.conflicts.length > 0 ||
                    result.applied.length !== 1
                ) {
                    await cloudGateway
                        .delete(attachment.id)
                        .catch(() => undefined);
                    throw new Error(
                        `Attachment migration conflicted for ${attachment.filename}.`
                    );
                }
                const applied = result.applied[0];
                if (applied?.type !== 'put-item') {
                    throw new Error(
                        'Attachment migration returned an invalid item.'
                    );
                }
                current = applied.entity;
                await this.#repository.apply([applied]);
                this.#store.getState().upsertItem(current);
                await localGateway.delete(attachment.id);
            }
        }
        return true;
    }

    async #replayOutbox(): Promise<void> {
        const operations = await this.#repository.loadOutbox(500);
        if (operations.length === 0) return;
        const grouped = new Map<
            string,
            {
                earliest: QueuedPlannerMutation;
                ids: string[];
                latest: QueuedPlannerMutation;
            }
        >();
        operations.forEach(operation => {
            const recordId =
                'entity' in operation.mutation
                    ? operation.mutation.entity.id
                    : operation.mutation.id;
            const group = grouped.get(recordId) ?? {
                earliest: operation,
                ids: [],
                latest: operation,
            };
            group.ids.push(operation.id);
            group.latest = operation;
            grouped.set(recordId, group);
        });
        const groups = [...grouped.values()].sort((left, right) =>
            left.latest.createdAt.localeCompare(right.latest.createdAt)
        );
        const conflicts = [];
        for (const group of groups) {
            let mutation = group.latest.mutation;
            const earliest = group.earliest.mutation;
            if (mutation.type === 'put-list' && earliest.type === 'put-list') {
                mutation = { ...mutation, base: earliest.base };
            } else if (
                mutation.type === 'put-item' &&
                earliest.type === 'put-item'
            ) {
                mutation = { ...mutation, base: earliest.base };
            }
            const result = await this.#gateway.publish([mutation]);
            if (result.conflicts.length > 0) {
                conflicts.push(...result.conflicts);
                continue;
            }
            if (result.applied.length > 0) {
                await this.#repository.apply(result.applied);
                result.applied.forEach(applied => {
                    if (applied.type === 'put-list') {
                        this.#store.getState().upsertList(applied.entity);
                    } else if (applied.type === 'put-item') {
                        this.#store.getState().upsertItem(applied.entity);
                    }
                });
            }
            await this.#repository.deleteOutbox(group.ids);
        }
        this.#collaborationStore.getState().setConflicts(conflicts);
    }

    #scheduleRefresh(): void {
        if (this.#refreshTimer !== null)
            window.clearTimeout(this.#refreshTimer);
        this.#refreshTimer = window.setTimeout(() => {
            this.#refreshTimer = null;
            void this.refresh().catch(error => {
                this.#store.getState().setSyncStatus({
                    error:
                        error instanceof Error ? error.message : 'Sync failed.',
                    status: 'error',
                });
            });
        }, 200);
    }

    #scheduleReplay(): void {
        if (!this.#started) return;
        this.#replayTimer = window.setTimeout(() => {
            this.#replayTimer = null;
            void this.#replayOutbox()
                .then(() => this.#scheduleReplay())
                .catch(error => {
                    this.#store.getState().setSyncStatus({
                        error:
                            error instanceof Error
                                ? error.message
                                : 'Sync failed.',
                        status: 'error',
                    });
                    this.#scheduleReplay();
                });
        }, 500);
    }
}
