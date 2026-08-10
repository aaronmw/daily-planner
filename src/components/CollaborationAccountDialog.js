import React, { useEffect, useId, useRef, useState } from 'react';
import { IconButton } from './atoms/Button';
import { ICONS } from './atoms/tokens';
import TurnstileChallenge from './TurnstileChallenge';

const CollaborationAccountDialog = ({ appActions, appData }) => {
    const titleId = useId();
    const dialogRef = useRef(null);
    const [accountMode, setAccountMode] = useState('upgrade');
    const [email, setEmail] = useState('');
    const [recoveryInput, setRecoveryInput] = useState('');
    const [captchaToken, setCaptchaToken] = useState(null);
    const collaboration = appData.collaboration || {};
    const {
        error,
        identity,
        isAccountDialogOpen = false,
        needsRecovery = false,
        pendingActionId,
        recoveryCode,
        turnstileSiteKey,
    } = collaboration;
    const record = identity?.record;
    const isGuest = record?.isAnonymous !== false;

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (isAccountDialogOpen && !dialog.open) dialog.showModal();
        if (!isAccountDialogOpen && dialog.open) dialog.close();
    }, [isAccountDialogOpen]);

    useEffect(() => {
        if (!isAccountDialogOpen || needsRecovery) setAccountMode('upgrade');
    }, [isAccountDialogOpen, needsRecovery]);

    const close = () => {
        if (!needsRecovery) appActions.onChangeAccountDialogOpen?.(false);
    };

    const submitEmail = async event => {
        event.preventDefault();
        const action =
            accountMode === 'existing'
                ? appActions.onSignInToExistingWithEmail
                : appActions.onContinueWithEmail;
        await action?.({ captchaToken, email });
    };

    const continueWithGoogle = () => {
        const action =
            accountMode === 'existing'
                ? appActions.onSignInToExistingWithGoogle
                : appActions.onContinueWithGoogle;
        void action?.().catch(() => {});
    };

    return (
        <dialog
            aria-labelledby={titleId}
            className="planner-account-dialog"
            onCancel={event => {
                if (needsRecovery) event.preventDefault();
                else close();
            }}
            onClose={() => appActions.onChangeAccountDialogOpen?.(false)}
            ref={dialogRef}
        >
            <header className="planner-share-dialog-header">
                <h2 id={titleId}>
                    {needsRecovery ? 'Unlock encrypted sync' : 'Account'}
                </h2>
                {!needsRecovery ? (
                    <IconButton
                        aria-label="Close"
                        title="Close"
                        onClick={close}
                    >
                        {ICONS.REMOVE_USER}
                    </IconButton>
                ) : null}
            </header>
            <div className="planner-account-dialog-content">
                {needsRecovery ? (
                    <form
                        className="planner-account-form"
                        onSubmit={event => {
                            event.preventDefault();
                            void appActions.onRecoverIdentity?.(recoveryInput);
                        }}
                    >
                        <p>
                            Enter the recovery key saved when encrypted sync was
                            set up on your first device.
                        </p>
                        <label htmlFor={`${titleId}-recovery`}>
                            Recovery key
                        </label>
                        <input
                            autoComplete="off"
                            id={`${titleId}-recovery`}
                            required
                            value={recoveryInput}
                            onChange={event =>
                                setRecoveryInput(event.target.value)
                            }
                        />
                        <button
                            aria-busy={
                                pendingActionId === 'recover-account' ||
                                undefined
                            }
                            disabled={pendingActionId === 'recover-account'}
                            type="submit"
                        >
                            <span className="planner-share-row-icon">
                                {pendingActionId === 'recover-account'
                                    ? ICONS.SPINNER
                                    : ICONS.KEY}
                            </span>
                            <span>Unlock planner</span>
                        </button>
                    </form>
                ) : recoveryCode ? (
                    <div className="planner-account-form">
                        <p>
                            This is the only way to unlock your encrypted lists
                            on a new device. Daily Planner cannot recover it.
                        </p>
                        <code className="planner-account-recovery-code">
                            {recoveryCode}
                        </code>
                        <button
                            type="button"
                            onClick={() => {
                                appActions.onCopyRecoveryKey?.();
                                appActions.onChangeAccountDialogOpen?.(false);
                            }}
                        >
                            <span className="planner-share-row-icon">
                                {ICONS.KEY}
                            </span>
                            <span>Copy key and continue</span>
                        </button>
                    </div>
                ) : isGuest ? (
                    <div className="planner-account-form">
                        <p>
                            {accountMode === 'existing'
                                ? 'Sign in to transfer this guest vault into an existing encrypted account.'
                                : 'This guest vault is device-bound. Link an account to keep access recoverable on other devices.'}
                        </p>
                        <button
                            aria-busy={
                                [
                                    'account-google',
                                    'existing-account-google',
                                ].includes(pendingActionId) || undefined
                            }
                            disabled={pendingActionId !== null}
                            type="button"
                            onClick={continueWithGoogle}
                        >
                            <span className="planner-share-row-icon">
                                {[
                                    'account-google',
                                    'existing-account-google',
                                ].includes(pendingActionId)
                                    ? ICONS.SPINNER
                                    : ICONS.USER}
                            </span>
                            <span>
                                {accountMode === 'existing'
                                    ? 'Sign in with Google'
                                    : 'Continue with Google'}
                            </span>
                        </button>
                        <div className="planner-account-divider">or</div>
                        {turnstileSiteKey ? (
                            <TurnstileChallenge
                                onChange={setCaptchaToken}
                                siteKey={turnstileSiteKey}
                            />
                        ) : null}
                        <form
                            className="planner-account-email-form"
                            onSubmit={submitEmail}
                        >
                            <label htmlFor={`${titleId}-email`}>
                                Email address
                            </label>
                            <input
                                autoComplete="email"
                                id={`${titleId}-email`}
                                placeholder="you@example.com"
                                required
                                type="email"
                                value={email}
                                onChange={event => setEmail(event.target.value)}
                            />
                            <button
                                aria-busy={
                                    [
                                        'account-email',
                                        'existing-account-email',
                                    ].includes(pendingActionId) || undefined
                                }
                                disabled={
                                    pendingActionId !== null ||
                                    Boolean(turnstileSiteKey && !captchaToken)
                                }
                                type="submit"
                            >
                                <span className="planner-share-row-icon">
                                    {[
                                        'account-email',
                                        'existing-account-email',
                                    ].includes(pendingActionId)
                                        ? ICONS.SPINNER
                                        : ICONS.LINK}
                                </span>
                                <span>
                                    {accountMode === 'existing'
                                        ? 'Sign in by email'
                                        : 'Email a link'}
                                </span>
                            </button>
                        </form>
                        <button
                            className="planner-account-mode-action"
                            disabled={pendingActionId !== null}
                            type="button"
                            onClick={() =>
                                setAccountMode(current =>
                                    current === 'existing'
                                        ? 'upgrade'
                                        : 'existing'
                                )
                            }
                        >
                            <span className="planner-share-row-icon">
                                {accountMode === 'existing'
                                    ? ICONS.LEFT
                                    : ICONS.KEY}
                            </span>
                            <span>
                                {accountMode === 'existing'
                                    ? 'Create or link a new account'
                                    : 'Use an existing account'}
                            </span>
                        </button>
                    </div>
                ) : (
                    <div className="planner-account-form">
                        <p>
                            Signed in as{' '}
                            {record?.email || 'a permanent account'}.
                        </p>
                    </div>
                )}
                {error ? (
                    <p className="planner-account-error" role="alert">
                        {error.message}
                    </p>
                ) : null}
            </div>
        </dialog>
    );
};

export default CollaborationAccountDialog;
