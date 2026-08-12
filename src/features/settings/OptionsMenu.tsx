import { useCallback, useRef, useState } from 'react';
import { usePlannerCommands } from '../../core/application/plannerContext';
import { usePlannerSelector } from '../../core/store/plannerContext';
import type { ThemeMode } from '../../core/domain/types';
import { Icon } from '../shell/Icon';
import { IconButton } from '../shell/IconButton';
import { KeyboardKey } from '../shell/KeyboardKey';
import {
    describeShortcut,
    desktopShortcutCoordinator,
    shortcutFromKeyboardEvent,
    shortcutKeyLabels,
} from '../../platform/runtime/desktopShortcuts';
import { getPlatformAdapter } from '../../platform/runtime/platformAdapter';
import {
    PLANNER_COMMAND_IDS,
    type PlannerCommandId,
} from '../../core/application/commandIds';
import {
    useCollaboration,
    useCollaborationSelector,
} from '../../core/collaboration/CollaborationContext';
import { TurnstileChallenge } from '../collaboration/TurnstileChallenge';
import {
    ShortcutHint,
    shortcutAriaKeys,
    type ShortcutDefinition,
} from '../shortcuts/ShortcutProvider';
import { CYCLE_THEME_SHORTCUT } from '../shortcuts/appShortcuts';

interface OptionsMenuProps {
    onShowDeletedItems: () => void;
}

const THEME_OPTIONS: readonly {
    icon: string;
    label: string;
    mode: ThemeMode;
}[] = [
    { icon: 'desktop', label: 'System', mode: 'system' },
    { icon: 'sun-bright', label: 'Light', mode: 'light' },
    { icon: 'moon', label: 'Dark', mode: 'dark' },
];

const DESKTOP_SHORTCUT_OPTIONS: readonly {
    commandId: PlannerCommandId;
    icon: string;
    label: string;
}[] = [
    {
        commandId: PLANNER_COMMAND_IDS.showPlanner,
        icon: 'window-restore',
        label: 'Show Daily Planner',
    },
    {
        commandId: PLANNER_COMMAND_IDS.createList,
        icon: 'rectangle-list',
        label: 'New List',
    },
    {
        commandId: PLANNER_COMMAND_IDS.createItem,
        icon: 'square-check',
        label: 'New Item',
    },
];

function Check({ checked }: { checked: boolean }) {
    return (
        <span
            className="grid size-[45px] place-items-center"
            aria-hidden="true"
        >
            {checked && <Icon name="check" />}
        </span>
    );
}

function GroupLabel({
    children,
    shortcut,
}: {
    children: string;
    shortcut?: ShortcutDefinition;
}) {
    return (
        <h3
            aria-keyshortcuts={
                shortcut ? shortcutAriaKeys(shortcut) : undefined
            }
            className="relative px-[45px] py-3 text-[0.8rem] uppercase text-planner-text-faded"
        >
            {children}
            {shortcut && (
                <ShortcutHint
                    className="planner-settings-group-shortcut"
                    shortcut={shortcut}
                />
            )}
        </h3>
    );
}

function ShortcutRow({
    commandId,
    icon,
    label,
}: {
    commandId: PlannerCommandId;
    icon: string;
    label: string;
}) {
    const commands = usePlannerCommands();
    const shortcuts = usePlannerSelector(
        state => state.preferences.desktopShortcuts
    );
    const shortcut = shortcuts[commandId];
    const [recording, setRecording] = useState(false);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState('');
    return (
        <button
            aria-label={`${label}, ${describeShortcut(shortcut)}`}
            aria-pressed={recording}
            className="grid min-h-[54px] w-full grid-cols-[45px_minmax(0,1fr)] items-center border-t-[length:var(--planner-stroke-width)] border-planner-border text-left transition-colors hover:bg-planner-shaded"
            onBlur={() => !pending && setRecording(false)}
            onClick={() => {
                if (!pending) {
                    setError('');
                    setRecording(true);
                }
            }}
            onKeyDown={event => {
                if (!recording || pending) return;
                event.preventDefault();
                event.stopPropagation();
                if (event.key === 'Escape') {
                    setRecording(false);
                    setError('');
                    return;
                }
                const nextShortcut = shortcutFromKeyboardEvent(event);
                if (!nextShortcut) return;
                const next = { ...shortcuts, [commandId]: nextShortcut };
                setPending(true);
                setError('');
                void desktopShortcutCoordinator
                    .update(next)
                    .then(() => {
                        commands.updatePreferences({ desktopShortcuts: next });
                        setRecording(false);
                    })
                    .catch(caught =>
                        setError(
                            caught instanceof Error
                                ? caught.message
                                : 'That shortcut is unavailable.'
                        )
                    )
                    .finally(() => setPending(false));
            }}
            title={error || describeShortcut(shortcut)}
            type="button"
        >
            <span className="grid size-[45px] place-items-center text-[1.2rem]">
                <Icon name={pending ? 'spinner' : icon} />
            </span>
            <span className="min-w-0 py-2 pr-3">
                <span className="block font-semibold">{label}</span>
                {error || recording ? (
                    <span className="block text-planner-text-faded">
                        {error || 'Press a modifier and another key'}
                    </span>
                ) : (
                    <span
                        aria-hidden="true"
                        className="mt-1 flex flex-wrap gap-1"
                    >
                        {shortcutKeyLabels(shortcut).map((key, index, keys) => (
                            <KeyboardKey
                                isIcon={index < keys.length - 1}
                                key={`${key}:${index}`}
                                label={key}
                            />
                        ))}
                    </span>
                )}
            </span>
        </button>
    );
}

