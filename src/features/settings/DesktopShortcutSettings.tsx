import { useRef, useState } from 'react';
import type { PlannerCommandId } from '../../core/application/commandIds';
import { PLANNER_COMMAND_IDS } from '../../core/application/commandIds';
import {
    desktopShortcutCoordinator,
    shortcutKeyLabels,
} from '../../platform/runtime/desktopShortcuts';
import { Icon } from '../shell/Icon';
import { IconButton } from '../shell/IconButton';
import { KeyboardKey } from '../shell/KeyboardKey';
import { useShortcutRecorder } from '../shortcuts/ShortcutProvider';

interface DesktopShortcutSettingsProps {
    onUpdate: (shortcuts: Readonly<Record<PlannerCommandId, string>>) => void;
    shortcuts: Readonly<Record<PlannerCommandId, string>>;
}

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

const errorMessage = (error: unknown): string =>
    error instanceof Error ? error.message : 'That shortcut is unavailable.';

const persistenceErrorMessage = (error: unknown): string =>
    `Could not save shortcut: ${errorMessage(error)}`;

const persistenceRestorationErrorMessage = (
    persistenceError: unknown,
    restorationError: unknown
): string =>
    `${persistenceErrorMessage(persistenceError)}. Restoring the previous shortcut also failed: ${errorMessage(restorationError)}`;

function DesktopShortcutRow({
    commandId,
    icon,
    label,
    onUpdate,
    shortcuts,
}: {
    commandId: PlannerCommandId;
    icon: string;
    label: string;
} & DesktopShortcutSettingsProps) {
    const [error, setError] = useState('');
    const [pending, setPending] = useState(false);
    const recordingSessionRef = useRef(0);
    const shortcut = shortcuts[commandId];
    const { active, cancel, pressedKeyLabels, start } = useShortcutRecorder({
        onStart: () => {
            recordingSessionRef.current += 1;
            return desktopShortcutCoordinator.dispose();
        },
        onCandidate: async candidate => {
            const recordingSession = recordingSessionRef.current;
            const next = { ...shortcuts, [commandId]: candidate };
            setError('');
            setPending(true);
            try {
                try {
                    await desktopShortcutCoordinator.update(next);
                } catch (caught) {
                    if (recordingSessionRef.current === recordingSession) {
                        setError(errorMessage(caught));
                    }
                    return false;
                }
                if (recordingSessionRef.current !== recordingSession) {
                    return false;
                }
                try {
                    onUpdate(next);
                    return true;
                } catch (persistenceError) {
                    try {
                        await desktopShortcutCoordinator.update(shortcuts);
                        if (recordingSessionRef.current === recordingSession) {
                            setError(persistenceErrorMessage(persistenceError));
                        }
                    } catch (restorationError) {
                        if (recordingSessionRef.current === recordingSession) {
                            setError(
                                persistenceRestorationErrorMessage(
                                    persistenceError,
                                    restorationError
                                )
                            );
                        }
                    }
                    return false;
                }
            } finally {
                if (recordingSessionRef.current === recordingSession) {
                    setPending(false);
                }
            }
        },
        onCancel: async () => {
            recordingSessionRef.current += 1;
            setPending(true);
            try {
                await desktopShortcutCoordinator.update(shortcuts);
            } catch (caught) {
                setError(errorMessage(caught));
            } finally {
                setPending(false);
            }
        },
    });
    const visibleLabels =
        pressedKeyLabels.length > 0
            ? pressedKeyLabels
            : shortcutKeyLabels(shortcut);

    const beginRecording = async () => {
        setError('');
        try {
            await start();
        } catch (caught) {
            setError(
                `Could not start shortcut editing: ${errorMessage(caught)}`
            );
        }
    };

    return (
        <div
            className="planner-desktop-shortcut-row"
            data-listening={active || undefined}
        >
            <span className="planner-desktop-shortcut-command-icon">
                <Icon name={icon} />
            </span>
            <span className="min-w-0">
                <span className="block font-semibold">{label}</span>
                {(active || error) && (
                    <span
                        aria-live="polite"
                        className={
                            error
                                ? 'text-planner-danger'
                                : 'text-planner-text-faded'
                        }
                    >
                        {error || 'Listening…'}
                    </span>
                )}
            </span>
            <span
                className="planner-desktop-shortcut-keys"
                data-testid={`${commandId}-shortcut-keys`}
            >
                {visibleLabels.map(key => (
                    <KeyboardKey
                        isIcon={['⇧', '⌃', '⌥', '⌘'].includes(key)}
                        key={key}
                        label={key}
                    />
                ))}
            </span>
            <IconButton
                aria-busy={pending || undefined}
                aria-pressed={active}
                disabled={pending && !active}
                icon={pending ? 'spinner' : 'pencil'}
                label={`${active ? 'Stop editing' : 'Edit'} shortcut for ${label}`}
                onBlur={active ? cancel : undefined}
                onClick={active ? cancel : beginRecording}
            />
        </div>
    );
}

export function DesktopShortcutSettings({
    onUpdate,
    shortcuts,
}: DesktopShortcutSettingsProps): React.JSX.Element {
    return (
        <>
            {DESKTOP_SHORTCUT_OPTIONS.map(option => (
                <DesktopShortcutRow
                    key={option.commandId}
                    onUpdate={onUpdate}
                    shortcuts={shortcuts}
                    {...option}
                />
            ))}
        </>
    );
}
