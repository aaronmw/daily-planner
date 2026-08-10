import { useCallback, useEffect, useRef, useState } from 'react';
import {
    useCollaboration,
    useCollaborationSelector,
} from '../../core/collaboration/CollaborationContext';
import {
    COLLABORATION_ROLES,
    roleHasCapability,
    type CollaborationRole,
} from '../../core/collaboration/roles';
import type {
    CollaborationInvitation,
    CollaborationMembership,
    CollaborationProfile,
} from '../../core/collaboration/types';
import type { IdentityId } from '../../core/domain/ids';
import { scrubInvitationUrl } from '../../core/collaboration/invitations';
import { usePlannerSelector } from '../../core/store/plannerContext';
import { collaborationIsConfigured } from '../../config/environment';
import { IconButton } from '../shell/IconButton';
import { CollaborationAvatar } from './CollaborationAvatar';
import { TurnstileChallenge } from './TurnstileChallenge';

const ROLE_LABELS: Record<CollaborationRole, string> = {
    comment: 'Read & Comment',
    full: 'Full',
    owner: 'Owner',
    read: 'Read',
    write: 'Write',
};

const SHAREABLE_ROLES = COLLABORATION_ROLES.filter(
    (role): role is Exclude<CollaborationRole, 'owner'> => role !== 'owner'
);
const EMPTY_INVITATIONS: readonly CollaborationInvitation[] = [];
const EMPTY_MEMBERSHIPS: readonly CollaborationMembership[] = [];
const EMPTY_PROFILES = new Map<IdentityId, CollaborationProfile>();

