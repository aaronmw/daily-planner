import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    createPlannerId,
    parseInvitationUrl,
    RECOVERY_ITERATIONS,
    ROLES,
    scrubInvitationUrl,
} from '../collaboration';
import {
    createCollaborationInvitation,
    createCollaborationIdentityHandoff,
    createCollaborationTask,
    createEncryptedComment,
    deleteEncryptedComment,
    ensureCollaborationSession,
    hasPendingCollaborationIdentityHandoff,
    importPlannerToCollaboration,
    claimPendingCollaborationIdentityHandoff,
    loadCollaborationSnapshot,
    leaveCollaborationList,
    markEncryptedCommentThreadRead,
    redeemCollaborationInvitation,
    registerCollaborationIdentity,
    removeCollaborationMember,
    revokeCollaborationInvitation,
    syncCollaborationEntity,
    transferCollaborationOwnership,
    updateCollaborationMemberRole,
} from '../platform/collaborationClient';
import {
    continueCollaborationWithEmail,
    continueCollaborationWithGoogle,
    exchangeCollaborationAuthCallback,
    finalizeCollaborationAccountUpgrade,
    signInToExistingCollaborationWithEmail,
    signInToExistingCollaborationWithGoogle,
    subscribeToCollaborationAuth,
} from '../platform/collaborationAuth';
import {
    createCollaborationIdentity,
    loadCollaborationIdentity,
    recoverCollaborationIdentity,
} from '../platform/collaborationIdentityStore';
import {
    enqueueCollaborationOperation,
    loadCollaborationOutbox,
    removeCollaborationOperation,
} from '../platform/collaborationOutbox';
import {
    disableCollaborationNotifications,
    enableCollaborationNotifications,
    showGenericCollaborationNotification,
} from '../platform/collaborationNotifications';
import { migrateLocalAttachmentsToCollaboration } from '../platform/collaborationMigration';
import {
    parseDailyPlannerDeepLink,
    subscribeToDailyPlannerDeepLinks,
} from '../platform/deepLinks';
import {
    getSupabaseClient,
    getSupabaseConfiguration,
    isSupabaseConfigured,
} from '../platform/supabase';
import usePersistentState from './usePersistentState';

const SYNC_DEBOUNCE_MS = 300;
const LOCAL_ONLY_KEYS = new Set([
    'collaboration_revision',
    'creator_identity_id',
    'key_version',
    'owner_identity_id',
]);

const entityFingerprint = entity =>
    JSON.stringify(entity, (key, value) =>
        LOCAL_ONLY_KEYS.has(key) || key.startsWith('collaboration_')
            ? undefined
            : value
    );

const groupBy = (values, getKey) => {
    const grouped = new Map();
    values.forEach(value => {
        const key = getKey(value);
        const group = grouped.get(key) || [];
        group.push(value);
        grouped.set(key, group);
    });
    return grouped;
};

const mergeSnapshotWithPending = (remote, pending, recordType) => {
    const byId = new Map(remote.map(entity => [entity.id, entity]));
    pending
        .filter(operation => operation.recordType === recordType)
        .forEach(operation => byId.set(operation.entity.id, operation.entity));
    return Array.from(byId.values());
};

