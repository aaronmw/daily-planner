import { useRef, useState } from 'react';
import {
    CONFIGURABLE_SHORTCUT_COMMANDS,
    assignShortcut,
    findShortcutConflicts,
    getShortcutAssignment,
    normalizeShortcutCandidate,
    type ConfigurableShortcutCommand,
    type ShortcutAssignments,
} from '../../core/application/shortcutCommands';
import {
    desktopShortcutCoordinator,
    shortcutKeyLabels,
} from '../../platform/runtime/desktopShortcuts';
import { Icon } from '../shell/Icon';
import { IconButton } from '../shell/IconButton';
import { KeyboardKey } from '../shell/KeyboardKey';
import { useShortcutRecorder } from '../shortcuts/ShortcutProvider';

interface ShortcutSettingsProps {
    assignments: ShortcutAssignments;
    onUpdate: (assignments: ShortcutAssignments) => void;
}

const errorMessage = (error: unknown): string =>
    error instanceof Error ? error.message : 'That shortcut is unavailable.';

const keyLabels = (
    command: ConfigurableShortcutCommand,
    assignment: string | undefined
): readonly string[] => {
    if (!assignment) return [];
    const labels = shortcutKeyLabels(assignment);
    if (command.family === 'digits-1-9') return [...labels.slice(0, -1), '1–9'];
    if (command.family === 'vertical-arrows')
        return [...labels.slice(0, -1), '↑↓'];
    return labels;
};

