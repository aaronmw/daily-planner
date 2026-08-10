import React, {
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import {
    createDesktopShortcutFromKeyboardEvent,
    describeDesktopShortcut,
    getDesktopShortcutKeyLabels,
} from '../platform/desktopShortcut';
import cx from '../utils/cx';
import { PLANNER_COMMANDS } from '../utils/plannerCommands';
import { IconButton } from './atoms/Button';
import KeyboardKey from './atoms/KeyboardKey';
import {
    COPY,
    ICONS,
    INTERACTION_ANIMATION_DURATION,
    THEME_MODES,
    TIMELINE_HOURS_PER_SCREEN_MAX,
    TIMELINE_HOURS_PER_SCREEN_MIN,
    TIMELINE_HOURS_PER_SCREEN_STEP,
} from './atoms/tokens';

const getThemeModeMenuItemId = themeMode => `theme-mode:${themeMode}`;

const THEME_MODE_ICONS = {
    SYSTEM: ICONS.SYSTEM_MODE,
    LIGHT: ICONS.LIGHT_MODE,
    DARK: ICONS.DARK_MODE,
};

const DESKTOP_SHORTCUT_OPTIONS = [
    {
        commandId: PLANNER_COMMANDS.SHOW_PLANNER,
        icon: ICONS.GLOBAL_SHORTCUT,
        label: COPY.LABEL_FOR_SHOW_PLANNER_SHORTCUT,
    },
    {
        commandId: PLANNER_COMMANDS.CREATE_LIST,
        icon: ICONS.LIST_MANAGER,
        label: COPY.LABEL_FOR_NEW_LIST_SHORTCUT,
    },
    {
        commandId: PLANNER_COMMANDS.CREATE_TASK,
        icon: ICONS.TASK_DETAILS,
        label: COPY.LABEL_FOR_NEW_TASK_SHORTCUT,
    },
];

const OptionsMenuCheckIcon = ({ isChecked }) => (
    <span className="planner-options-menu-check-slot" aria-hidden="true">
        <span
            className={cx(
                'planner-options-menu-check-icon',
                !isChecked && 'planner-options-menu-check-icon-hidden'
            )}
        >
            {ICONS.CHECK}
        </span>
    </span>
);

const OptionsMenuGroup = ({
    children,
    hasSlots = false,
    label,
    labelId,
    role,
}) => (
    <div
        className={cx(
            'planner-options-menu-group',
            hasSlots && 'planner-options-menu-group-with-slots'
        )}
        role={role}
        aria-labelledby={labelId}
    >
        <div className="planner-options-menu-group-label">
            <span
                id={labelId}
                className="planner-options-menu-group-label-text"
            >
                {label}
            </span>
        </div>
        {children}
    </div>
);

const OptionsMenuOption = ({
    icon,
    isChecked,
    isOpen,
    label,
    onClick,
    onKeyDown,
    shortcut,
}) => (
    <button
        type="button"
        role="radio"
        aria-checked={isChecked}
        className={cx(
            'planner-options-menu-item',
            icon && 'planner-options-menu-item-has-leading-icon',
            'planner-options-menu-item-has-trailing-icon'
        )}
        onClick={onClick}
        onKeyDown={onKeyDown}
        tabIndex={isOpen && isChecked ? 0 : -1}
    >
        {icon ? (
            <span
                className="planner-options-menu-item-icon-slot"
                aria-hidden="true"
            >
                {icon}
            </span>
        ) : null}
        <span className="planner-options-menu-item-label">
            <span className="planner-options-menu-item-label-primary">
                {label}
            </span>
            {shortcut ? (
                <kbd
                    className="planner-options-menu-item-shortcut"
                    aria-hidden="true"
                >
                    {shortcut}
                </kbd>
            ) : null}
        </span>
        <OptionsMenuCheckIcon isChecked={isChecked} />
    </button>
);

const OptionsMenuToggle = ({
    isChecked,
    isOpen,
    isPending = false,
    label,
    onChange,
}) => (
    <button
        type="button"
        role="checkbox"
        aria-checked={isChecked}
        aria-busy={isPending || undefined}
        className="planner-options-menu-item planner-options-menu-item-has-trailing-icon"
        disabled={isPending}
        onClick={() => !isPending && onChange(!isChecked)}
        tabIndex={isOpen ? 0 : -1}
    >
        <span className="planner-options-menu-item-label">{label}</span>
        {isPending ? (
            <span
                aria-hidden="true"
                className="planner-options-menu-check-slot planner-spin"
            >
                {ICONS.SPINNER}
            </span>
        ) : (
            <OptionsMenuCheckIcon isChecked={isChecked} />
        )}
    </button>
);

const OptionsMenuAction = ({
    disabled = false,
    icon,
    isCurrent,
    isOpen,
    label,
    onClick,
    status,
}) => (
    <button
        type="button"
        aria-current={isCurrent ? 'page' : undefined}
        className={cx(
            'planner-options-menu-item',
            icon && 'planner-options-menu-item-has-leading-icon'
        )}
        disabled={disabled}
        onClick={onClick}
        tabIndex={isOpen ? 0 : -1}
    >
        {icon ? (
            <span
                className="planner-options-menu-item-icon-slot"
                aria-hidden="true"
            >
                {icon}
            </span>
        ) : null}
        <span className="planner-options-menu-item-label planner-options-menu-shortcut-row-label">
            <span className="planner-options-menu-item-label-primary">
                {label}
            </span>
            {status ? (
                <span className="planner-options-menu-shortcut-status">
                    {status}
                </span>
            ) : null}
        </span>
    </button>
);

const OptionsMenuShortcut = ({ icon, isOpen, label, onChange, shortcut }) => {
    const [errorMessage, setErrorMessage] = useState('');
    const [isPending, setIsPending] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const shortcutDescription = describeDesktopShortcut(shortcut);
    const shortcutKeyLabels = getDesktopShortcutKeyLabels(shortcut);

    const captureShortcut = async evt => {
        if (!isRecording || isPending) {
            return;
        }

        evt.preventDefault();
        evt.stopPropagation();

        if (evt.key === 'Escape') {
            setErrorMessage('');
            setIsRecording(false);
            return;
        }

        const nextShortcut = createDesktopShortcutFromKeyboardEvent(evt);

        if (!nextShortcut) {
            return;
        }

        setErrorMessage('');
        setIsPending(true);

        try {
            await onChange(nextShortcut);
            setIsRecording(false);
        } catch {
            setErrorMessage(COPY.LABEL_FOR_GLOBAL_SHORTCUT_ERROR);
        } finally {
            setIsPending(false);
        }
    };

    return (
        <button
            type="button"
            aria-busy={isPending ? 'true' : undefined}
            aria-invalid={errorMessage ? 'true' : undefined}
            aria-label={`${label}, ${shortcutDescription}`}
            aria-pressed={isRecording}
            className="planner-options-menu-item planner-options-menu-item-has-leading-icon"
            data-recording={isRecording ? 'true' : 'false'}
            onBlur={() => {
                if (!isPending) {
                    setIsRecording(false);
                }
            }}
            onClick={() => {
                if (!isPending) {
                    setErrorMessage('');
                    setIsRecording(true);
                }
            }}
            onKeyDown={captureShortcut}
            tabIndex={isOpen ? 0 : -1}
            title={errorMessage || shortcutDescription}
        >
            <span
                className={cx(
                    'planner-options-menu-item-icon-slot',
                    isPending && 'planner-spin'
                )}
                aria-hidden="true"
            >
                {isPending ? ICONS.SPINNER : icon}
            </span>
            <span className="planner-options-menu-item-label planner-options-menu-shortcut-row-label">
                <span className="planner-options-menu-item-label-primary">
                    {label}
                </span>
                {errorMessage || isRecording ? (
                    <span className="planner-options-menu-shortcut-status">
                        {errorMessage
                            ? COPY.LABEL_FOR_GLOBAL_SHORTCUT_ERROR
                            : COPY.LABEL_FOR_GLOBAL_SHORTCUT_CAPTURE}
                    </span>
                ) : (
                    <span
                        className="planner-keyboard-shortcut"
                        aria-hidden="true"
                    >
                        {shortcutKeyLabels.map((keyLabel, index) => (
                            <KeyboardKey
                                isIcon={index < shortcutKeyLabels.length - 1}
                                key={`${keyLabel}:${index}`}
                                label={keyLabel}
                            />
                        ))}
                    </span>
                )}
            </span>
            <span className="sr-only" aria-live="polite">
                {errorMessage ||
                    (isRecording
                        ? 'Press a modifier and another key. Escape cancels.'
                        : '')}
            </span>
        </button>
    );
};

const OptionsMenu = ({ appActions, appData }) => {
    const menuId = useId();
    const desktopGroupLabelId = `${menuId}-desktop-label`;
    const editingGroupLabelId = `${menuId}-editing-label`;
    const lightingModeLabelId = `${menuId}-lighting-mode-label`;
    const syncGroupLabelId = `${menuId}-sync-label`;
    const timelineGroupLabelId = `${menuId}-timeline-label`;
    const zoomInputId = `${menuId}-timeline-zoom`;
    const controlRef = useRef(null);
    const dialogRef = useRef(null);
    const menuContentRef = useRef(null);
    const triggerRef = useRef(null);

    const {
        onChangeDesktopShortcut,
        onChangeAccountDialogOpen = () => {},
        onChangeFocusAssistEnabled,
        onChangeHighlightIncompleteSentencesEnabled,
        onChangeIsOptionsMenuOpen,
        onChangeRelativeCardSizingEnabled,
        onChangeShareDialogOpen = () => {},
        onChangeThemeMode,
        onChangeTimelineHoursPerScreen,
        onChangeNotificationsEnabled = () => {},
        onCopyRecoveryKey = () => {},
        onShowTrashContents,
    } = appActions;
    const {
        desktopShortcuts,
        focusAssistEnabled,
        highlightIncompleteSentencesEnabled,
        isDesktop,
        isOptionsMenuOpen: isOpen,
        isShowingTrashContents,
        relativeCardSizingEnabled,
        themeMode,
        timelineHoursPerScreen,
    } = appData;
    const collaboration = appData.collaboration || {};
    const {
        identity,
        isConfigured: isSyncConfigured = false,
        isEnabled: isSyncEnabled = false,
        notificationsEnabled = false,
        pendingActionId,
        recoveryCode,
        syncStatus = 'Local only',
    } = collaboration;
    const setIsOpen = onChangeIsOptionsMenuOpen;
    const hasCustomLightingMode = themeMode !== THEME_MODES[0];

    useLayoutEffect(() => {
        const dialog = dialogRef.current;

        if (!dialog) {
            return undefined;
        }

        if (isOpen) {
            if (!dialog.open) {
                dialog.show();
            }

            menuContentRef.current?.scrollTo({ top: 0, left: 0 });
            menuContentRef.current
                ?.querySelector('[role="radio"][aria-checked="true"]')
                ?.focus();

            return undefined;
        }

        if (!dialog.open) {
            return undefined;
        }

        const closeTimer = window.setTimeout(
            () => dialog.close(),
            INTERACTION_ANIMATION_DURATION
        );

        return () => window.clearTimeout(closeTimer);
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            return undefined;
        }

        const closeIfOutside = evt => {
            if (
                evt.target instanceof Node &&
                !controlRef.current?.contains(evt.target)
            ) {
                setIsOpen(false);
            }
        };

        const closeOnEscape = evt => {
            if (evt.key === 'Escape') {
                setIsOpen(false);
                requestAnimationFrame(() => triggerRef.current?.focus());
            }
        };

        document.addEventListener('pointerdown', closeIfOutside);
        document.addEventListener('keydown', closeOnEscape);

        return () => {
            document.removeEventListener('pointerdown', closeIfOutside);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [isOpen, setIsOpen]);

    const selectThemeMode = nextThemeMode => {
        onChangeThemeMode(nextThemeMode);
        setIsOpen(false);
        requestAnimationFrame(() => triggerRef.current?.focus());
    };

    const selectThemeModeFromKeyboard = (evt, currentModeIndex) => {
        const lastModeIndex = THEME_MODES.length - 1;
        let nextModeIndex;

        switch (evt.key) {
            case 'ArrowDown':
            case 'ArrowRight':
                nextModeIndex = (currentModeIndex + 1) % THEME_MODES.length;
                break;
            case 'ArrowUp':
            case 'ArrowLeft':
                nextModeIndex =
                    (currentModeIndex - 1 + THEME_MODES.length) %
                    THEME_MODES.length;
                break;
            case 'Home':
                nextModeIndex = 0;
                break;
            case 'End':
                nextModeIndex = lastModeIndex;
                break;
            default:
                return;
        }

        evt.preventDefault();
        selectThemeMode(THEME_MODES[nextModeIndex]);
    };

    const showDeletedItems = () => {
        onShowTrashContents();
        setIsOpen(false);
        requestAnimationFrame(() => triggerRef.current?.focus());
    };

    return (
        <div className="planner-options-menu-control" ref={controlRef}>
            <IconButton
                aria-controls={menuId}
                aria-expanded={isOpen}
                aria-haspopup="dialog"
                aria-label={COPY.LABEL_FOR_OPTIONS}
                className={cx(
                    'planner-options-menu-trigger',
                    hasCustomLightingMode &&
                        'planner-options-menu-trigger-active'
                )}
                title={COPY.LABEL_FOR_OPTIONS}
                onClick={() => setIsOpen(current => !current)}
                ref={triggerRef}
            >
                {ICONS.OPTIONS}
            </IconButton>

            <dialog
                id={menuId}
                aria-label={COPY.LABEL_FOR_OPTIONS}
                className={cx(
                    'planner-options-menu-surface',
                    isOpen
                        ? 'planner-options-menu-surface-open'
                        : 'planner-options-menu-surface-closed'
                )}
                ref={dialogRef}
            >
                <div
                    className="planner-options-menu-content"
                    ref={menuContentRef}
                >
                    <OptionsMenuGroup
                        hasSlots
                        label={COPY.LABEL_FOR_LIGHTING_MODE}
                        labelId={lightingModeLabelId}
                        role="radiogroup"
                    >
                        {THEME_MODES.map((mode, modeIndex) => {
                            const itemId = getThemeModeMenuItemId(mode);

                            return (
                                <OptionsMenuOption
                                    key={itemId}
                                    icon={THEME_MODE_ICONS[mode]}
                                    isChecked={mode === themeMode}
                                    isOpen={isOpen}
                                    label={COPY.LIGHTING_MODE_LABELS[mode]}
                                    shortcut="D"
                                    onClick={() => selectThemeMode(mode)}
                                    onKeyDown={evt =>
                                        selectThemeModeFromKeyboard(
                                            evt,
                                            modeIndex
                                        )
                                    }
                                />
                            );
                        })}
                    </OptionsMenuGroup>
                    <OptionsMenuGroup
                        label={COPY.LABEL_FOR_TIMELINE_SETTINGS}
                        labelId={timelineGroupLabelId}
                        role="group"
                    >
                        <div className="planner-options-menu-zoom-row">
                            <label htmlFor={zoomInputId}>
                                {COPY.LABEL_FOR_TIMELINE_ZOOM}
                            </label>
                            <input
                                id={zoomInputId}
                                aria-valuetext={`${timelineHoursPerScreen} hours visible`}
                                className="planner-options-menu-zoom-slider"
                                max={TIMELINE_HOURS_PER_SCREEN_MAX}
                                min={TIMELINE_HOURS_PER_SCREEN_MIN}
                                step={TIMELINE_HOURS_PER_SCREEN_STEP}
                                tabIndex={isOpen ? undefined : -1}
                                type="range"
                                value={timelineHoursPerScreen}
                                onChange={evt =>
                                    onChangeTimelineHoursPerScreen(
                                        evt.target.value
                                    )
                                }
                            />
                            <span className="planner-options-menu-zoom-value">
                                {timelineHoursPerScreen}h
                            </span>
                        </div>
                        <OptionsMenuToggle
                            isChecked={relativeCardSizingEnabled}
                            isOpen={isOpen}
                            label={COPY.LABEL_FOR_RELATIVE_CARD_SIZING}
                            onChange={onChangeRelativeCardSizingEnabled}
                        />
                    </OptionsMenuGroup>
                    <OptionsMenuGroup
                        label={COPY.LABEL_FOR_EDITING_SETTINGS}
                        labelId={editingGroupLabelId}
                        role="group"
                    >
                        <OptionsMenuToggle
                            isChecked={focusAssistEnabled}
                            isOpen={isOpen}
                            label={COPY.LABEL_FOR_FOCUS_ASSIST}
                            onChange={onChangeFocusAssistEnabled}
                        />
                        <OptionsMenuToggle
                            isChecked={highlightIncompleteSentencesEnabled}
                            isOpen={isOpen}
                            label={COPY.LABEL_FOR_HIGHLIGHT_INCOMPLETE}
                            onChange={
                                onChangeHighlightIncompleteSentencesEnabled
                            }
                        />
                    </OptionsMenuGroup>
                    <OptionsMenuGroup
                        hasSlots
                        label={COPY.LABEL_FOR_SYNC_AND_SHARING}
                        labelId={syncGroupLabelId}
                        role="group"
                    >
                        <OptionsMenuAction
                            disabled={!isSyncConfigured}
                            icon={ICONS.SYNC}
                            isOpen={isOpen}
                            label={
                                isSyncEnabled
                                    ? COPY.LABEL_FOR_SYNC_STATUS
                                    : COPY.LABEL_FOR_ENABLE_SYNC
                            }
                            status={
                                isSyncConfigured ? syncStatus : 'Not configured'
                            }
                            onClick={() => {
                                onChangeShareDialogOpen(true);
                                setIsOpen(false);
                            }}
                        />
                        {isSyncEnabled ? (
                            <>
                                <OptionsMenuAction
                                    icon={ICONS.USER}
                                    isOpen={isOpen}
                                    label="Account"
                                    status={
                                        identity?.record?.isAnonymous
                                            ? 'Guest'
                                            : identity?.record?.email ||
                                              'Signed in'
                                    }
                                    onClick={() => {
                                        onChangeAccountDialogOpen(true);
                                        setIsOpen(false);
                                    }}
                                />
                                <OptionsMenuToggle
                                    isChecked={notificationsEnabled}
                                    isOpen={isOpen}
                                    isPending={
                                        pendingActionId === 'notifications'
                                    }
                                    label={COPY.LABEL_FOR_NOTIFICATIONS}
                                    onChange={onChangeNotificationsEnabled}
                                />
                                {recoveryCode ? (
                                    <OptionsMenuAction
                                        icon={ICONS.KEY}
                                        isOpen={isOpen}
                                        label={COPY.LABEL_FOR_RECOVERY}
                                        status="Copy"
                                        onClick={onCopyRecoveryKey}
                                    />
                                ) : null}
                            </>
                        ) : null}
                    </OptionsMenuGroup>
                    {isDesktop ? (
                        <OptionsMenuGroup
                            hasSlots
                            label={COPY.LABEL_FOR_DESKTOP_SETTINGS}
                            labelId={desktopGroupLabelId}
                            role="group"
                        >
                            {DESKTOP_SHORTCUT_OPTIONS.map(option => (
                                <OptionsMenuShortcut
                                    key={`${option.commandId}:${isOpen ? 'open' : 'closed'}`}
                                    icon={option.icon}
                                    isOpen={isOpen}
                                    label={option.label}
                                    shortcut={
                                        desktopShortcuts[option.commandId]
                                    }
                                    onChange={nextShortcut =>
                                        onChangeDesktopShortcut(
                                            option.commandId,
                                            nextShortcut
                                        )
                                    }
                                />
                            ))}
                        </OptionsMenuGroup>
                    ) : null}
                    <div
                        aria-label={COPY.LABEL_FOR_DELETED_ITEMS}
                        className="planner-options-menu-group"
                        role="group"
                    >
                        <OptionsMenuAction
                            icon={ICONS.END_ZONE}
                            isCurrent={isShowingTrashContents}
                            isOpen={isOpen}
                            label={COPY.LABEL_FOR_DELETED_ITEMS}
                            onClick={showDeletedItems}
                        />
                    </div>
                </div>
            </dialog>
        </div>
    );
};

export default OptionsMenu;
