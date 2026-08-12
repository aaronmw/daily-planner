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

export type ShortcutModifier = 'alt' | 'control' | 'meta' | 'shift';

export interface ShortcutDefinition {
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

type ShortcutAriaProps = Pick<HTMLAttributes<HTMLElement>, 'aria-keyshortcuts'>;

interface ShortcutSource {
    current: () => readonly ShortcutBinding[];
}

interface ShortcutContextValue {
    commandHeld: boolean;
    registerSource: (id: string, source: ShortcutSource) => () => void;
}

const ShortcutContext = createContext<ShortcutContextValue | null>(null);

const modifierLabels: Record<ShortcutModifier, string> = {
    alt: '⌥',
    control: '⌃',
    meta: '⌘',
    shift: '⇧',
};

const modifierEventKeys: Record<
    ShortcutModifier,
    keyof Pick<KeyboardEvent, 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey'>
> = {
    alt: 'altKey',
    control: 'ctrlKey',
    meta: 'metaKey',
    shift: 'shiftKey',
};

const modifierAriaLabels: Record<ShortcutModifier, string> = {
    alt: 'Alt',
    control: 'Control',
    meta: 'Meta',
    shift: 'Shift',
};

const normalizeKey = (key: string) => key.toLocaleLowerCase();

export const shortcutAriaKeys = (shortcut: ShortcutDefinition) =>
    [
        ...shortcut.modifiers.map(modifier => modifierAriaLabels[modifier]),
        shortcut.keyLabel,
    ].join('+');

const matchesShortcut = (
    event: KeyboardEvent,
    shortcut: ShortcutDefinition
) => {
    if (normalizeKey(event.key) !== normalizeKey(shortcut.key)) return false;
    const requiredModifiers = new Set(shortcut.modifiers);
    return (Object.keys(modifierEventKeys) as ShortcutModifier[]).every(
        modifier =>
            event[modifierEventKeys[modifier]] ===
            requiredModifiers.has(modifier)
    );
};

export function ShortcutProvider({ children }: PropsWithChildren) {
    const [commandHeld, setCommandHeld] = useState(false);
    const sourcesRef = useRef(new Map<string, ShortcutSource>());
    const registerSource = useCallback((id: string, source: ShortcutSource) => {
        sourcesRef.current.set(id, source);
        return () => {
            if (sourcesRef.current.get(id) === source) {
                sourcesRef.current.delete(id);
            }
        };
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
        const resetCommand = () => setCommandHeld(false);
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
    }, []);

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
        () => ({ commandHeld, registerSource }),
        [commandHeld, registerSource]
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