export function CollaborationDialog() {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const collaboration = useCollaboration();
    const syncStatus = usePlannerSelector(state => state.syncStatus);
    const selectedList = usePlannerSelector(state =>
        state.selectedListId
            ? (state.listsById.get(state.selectedListId) ?? null)
            : null
    );
    const identityId = useCollaborationSelector(state => state.identityId);
    const selectedMemberships = useCollaborationSelector(state =>
        selectedList
            ? state.membershipsByListId.get(selectedList.id)
            : undefined
    );
    const memberships = selectedMemberships ?? EMPTY_MEMBERSHIPS;
    const selectedProfiles = useCollaborationSelector(state =>
        selectedList ? state.profilesByListId.get(selectedList.id) : undefined
    );
    const profiles = selectedProfiles ?? EMPTY_PROFILES;
    const selectedInvitations = useCollaborationSelector(state =>
        selectedList
            ? state.invitationsByListId.get(selectedList.id)
            : undefined
    );
    const invitations = selectedInvitations ?? EMPTY_INVITATIONS;
    const pendingInvitationUrl = useCollaborationSelector(
        state => state.pendingInvitationUrl
    );
    const [challengeAction, setChallengeAction] = useState<
        'enable' | 'accept' | null
    >(null);
    const [inviteRole, setInviteRole] =
        useState<Exclude<CollaborationRole, 'owner'>>('read');
    const [formerOwnerRole, setFormerOwnerRole] = useState<Exclude<
        CollaborationRole,
        'owner'
    > | null>('full');
    const [transferOwnerId, setTransferOwnerId] = useState('');
    const [pendingAction, setPendingAction] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [recoveryCode, setRecoveryCode] = useState('');

    const currentMembership = memberships.find(
        membership =>
            membership.userId === identityId && membership.state === 'active'
    );
    const currentRole = currentMembership?.role ?? 'read';
    const canManage = roleHasCapability(currentRole, 'manage-access');
    const activeMembers = memberships.filter(
        member => member.state === 'active'
    );
    const transferCandidates = activeMembers.filter(
        member => member.userId !== identityId
    );

    useEffect(() => {
        if (pendingInvitationUrl) dialogRef.current?.showModal();
    }, [pendingInvitationUrl]);

    const run = useCallback(async (id: string, action: () => Promise<void>) => {
        setPendingAction(id);
        setError('');
        setMessage('');
        try {
            await action();
        } catch (caught) {
            setError(
                caught instanceof Error ? caught.message : 'The action failed.'
            );
        } finally {
            setPendingAction(null);
        }
    }, []);

    const onChallengeToken = useCallback(
        (token: string) => {
            const action = challengeAction;
            setChallengeAction(null);
            if (action === 'accept' && pendingInvitationUrl) {
                void run('accept', async () => {
                    await collaboration.acceptInvitation(
                        pendingInvitationUrl,
                        token
                    );
                    window.history.replaceState(
                        null,
                        '',
                        scrubInvitationUrl(window.location.href)
                    );
                    collaboration.clearPendingInvitation();
                    setMessage('Shared list added.');
                });
            } else if (action === 'enable') {
                void run('enable', async () => {
                    await collaboration.enableSync(token);
                    setMessage('Encrypted sync is enabled.');
                });
            }
        },
        [challengeAction, collaboration, pendingInvitationUrl, run]
    );

    const profileFor = (member: CollaborationMembership) =>
        profiles.get(member.userId) ?? null;

    return (
        <>
            <IconButton
                icon="user-plus"
                label="Share and access"
                onClick={() => dialogRef.current?.showModal()}
            />
            <dialog
                aria-label="Share and access"
                className="fixed inset-0 m-auto max-h-[calc(100dvh-24px)] w-[min(680px,calc(100vw-24px))] overflow-auto border-[length:var(--planner-stroke-width)] border-planner-border bg-planner-background p-0 text-planner-text shadow-2xl backdrop:bg-black/50"
                ref={dialogRef}
            >
                <header className="flex h-[45px] items-center border-b-[length:var(--planner-stroke-width)] border-planner-border">
                    <h2 className="min-w-0 flex-1 px-4 text-[1rem] font-semibold">
                        Share and access
                    </h2>
                    <IconButton
                        icon="xmark"
                        label="Close share and access"
                        onClick={() => dialogRef.current?.close()}
                    />
                </header>
                <div className="leading-[1.6]">
                    {error && (
                        <p
                            aria-live="assertive"
                            className="border-b-[length:var(--planner-stroke-width)] border-planner-border p-4 text-planner-danger"
                        >
                            {error}
                        </p>
                    )}
                    {error.toLowerCase().includes('recovery') && (
                        <section className="border-b-[length:var(--planner-stroke-width)] border-planner-border p-5">
                            <h3 className="font-semibold">
                                Unlock encrypted sync
                            </h3>
                            <label className="mt-3 block">
                                <span className="mb-1 block text-planner-text-faded">
                                    Recovery key
                                </span>
                                <input
                                    autoComplete="off"
                                    className="h-[45px] w-full border-[length:var(--planner-stroke-width)] border-planner-border bg-planner-background px-3 uppercase"
                                    onChange={event =>
                                        setRecoveryCode(event.target.value)
                                    }
                                    value={recoveryCode}
                                />
                            </label>
                            <button
                                className="mt-3 h-[45px] border-[length:var(--planner-stroke-width)] border-planner-border px-4 font-semibold hover:bg-planner-shaded"
                                disabled={
                                    !recoveryCode.trim() ||
                                    pendingAction === 'recover'
                                }
                                onClick={() =>
                                    void run('recover', async () => {
                                        await collaboration.recoverSync(
                                            recoveryCode
                                        );
                                        setRecoveryCode('');
                                        setMessage('Encrypted sync unlocked.');
                                    })
                                }
                                type="button"
                            >
                                Unlock
                            </button>
                        </section>
                    )}
                    {message && (
                        <p
                            aria-live="polite"
                            className="border-b-[length:var(--planner-stroke-width)] border-planner-border p-4"
                        >
                            {message}
                        </p>
                    )}

                    {pendingInvitationUrl ? (
                        <section className="p-5">
                            <h3 className="text-[1.15rem] font-semibold">
                                Encrypted invitation
                            </h3>
                            <p className="mt-2 text-planner-text-faded">
                                Add this single-use shared list to your
                                encrypted planner.
                            </p>
                            {challengeAction === 'accept' ? (
                                <div className="mt-4">
                                    <TurnstileChallenge
                                        onError={setError}
                                        onToken={onChallengeToken}
                                    />
                                </div>
                            ) : (
                                <button
                                    className="mt-4 h-[45px] border-[length:var(--planner-stroke-width)] border-planner-border px-4 font-semibold transition-colors hover:bg-planner-shaded"
                                    disabled={pendingAction === 'accept'}
                                    onClick={() => setChallengeAction('accept')}
                                    type="button"
                                >
                                    Accept shared list
                                </button>
                            )}
                        </section>
                    ) : syncStatus.status === 'local-only' ? (
                        <section className="p-5">
                            <p>Sync and encrypted sharing are currently off.</p>
                            {challengeAction === 'enable' ? (
                                <div className="mt-4">
                                    <TurnstileChallenge
                                        onError={setError}
                                        onToken={onChallengeToken}
                                    />
                                </div>
                            ) : (
                                <button
                                    className="mt-4 h-[45px] border-[length:var(--planner-stroke-width)] border-planner-border px-4 font-semibold transition-colors hover:bg-planner-shaded"
                                    disabled={!collaborationIsConfigured()}
                                    onClick={() => setChallengeAction('enable')}
                                    type="button"
                                >
                                    {collaborationIsConfigured()
                                        ? 'Enable Sync'
                                        : 'Sync is not configured'}
                                </button>
                            )}
                        </section>
                    ) : selectedList ? (
                        <>
                            <section className="border-b-[length:var(--planner-stroke-width)] border-planner-border p-5">
                                <h3 className="font-semibold">
                                    Invite someone
                                </h3>
                                <div className="mt-3 grid grid-cols-[1fr_auto]">
                                    <select
                                        aria-label="Invitation access"
                                        className="min-h-[45px] min-w-0 border-[length:var(--planner-stroke-width)] border-r-0 border-planner-border bg-planner-background px-3"
                                        disabled={!canManage}
                                        onChange={event =>
                                            setInviteRole(
                                                event.target.value as Exclude<
                                                    CollaborationRole,
                                                    'owner'
                                                >
                                            )
                                        }
                                        value={inviteRole}
                                    >
                                        {SHAREABLE_ROLES.map(role => (
                                            <option key={role} value={role}>
                                                {ROLE_LABELS[role]}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        className="min-h-[45px] border-[length:var(--planner-stroke-width)] border-planner-border px-4 font-semibold hover:bg-planner-shaded"
                                        disabled={
                                            !canManage ||
                                            pendingAction === 'invite'
                                        }
                                        onClick={() =>
                                            void run('invite', async () => {
                                                const invitation =
                                                    await collaboration.createInvitation(
                                                        selectedList.id,
                                                        inviteRole
                                                    );
                                                await navigator.clipboard.writeText(
                                                    invitation.url ?? ''
                                                );
                                                setMessage(
                                                    `${ROLE_LABELS[inviteRole]} link copied.`
                                                );
                                            })
                                        }
                                        type="button"
                                    >
                                        Create link
                                    </button>
                                </div>
                                {!canManage && (
                                    <p className="mt-2 text-planner-text-faded">
                                        Full access is required to invite
                                        people.
                                    </p>
                                )}
                                {invitations.map(invitation => (
                                    <div
                                        className="mt-2 grid min-h-[45px] grid-cols-[1fr_auto] items-center border-[length:var(--planner-stroke-width)] border-planner-border"
                                        key={invitation.id}
                                    >
                                        <button
                                            className="min-w-0 truncate px-3 text-left"
                                            disabled={!invitation.url}
                                            onClick={() =>
                                                void navigator.clipboard.writeText(
                                                    invitation.url ?? ''
                                                )
                                            }
                                            type="button"
                                        >
                                            {ROLE_LABELS[invitation.role]} link
                                        </button>
                                        <button
                                            className="h-full px-3 hover:bg-planner-shaded"
                                            onClick={() =>
                                                void run(
                                                    `revoke:${invitation.id}`,
                                                    () =>
                                                        collaboration.revokeInvitation(
                                                            selectedList.id,
                                                            invitation.id
                                                        )
                                                )
                                            }
                                            type="button"
                                        >
                                            Revoke
                                        </button>
                                    </div>
                                ))}
                            </section>

                            <section className="border-b-[length:var(--planner-stroke-width)] border-planner-border p-5">
                                <h3 className="font-semibold">
                                    People with access
                                </h3>
                                <div className="mt-3 border-[length:var(--planner-stroke-width)] border-planner-border">
                                    {activeMembers.map(member => {
                                        const profile = profileFor(member);
                                        return (
                                            <div
                                                className="grid min-h-[45px] grid-cols-[45px_minmax(0,1fr)_180px_45px] items-center border-b-[length:var(--planner-stroke-width)] border-planner-border last:border-b-0"
                                                key={member.userId}
                                            >
                                                <span className="grid size-[45px] place-items-center">
                                                    <CollaborationAvatar
                                                        isPresent={false}
                                                        labelPrefix="Collaborator"
                                                        profile={profile}
                                                    />
                                                </span>
                                                <span className="min-w-0 truncate">
                                                    {profile?.displayName ??
                                                        'Former collaborator'}
                                                </span>
                                                <select
                                                    aria-label={`Access for ${profile?.displayName ?? 'collaborator'}`}
                                                    className="h-[45px] min-w-0 bg-planner-background px-2"
                                                    disabled={
                                                        !canManage ||
                                                        member.role === 'owner'
                                                    }
                                                    onChange={event =>
                                                        void run(
                                                            `role:${member.userId}`,
                                                            () =>
                                                                collaboration.updateMemberRole(
                                                                    selectedList.id,
                                                                    member,
                                                                    event.target
                                                                        .value as Exclude<
                                                                        CollaborationRole,
                                                                        'owner'
                                                                    >
                                                                )
                                                        )
                                                    }
                                                    value={member.role}
                                                >
                                                    {COLLABORATION_ROLES.map(
                                                        role => (
                                                            <option
                                                                disabled={
                                                                    role ===
                                                                    'owner'
                                                                }
                                                                key={role}
                                                                value={role}
                                                            >
                                                                {
                                                                    ROLE_LABELS[
                                                                        role
                                                                    ]
                                                                }
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                                {canManage &&
                                                member.role !== 'owner' ? (
                                                    <IconButton
                                                        icon="user-minus"
                                                        label={`Remove ${profile?.displayName ?? 'collaborator'}`}
                                                        onClick={() =>
                                                            void run(
                                                                `remove:${member.userId}`,
                                                                () =>
                                                                    collaboration.removeMember(
                                                                        selectedList.id,
                                                                        member
                                                                    )
                                                            )
                                                        }
                                                    />
                                                ) : (
                                                    <span />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>

                            {currentRole === 'owner' &&
                                transferCandidates.length > 0 && (
                                    <section className="border-b-[length:var(--planner-stroke-width)] border-planner-border p-5">
                                        <h3 className="font-semibold">
                                            Transfer ownership
                                        </h3>
                                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                            <select
                                                aria-label="New Owner"
                                                className="h-[45px] border-[length:var(--planner-stroke-width)] border-planner-border bg-planner-background px-3"
                                                onChange={event =>
                                                    setTransferOwnerId(
                                                        event.target.value
                                                    )
                                                }
                                                value={transferOwnerId}
                                            >
                                                <option value="">
                                                    Choose new Owner
                                                </option>
                                                {transferCandidates.map(
                                                    member => (
                                                        <option
                                                            key={member.userId}
                                                            value={
                                                                member.userId
                                                            }
                                                        >
                                                            {profileFor(member)
                                                                ?.displayName ??
                                                                'Collaborator'}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                            <select
                                                aria-label="Your access after transfer"
                                                className="h-[45px] border-[length:var(--planner-stroke-width)] border-planner-border bg-planner-background px-3"
                                                onChange={event =>
                                                    setFormerOwnerRole(
                                                        event.target.value ===
                                                            'remove'
                                                            ? null
                                                            : (event.target
                                                                  .value as Exclude<
                                                                  CollaborationRole,
                                                                  'owner'
                                                              >)
                                                    )
                                                }
                                                value={
                                                    formerOwnerRole ?? 'remove'
                                                }
                                            >
                                                {SHAREABLE_ROLES.map(role => (
                                                    <option
                                                        key={role}
                                                        value={role}
                                                    >
                                                        Keep {ROLE_LABELS[role]}
                                                    </option>
                                                ))}
                                                <option value="remove">
                                                    Remove me
                                                </option>
                                            </select>
                                        </div>
                                        <button
                                            className="mt-2 h-[45px] border-[length:var(--planner-stroke-width)] border-planner-border px-4 font-semibold hover:bg-planner-shaded"
                                            disabled={!transferOwnerId}
                                            onClick={() => {
                                                const member =
                                                    transferCandidates.find(
                                                        value =>
                                                            value.userId ===
                                                            transferOwnerId
                                                    );
                                                if (!member) return;
                                                void run('transfer', () =>
                                                    collaboration.transferOwnership(
                                                        selectedList.id,
                                                        member,
                                                        formerOwnerRole
                                                    )
                                                );
                                            }}
                                            type="button"
                                        >
                                            Transfer ownership
                                        </button>
                                    </section>
                                )}

                            {currentMembership && currentRole !== 'owner' && (
                                <section className="p-5">
                                    <button
                                        className="h-[45px] border-[length:var(--planner-stroke-width)] border-planner-danger px-4 text-planner-danger hover:bg-planner-shaded"
                                        onClick={() =>
                                            void run('leave', () =>
                                                collaboration.leaveList(
                                                    selectedList.id,
                                                    currentMembership
                                                )
                                            )
                                        }
                                        type="button"
                                    >
                                        Leave this list
                                    </button>
                                </section>
                            )}
                        </>
                    ) : (
                        <p className="p-5">Select a list to manage access.</p>
                    )}
                </div>
            </dialog>
        </>
    );
}