function ShortcutRow({
    assignments,
    command,
    onUpdate,
}: ShortcutSettingsProps & { command: ConfigurableShortcutCommand }) {
    const [error, setError] = useState('');
    const [pendingSession, setPendingSession] = useState<number | null>(null);
    const [conflictCandidate, setConflictCandidate] = useState<string | null>(
        null
    );
    const savedAssignmentsRef = useRef(assignments);
    const skipRestorationRef = useRef(false);
    const recordingSessionRef = useRef(0);
    const pending = pendingSession !== null;
    const assignment = getShortcutAssignment(assignments, command);
    const conflicts = conflictCandidate
        ? findShortcutConflicts(assignments, command.id, conflictCandidate)
        : [];

    const persist = async (
        candidate: string,
        displaceConflicts: boolean
    ): Promise<boolean> => {
        const recordingSession = recordingSessionRef.current;
        const next = assignShortcut(assignments, command.id, candidate, {
            displaceConflicts,
        });
        setPendingSession(recordingSession);
        setError('');
        try {
            await desktopShortcutCoordinator.update(next.desktop);
            if (recordingSessionRef.current !== recordingSession) return false;
            onUpdate(next);
            return true;
        } catch (caught) {
            if (recordingSessionRef.current !== recordingSession) return false;
            try {
                await desktopShortcutCoordinator.update(
                    savedAssignmentsRef.current.desktop
                );
                setError(`Could not save shortcut: ${errorMessage(caught)}`);
            } catch (restorationError) {
                setError(
                    `Could not save shortcut: ${errorMessage(caught)}. Restoring the previous shortcut also failed: ${errorMessage(restorationError)}`
                );
            }
            return false;
        } finally {
            setPendingSession(current =>
                current === recordingSession ? null : current
            );
        }
    };

    const recorder = useShortcutRecorder({
        onStart: () => {
            recordingSessionRef.current += 1;
            savedAssignmentsRef.current = assignments;
            setConflictCandidate(null);
            setError('');
            return desktopShortcutCoordinator.dispose();
        },
        onCandidate: async candidate => {
            const normalized = normalizeShortcutCandidate(command, candidate);
            if (!normalized) {
                setError(
                    command.scope === 'desktop'
                        ? 'Global shortcuts need a modifier and a supported key.'
                        : command.family === 'digits-1-9'
                          ? 'Press any number from 1 to 9, with optional modifiers.'
                          : command.family === 'vertical-arrows'
                            ? 'Press Up or Down, with optional modifiers.'
                            : 'Press a supported key, with optional modifiers.'
                );
                return false;
            }
            const nextConflicts = findShortcutConflicts(
                assignments,
                command.id,
                normalized
            );
            if (nextConflicts.length > 0) {
                setConflictCandidate(normalized);
                setError('');
                return false;
            }
            return persist(normalized, false);
        },
        onCancel: async () => {
            recordingSessionRef.current += 1;
            const recordingSession = recordingSessionRef.current;
            setConflictCandidate(null);
            if (skipRestorationRef.current) {
                skipRestorationRef.current = false;
                return;
            }
            setPendingSession(recordingSession);
            try {
                await desktopShortcutCoordinator.update(
                    savedAssignmentsRef.current.desktop
                );
            } catch (caught) {
                setError(errorMessage(caught));
            } finally {
                setPendingSession(current =>
                    current === recordingSession ? null : current
                );
            }
        },
    });
    const visibleLabels =
        recorder.pressedKeyLabels.length > 0
            ? recorder.pressedKeyLabels
            : keyLabels(command, assignment);

    const beginRecording = async () => {
        try {
            await recorder.start();
        } catch (caught) {
            setError(
                `Could not start shortcut editing: ${errorMessage(caught)}`
            );
        }
    };

    const acceptConflictCandidate = async () => {
        if (!conflictCandidate) return;
        if (!(await persist(conflictCandidate, true))) return;
        setConflictCandidate(null);
        skipRestorationRef.current = true;
        recorder.cancel();
    };

    return (
        <div
            className="planner-desktop-shortcut-row"
            data-listening={recorder.active || undefined}
        >
            <span className="planner-desktop-shortcut-command-icon">
                <Icon name={command.icon} />
            </span>
            <span className="min-w-0">
                <span className="block font-semibold">{command.label}</span>
                {(recorder.active || error || !assignment) && (
                    <span
                        aria-live="polite"
                        className={
                            error
                                ? 'text-planner-danger'
                                : 'text-planner-text-faded'
                        }
                    >
                        {error ||
                            (recorder.active ? 'Listening…' : 'Not assigned')}
                    </span>
                )}
            </span>
            <span
                className="planner-desktop-shortcut-keys"
                data-testid={`${command.id}-shortcut-keys`}
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
                aria-pressed={recorder.active}
                disabled={pending}
                icon={pending ? 'spinner' : 'pencil'}
                label={`${recorder.active ? 'Stop editing' : 'Edit'} shortcut for ${command.label}`}
                onClick={recorder.active ? recorder.cancel : beginRecording}
            />
            {conflictCandidate && conflicts.length > 0 && (
                <div className="planner-shortcut-conflict" role="alert">
                    <p>
                        This shortcut is already assigned to{' '}
                        {conflicts.map(conflict => conflict.label).join(', ')}.
                    </p>
                    <div className="flex justify-end gap-2">
                        <button
                            className="planner-shortcut-conflict-action"
                            onClick={recorder.cancel}
                            type="button"
                        >
                            Cancel
                        </button>
                        <button
                            className="planner-shortcut-conflict-action font-semibold"
                            disabled={pending}
                            onClick={() => void acceptConflictCandidate()}
                            type="button"
                        >
                            Use it here
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function ShortcutGroup({
    assignments,
    label,
    onUpdate,
    scope,
}: ShortcutSettingsProps & {
    label: string;
    scope: 'app' | 'desktop';
}) {
    const commands: ConfigurableShortcutCommand[] = [];
    for (const command of CONFIGURABLE_SHORTCUT_COMMANDS) {
        if (command.scope === scope) commands.push(command);
    }

    return (
        <div>
            <h4 className="sr-only">{label}</h4>
            {commands.map(command => (
                <ShortcutRow
                    assignments={assignments}
                    command={command}
                    key={command.id}
                    onUpdate={onUpdate}
                />
            ))}
        </div>
    );
}

export function ShortcutSettings(props: ShortcutSettingsProps) {
    return (
        <>
            <ShortcutGroup {...props} label="Global" scope="desktop" />
            <ShortcutGroup {...props} label="In app" scope="app" />
        </>
    );
}
