import { describe, expect, it, vi } from 'vitest';
import type {
    CollaborationGateway,
    PlannerMutation,
    PlannerRepository,
    PreferenceRepository,
    QueuedPlannerMutation,
} from '../../application/ports';
import { createPlannerList } from '../../domain/factories';
import type { IdentityId, ListId } from '../../domain/ids';
import type { PlannerPreferences, PlannerSnapshot } from '../../domain/types';
import {
    DEFAULT_PREFERENCES,
    createPlannerStore,
} from '../../store/plannerStore';
import { CollaborationEngine } from '../CollaborationEngine';
import { createCollaborationStore } from '../collaborationStore';
import type { CollaborationSnapshot } from '../types';

const TEST_IDENTITY_ID = '00000000-0000-4000-8000-000000000001' as IdentityId;

const collaborationSnapshot = (
    planner: PlannerSnapshot
): CollaborationSnapshot => ({
    comments: [],
    identity: {
        email: null,
        isAnonymous: true,
        recoveryCode: null,
        userId: TEST_IDENTITY_ID,
    },
    invitations: [],
    memberships: [],
    planner,
    profiles: [],
    threadReads: [],
});

class MemoryRepository implements PlannerRepository {
    applied: {
        mutations: readonly PlannerMutation[];
        options?: { enqueueForSync?: boolean };
    }[] = [];
    outbox: QueuedPlannerMutation[] = [];
    snapshot: PlannerSnapshot = { lists: [], items: [] };
    async apply(
        mutations: readonly PlannerMutation[],
        options?: { enqueueForSync?: boolean }
    ) {
        this.applied.push(options ? { mutations, options } : { mutations });
    }
    async deleteOutbox(ids: readonly string[]) {
        this.outbox = this.outbox.filter(item => !ids.includes(item.id));
    }
    async load() {
        return this.snapshot;
    }
    async loadOutbox() {
        return this.outbox;
    }
    async replace(snapshot: PlannerSnapshot) {
        this.snapshot = snapshot;
    }
}

class MemoryGateway implements CollaborationGateway {
    disconnected = false;
    enableError: Error | null = null;
    published: PlannerMutation[][] = [];
    snapshot: CollaborationSnapshot = collaborationSnapshot({
        lists: [],
        items: [],
    });
    async continueAccountWithEmail() {}
    async continueAccountWithGoogle() {}
    async createComment(): Promise<never> {
        throw new Error('Not used in this test.');
    }
    async createInvitation(): Promise<never> {
        throw new Error('Not used in this test.');
    }
    async connect() {}
    async disconnect() {
        this.disconnected = true;
    }
    async deleteComment() {}
    async enableSync(snapshot: PlannerSnapshot) {
        if (this.enableError) throw this.enableError;
        this.snapshot = collaborationSnapshot(snapshot);
        return this.snapshot;
    }
    async handleAuthCallback() {}
    async loadSnapshot() {
        return this.snapshot;
    }
    async leaveList() {}
    async markThreadRead() {}
    async publish(mutations: readonly PlannerMutation[]) {
        this.published.push([...mutations]);
        return { applied: [...mutations], conflicts: [] };
    }
    async redeemInvitation(): Promise<never> {
        throw new Error('Not used in this test.');
    }
    async recoverSync(): Promise<never> {
        throw new Error('Not used in this test.');
    }
    async removeMember() {}
    async revokeInvitation() {}
    async setActiveList(_listId: ListId | null) {}
    async signInExistingWithEmail() {}
    async signInExistingWithGoogle() {}
    async transferOwnership() {}
    async updateMemberRole() {}
}

