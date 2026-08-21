import {
    createContext,
    type HTMLAttributes,
    type PropsWithChildren,
    useCallback,
    useContext,
    useEffect,
    useId,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { KeyboardKey } from '../shell/KeyboardKey';
import { isTextEntryTarget } from '../shell/isTextEntryTarget';
import {
    shortcutFromKeyboardEvent,
    shortcutKeyLabelsFromKeyboardEvent,
} from '../../platform/runtime/desktopShortcuts';
import { matchesShortcut, shortcutAriaKeys } from './shortcutMatching';

export type ShortcutModifier = 'alt' | 'control' | 'meta' | 'shift';

export interface ShortcutDefinition {
    code?: string;
    id: string;
    key: string;
    keyLabel: string;
    modifiers: readonly ShortcutModifier[];
}

export interface ShortcutBinding {
    allowInTextEntry?: boolean;
    enabled?: boolean;
    onTrigger: () => void;
    shortcut: ShortcutDefinition;
}

export interface ShortcutRecorderOptions {
    onCancel?: () => void | Promise<void>;
    onCandidate: (shortcut: string) => boolean | Promise<boolean>;
    onStart?: () => void | Promise<void>;
}

export interface ShortcutRecorder {
    active: boolean;
    cancel: () => void;
    pressedKeyLabels: readonly string[];
    start: () => Promise<void>;
}

type ShortcutAriaProps = Pick<HTMLAttributes<HTMLElement>, 'aria-keyshortcuts'>;

interface ShortcutSource {
    current: () => readonly ShortcutBinding[];
}

interface ActiveShortcutRecorder {
    id: string;
    onCancel: () => void | Promise<void>;
    onCandidate: (shortcut: string) => boolean | Promise<boolean>;
    pending: boolean;
    version: number;
}

interface PendingShortcutRecorderStart {
    cancelled: boolean;
    id: string;
    onCancel: () => void | Promise<void>;
    version: number;
}

interface ShortcutRecordingView {
    id: string;
    pressedKeyLabels: readonly string[];
}

interface ShortcutRecordingOwner {
    id: string;
    version: number;
}

interface ShortcutContextValue {
    commandHeld: boolean;
    cancelRecording: (id?: string) => void;
    recordingOwner: ShortcutRecordingOwner | null;
    recordingView: ShortcutRecordingView | null;
    registerSource: (id: string, source: ShortcutSource) => () => void;
    startRecording: (
        id: string,
        options: ShortcutRecorderOptions
    ) => Promise<void>;
}

const ShortcutContext = createContext<ShortcutContextValue | null>(null);

const modifierLabels: Record<ShortcutModifier, string> = {
    alt: '⌥',
    control: '⌃',
    meta: '⌘',
    shift: '⇧',
};

const isPromiseLike = (value: unknown): value is PromiseLike<unknown> =>
    typeof value === 'object' &&
    value !== null &&
    'then' in value &&
    typeof value.then === 'function';

const shortcutRecorderStartError = (error: unknown): Error =>
    error instanceof Error
        ? error
        : new Error('Shortcut recording could not start.');

const invokeCancellation = (
    onCancel: () => void | Promise<void>
): void | Promise<void> => {
    try {
        const cancelled = onCancel();
        if (isPromiseLike(cancelled)) {
            return Promise.resolve(cancelled).catch(() => undefined);
        }
    } catch {
        // A recorder cleanup failure must not leak through a key or blur event.
    }
};

export function ShortcutProvider({ children }: PropsWithChildren) {
    const [commandHeld, setCommandHeld] = useState(false);
    const [recordingView, setRecordingView] =
        useState<ShortcutRecordingView | null>(null);
    const [recordingOwner, setRecordingOwner] =
        useState<ShortcutRecordingOwner | null>(null);
    const activeRecorderRef = useRef<ActiveShortcutRecorder | null>(null);
    const pendingRecorderStartRef = useRef<PendingShortcutRecorderStart | null>(
        null
    );
    const recordingOperationRef = useRef<Promise<void> | null>(null);
    const recordingStartVersionRef = useRef(0);
    const sourcesRef = useRef(new Map<string, ShortcutSource>());
    const registerSource = useCallback((id: string, source: ShortcutSource) => {
        sourcesRef.current.set(id, source);
        return () => {
            if (sourcesRef.current.get(id) === source) {
                sourcesRef.current.delete(id);
            }
        };
    }, []);

    const clearRecordingOwnership = useCallback((version: number) => {
        setRecordingOwner(current =>
            current?.version === version ? null : current
        );
    }, []);

    const clearRecording = useCallback(
        (recorder: ActiveShortcutRecorder) => {
            if (activeRecorderRef.current !== recorder) return;
            activeRecorderRef.current = null;
            setRecordingView(null);
            clearRecordingOwnership(recorder.version);
        },
        [clearRecordingOwnership]
    );

    const cancelActiveRecording = useCallback(
        (id?: string): void | Promise<void> => {
            const pendingStart = pendingRecorderStartRef.current;
            if (pendingStart && (!id || pendingStart.id === id)) {
                pendingStart.cancelled = true;
                pendingRecorderStartRef.current = null;
                recordingStartVersionRef.current += 1;
                clearRecordingOwnership(pendingStart.version);
            }

            const recorder = activeRecorderRef.current;
            if (!recorder || (id && recorder.id !== id)) return;

            activeRecorderRef.current = null;
            setRecordingView(null);
            clearRecordingOwnership(recorder.version);
            return invokeCancellation(recorder.onCancel);
        },
        [clearRecordingOwnership]
    );

    const cancelRecording = useCallback(
        (id?: string) => {
            const cancelled = cancelActiveRecording(id);
            if (isPromiseLike(cancelled)) {
                void Promise.resolve(cancelled).catch(() => undefined);
            }
        },
        [cancelActiveRecording]
    );

    const startRecording = useCallback(
        (id: string, options: ShortcutRecorderOptions): Promise<void> => {
            const priorOperation = recordingOperationRef.current;
            const cancellation = cancelActiveRecording();
            const pendingStart: PendingShortcutRecorderStart = {
                cancelled: false,
                id,
                onCancel: options.onCancel ?? (() => undefined),
                version: ++recordingStartVersionRef.current,
            };
            pendingRecorderStartRef.current = pendingStart;
            setRecordingOwner({ id, version: pendingStart.version });
            const activate = (): Promise<void> => {
                const ownsPendingStart = () =>
                    pendingRecorderStartRef.current === pendingStart &&
                    !pendingStart.cancelled &&
                    recordingStartVersionRef.current === pendingStart.version;
                const abandonStart = (): void | Promise<void> => {
                    if (pendingRecorderStartRef.current === pendingStart) {
                        pendingRecorderStartRef.current = null;
                    }
                    clearRecordingOwnership(pendingStart.version);
                    return invokeCancellation(pendingStart.onCancel);
                };
                const activateRecorder = () => {
                    if (!ownsPendingStart()) {
                        return abandonStart();
                    }
                    const recorder: ActiveShortcutRecorder = {
                        id,
                        onCancel: pendingStart.onCancel,
                        onCandidate: options.onCandidate,
                        pending: false,
                        version: pendingStart.version,
                    };
                    activeRecorderRef.current = recorder;
                    pendingRecorderStartRef.current = null;
                    setRecordingView({ id, pressedKeyLabels: [] });
                };
                if (!ownsPendingStart()) return Promise.resolve();
                let started: void | Promise<void>;
                try {
                    started = options.onStart?.();
                } catch (error) {
                    if (pendingRecorderStartRef.current === pendingStart) {
                        pendingRecorderStartRef.current = null;
                    }
                    clearRecordingOwnership(pendingStart.version);
                    return Promise.reject(shortcutRecorderStartError(error));
                }
                if (isPromiseLike(started)) {
                    return Promise.resolve(started).then(
                        activateRecorder,
                        error => {
                            if (
                                pendingRecorderStartRef.current === pendingStart
                            ) {
                                pendingRecorderStartRef.current = null;
                            }
                            clearRecordingOwnership(pendingStart.version);
                            return Promise.reject(
                                shortcutRecorderStartError(error)
                            );
                        }
                    );
                }
                const activated = activateRecorder();
                if (isPromiseLike(activated)) {
                    return Promise.resolve(activated).then(() => undefined);
                }
                return Promise.resolve();
            };

            const begin = (): Promise<void> =>
                isPromiseLike(cancellation)
                    ? Promise.resolve(cancellation).then(activate)
                    : activate();
            const operation = priorOperation
                ? priorOperation.then(begin, begin)
                : begin();
            recordingOperationRef.current = operation;
            void operation.then(
                () => {
                    if (recordingOperationRef.current === operation) {
                        recordingOperationRef.current = null;
                    }
                },
                () => {
                    if (recordingOperationRef.current === operation) {
                        recordingOperationRef.current = null;
                    }
                }
            );
            return operation;
        },
        [cancelActiveRecording, clearRecordingOwnership]
    );

    const setPressedKeyLabels = useCallback((labels: readonly string[]) => {
        const recorder = activeRecorderRef.current;
        if (!recorder) return;
        setRecordingView(current =>
            current?.id === recorder.id
                ? { id: recorder.id, pressedKeyLabels: labels }
                : current
        );
    }, []);

    useEffect(() => {
        const updateCommandState = (event: KeyboardEvent) => {
            if (event.key === 'Meta' || event.metaKey) {
                setCommandHeld(true);
            }
        };
        const releaseCommand = (event: KeyboardEvent) => {
            if (event.key === 'Meta' || !event.metaKey) {
                setCommandHeld(false);
            }
        };
        const resetCommand = () => {
            setCommandHeld(false);
            cancelRecording();
        };
        const resetHiddenCommand = () => {
            if (document.visibilityState === 'hidden') resetCommand();
        };

        window.addEventListener('keydown', updateCommandState, true);
        window.addEventListener('keyup', releaseCommand, true);
        window.addEventListener('blur', resetCommand);
        document.addEventListener('visibilitychange', resetHiddenCommand);
        return () => {
            window.removeEventListener('keydown', updateCommandState, true);
            window.removeEventListener('keyup', releaseCommand, true);
            window.removeEventListener('blur', resetCommand);
            document.removeEventListener(
                'visibilitychange',
                resetHiddenCommand
            );
        };
    }, [cancelRecording]);

    useEffect(() => {
        const updateHeldModifierLabels = (event: KeyboardEvent) => {
            setPressedKeyLabels(
                shortcutKeyLabelsFromKeyboardEvent({
                    altKey: event.altKey,
                    code: '',
                    ctrlKey: event.ctrlKey,
                    metaKey: event.metaKey,
                    shiftKey: event.shiftKey,
                } as KeyboardEvent)
            );
        };
        const captureRecordingKeyDown = (event: KeyboardEvent) => {
            const recorder = activeRecorderRef.current;
            const pendingStart = pendingRecorderStartRef.current;
            if (!recorder && !pendingStart) return;

            event.preventDefault();
            if (event.key === 'Escape') {
                cancelRecording();
                return;
            }
            event.stopPropagation();
            if (!recorder) return;
            if (event.repeat || recorder.pending) return;

            setPressedKeyLabels(shortcutKeyLabelsFromKeyboardEvent(event));
            const shortcut = shortcutFromKeyboardEvent(event);
            if (!shortcut) return;

            recorder.pending = true;
            const settleCandidate = (accepted: boolean) => {
                if (activeRecorderRef.current !== recorder) return;
                recorder.pending = false;
                if (accepted) clearRecording(recorder);
            };
            try {
                const accepted = recorder.onCandidate(shortcut);
                if (isPromiseLike(accepted)) {
                    void Promise.resolve(accepted).then(
                        value => settleCandidate(value),
                        () => settleCandidate(false)
                    );
                } else {
                    settleCandidate(accepted);
                }
            } catch {
                settleCandidate(false);
            }
        };
        const captureRecordingKeyUp = (event: KeyboardEvent) => {
            if (!activeRecorderRef.current) return;
            event.preventDefault();
            event.stopPropagation();
            updateHeldModifierLabels(event);
        };

        window.addEventListener('keydown', captureRecordingKeyDown, true);
        window.addEventListener('keyup', captureRecordingKeyUp, true);
        return () => {
            window.removeEventListener(
                'keydown',
                captureRecordingKeyDown,
                true
            );
            window.removeEventListener('keyup', captureRecordingKeyUp, true);
        };
    }, [cancelRecording, clearRecording, setPressedKeyLabels]);

    useEffect(() => {
        const dispatchShortcut = (event: KeyboardEvent) => {
            if (event.defaultPrevented || event.repeat) return;

            const matches = Array.from(sourcesRef.current.values()).flatMap(
                source =>
                    source
                        .current()
                        .filter(
                            binding =>
                                binding.enabled !== false &&
                                matchesShortcut(event, binding.shortcut) &&
                                (binding.allowInTextEntry === true ||
                                    !isTextEntryTarget(event.target))
                        )
            );
            const binding = matches[0];
            if (!binding) return;

            if (matches.length > 1) {
                console.error(
                    `Shortcut conflict for ${shortcutAriaKeys(binding.shortcut)}: ${matches.map(match => match.shortcut.id).join(', ')}`
                );
            }
            event.preventDefault();
            binding.onTrigger();
        };

        document.addEventListener('keydown', dispatchShortcut);
        return () => document.removeEventListener('keydown', dispatchShortcut);
    }, []);

    const value = useMemo(
        () => ({
            cancelRecording,
            commandHeld,
            recordingOwner,
            recordingView,
            registerSource,
            startRecording,
        }),
        [
            cancelRecording,
            commandHeld,
            recordingOwner,
            recordingView,
            registerSource,
            startRecording,
        ]
    );

    return (
        <ShortcutContext.Provider value={value}>
            {children}
        </ShortcutContext.Provider>
    );
}

const useShortcutContext = () => {
    const context = useContext(ShortcutContext);
    if (!context) {
        throw new Error('Shortcut controls require a ShortcutProvider.');
    }
    return context;
};

export function useShortcuts(
    bindings: readonly ShortcutBinding[]
): readonly ShortcutAriaProps[] {
    const { registerSource } = useShortcutContext();
    const sourceId = useId();
    const bindingsRef = useRef(bindings);
    useLayoutEffect(() => {
        bindingsRef.current = bindings;
    }, [bindings]);

    useEffect(
        () =>
            registerSource(sourceId, {
                current: () => bindingsRef.current,
            }),
        [registerSource, sourceId]
    );

    return bindings.map(binding => ({
        'aria-keyshortcuts': shortcutAriaKeys(binding.shortcut),
    }));
}

export function useShortcut(binding: ShortcutBinding): ShortcutAriaProps {
    const ariaProps = useShortcuts([binding]);
    return ariaProps[0] ?? {};
}

export function useShortcutRecorder(
    options: ShortcutRecorderOptions
): ShortcutRecorder {
    const { cancelRecording, recordingOwner, recordingView, startRecording } =
        useShortcutContext();
    const recorderId = useId();
    const onCancelRef = useRef(options.onCancel);
    const onCandidateRef = useRef(options.onCandidate);
    const onStartRef = useRef(options.onStart);
    useLayoutEffect(() => {
        onCancelRef.current = options.onCancel;
        onCandidateRef.current = options.onCandidate;
        onStartRef.current = options.onStart;
    }, [options.onCancel, options.onCandidate, options.onStart]);

    const cancel = useCallback(
        () => cancelRecording(recorderId),
        [cancelRecording, recorderId]
    );
    const start = useCallback(
        () =>
            startRecording(recorderId, {
                onCancel: () => onCancelRef.current?.(),
                onCandidate: shortcut => onCandidateRef.current(shortcut),
                onStart: () => onStartRef.current?.(),
            }),
        [recorderId, startRecording]
    );
    useEffect(() => cancel, [cancel]);

    const active = recordingOwner?.id === recorderId;
    return {
        active,
        cancel,
        pressedKeyLabels:
            recordingView?.id === recorderId
                ? recordingView.pressedKeyLabels
                : [],
        start,
    };
}

interface ShortcutHintProps {
    className?: string;
    shortcut: ShortcutDefinition;
    visibility?: 'always' | 'modifier';
}

export function ShortcutHint({
    className = '',
    shortcut,
    visibility = 'modifier',
}: ShortcutHintProps) {
    const { commandHeld } = useShortcutContext();
    const visible = visibility === 'always' || commandHeld;

    return (
        <span
            aria-hidden="true"
            className={`planner-shortcut-hint ${className}`}
            data-slot="shortcut-hint"
            data-visible={visible || undefined}
        >
            {shortcut.modifiers.map(modifier => (
                <KeyboardKey
                    isIcon
                    key={modifier}
                    label={modifierLabels[modifier]}
                />
            ))}
            <KeyboardKey label={shortcut.keyLabel} />
        </span>
    );
}
