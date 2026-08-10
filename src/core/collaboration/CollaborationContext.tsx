import {
    createContext,
    type PropsWithChildren,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { useStore } from 'zustand';
import {
    usePlannerSelector,
    usePlannerStoreApi,
} from '../store/plannerContext';
import { EncryptedDexiePlannerRepository } from '../../platform/persistence/plannerRepository';
import { LocalStoragePreferenceRepository } from '../../platform/persistence/preferences';
import type { CollaborationEngine } from './CollaborationEngine';
import type {
    CollaborationComment,
    CollaborationInvitation,
    CollaborationMembership,
} from './types';
import type { CollaborationRole } from './roles';
import type { ListId, ItemId } from '../domain/ids';
import type { PlannerList, PlannerItem } from '../domain/types';
import {
    parsePlannerDeepLink,
    subscribeToPlannerDeepLinks,
} from '../../platform/runtime/deepLinks';
import { parseInvitationUrl } from './invitations';
import {
    createCollaborationStore,
    type CollaborationStore,
    type CollaborationStoreState,
} from './collaborationStore';

interface CollaborationController {
    acceptInvitation(
        invitationUrl: string,
        captchaToken: string
    ): Promise<ListId>;
    createComment(
        itemId: ItemId,
        body: string,
        parentCommentId: string | null
    ): Promise<CollaborationComment>;
    createInvitation(
        listId: ListId,
        role: Exclude<CollaborationRole, 'owner'>
    ): Promise<CollaborationInvitation>;
    clearPendingInvitation(): void;
    continueAccountWithEmail(email: string): Promise<void>;
    continueAccountWithGoogle(): Promise<void>;
    deleteComment(comment: CollaborationComment): Promise<void>;
    enableSync(captchaToken: string): Promise<void>;
    handleAuthCallback(value: string): Promise<void>;
    leaveList(
        listId: ListId,
        membership: CollaborationMembership
    ): Promise<void>;
    markThreadRead(itemId: ItemId): Promise<void>;
    removeMember(
        listId: ListId,
        member: CollaborationMembership
    ): Promise<void>;
    refresh(): Promise<void>;
    recoverSync(recoveryCode: string): Promise<void>;
    resolveConflict(
        conflictId: string,
        resolution: 'discard' | 'merge' | 'mine' | 'private-copy' | 'theirs',
        merged?: PlannerList | PlannerItem
    ): Promise<void>;
    revokeInvitation(listId: ListId, invitationId: string): Promise<void>;
    setNotificationsEnabled(enabled: boolean): Promise<void>;
    signInExistingWithEmail(email: string, captchaToken: string): Promise<void>;
    signInExistingWithGoogle(): Promise<void>;
    start(): Promise<void>;
    stop(): Promise<void>;
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

const CollaborationContext = createContext<CollaborationController | null>(
    null
);
const CollaborationStoreContext = createContext<CollaborationStore | null>(
    null
);

export function CollaborationProvider({ children }: PropsWithChildren) {
    const store = usePlannerStoreApi();
    const [collaborationStore] = useState(createCollaborationStore);
    const hydrated = usePlannerSelector(state => state.hydrated);
    const syncEnabled = usePlannerSelector(
        state => state.preferences.syncEnabled
    );
    const engineRef = useRef<CollaborationEngine | null>(null);
    const enginePromiseRef = useRef<Promise<CollaborationEngine> | null>(null);

    const controller = useMemo<CollaborationController>(() => {
        const getEngine = async () => {
            if (engineRef.current) return engineRef.current;
            enginePromiseRef.current ??= Promise.all([
                import('./CollaborationEngine'),
                import('../../platform/collaboration/gateway'),
            ]).then(([engineModule, gatewayModule]) => {
                const engine = new engineModule.CollaborationEngine({
                    collaborationStore,
                    gateway: new gatewayModule.SupabaseCollaborationGateway(),
                    preferences: new LocalStoragePreferenceRepository(),
                    repository: new EncryptedDexiePlannerRepository(),
                    store,
                });
                engineRef.current = engine;
                return engine;
            });
            return enginePromiseRef.current;
        };
        return {
            acceptInvitation: async (invitationUrl, captchaToken) =>
                (await getEngine()).acceptInvitation(
                    invitationUrl,
                    captchaToken
                ),
            createComment: async (itemId, body, parentCommentId) =>
                (await getEngine()).createComment(
                    itemId,
                    body,
                    parentCommentId
                ),
            createInvitation: async (listId, role) =>
                (await getEngine()).createInvitation(listId, role),
            clearPendingInvitation: () =>
                collaborationStore.getState().setPendingInvitationUrl(null),
            continueAccountWithEmail: async email =>
                (await getEngine()).continueAccountWithEmail(email),
            continueAccountWithGoogle: async () =>
                (await getEngine()).continueAccountWithGoogle(),
            deleteComment: async comment =>
                (await getEngine()).deleteComment(comment),
            enableSync: async captchaToken => {
                await (await getEngine()).enableSync(captchaToken);
            },
            handleAuthCallback: async value =>
                (await getEngine()).handleAuthCallback(value),
            leaveList: async (listId, membership) =>
                (await getEngine()).leaveList(listId, membership),
            markThreadRead: async itemId =>
                (await getEngine()).markThreadRead(itemId),
            removeMember: async (listId, member) =>
                (await getEngine()).removeMember(listId, member),
            refresh: async () => {
                await (await getEngine()).refresh();
            },
            recoverSync: async recoveryCode =>
                (await getEngine()).recoverSync(recoveryCode),
            resolveConflict: async (conflictId, resolution, merged) =>
                (await getEngine()).resolveConflict(
                    conflictId,
                    resolution,
                    merged
                ),
            revokeInvitation: async (listId, invitationId) =>
                (await getEngine()).revokeInvitation(listId, invitationId),
            setNotificationsEnabled: async enabled =>
                (await getEngine()).setNotificationsEnabled(enabled),
            signInExistingWithEmail: async (email, captchaToken) =>
                (await getEngine()).signInExistingWithEmail(
                    email,
                    captchaToken
                ),
            signInExistingWithGoogle: async () =>
                (await getEngine()).signInExistingWithGoogle(),
            start: async () => {
                await (await getEngine()).start();
            },
            stop: async () => {
                await engineRef.current?.stop();
            },
            transferOwnership: async (listId, newOwner, formerOwnerRole) =>
                (await getEngine()).transferOwnership(
                    listId,
                    newOwner,
                    formerOwnerRole
                ),
            updateMemberRole: async (listId, member, role) =>
                (await getEngine()).updateMemberRole(listId, member, role),
        };
    }, [collaborationStore, store]);

    useEffect(() => {
        if (!hydrated || !syncEnabled) return;
        void controller.start().catch(() => undefined);
        return () => void controller.stop();
    }, [controller, hydrated, syncEnabled]);

    useEffect(() => {
        if (parseInvitationUrl(window.location.href)) {
            collaborationStore
                .getState()
                .setPendingInvitationUrl(window.location.href);
        }
        const handle = (value: string) => {
            const parsed = parsePlannerDeepLink(value);
            if (!parsed) return;
            if (parsed.type === 'auth') {
                void controller.handleAuthCallback(value).catch(error =>
                    store.getState().setSyncStatus({
                        error:
                            error instanceof Error
                                ? error.message
                                : 'Account sign-in failed.',
                        status: 'error',
                    })
                );
                return;
            }
            const canonical = new URL(
                `/share/${parsed.listId}`,
                window.location.origin
            );
            canonical.hash = parsed.url.hash;
            collaborationStore
                .getState()
                .setPendingInvitationUrl(canonical.toString());
        };
        return subscribeToPlannerDeepLinks(handle);
    }, [collaborationStore, controller, store]);

    return (
        <CollaborationStoreContext.Provider value={collaborationStore}>
            <CollaborationContext.Provider value={controller}>
                {children}
            </CollaborationContext.Provider>
        </CollaborationStoreContext.Provider>
    );
}

export const useCollaboration = (): CollaborationController => {
    const controller = useContext(CollaborationContext);
    if (!controller) {
        throw new Error('CollaborationProvider is missing from the app shell.');
    }
    return controller;
};

export const useCollaborationStoreApi = (): CollaborationStore => {
    const store = useContext(CollaborationStoreContext);
    if (!store) {
        throw new Error('CollaborationProvider is missing from the app shell.');
    }
    return store;
};

export const useCollaborationSelector = <Value,>(
    selector: (state: CollaborationStoreState) => Value
): Value => {
    const store = useCollaborationStoreApi();
    return useStore(store, selector);
};