export default function usePlannerCollaboration({
    lists,
    selectedListId,
    selectedTaskId,
    setSelectedListId,
    setSelectedTaskId,
    setLists,
    setTasks,
    tasks,
}) {
    const [syncEnabled, setSyncEnabled] = usePersistentState(
        'collaboration-sync-enabled',
        false
    );
    const [notificationsEnabled, setNotificationsEnabled] = usePersistentState(
        'collaboration-notifications-enabled',
        false
    );
    const [identity, setIdentity] = useState(null);
    const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
    const [syncStatus, setSyncStatus] = useState(
        syncEnabled ? 'Connecting' : 'Local only'
    );
    const [error, setError] = useState(null);
    const [recoveryCode, setRecoveryCode] = useState(null);
    const [memberships, setMemberships] = useState([]);
    const [profiles, setProfiles] = useState([]);
    const [comments, setComments] = useState([]);
    const [threadReads, setThreadReads] = useState([]);
    const [invitationsByListId, setInvitationsByListId] = useState(new Map());
    const [presenceByIdentityId, setPresenceByIdentityId] = useState(new Map());
    const [conflicts, setConflicts] = useState([]);
    const [pendingInvitationUrl, setPendingInvitationUrl] = useState(null);
    const [pendingActionId, setPendingActionId] = useState(null);
    const [needsRecovery, setNeedsRecovery] = useState(false);
    const [recoveryKeyring, setRecoveryKeyring] = useState(null);
    const baseListsRef = useRef(new Map());
    const baseTasksRef = useRef(new Map());
    const identityRef = useRef(null);
    const inFlightEntityIdsRef = useRef(new Set());
    const refreshPromiseRef = useRef(null);
    const syncTimerRef = useRef(null);
    const listsRef = useRef(lists);
    const tasksRef = useRef(tasks);
    listsRef.current = lists;
    tasksRef.current = tasks;

    const configured = isSupabaseConfigured();
    const configuration = getSupabaseConfiguration();

    const applySnapshot = useCallback(
        async snapshot => {
            const pending = await loadCollaborationOutbox();
            const remoteLists = snapshot.lists;
            const remoteTasks = snapshot.tasks;
            baseListsRef.current = new Map(
                remoteLists.map(list => [list.id, list])
            );
            baseTasksRef.current = new Map(
                remoteTasks.map(task => [task.id, task])
            );
            setLists(currentLists => {
                const localOnly = currentLists.filter(
                    list => list.is_private_copy
                );
                return mergeSnapshotWithPending(
                    remoteLists.concat(localOnly),
                    pending,
                    'list'
                );
            });
            setTasks(currentTasks => {
                const localOnly = currentTasks.filter(
                    task => task.is_private_copy
                );
                return mergeSnapshotWithPending(
                    remoteTasks.concat(localOnly),
                    pending,
                    'task'
                );
            });
            setMemberships(snapshot.memberships);
            setProfiles(snapshot.profiles);
            setComments(snapshot.comments);
            setThreadReads(snapshot.threadReads || []);
            setInvitationsByListId(current => {
                const byId = new Map();
                current.forEach(invitations =>
                    invitations.forEach(invitation =>
                        byId.set(invitation.id, invitation)
                    )
                );
                return groupBy(
                    (snapshot.invitations || [])
                        .filter(
                            invitation =>
                                !invitation.revoked_at &&
                                !invitation.used_at &&
                                invitation.expires_at > new Date().toISOString()
                        )
                        .map(invitation => ({
                            ...invitation,
                            url: byId.get(invitation.id)?.url || null,
                        })),
                    invitation => invitation.list_id
                );
            });
            setIdentity(snapshot.identity);
            identityRef.current = snapshot.identity;
            setSyncStatus('Synced');
            setIsReady(true);
        },
        [setLists, setTasks]
    );

    const refresh = useCallback(async () => {
        if (!configured || !syncEnabled) return null;
        if (refreshPromiseRef.current) return refreshPromiseRef.current;

        setSyncStatus('Syncing');
        refreshPromiseRef.current = loadCollaborationSnapshot()
            .then(snapshot => {
                if (snapshot) return applySnapshot(snapshot);
                return null;
            })
            .catch(caught => {
                setError(caught);
                setSyncStatus('Needs attention');
                throw caught;
            })
            .finally(() => {
                refreshPromiseRef.current = null;
            });
        return refreshPromiseRef.current;
    }, [applySnapshot, configured, syncEnabled]);

    const requireRecovery = useCallback(({ existing, keyring, user }) => {
        if (!keyring?.encrypted_account_key) {
            throw new Error('This guest identity is bound to another device.');
        }
        setRecoveryKeyring({
            ...keyring,
            publicKey: existing.public_key,
            user,
        });
        setNeedsRecovery(true);
        setIsAccountDialogOpen(true);
        const recoveryError = new Error(
            'Enter your recovery key to unlock encrypted sync.'
        );
        recoveryError.code = 'RECOVERY_REQUIRED';
        throw recoveryError;
    }, []);

    const resolveSessionIdentity = useCallback(
        async user => {
            let localIdentity = await loadCollaborationIdentity();
            if (localIdentity?.record.userId === user.id) {
                identityRef.current = localIdentity;
                setIdentity(localIdentity);
                return localIdentity;
            }

            const supabase = getSupabaseClient();
            const [existingResult, keyringResult] = await Promise.all([
                supabase
                    .from('collaboration_identities')
                    .select('user_id,public_key')
                    .eq('user_id', user.id)
                    .maybeSingle(),
                supabase
                    .from('identity_keyrings')
                    .select(
                        'encrypted_private_key,encrypted_account_key,recovery_iv,recovery_salt'
                    )
                    .eq('user_id', user.id)
                    .maybeSingle(),
            ]);
            if (existingResult.error) throw existingResult.error;
            if (keyringResult.error) throw keyringResult.error;
            if (existingResult.data) {
                return requireRecovery({
                    existing: existingResult.data,
                    keyring: keyringResult.data,
                    user,
                });
            }

            if (localIdentity?.record.userId !== user.id) {
                const hasPendingHandoff =
                    await hasPendingCollaborationIdentityHandoff();
                if (!hasPendingHandoff || user.is_anonymous) {
                    throw new Error(
                        'This device vault belongs to another account. Start an account handoff before switching identities.'
                    );
                }
            }

            localIdentity = await createCollaborationIdentity({
                email: user.email || null,
                isAnonymous: user.is_anonymous,
                userId: user.id,
            });
            await registerCollaborationIdentity(localIdentity);
            if (!user.is_anonymous) {
                await claimPendingCollaborationIdentityHandoff(localIdentity);
            }
            setRecoveryCode(localIdentity.recoveryCode);
            setNeedsRecovery(false);
            setRecoveryKeyring(null);
            identityRef.current = localIdentity;
            setIdentity(localIdentity);
            return localIdentity;
        },
        [requireRecovery]
    );

    const ensureIdentity = useCallback(
        async ({ captchaToken } = {}) => {
            const session = await ensureCollaborationSession({ captchaToken });
            if (!session?.user) {
                throw new Error(
                    'A collaboration session could not be created.'
                );
            }
            return resolveSessionIdentity(session.user);
        },
        [resolveSessionIdentity]
    );

    const onRecoverIdentity = useCallback(
        async recoveryInput => {
            if (!recoveryKeyring) {
                throw new Error('No encrypted account is waiting to recover.');
            }
            setPendingActionId('recover-account');
            try {
                const recovered = await recoverCollaborationIdentity({
                    email: recoveryKeyring.user.email || null,
                    encryptedPrivateKey: recoveryKeyring.encrypted_private_key,
                    protectedAccountKey: {
                        algorithm: 'AES-256-GCM',
                        ciphertext: recoveryKeyring.encrypted_account_key,
                        iterations: RECOVERY_ITERATIONS,
                        iv: recoveryKeyring.recovery_iv,
                        kdf: 'PBKDF2-SHA256',
                        salt: recoveryKeyring.recovery_salt,
                        version: 1,
                    },
                    publicKey: recoveryKeyring.publicKey,
                    recoveryCode: recoveryInput,
                    userId: recoveryKeyring.user.id,
                });
                identityRef.current = recovered;
                setIdentity(recovered);
                await claimPendingCollaborationIdentityHandoff(recovered);
                setNeedsRecovery(false);
                setRecoveryKeyring(null);
                if (syncEnabled) await refresh();
                return recovered;
            } finally {
                setPendingActionId(null);
            }
        },
        [recoveryKeyring, refresh, syncEnabled]
    );

    const onEnableSync = useCallback(
        async ({ captchaToken } = {}) => {
            if (!configured) {
                throw new Error('Encrypted sync is not configured.');
            }
            setError(null);
            setSyncStatus('Encrypting local lists');
            try {
                const localIdentity = await ensureIdentity({ captchaToken });
                const cloudLists = listsRef.current.filter(
                    list => !list.is_private_copy
                );
                const cloudListIds = new Set(cloudLists.map(list => list.id));
                await importPlannerToCollaboration({
                    identity: localIdentity,
                    lists: cloudLists,
                    tasks: tasksRef.current.filter(
                        task =>
                            !task.is_private_copy &&
                            cloudListIds.has(task.list_id)
                    ),
                });
                const remoteSnapshot = await loadCollaborationSnapshot();
                if (!remoteSnapshot) {
                    throw new Error('The encrypted vault could not be loaded.');
                }
                const snapshot = await migrateLocalAttachmentsToCollaboration({
                    identity: localIdentity,
                    snapshot: remoteSnapshot,
                    syncEntity: syncCollaborationEntity,
                });
                await applySnapshot(snapshot);
                setSyncEnabled(true);
                setSyncStatus('Synced');
                setIsShareDialogOpen(true);
            } catch (caught) {
                setError(caught);
                setSyncStatus('Needs attention');
                throw caught;
            }
        },
        [applySnapshot, configured, ensureIdentity, setSyncEnabled]
    );

    useEffect(() => {
        if (!configured || !syncEnabled) {
            setIsReady(!syncEnabled);
            return;
        }
        void ensureIdentity()
            .then(() => refresh())
            .catch(caught => {
                setError(caught);
                setSyncStatus('Needs attention');
            });
    }, [configured, ensureIdentity, refresh, syncEnabled]);

    useEffect(() => {
        if (!configured) return undefined;
        return subscribeToCollaborationAuth((_event, session) => {
            const user = session?.user;
            if (!user || user.is_anonymous) return;
            void loadCollaborationIdentity()
                .then(localIdentity => {
                    if (localIdentity?.record.userId === user.id) {
                        return finalizeCollaborationAccountUpgrade(user);
                    }
                    return resolveSessionIdentity(user).then(nextIdentity => ({
                        identity: nextIdentity,
                        recoveryCode: nextIdentity.recoveryCode || null,
                    }));
                })
                .then(result => {
                    if (!result) return;
                    identityRef.current = result.identity;
                    setIdentity(result.identity);
                    setRecoveryCode(result.recoveryCode);
                    setIsAccountDialogOpen(Boolean(result.recoveryCode));
                    if (syncEnabled) void refresh();
                })
                .catch(caught => setError(caught));
        });
    }, [configured, refresh, resolveSessionIdentity, syncEnabled]);

    useEffect(() => {
        if (!configured) return undefined;
        const receiveDeepLink = value => {
            const directInvitation = parseInvitationUrl(value);
            if (directInvitation) {
                setPendingInvitationUrl(value);
                setIsShareDialogOpen(true);
                return;
            }
            const deepLink = parseDailyPlannerDeepLink(value);
            if (deepLink?.type === 'auth') {
                void exchangeCollaborationAuthCallback(value).catch(caught =>
                    setError(caught)
                );
                return;
            }
            if (deepLink?.type === 'share') {
                const origin = configuration.appUrl || window.location.origin;
                const canonical = new URL(
                    `/share/${encodeURIComponent(deepLink.listId)}`,
                    origin
                );
                canonical.hash = deepLink.url.hash;
                setPendingInvitationUrl(canonical.toString());
                setIsShareDialogOpen(true);
            }
        };

        if (parseInvitationUrl(window.location.href)) {
            receiveDeepLink(window.location.href);
        }
        return subscribeToDailyPlannerDeepLinks(receiveDeepLink);
    }, [configured, configuration.appUrl]);

    const processOperation = useCallback(
        async operation => {
            const entityId = operation.entity.id;
            if (inFlightEntityIdsRef.current.has(entityId)) return;
            inFlightEntityIdsRef.current.add(entityId);
            setSyncStatus('Syncing');
            try {
                const currentIdentity = identityRef.current;
                let result;
                if (!operation.entity.collaboration_revision) {
                    if (operation.recordType === 'list') {
                        const relatedTasks = tasksRef.current.filter(
                            task => task.list_id === entityId
                        );
                        const [imported] = await importPlannerToCollaboration({
                            identity: currentIdentity,
                            lists: [operation.entity],
                            tasks: relatedTasks,
                        });
                        setLists(current =>
                            current.map(list =>
                                list.id === entityId
                                    ? {
                                          ...list,
                                          collaboration_revision:
                                              imported.revision,
                                          key_version: imported.keyVersion,
                                          owner_identity_id:
                                              currentIdentity.record.userId,
                                      }
                                    : list
                            )
                        );
                        const taskRevisions = new Map(
                            imported.taskRevisions.map(task => [task.id, task])
                        );
                        setTasks(current =>
                            current.map(task =>
                                taskRevisions.has(task.id)
                                    ? {
                                          ...task,
                                          collaboration_revision: 1,
                                          creator_identity_id:
                                              currentIdentity.record.userId,
                                          key_version: imported.keyVersion,
                                      }
                                    : task
                            )
                        );
                        result = { entity: operation.entity, revision: 1 };
                    } else {
                        result = await createCollaborationTask({
                            identity: currentIdentity,
                            task: operation.entity,
                        });
                    }
                } else {
                    result = await syncCollaborationEntity({
                        base: operation.base,
                        entity: operation.entity,
                        identity: currentIdentity,
                        recordType: operation.recordType,
                    });
                }

                if (result.conflict) {
                    setConflicts(current =>
                        current.concat({
                            ...result.conflict,
                            entityId,
                            id: createPlannerId(),
                        })
                    );
                } else if (operation.recordType === 'list') {
                    const syncedEntity = {
                        ...operation.entity,
                        ...result.entity,
                        collaboration_revision: result.revision,
                    };
                    baseListsRef.current.set(entityId, syncedEntity);
                    setLists(current =>
                        current.map(list =>
                            list.id === entityId
                                ? {
                                      ...list,
                                      ...result.entity,
                                      collaboration_revision: result.revision,
                                  }
                                : list
                        )
                    );
                } else {
                    const syncedEntity = {
                        ...operation.entity,
                        ...result.entity,
                        collaboration_revision: result.revision,
                    };
                    baseTasksRef.current.set(entityId, syncedEntity);
                    setTasks(current =>
                        current.map(task =>
                            task.id === entityId
                                ? {
                                      ...task,
                                      ...result.entity,
                                      collaboration_revision: result.revision,
                                  }
                                : task
                        )
                    );
                    if (result.movedComments?.length) {
                        const movedCommentById = new Map(
                            result.movedComments.map(comment => [
                                comment.id,
                                comment,
                            ])
                        );
                        setComments(current =>
                            current.map(
                                comment =>
                                    movedCommentById.get(comment.id) || comment
                            )
                        );
                    }
                }
                await removeCollaborationOperation(operation.id);
                setSyncStatus(result.conflict ? 'Conflict' : 'Synced');
            } catch (caught) {
                setError(caught);
                setSyncStatus(navigator.onLine ? 'Needs attention' : 'Offline');
            } finally {
                inFlightEntityIdsRef.current.delete(entityId);
            }
        },
        [setLists, setTasks]
    );

    useEffect(() => {
        if (!configured || !syncEnabled || !isReady || !identity) return;
        if (syncTimerRef.current !== null) {
            window.clearTimeout(syncTimerRef.current);
        }
        syncTimerRef.current = window.setTimeout(async () => {
            const operations = [];
            const cloudListIds = new Set(
                listsRef.current
                    .filter(list => list.collaboration_revision)
                    .map(list => list.id)
            );
            for (const list of listsRef.current) {
                if (
                    list.is_private_copy ||
                    inFlightEntityIdsRef.current.has(list.id)
                ) {
                    continue;
                }
                const base = baseListsRef.current.get(list.id);
                if (
                    !base ||
                    entityFingerprint(base) !== entityFingerprint(list)
                ) {
                    operations.push({ base, entity: list, recordType: 'list' });
                }
            }
            for (const task of tasksRef.current) {
                if (
                    task.is_private_copy ||
                    !cloudListIds.has(task.list_id) ||
                    inFlightEntityIdsRef.current.has(task.id)
                ) {
                    continue;
                }
                const base = baseTasksRef.current.get(task.id);
                if (
                    !base ||
                    entityFingerprint(base) !== entityFingerprint(task)
                ) {
                    operations.push({ base, entity: task, recordType: 'task' });
                }
            }

            for (const operation of operations) {
                const id = await enqueueCollaborationOperation(operation);
                void processOperation({ ...operation, id });
            }
        }, SYNC_DEBOUNCE_MS);

        return () => window.clearTimeout(syncTimerRef.current);
    }, [
        configured,
        identity,
        isReady,
        lists,
        processOperation,
        syncEnabled,
        tasks,
    ]);

    useEffect(() => {
        if (!configured || !syncEnabled || !isReady || !identity) return;
        void loadCollaborationOutbox().then(operations => {
            operations.forEach(operation => void processOperation(operation));
        });
    }, [configured, identity, isReady, processOperation, syncEnabled]);

    useEffect(() => {
        const supabase = getSupabaseClient();
        const userId = identity?.record?.userId;
        if (!supabase || !syncEnabled || !userId) return undefined;

        void supabase.realtime.setAuth();
        const userChannel = supabase
            .channel(`user:${userId}`, { config: { private: true } })
            .on('broadcast', { event: 'access_changed' }, () => void refresh())
            .on('broadcast', { event: 'notification_created' }, () => {
                if (notificationsEnabled) {
                    void showGenericCollaborationNotification();
                }
            })
            .subscribe();
        const listChannel = selectedListId
            ? supabase
                  .channel(`list:${selectedListId}`, {
                      config: { private: true, presence: { key: userId } },
                  })
                  .on('broadcast', { event: '*' }, () => void refresh())
                  .on('presence', { event: 'sync' }, () => {
                      const state = listChannel.presenceState();
                      const present = new Map();
                      Object.values(state)
                          .flat()
                          .forEach(value => present.set(value.userId, value));
                      setPresenceByIdentityId(present);
                  })
                  .subscribe(async status => {
                      if (status === 'SUBSCRIBED') {
                          await listChannel.track({
                              selectedTaskId,
                              sessionId: createPlannerId(),
                              userId,
                          });
                      }
                  })
            : null;

        return () => {
            void supabase.removeChannel(userChannel);
            if (listChannel) void supabase.removeChannel(listChannel);
        };
    }, [
        identity,
        notificationsEnabled,
        refresh,
        selectedListId,
        selectedTaskId,
        syncEnabled,
    ]);

    const profileByIdentityId = useMemo(
        () => new Map(profiles.map(profile => [profile.identity_id, profile])),
        [profiles]
    );
    const profileByListAndIdentityId = useMemo(
        () =>
            new Map(
                profiles.map(profile => [
                    `${profile.list_id}:${profile.identity_id}`,
                    profile,
                ])
            ),
        [profiles]
    );
    const getProfileForList = useCallback(
        (listId, identityId) =>
            profileByListAndIdentityId.get(`${listId}:${identityId}`) ||
            profileByIdentityId.get(identityId),
        [profileByIdentityId, profileByListAndIdentityId]
    );
    const membershipsByListId = useMemo(
        () =>
            groupBy(
                memberships.filter(member => member.state === 'active'),
                member => member.list_id
            ),
        [memberships]
    );
    const membersByListId = useMemo(() => {
        const result = new Map();
        membershipsByListId.forEach((listMemberships, listId) => {
            result.set(
                listId,
                listMemberships.map(member => ({
                    ...member,
                    isPresent: presenceByIdentityId.has(member.user_id),
                    profile: getProfileForList(listId, member.user_id),
                }))
            );
        });
        return result;
    }, [getProfileForList, membershipsByListId, presenceByIdentityId]);
    const roleByListId = useMemo(() => {
        const userId = identity?.record?.userId;
        return new Map(
            memberships
                .filter(
                    member =>
                        member.user_id === userId && member.state === 'active'
                )
                .map(member => [member.list_id, member.role])
        );
    }, [identity, memberships]);
    const commentsByTaskId = useMemo(
        () => groupBy(comments, comment => comment.task_id),
        [comments]
    );
    const unreadCommentCountByTaskId = useMemo(() => {
        const lastReadByTaskId = new Map(
            threadReads.map(read => [read.task_id, read.last_read_at])
        );
        const counts = new Map();
        comments.forEach(comment => {
            const lastReadAt = lastReadByTaskId.get(comment.task_id);
            if (!lastReadAt || comment.created_at > lastReadAt) {
                counts.set(
                    comment.task_id,
                    (counts.get(comment.task_id) || 0) + 1
                );
            }
        });
        return counts;
    }, [comments, threadReads]);

    const onAcceptPendingInvitation = useCallback(
        async ({ captchaToken } = {}) => {
            if (!pendingInvitationUrl) return null;
            setPendingActionId('accept-invitation');
            setError(null);
            try {
                const currentIdentity = await ensureIdentity({ captchaToken });
                const localLists = listsRef.current.filter(
                    list =>
                        !list.collaboration_revision && !list.is_private_copy
                );
                const localListIds = new Set(localLists.map(list => list.id));
                await importPlannerToCollaboration({
                    identity: currentIdentity,
                    lists: localLists,
                    tasks: tasksRef.current.filter(
                        task =>
                            !task.is_private_copy &&
                            localListIds.has(task.list_id)
                    ),
                });
                const redeemed = await redeemCollaborationInvitation({
                    identity: currentIdentity,
                    invitationUrl: pendingInvitationUrl,
                });
                const remoteSnapshot = await loadCollaborationSnapshot();
                if (!remoteSnapshot) {
                    throw new Error('The shared list could not be loaded.');
                }
                const snapshot = await migrateLocalAttachmentsToCollaboration({
                    identity: currentIdentity,
                    snapshot: remoteSnapshot,
                    syncEntity: syncCollaborationEntity,
                });
                await applySnapshot(snapshot);
                setSyncEnabled(true);
                setSelectedListId(redeemed.listId);
                setSelectedTaskId(
                    snapshot.tasks.find(
                        task =>
                            task.list_id === redeemed.listId && !task.isComplete
                    )?.id || null
                );
                if (window.location.protocol.startsWith('http')) {
                    window.history.replaceState(
                        null,
                        '',
                        scrubInvitationUrl(window.location.href)
                    );
                }
                setPendingInvitationUrl(null);
                setIsShareDialogOpen(false);
                return redeemed;
            } catch (caught) {
                setError(caught);
                throw caught;
            } finally {
                setPendingActionId(null);
            }
        },
        [
            applySnapshot,
            ensureIdentity,
            pendingInvitationUrl,
            setSelectedListId,
            setSelectedTaskId,
            setSyncEnabled,
        ]
    );

    const onCreateShareLink = useCallback(async (listId, role) => {
        const currentIdentity = identityRef.current;
        const list = listsRef.current.find(item => item.id === listId);
        const invitation = await createCollaborationInvitation({
            identity: currentIdentity,
            keyVersion: list.key_version || 1,
            listId,
            role,
        });
        setInvitationsByListId(current => {
            const next = new Map(current);
            next.set(listId, [...(next.get(listId) || []), invitation]);
            return next;
        });
        await navigator.clipboard?.writeText(invitation.url);
        return invitation;
    }, []);

    const onRevokeInvitation = useCallback(async (listId, invitationId) => {
        await revokeCollaborationInvitation(listId, invitationId);
        setInvitationsByListId(current => {
            const next = new Map(current);
            next.set(
                listId,
                (next.get(listId) || []).filter(
                    item => item.id !== invitationId
                )
            );
            return next;
        });
    }, []);

    const onUpdateMemberRole = useCallback(
        async (listId, userId, role) => {
            const member = memberships.find(
                value => value.list_id === listId && value.user_id === userId
            );
            if (!member) throw new Error('That collaborator is unavailable.');
            setPendingActionId(`member-role:${userId}`);
            try {
                await updateCollaborationMemberRole({ listId, member, role });
                await refresh();
            } finally {
                setPendingActionId(null);
            }
        },
        [memberships, refresh]
    );

    const onRemoveMember = useCallback(
        async (listId, userId) => {
            const member = memberships.find(
                value => value.list_id === listId && value.user_id === userId
            );
            if (!member) throw new Error('That collaborator is unavailable.');
            setPendingActionId(`remove-member:${userId}`);
            try {
                const rotation = await removeCollaborationMember({
                    identity: identityRef.current,
                    listId,
                    member,
                });
                setLists(current =>
                    current.map(list =>
                        list.id === listId
                            ? {
                                  ...list,
                                  collaboration_revision: rotation.revision,
                                  key_version: rotation.keyVersion,
                              }
                            : list
                    )
                );
                setTasks(current =>
                    current.map(task =>
                        task.list_id === listId
                            ? { ...task, key_version: rotation.keyVersion }
                            : task
                    )
                );
                await refresh();
            } finally {
                setPendingActionId(null);
            }
        },
        [memberships, refresh, setLists, setTasks]
    );

    const onLeaveSharedList = useCallback(
        async listId => {
            setPendingActionId(`leave-list:${listId}`);
            try {
                await leaveCollaborationList({
                    identity: identityRef.current,
                    listId,
                });
                await refresh();
                setIsShareDialogOpen(false);
            } finally {
                setPendingActionId(null);
            }
        },
        [refresh]
    );

    const onTransferOwnership = useCallback(
        async (listId, newOwnerId, formerOwnerRole) => {
            const newOwner = memberships.find(
                value =>
                    value.list_id === listId && value.user_id === newOwnerId
            );
            if (!newOwner) throw new Error('Choose an active collaborator.');
            setPendingActionId(`transfer-owner:${newOwnerId}`);
            try {
                await transferCollaborationOwnership({
                    formerOwnerRole,
                    identity: identityRef.current,
                    listId,
                    newOwner,
                });
                await refresh();
            } finally {
                setPendingActionId(null);
            }
        },
        [memberships, refresh]
    );

    const onCreateComment = useCallback(
        async (taskId, body, { parentCommentId = null } = {}) => {
            const task = tasksRef.current.find(item => item.id === taskId);
            const listMembers = membersByListId.get(task.list_id) || [];
            const mentionedUserIds = listMembers
                .filter(member => {
                    const name = member.profile?.display_name;
                    return name && body.includes(`@${name}`);
                })
                .map(member => member.user_id);
            const comment = await createEncryptedComment({
                body,
                identity: identityRef.current,
                keyVersion: task.key_version || 1,
                listId: task.list_id,
                mentionedUserIds,
                parentCommentId,
                taskId,
            });
            setComments(current => current.concat(comment));
            await markEncryptedCommentThreadRead({
                listId: task.list_id,
                taskId,
            });
            setThreadReads(current =>
                current
                    .filter(read => read.task_id !== taskId)
                    .concat({
                        last_read_at: new Date().toISOString(),
                        list_id: task.list_id,
                        task_id: taskId,
                    })
            );
            return comment;
        },
        [membersByListId]
    );

    const onDeleteComment = useCallback(async comment => {
        await deleteEncryptedComment({ comment, listId: comment.list_id });
        setComments(current => current.filter(item => item.id !== comment.id));
    }, []);

    const onMarkCommentThreadRead = useCallback(async taskId => {
        const task = tasksRef.current.find(item => item.id === taskId);
        if (!task) return;
        await markEncryptedCommentThreadRead({
            listId: task.list_id,
            taskId,
        });
        setThreadReads(current =>
            current
                .filter(read => read.task_id !== taskId)
                .concat({
                    last_read_at: new Date().toISOString(),
                    list_id: task.list_id,
                    task_id: taskId,
                })
        );
    }, []);

    const onResolveFieldConflict = useCallback(
        async (conflictId, choices) => {
            const conflict = conflicts.find(value => value.id === conflictId);
            if (!conflict) return;
            const resolved = {
                ...conflict.merged,
                collaboration_revision: conflict.remoteRevision,
                key_version:
                    conflict.remoteKeyVersion || conflict.local.key_version,
            };
            Object.entries(choices).forEach(([field, selection]) => {
                if (selection.value === undefined) delete resolved[field];
                else resolved[field] = selection.value;
            });
            const result = await syncCollaborationEntity({
                base: conflict.remote,
                entity: resolved,
                identity: identityRef.current,
                recordType: conflict.recordType,
            });
            if (result.conflict) {
                throw new Error('The item changed again while resolving it.');
            }
            const next = {
                ...result.entity,
                collaboration_revision: result.revision,
            };
            if (conflict.recordType === 'list') {
                baseListsRef.current.set(next.id, next);
                setLists(current =>
                    current.map(item => (item.id === next.id ? next : item))
                );
            } else {
                baseTasksRef.current.set(next.id, next);
                setTasks(current =>
                    current.map(item => (item.id === next.id ? next : item))
                );
            }
            setConflicts(current =>
                current.filter(value => value.id !== conflictId)
            );
        },
        [conflicts, setLists, setTasks]
    );

    const onSaveConflictAsPrivateCopy = useCallback(
        async conflictId => {
            const conflict = conflicts.find(value => value.id === conflictId);
            if (!conflict) return;
            const stripCloudFields = value => {
                const copy = { ...value };
                Object.keys(copy).forEach(key => {
                    if (
                        key.startsWith('collaboration_') ||
                        [
                            'creator_identity_id',
                            'key_version',
                            'owner_identity_id',
                        ].includes(key)
                    ) {
                        delete copy[key];
                    }
                });
                return copy;
            };
            if (conflict.recordType === 'list') {
                const copy = stripCloudFields(conflict.local);
                copy.id = createPlannerId();
                copy.isArchived = false;
                copy.is_private_copy = true;
                copy.label = `${copy.label || 'Recovered list'} (Private copy)`;
                setLists(current => current.concat(copy));
                setSelectedListId(copy.id);
                setSelectedTaskId(null);
            } else {
                const sourceList = listsRef.current.find(
                    list => list.id === conflict.local.list_id
                );
                const privateListId = createPlannerId();
                const privateList = {
                    accent_key: sourceList?.accent_key,
                    id: privateListId,
                    isArchived: false,
                    is_private_copy: true,
                    label: `${sourceList?.label || 'Recovered'} (Private copy)`,
                };
                const copy = stripCloudFields(conflict.local);
                copy.id = createPlannerId();
                copy.isComplete = false;
                copy.is_private_copy = true;
                copy.list_id = privateListId;
                setLists(current => current.concat(privateList));
                setTasks(current => current.concat(copy));
                setSelectedListId(privateListId);
                setSelectedTaskId(copy.id);
            }
            setConflicts(current =>
                current.filter(value => value.id !== conflictId)
            );
        },
        [conflicts, setLists, setSelectedListId, setSelectedTaskId, setTasks]
    );

    const onDiscardConflict = useCallback(
        async conflictId => {
            setConflicts(current =>
                current.filter(value => value.id !== conflictId)
            );
            await refresh();
        },
        [refresh]
    );

    const onContinueWithGoogle = useCallback(async () => {
        setPendingActionId('account-google');
        try {
            await continueCollaborationWithGoogle();
        } finally {
            setPendingActionId(null);
        }
    }, []);

    const onContinueWithEmail = useCallback(async options => {
        setPendingActionId('account-email');
        try {
            await continueCollaborationWithEmail(options);
        } finally {
            setPendingActionId(null);
        }
    }, []);

    const onSignInToExistingWithGoogle = useCallback(async () => {
        setPendingActionId('existing-account-google');
        setError(null);
        try {
            const currentIdentity = identityRef.current;
            if (!currentIdentity?.record?.isAnonymous) {
                throw new Error('A guest identity is required for handoff.');
            }
            await createCollaborationIdentityHandoff(currentIdentity);
            await signInToExistingCollaborationWithGoogle();
        } catch (caught) {
            setError(caught);
            throw caught;
        } finally {
            setPendingActionId(null);
        }
    }, []);

    const onSignInToExistingWithEmail = useCallback(async options => {
        setPendingActionId('existing-account-email');
        setError(null);
        try {
            const currentIdentity = identityRef.current;
            if (!currentIdentity?.record?.isAnonymous) {
                throw new Error('A guest identity is required for handoff.');
            }
            await createCollaborationIdentityHandoff(currentIdentity);
            await signInToExistingCollaborationWithEmail(options);
        } catch (caught) {
            setError(caught);
            throw caught;
        } finally {
            setPendingActionId(null);
        }
    }, []);

    const onChangeNotificationsEnabled = useCallback(
        async nextEnabled => {
            setPendingActionId('notifications');
            try {
                const enabled = nextEnabled
                    ? await enableCollaborationNotifications()
                    : await disableCollaborationNotifications();
                setNotificationsEnabled(enabled);
                return enabled;
            } catch (caught) {
                setError(caught);
                throw caught;
            } finally {
                setPendingActionId(null);
            }
        },
        [setNotificationsEnabled]
    );

    const onCopyRecoveryKey = useCallback(() => {
        if (recoveryCode) navigator.clipboard?.writeText(recoveryCode);
    }, [recoveryCode]);

    const actions = useMemo(
        () => ({
            onAcceptPendingInvitation,
            onChangeAccountDialogOpen: setIsAccountDialogOpen,
            onChangeNotificationsEnabled,
            onChangeShareDialogOpen: setIsShareDialogOpen,
            onContinueWithEmail,
            onContinueWithGoogle,
            onCopyRecoveryKey,
            onCreateComment,
            onCreateShareLink,
            onDeleteComment,
            onDiscardConflict,
            onEnableSync,
            onLeaveSharedList,
            onMarkCommentThreadRead,
            onRecoverIdentity,
            onRemoveMember,
            onResolveFieldConflict,
            onRevokeInvitation,
            onSaveConflictAsPrivateCopy,
            onSignInToExistingWithEmail,
            onSignInToExistingWithGoogle,
            onTransferOwnership,
            onUpdateMemberRole,
        }),
        [
            onAcceptPendingInvitation,
            onChangeNotificationsEnabled,
            onContinueWithEmail,
            onContinueWithGoogle,
            onCopyRecoveryKey,
            onCreateComment,
            onCreateShareLink,
            onDeleteComment,
            onDiscardConflict,
            onEnableSync,
            onLeaveSharedList,
            onMarkCommentThreadRead,
            onRecoverIdentity,
            onRemoveMember,
            onResolveFieldConflict,
            onRevokeInvitation,
            onSaveConflictAsPrivateCopy,
            onSignInToExistingWithEmail,
            onSignInToExistingWithGoogle,
            onTransferOwnership,
            onUpdateMemberRole,
        ]
    );
    const data = useMemo(
        () => ({
            commentsByTaskId,
            conflicts,
            error,
            identity,
            getProfileForList,
            invitationsByListId,
            isAccountDialogOpen,
            isConfigured: configured,
            isEnabled: syncEnabled,
            isReady,
            isShareDialogOpen,
            membersByListId,
            needsRecovery,
            notificationsEnabled,
            pendingActionId,
            pendingInvitationUrl,
            presenceByIdentityId,
            profileByIdentityId,
            recoveryCode,
            roleByListId,
            syncStatus,
            turnstileSiteKey: configuration.turnstileSiteKey,
            unreadCommentCountByTaskId,
        }),
        [
            commentsByTaskId,
            configuration.turnstileSiteKey,
            configured,
            conflicts,
            error,
            getProfileForList,
            identity,
            invitationsByListId,
            isAccountDialogOpen,
            isReady,
            isShareDialogOpen,
            membersByListId,
            needsRecovery,
            notificationsEnabled,
            pendingActionId,
            pendingInvitationUrl,
            presenceByIdentityId,
            profileByIdentityId,
            recoveryCode,
            roleByListId,
            syncEnabled,
            syncStatus,
            unreadCommentCountByTaskId,
        ]
    );

    return useMemo(() => ({ actions, data }), [actions, data]);
}
