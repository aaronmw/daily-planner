import type { PlannerCommandId } from '../../core/application/commandIds';
import { getPlatformAdapter } from './platformAdapter';

interface ModifierDefinition {
    accelerator: string;
    description: string;
    eventProperty: 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey';
    symbol: string;
}

const MODIFIERS: readonly ModifierDefinition[] = [
    {
        accelerator: 'Shift',
        description: 'Shift',
        eventProperty: 'shiftKey',
        symbol: '⇧',
    },
    {
        accelerator: 'Control',
        description: 'Control',
        eventProperty: 'ctrlKey',
        symbol: '⌃',
    },
    {
        accelerator: 'Alt',
        description: 'Option',
        eventProperty: 'altKey',
        symbol: '⌥',
    },
    {
        accelerator: 'Super',
        description: 'Command',
        eventProperty: 'metaKey',
        symbol: '⌘',
    },
];

const MODIFIER_CODES = new Set([
    'AltLeft',
    'AltRight',
    'ControlLeft',
    'ControlRight',
    'MetaLeft',
    'MetaRight',
    'ShiftLeft',
    'ShiftRight',
]);

const NAMED_KEYS: Record<string, string> = {
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
    ArrowUp: '↑',
    Backspace: 'Delete',
    Enter: 'Return',
    Escape: 'Escape',
    Space: 'Space',
    Tab: 'Tab',
};

const supportedCode = (code: string): boolean =>
    /^Key[A-Z]$/.test(code) ||
    /^Digit[0-9]$/.test(code) ||
    /^F(?:[1-9]|1[0-9]|2[0-4])$/.test(code) ||
    code in NAMED_KEYS;

const keyLabel = (code: string): string => {
    if (/^Key[A-Z]$/.test(code)) return code.slice(3);
    if (/^Digit[0-9]$/.test(code)) return code.slice(5);
    return NAMED_KEYS[code] ?? code;
};

const parseShortcut = (shortcut: string) => {
    const tokens = shortcut.split('+').filter(Boolean);
    const code = tokens.at(-1) ?? '';
    const modifierTokens = new Set(tokens.slice(0, -1));
    if (
        !supportedCode(code) ||
        modifierTokens.size === 0 ||
        modifierTokens.size !== tokens.length - 1 ||
        [...modifierTokens].some(
            token => !MODIFIERS.some(value => value.accelerator === token)
        )
    ) {
        return null;
    }
    return {
        code,
        modifiers: MODIFIERS.filter(value =>
            modifierTokens.has(value.accelerator)
        ),
    };
};

export const shortcutFromKeyboardEvent = (
    event: KeyboardEvent | React.KeyboardEvent
): string | null => {
    if (
        !event.code ||
        MODIFIER_CODES.has(event.code) ||
        !supportedCode(event.code)
    ) {
        return null;
    }
    const modifiers = MODIFIERS.filter(value => event[value.eventProperty]);
    if (modifiers.length === 0) return null;
    return [...modifiers.map(value => value.accelerator), event.code].join('+');
};

export const shortcutKeyLabels = (shortcut: string): string[] => {
    const parsed = parseShortcut(shortcut);
    if (!parsed) return [];
    return [
        ...parsed.modifiers.map(modifier => modifier.symbol),
        keyLabel(parsed.code),
    ];
};

export const describeShortcut = (shortcut: string): string => {
    const parsed = parseShortcut(shortcut);
    if (!parsed) return 'Invalid shortcut';
    return [
        ...parsed.modifiers.map(modifier => modifier.description),
        keyLabel(parsed.code),
    ].join(' + ');
};

export const validateShortcutMap = (
    shortcuts: Readonly<Record<PlannerCommandId, string>>
): void => {
    if (Object.values(shortcuts).some(shortcut => !parseShortcut(shortcut))) {
        throw new Error('Every desktop shortcut needs a modifier and a key.');
    }
    if (
        new Set(Object.values(shortcuts)).size !==
        Object.values(shortcuts).length
    ) {
        throw new Error('Desktop shortcuts must be unique.');
    }
};

class DesktopShortcutCoordinator {
    #cleanup: (() => void | Promise<void>) | null = null;
    #handler: ((command: PlannerCommandId) => void) | null = null;
    #serialized = '';

    setHandler(handler: (command: PlannerCommandId) => void): void {
        this.#handler = handler;
    }

    async update(
        shortcuts: Readonly<Record<PlannerCommandId, string>>
    ): Promise<void> {
        validateShortcutMap(shortcuts);
        const serialized = JSON.stringify(shortcuts);
        if (serialized === this.#serialized) return;
        const cleanup = await getPlatformAdapter().registerGlobalShortcuts(
            shortcuts,
            command => this.#handler?.(command)
        );
        this.#cleanup = cleanup;
        this.#serialized = serialized;
    }

    async dispose(): Promise<void> {
        const cleanup = this.#cleanup;
        this.#cleanup = null;
        this.#serialized = '';
        await cleanup?.();
    }
}

const coordinator = new DesktopShortcutCoordinator();

export const desktopShortcutCoordinator = coordinator;