describe('CollaborationEngine', () => {
    it('compacts queued mutations, refreshes, and disconnects cleanly', async () => {
        vi.useFakeTimers();
        const list = createPlannerList();
        const latest = { ...list, label: 'Latest', revision: 1 };
        const repository = new MemoryRepository();
        repository.snapshot = { lists: [latest], items: [] };
        repository.outbox = [
            {
                createdAt: '2026-01-01T00:00:00.000Z',
                id: 'first',
                listId: list.id,
                mutation: { base: null, entity: list, type: 'put-list' },
            },
            {
                createdAt: '2026-01-01T00:00:01.000Z',
                id: 'second',
                listId: list.id,
                mutation: { base: list, entity: latest, type: 'put-list' },
            },
        ];
        const gateway = new MemoryGateway();
        gateway.snapshot = collaborationSnapshot(repository.snapshot);
        const store = createPlannerStore();
        store.getState().setPreferences({
            ...DEFAULT_PREFERENCES,
            syncEnabled: true,
        });
        const preferences: PreferenceRepository = {
            load: () => store.getState().preferences,
            save: (_value: PlannerPreferences) => undefined,
        };
        const engine = new CollaborationEngine({
            collaborationStore: createCollaborationStore(),
            gateway,
            preferences,
            repository,
            store,
        });

        await engine.start();

        expect(gateway.published).toEqual([
            [{ base: null, entity: latest, type: 'put-list' }],
        ]);
        expect(repository.outbox).toHaveLength(0);
        expect(store.getState().syncStatus.status).toBe('synced');
        await engine.stop();
        expect(gateway.disconnected).toBe(true);
        vi.useRealTimers();
    });

    it('persists the sync preference only after a successful import', async () => {
        const list = createPlannerList();
        const repository = new MemoryRepository();
        repository.snapshot = { lists: [list], items: [] };
        const gateway = new MemoryGateway();
        gateway.enableError = new Error('Remote import failed');
        const store = createPlannerStore();
        store.getState().applySnapshot(repository.snapshot);
        const saved: PlannerPreferences[] = [];
        const engine = new CollaborationEngine({
            collaborationStore: createCollaborationStore(),
            gateway,
            preferences: {
                load: () => store.getState().preferences,
                save: value => saved.push(value),
            },
            repository,
            store,
        });

        await expect(engine.enableSync('captcha')).rejects.toThrow(
            'Remote import failed'
        );
        expect(saved).toEqual([]);
        expect(store.getState().preferences.syncEnabled).toBe(false);
        expect(store.getState().syncStatus).toMatchObject({
            error: 'Remote import failed',
            status: 'error',
        });
    });

    it('does not persist notification preferences when permission fails', async () => {
        const store = createPlannerStore();
        const saved: PlannerPreferences[] = [];
        const engine = new CollaborationEngine({
            collaborationStore: createCollaborationStore(),
            gateway: new MemoryGateway(),
            notifications: {
                disable: async () => undefined,
                enable: async () => {
                    throw new Error('Permission denied');
                },
            },
            preferences: {
                load: () => store.getState().preferences,
                save: value => saved.push(value),
            },
            repository: new MemoryRepository(),
            store,
        });

        await expect(engine.setNotificationsEnabled(true)).rejects.toThrow(
            'Permission denied'
        );
        expect(saved).toEqual([]);
        expect(store.getState().preferences.notificationsEnabled).toBe(false);
    });

    it('keeps a same-field conflict queued until the user chooses a version', async () => {
        const base = createPlannerList({ label: 'Base' });
        const local = { ...base, label: 'Mine', revision: 2 };
        const remote = { ...base, label: 'Theirs', revision: 3 };
        const repository = new MemoryRepository();
        repository.snapshot = { lists: [local], items: [] };
        repository.outbox = [
            {
                createdAt: '2026-01-01T00:00:00.000Z',
                id: 'pending-edit',
                listId: base.id,
                mutation: { base, entity: local, type: 'put-list' },
            },
        ];
        const collaborationStore = createCollaborationStore();
        collaborationStore.getState().setConflicts([
            {
                entityId: base.id,
                entityType: 'list',
                id: 'conflict',
                local,
                remote,
                status: 'field-conflict',
            },
        ]);
        const store = createPlannerStore();
        store.getState().applySnapshot(repository.snapshot);
        const engine = new CollaborationEngine({
            collaborationStore,
            gateway: new MemoryGateway(),
            preferences: {
                load: () => store.getState().preferences,
                save: () => undefined,
            },
            repository,
            store,
        });

        await engine.resolveConflict('conflict', 'mine');

        expect(repository.outbox).toHaveLength(0);
        expect(repository.applied.at(-1)).toMatchObject({
            mutations: [
                {
                    base: remote,
                    entity: { label: 'Mine', revision: 4 },
                    type: 'put-list',
                },
            ],
            options: { enqueueForSync: true },
        });
        expect(store.getState().listsById.get(base.id)).toMatchObject({
            label: 'Mine',
            revision: 4,
        });
        expect(collaborationStore.getState().conflicts).toEqual([]);
    });

    it('preserves a remotely deleted list as a fresh private copy', async () => {
        const local = createPlannerList({ label: 'Keep this' });
        const repository = new MemoryRepository();
        repository.snapshot = { lists: [local], items: [] };
        repository.outbox = [
            {
                createdAt: '2026-01-01T00:00:00.000Z',
                id: 'pending-edit',
                listId: local.id,
                mutation: {
                    base: local,
                    entity: { ...local, revision: 1 },
                    type: 'put-list',
                },
            },
        ];
        const collaborationStore = createCollaborationStore();
        collaborationStore.getState().setConflicts([
            {
                entityId: local.id,
                entityType: 'list',
                id: 'deleted-conflict',
                local,
                status: 'deleted-remotely',
            },
        ]);
        const store = createPlannerStore();
        store.getState().applySnapshot(repository.snapshot);
        const engine = new CollaborationEngine({
            collaborationStore,
            gateway: new MemoryGateway(),
            preferences: {
                load: () => store.getState().preferences,
                save: () => undefined,
            },
            repository,
            store,
        });

        await engine.resolveConflict('deleted-conflict', 'private-copy');

        const copies = [...store.getState().listsById.values()].filter(
            list => list.id !== local.id
        );
        expect(copies).toHaveLength(1);
        expect(copies[0]).toMatchObject({
            isPrivateCopy: true,
            label: 'Keep this',
            ownerIdentityId: null,
            revision: 0,
        });
        expect(repository.applied.at(-1)?.options?.enqueueForSync).not.toBe(
            true
        );
        expect(repository.outbox).toHaveLength(0);
    });
});