export function OptionsMenu({ onShowDeletedItems }: OptionsMenuProps) {
    const commands = usePlannerCommands();
    const collaboration = useCollaboration();
    const preferences = usePlannerSelector(state => state.preferences);
    const syncStatus = usePlannerSelector(state => state.syncStatus);
    const identityEmail = useCollaborationSelector(
        state => state.identityEmail
    );
    const identityIsAnonymous = useCollaborationSelector(
        state => state.identityIsAnonymous
    );
    const recoveryCode = useCollaborationSelector(state => state.recoveryCode);
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [accountEmail, setAccountEmail] = useState('');
    const [accountPending, setAccountPending] = useState(false);
    const [accountMessage, setAccountMessage] = useState('');
    const [existingAccountOpen, setExistingAccountOpen] = useState(false);
    const [existingCaptchaToken, setExistingCaptchaToken] = useState('');
    const [recoveryInput, setRecoveryInput] = useState('');
    const [notificationPending, setNotificationPending] = useState(false);
    const [notificationError, setNotificationError] = useState('');
    const rowClass =
        'grid min-h-[45px] w-full grid-cols-[45px_minmax(0,1fr)_45px] items-center border-t-[length:var(--planner-stroke-width)] border-planner-border text-left transition-[background-color,color] duration-150 hover:bg-planner-shaded';

    const close = () => dialogRef.current?.close();
    const onChallengeError = useCallback(
        (message: string) => setAccountMessage(message),
        []
    );
    const onChallengeToken = useCallback(
        (token: string) => setExistingCaptchaToken(token),
        []
    );
    return (
        <>
            <IconButton
                icon="gear"
                label="Options"
                onClick={() => dialogRef.current?.showModal()}
            />
            <dialog
                aria-label="Options"
                className="fixed inset-auto right-3 top-[57px] m-0 max-h-[calc(100dvh-69px)] w-[min(460px,calc(100vw-24px))] overflow-auto border-[length:var(--planner-stroke-width)] border-planner-border bg-planner-background p-0 text-planner-text shadow-2xl backdrop:bg-black/40"
                onCancel={close}
                ref={dialogRef}
            >
                <div className="flex h-[45px] items-center border-b-[length:var(--planner-stroke-width)] border-planner-border">
                    <h2 className="min-w-0 flex-1 px-4 text-[1rem] font-semibold">
                        Options
                    </h2>
                    <IconButton
                        icon="xmark"
                        label="Close options"
                        onClick={close}
                    />
                </div>

                <section>
                    <GroupLabel shortcut={CYCLE_THEME_SHORTCUT}>
                        Lighting mode
                    </GroupLabel>
                    {THEME_OPTIONS.map(option => (
                        <button
                            aria-checked={preferences.themeMode === option.mode}
                            className={rowClass}
                            key={option.mode}
                            onClick={() =>
                                commands.updatePreferences({
                                    themeMode: option.mode,
                                })
                            }
                            role="radio"
                            type="button"
                        >
                            <span className="grid size-[45px] place-items-center text-[1.2rem]">
                                <Icon name={option.icon} />
                            </span>
                            <span>{option.label}</span>
                            <Check
                                checked={preferences.themeMode === option.mode}
                            />
                        </button>
                    ))}
                </section>

                {getPlatformAdapter().kind === 'desktop' && (
                    <section>
                        <GroupLabel>Desktop shortcuts</GroupLabel>
                        {DESKTOP_SHORTCUT_OPTIONS.map(option => (
                            <ShortcutRow key={option.commandId} {...option} />
                        ))}
                    </section>
                )}

                <section>
                    <GroupLabel>Timeline</GroupLabel>
                    <div className={`${rowClass} cursor-default`}>
                        <span className="grid size-[45px] place-items-center">
                            <Icon name="magnifying-glass" />
                        </span>
                        <div className="grid min-w-0 grid-cols-[auto_1fr_auto] items-center gap-3">
                            <span>Zoom</span>
                            <input
                                aria-label="Timeline hours visible"
                                className="min-w-0 accent-[var(--planner-contrast)]"
                                max={24}
                                min={4}
                                onChange={event =>
                                    commands.updatePreferences({
                                        timelineHoursPerScreen: Number(
                                            event.target.value
                                        ),
                                    })
                                }
                                step={1}
                                type="range"
                                value={preferences.timelineHoursPerScreen}
                            />
                            <output>
                                {preferences.timelineHoursPerScreen}h
                            </output>
                        </div>
                        <span />
                    </div>
                    <button
                        aria-checked={preferences.relativeCardSizingEnabled}
                        className={rowClass}
                        onClick={() =>
                            commands.updatePreferences({
                                relativeCardSizingEnabled:
                                    !preferences.relativeCardSizingEnabled,
                            })
                        }
                        role="checkbox"
                        type="button"
                    >
                        <span className="grid size-[45px] place-items-center">
                            <Icon name="arrows-up-down" />
                        </span>
                        <span>Relative card sizing</span>
                        <Check
                            checked={preferences.relativeCardSizingEnabled}
                        />
                    </button>
                </section>

                <section>
                    <GroupLabel>Editing</GroupLabel>
                    <button
                        aria-checked={preferences.focusAssistEnabled}
                        className={rowClass}
                        onClick={() =>
                            commands.updatePreferences({
                                focusAssistEnabled:
                                    !preferences.focusAssistEnabled,
                            })
                        }
                        role="checkbox"
                        type="button"
                    >
                        <span className="grid size-[45px] place-items-center">
                            <Icon name="bullseye" />
                        </span>
                        <span>Focus Assist</span>
                        <Check checked={preferences.focusAssistEnabled} />
                    </button>
                    <button
                        aria-checked={
                            preferences.highlightIncompleteSentencesEnabled
                        }
                        className={rowClass}
                        onClick={() =>
                            commands.updatePreferences({
                                highlightIncompleteSentencesEnabled:
                                    !preferences.highlightIncompleteSentencesEnabled,
                            })
                        }
                        role="checkbox"
                        type="button"
                    >
                        <span className="grid size-[45px] place-items-center">
                            <Icon name="spell-check" />
                        </span>
                        <span>Highlight incomplete</span>
                        <Check
                            checked={
                                preferences.highlightIncompleteSentencesEnabled
                            }
                        />
                    </button>
                </section>

                <section>
                    <GroupLabel>Sync &amp; sharing</GroupLabel>
                    <div className={`${rowClass} cursor-default`}>
                        <span className="grid size-[45px] place-items-center">
                            <Icon name="cloud-lock" />
                        </span>
                        <span className="min-w-0">
                            <span className="block">Encrypted sync</span>
                            <span className="block truncate text-planner-text-faded">
                                {syncStatus.status === 'local-only'
                                    ? 'Local only'
                                    : syncStatus.status === 'error'
                                      ? syncStatus.error
                                      : syncStatus.status}
                            </span>
                        </span>
                        <Check checked={syncStatus.status === 'synced'} />
                    </div>

                    {preferences.syncEnabled && identityIsAnonymous && (
                        <div className="border-t-[length:var(--planner-stroke-width)] border-planner-border p-3">
                            <p className="mb-2 text-planner-text-faded">
                                Add an account so this encrypted planner can be
                                recovered on another device.
                            </p>
                            <div className="grid grid-cols-[1fr_auto]">
                                <input
                                    aria-label="Account email"
                                    className="h-[45px] min-w-0 border-[length:var(--planner-stroke-width)] border-r-0 border-planner-border bg-planner-background px-3"
                                    onChange={event =>
                                        setAccountEmail(event.target.value)
                                    }
                                    placeholder="you@example.com"
                                    type="email"
                                    value={accountEmail}
                                />
                                <button
                                    className="h-[45px] border-[length:var(--planner-stroke-width)] border-planner-border px-3 font-semibold hover:bg-planner-shaded"
                                    disabled={
                                        !accountEmail.trim() || accountPending
                                    }
                                    onClick={() => {
                                        setAccountPending(true);
                                        setAccountMessage('');
                                        void collaboration
                                            .continueAccountWithEmail(
                                                accountEmail.trim()
                                            )
                                            .then(() =>
                                                setAccountMessage(
                                                    'Check your email to finish linking the account.'
                                                )
                                            )
                                            .catch(caught =>
                                                setAccountMessage(
                                                    caught instanceof Error
                                                        ? caught.message
                                                        : 'The account could not be linked.'
                                                )
                                            )
                                            .finally(() =>
                                                setAccountPending(false)
                                            );
                                    }}
                                    type="button"
                                >
                                    Link email
                                </button>
                            </div>
                            <button
                                className="mt-2 h-[45px] w-full border-[length:var(--planner-stroke-width)] border-planner-border px-3 font-semibold hover:bg-planner-shaded"
                                disabled={accountPending}
                                onClick={() => {
                                    setAccountPending(true);
                                    setAccountMessage('');
                                    void collaboration
                                        .continueAccountWithGoogle()
                                        .catch(caught =>
                                            setAccountMessage(
                                                caught instanceof Error
                                                    ? caught.message
                                                    : 'Google sign-in could not start.'
                                            )
                                        )
                                        .finally(() =>
                                            setAccountPending(false)
                                        );
                                }}
                                type="button"
                            >
                                Continue with Google
                            </button>
                            <button
                                className="mt-2 h-[45px] w-full border-[length:var(--planner-stroke-width)] border-planner-border px-3 font-semibold hover:bg-planner-shaded"
                                onClick={() =>
                                    setExistingAccountOpen(value => !value)
                                }
                                type="button"
                            >
                                Use an existing account
                            </button>
                            {existingAccountOpen && (
                                <div className="mt-3 border-t-[length:var(--planner-stroke-width)] border-planner-border pt-3">
                                    <p className="text-planner-text-faded">
                                        Your guest lists will be handed to the
                                        account after it is unlocked.
                                    </p>
                                    <TurnstileChallenge
                                        onError={onChallengeError}
                                        onToken={onChallengeToken}
                                    />
                                    <button
                                        className="h-[45px] w-full border-[length:var(--planner-stroke-width)] border-planner-border px-3 font-semibold hover:bg-planner-shaded"
                                        disabled={
                                            !accountEmail.trim() ||
                                            !existingCaptchaToken ||
                                            accountPending
                                        }
                                        onClick={() => {
                                            setAccountPending(true);
                                            setAccountMessage('');
                                            void collaboration
                                                .signInExistingWithEmail(
                                                    accountEmail.trim(),
                                                    existingCaptchaToken
                                                )
                                                .then(() =>
                                                    setAccountMessage(
                                                        'Check your email to finish signing in.'
                                                    )
                                                )
                                                .catch(caught =>
                                                    setAccountMessage(
                                                        caught instanceof Error
                                                            ? caught.message
                                                            : 'Existing account sign-in failed.'
                                                    )
                                                )
                                                .finally(() =>
                                                    setAccountPending(false)
                                                );
                                        }}
                                        type="button"
                                    >
                                        Sign in with email
                                    </button>
                                    <button
                                        className="mt-2 h-[45px] w-full border-[length:var(--planner-stroke-width)] border-planner-border px-3 font-semibold hover:bg-planner-shaded"
                                        disabled={accountPending}
                                        onClick={() => {
                                            setAccountPending(true);
                                            setAccountMessage('');
                                            void collaboration
                                                .signInExistingWithGoogle()
                                                .catch(caught =>
                                                    setAccountMessage(
                                                        caught instanceof Error
                                                            ? caught.message
                                                            : 'Existing account sign-in failed.'
                                                    )
                                                )
                                                .finally(() =>
                                                    setAccountPending(false)
                                                );
                                        }}
                                        type="button"
                                    >
                                        Sign in with Google
                                    </button>
                                </div>
                            )}
                            {accountMessage && (
                                <p className="mt-2" aria-live="polite">
                                    {accountMessage}
                                </p>
                            )}
                        </div>
                    )}

                    {syncStatus.status === 'error' &&
                        syncStatus.error.toLowerCase().includes('recovery') && (
                            <div className="border-t-[length:var(--planner-stroke-width)] border-planner-border p-3">
                                <label className="block">
                                    <span className="mb-1 block text-planner-text-faded">
                                        Existing account recovery key
                                    </span>
                                    <input
                                        autoComplete="off"
                                        className="h-[45px] w-full border-[length:var(--planner-stroke-width)] border-planner-border bg-planner-background px-3 uppercase"
                                        onChange={event =>
                                            setRecoveryInput(event.target.value)
                                        }
                                        value={recoveryInput}
                                    />
                                </label>
                                <button
                                    className="mt-2 h-[45px] w-full border-[length:var(--planner-stroke-width)] border-planner-border px-3 font-semibold hover:bg-planner-shaded"
                                    disabled={
                                        !recoveryInput.trim() || accountPending
                                    }
                                    onClick={() => {
                                        setAccountPending(true);
                                        void collaboration
                                            .recoverSync(recoveryInput)
                                            .then(() => {
                                                setRecoveryInput('');
                                                setAccountMessage(
                                                    'Existing account unlocked.'
                                                );
                                            })
                                            .catch(caught =>
                                                setAccountMessage(
                                                    caught instanceof Error
                                                        ? caught.message
                                                        : 'The account could not be unlocked.'
                                                )
                                            )
                                            .finally(() =>
                                                setAccountPending(false)
                                            );
                                    }}
                                    type="button"
                                >
                                    Unlock existing account
                                </button>
                            </div>
                        )}

                    {preferences.syncEnabled && !identityIsAnonymous && (
                        <div className={`${rowClass} cursor-default`}>
                            <span className="grid size-[45px] place-items-center">
                                <Icon name="user-shield" />
                            </span>
                            <span className="min-w-0 truncate">
                                {identityEmail ?? 'Permanent account'}
                            </span>
                            <Check checked />
                        </div>
                    )}

                    {recoveryCode && (
                        <button
                            className={rowClass}
                            onClick={() => {
                                void navigator.clipboard.writeText(
                                    recoveryCode
                                );
                                setAccountMessage('Recovery key copied.');
                            }}
                            type="button"
                        >
                            <span className="grid size-[45px] place-items-center">
                                <Icon name="key" />
                            </span>
                            <span>
                                <span className="block">Copy recovery key</span>
                                <span className="block text-planner-danger">
                                    Save this now; it is shown only once.
                                </span>
                            </span>
                            <span />
                        </button>
                    )}

                    {preferences.syncEnabled && (
                        <button
                            aria-checked={preferences.notificationsEnabled}
                            className={rowClass}
                            disabled={notificationPending}
                            onClick={() => {
                                const enabled =
                                    !preferences.notificationsEnabled;
                                setNotificationPending(true);
                                setNotificationError('');
                                void collaboration
                                    .setNotificationsEnabled(enabled)
                                    .catch(caught =>
                                        setNotificationError(
                                            caught instanceof Error
                                                ? caught.message
                                                : 'Notifications could not be updated.'
                                        )
                                    )
                                    .finally(() =>
                                        setNotificationPending(false)
                                    );
                            }}
                            role="checkbox"
                            title={notificationError || undefined}
                            type="button"
                        >
                            <span className="grid size-[45px] place-items-center">
                                <Icon
                                    name={
                                        notificationPending ? 'spinner' : 'bell'
                                    }
                                />
                            </span>
                            <span className="min-w-0">
                                <span className="block">Notifications</span>
                                {notificationError && (
                                    <span
                                        aria-live="polite"
                                        className="block truncate text-planner-danger"
                                    >
                                        {notificationError}
                                    </span>
                                )}
                            </span>
                            <Check checked={preferences.notificationsEnabled} />
                        </button>
                    )}
                </section>

                <section>
                    <GroupLabel>Planner</GroupLabel>
                    <button
                        className={rowClass}
                        onClick={() => {
                            close();
                            onShowDeletedItems();
                        }}
                        type="button"
                    >
                        <span className="grid size-[45px] place-items-center">
                            <Icon name="trash" />
                        </span>
                        <span>Deleted items</span>
                        <span className="grid size-[45px] place-items-center">
                            <Icon name="chevron-right" />
                        </span>
                    </button>
                </section>
            </dialog>
        </>
    );
}
