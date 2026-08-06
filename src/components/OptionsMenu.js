import React, {
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';
import cx from '../utils/cx';
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

const OptionsMenuToggle = ({ isChecked, isOpen, label, onChange }) => (
    <button
        type="button"
        role="checkbox"
        aria-checked={isChecked}
        className="planner-options-menu-item planner-options-menu-item-has-trailing-icon"
        onClick={() => onChange(!isChecked)}
        tabIndex={isOpen ? 0 : -1}
    >
        <span className="planner-options-menu-item-label">{label}</span>
        <OptionsMenuCheckIcon isChecked={isChecked} />
    </button>
);

const OptionsMenu = ({ appActions, appData }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuId = useId();
    const lightingModeLabelId = `${menuId}-lighting-mode-label`;
    const timelineGroupLabelId = `${menuId}-timeline-label`;
    const zoomInputId = `${menuId}-timeline-zoom`;
    const controlRef = useRef(null);
    const dialogRef = useRef(null);
    const menuContentRef = useRef(null);
    const triggerRef = useRef(null);

    const {
        onChangeRelativeCardSizingEnabled,
        onChangeThemeMode,
        onChangeTimelineHoursPerScreen,
    } = appActions;
    const { relativeCardSizingEnabled, themeMode, timelineHoursPerScreen } =
        appData;
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
    }, [isOpen]);

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

    return (
        <div className="planner-options-menu-control" ref={controlRef}>
            <button
                type="button"
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
                <span
                    className="planner-options-menu-icon-slot"
                    aria-hidden="true"
                >
                    {ICONS.OPTIONS}
                </span>
            </button>

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
                </div>
            </dialog>
        </div>
    );
};

export default OptionsMenu;
