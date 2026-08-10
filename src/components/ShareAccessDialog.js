import React, { useEffect, useId, useRef, useState } from 'react';
import { COLLABORATION_ROLE_ORDER, ROLES } from '../collaboration/roles';
import cx from '../utils/cx';
import CollaborationAvatar from './CollaborationAvatar';
import { IconButton } from './atoms/Button';
import { COPY, ICONS } from './atoms/tokens';
import TurnstileChallenge from './TurnstileChallenge';

const ROLE_LABELS = Object.freeze({
    [ROLES.READ]: 'Read',
    [ROLES.COMMENT]: 'Read & Comment',
    [ROLES.WRITE]: 'Write',
    [ROLES.FULL]: 'Full',
    [ROLES.OWNER]: 'Owner',
});

const SHAREABLE_ROLES = COLLABORATION_ROLE_ORDER.filter(
    role => role !== ROLES.OWNER
);

const noopAsync = async () => {};

const ShareAccessDialog = ({ appActions, appData }) => {
    const dialogId = useId();
    const dialogRef = useRef(null);
    const triggerRef = useRef(null);
    const [inviteRole, setInviteRole] = useState(ROLES.WRITE);
    const [isCreatingLink, setIsCreatingLink] = useState(false);
    const [isAcceptingInvitation, setIsAcceptingInvitation] = useState(false);
    const [captchaToken, setCaptchaToken] = useState(null);
    const [transferOwnerId, setTransferOwnerId] = useState('');
    const [formerOwnerRole, setFormerOwnerRole] = useState(ROLES.FULL);
    const collaboration = appData.collaboration || {};
    const {
        isConfigured = false,
        isEnabled = false,
        isShareDialogOpen = false,
        membersByListId = new Map(),
        invitationsByListId = new Map(),
        pendingActionId,
        pendingInvitationUrl,
        profileByIdentityId = new Map(),
        roleByListId = new Map(),
        turnstileSiteKey = '',
    } = collaboration;
    const {
        onAcceptPendingInvitation = noopAsync,
        onChangeShareDialogOpen = () => {},
        onCreateShareLink = noopAsync,
        onEnableSync = noopAsync,
        onLeaveSharedList = noopAsync,
        onRemoveMember = noopAsync,
        onRevokeInvitation = noopAsync,
        onTransferOwnership = noopAsync,
        onUpdateMemberRole = noopAsync,
    } = appActions;
    const listId = appData.selectedListId;
    const members = membersByListId.get(listId) || [];
    const invitations = invitationsByListId.get(listId) || [];
    const currentRole = roleByListId.get(listId) || ROLES.OWNER;
    const canManage = [ROLES.FULL, ROLES.OWNER].includes(currentRole);
    const currentUserId = collaboration.identity?.record?.userId;
    const transferCandidates = members.filter(
        member => member.user_id !== currentUserId
    );

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (isShareDialogOpen && !dialog.open) {
            dialog.showModal?.();
        } else if (!isShareDialogOpen && dialog.open) {
            dialog.close();
        }
    }, [isShareDialogOpen]);

    const closeDialog = () => {
        onChangeShareDialogOpen(false);
        requestAnimationFrame(() => triggerRef.current?.focus());
    };

    const createLink = async () => {
        if (isCreatingLink) return;
        setIsCreatingLink(true);
        try {
            await onCreateShareLink(listId, inviteRole);
        } finally {
            setIsCreatingLink(false);
        }
    };

    const acceptInvitation = async () => {
        if (isAcceptingInvitation) return;
        setIsAcceptingInvitation(true);
        try {
            await onAcceptPendingInvitation({ captchaToken });
        } finally {
            setIsAcceptingInvitation(false);
        }
    };

    return (
        <>
            <IconButton
                aria-controls={dialogId}
                aria-expanded={isShareDialogOpen}
                aria-haspopup="dialog"
                aria-label={COPY.LABEL_FOR_SHARE_AND_ACCESS}
                className={cx(
                    'planner-share-trigger border-0',
                    isEnabled && 'text-planner-primary'
                )}
                title={COPY.LABEL_FOR_SHARE_AND_ACCESS}
                onClick={() => onChangeShareDialogOpen(true)}
                ref={triggerRef}
            >
                {ICONS.SHARE}
            </IconButton>
            <dialog
                aria-labelledby={`${dialogId}-title`}
                className="planner-share-dialog"
                id={dialogId}
                onCancel={evt => {
                    evt.preventDefault();
                    closeDialog();
                }}
                onClose={() => onChangeShareDialogOpen(false)}
                ref={dialogRef}
            >
                <header className="planner-share-dialog-header">
                    <h2 id={`${dialogId}-title`}>
                        {COPY.LABEL_FOR_SHARE_AND_ACCESS}
                    </h2>
                    <IconButton
                        aria-label="Close"
                        title="Close"
                        onClick={closeDialog}
                    >
                        {ICONS.REMOVE_USER}
                    </IconButton>
                </header>
                <div className="planner-share-dialog-content">
                    {pendingInvitationUrl ? (
                        <section className="planner-share-section planner-share-accept-section">
                            <h3>Encrypted invitation</h3>
                            <p className="planner-share-dialog-message">
                                Accept this single-use invitation to add the
                                shared list to your encrypted planner.
                            </p>
                            {turnstileSiteKey ? (
                                <TurnstileChallenge
                                    onChange={setCaptchaToken}
                                    siteKey={turnstileSiteKey}
                                />
                            ) : null}
                            <button
                                aria-busy={isAcceptingInvitation || undefined}
                                className="planner-share-primary-action"
                                disabled={
                                    isAcceptingInvitation ||
                                    Boolean(turnstileSiteKey && !captchaToken)
                                }
                                type="button"
                                onClick={acceptInvitation}
                            >
                                <span
                                    className={cx(
                                        'planner-share-row-icon',
                                        isAcceptingInvitation && 'planner-spin'
                                    )}
                                >
                                    {isAcceptingInvitation
                                        ? ICONS.SPINNER
                                        : ICONS.KEY}
                                </span>
                                <span>Accept shared list</span>
                            </button>
                        </section>
                    ) : !isConfigured ? (
                        <p className="planner-share-dialog-message">
                            Add the Daily Planner Supabase settings to enable
                            encrypted sharing on this build.
                        </p>
                    ) : !isEnabled ? (
                        <>
                            <TurnstileChallenge
                                onChange={setCaptchaToken}
                                siteKey={turnstileSiteKey}
                            />
                            <button
                                className="planner-share-primary-action"
                                disabled={
                                    Boolean(turnstileSiteKey) && !captchaToken
                                }
                                type="button"
                                onClick={() => onEnableSync({ captchaToken })}
                            >
                                <span className="planner-share-row-icon">
                                    {ICONS.SYNC}
                                </span>
                                <span>{COPY.LABEL_FOR_ENABLE_SYNC}</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <section className="planner-share-section">
                                <h3>Invite someone</h3>
                                <div className="planner-share-invite-row">
                                    <span className="planner-share-row-icon">
                                        {ICONS.LINK}
                                    </span>
                                    <select
                                        aria-label="Invitation access"
                                        value={inviteRole}
                                        onChange={evt =>
                                            setInviteRole(evt.target.value)
                                        }
                                    >
                                        {SHAREABLE_ROLES.map(role => (
                                            <option key={role} value={role}>
                                                {ROLE_LABELS[role]}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        aria-busy={isCreatingLink || undefined}
                                        disabled={isCreatingLink || !canManage}
                                        type="button"
                                        onClick={createLink}
                                    >
                                        <span
                                            aria-hidden="true"
                                            className={cx(
                                                'planner-share-inline-action-icon',
                                                isCreatingLink && 'planner-spin'
                                            )}
                                        >
                                            {isCreatingLink
                                                ? ICONS.SPINNER
                                                : ICONS.LINK}
                                        </span>
                                        <span>Create link</span>
                                    </button>
                                </div>
                                {!canManage ? (
                                    <p className="planner-share-help">
                                        Full access is required to invite or
                                        manage people.
                                    </p>
                                ) : null}
                                {invitations.map(invitation => (
                                    <div
                                        className="planner-share-invitation"
                                        key={invitation.id}
                                    >
                                        {invitation.url ? (
                                            <a
                                                href={invitation.url}
                                                rel="noreferrer"
                                                target="_blank"
                                            >
                                                {ROLE_LABELS[invitation.role]}{' '}
                                                link
                                            </a>
                                        ) : (
                                            <span>
                                                {ROLE_LABELS[invitation.role]}{' '}
                                                link
                                            </span>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                onRevokeInvitation(
                                                    listId,
                                                    invitation.id
                                                )
                                            }
                                        >
                                            Revoke
                                        </button>
                                    </div>
                                ))}
                            </section>
                            <section className="planner-share-section">
                                <h3>People with access</h3>
                                {members.map(member => {
                                    const identityId =
                                        member.user_id ||
                                        member.identity_id ||
                                        member.identityId;
                                    const profile =
                                        member.profile ||
                                        profileByIdentityId.get(identityId);
                                    const isOwner = member.role === ROLES.OWNER;

                                    return (
                                        <div
                                            className="planner-share-member-row"
                                            key={identityId}
                                        >
                                            <CollaborationAvatar
                                                isPresent={member.isPresent}
                                                profile={profile}
                                            />
                                            <span className="planner-share-member-name">
                                                {profile?.display_name ||
                                                    'Collaborator'}
                                            </span>
                                            <select
                                                aria-label={`Access for ${
                                                    profile?.display_name ||
                                                    'collaborator'
                                                }`}
                                                aria-busy={
                                                    pendingActionId ===
                                                        `member-role:${identityId}` ||
                                                    undefined
                                                }
                                                disabled={
                                                    !canManage ||
                                                    isOwner ||
                                                    pendingActionId ===
                                                        `member-role:${identityId}`
                                                }
                                                value={member.role}
                                                onChange={evt =>
                                                    onUpdateMemberRole(
                                                        listId,
                                                        identityId,
                                                        evt.target.value
                                                    )
                                                }
                                            >
                                                {COLLABORATION_ROLE_ORDER.map(
                                                    role => (
                                                        <option
                                                            disabled={
                                                                role ===
                                                                    ROLES.OWNER &&
                                                                !isOwner
                                                            }
                                                            key={role}
                                                            value={role}
                                                        >
                                                            {ROLE_LABELS[role]}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                            {!isOwner && canManage ? (
                                                <IconButton
                                                    aria-label={`Remove ${
                                                        profile?.display_name ||
                                                        'collaborator'
                                                    }`}
                                                    title="Remove access"
                                                    className={cx(
                                                        pendingActionId ===
                                                            `remove-member:${identityId}` &&
                                                            'planner-spin'
                                                    )}
                                                    disabled={
                                                        pendingActionId ===
                                                        `remove-member:${identityId}`
                                                    }
                                                    onClick={() =>
                                                        onRemoveMember(
                                                            listId,
                                                            identityId
                                                        )
                                                    }
                                                >
                                                    {pendingActionId ===
                                                    `remove-member:${identityId}`
                                                        ? ICONS.SPINNER
                                                        : ICONS.REMOVE_USER}
                                                </IconButton>
                                            ) : null}
                                        </div>
                                    );
                                })}
                            </section>
                            {currentRole === ROLES.OWNER &&
                            transferCandidates.length ? (
                                <section className="planner-share-section">
                                    <h3>Transfer ownership</h3>
                                    <div className="planner-share-transfer-row">
                                        <span className="planner-share-row-icon">
                                            {ICONS.USER}
                                        </span>
                                        <select
                                            aria-label="New Owner"
                                            value={transferOwnerId}
                                            onChange={event =>
                                                setTransferOwnerId(
                                                    event.target.value
                                                )
                                            }
                                        >
                                            <option value="">
                                                Choose new Owner
                                            </option>
                                            {transferCandidates.map(member => (
                                                <option
                                                    key={member.user_id}
                                                    value={member.user_id}
                                                >
                                                    {member.profile
                                                        ?.display_name ||
                                                        'Collaborator'}
                                                </option>
                                            ))}
                                        </select>
                                        <select
                                            aria-label="Your access after transfer"
                                            value={formerOwnerRole || 'remove'}
                                            onChange={event =>
                                                setFormerOwnerRole(
                                                    event.target.value ===
                                                        'remove'
                                                        ? null
                                                        : event.target.value
                                                )
                                            }
                                        >
                                            {SHAREABLE_ROLES.map(role => (
                                                <option key={role} value={role}>
                                                    Keep {ROLE_LABELS[role]}
                                                </option>
                                            ))}
                                            <option value="remove">
                                                Remove me
                                            </option>
                                        </select>
                                        <button
                                            aria-busy={
                                                pendingActionId?.startsWith(
                                                    'transfer-owner:'
                                                ) || undefined
                                            }
                                            disabled={
                                                !transferOwnerId ||
                                                pendingActionId?.startsWith(
                                                    'transfer-owner:'
                                                )
                                            }
                                            type="button"
                                            onClick={() =>
                                                onTransferOwnership(
                                                    listId,
                                                    transferOwnerId,
                                                    formerOwnerRole
                                                )
                                            }
                                        >
                                            Transfer
                                        </button>
                                    </div>
                                </section>
                            ) : null}
                            {currentRole !== ROLES.OWNER ? (
                                <button
                                    aria-busy={
                                        pendingActionId ===
                                            `leave-list:${listId}` || undefined
                                    }
                                    className="planner-share-leave-action"
                                    disabled={
                                        pendingActionId ===
                                        `leave-list:${listId}`
                                    }
                                    type="button"
                                    onClick={() => onLeaveSharedList(listId)}
                                >
                                    Leave this list
                                </button>
                            ) : null}
                        </>
                    )}
                </div>
            </dialog>
        </>
    );
};

export { ROLE_LABELS };
export default ShareAccessDialog;
