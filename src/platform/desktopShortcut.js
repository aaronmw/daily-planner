import { PLANNER_COMMANDS } from '../utils/plannerCommands';

const DEFAULT_DESKTOP_GLOBAL_SHORTCUT = 'Shift+Control+Alt+Super+KeyP';
const DEFAULT_DESKTOP_CREATION_SHORTCUTS = Object.freeze({
    [PLANNER_COMMANDS.CREATE_LIST]: 'Shift+Control+Alt+Super+KeyL',
    [PLANNER_COMMANDS.CREATE_TASK]: 'Shift+Control+Alt+Super+KeyT',
});
const DEFAULT_DESKTOP_SHORTCUTS = Object.freeze({
    [PLANNER_COMMANDS.SHOW_PLANNER]: DEFAULT_DESKTOP_GLOBAL_SHORTCUT,
    ...DEFAULT_DESKTOP_CREATION_SHORTCUTS,
});

const MODIFIER_DEFINITIONS = [
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

const NAMED_KEY_LABELS = {
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
    ArrowUp: '↑',
    Backspace: 'Delete',
    BracketLeft: '[',
    BracketRight: ']',
    Comma: ',',
    Delete: 'Forward Delete',
    End: 'End',
    Enter: 'Return',
    Equal: '=',
    Home: 'Home',
    Minus: '-',
    PageDown: 'Page Down',
    PageUp: 'Page Up',
    Period: '.',
    Quote: "'",
    Semicolon: ';',
    Slash: '/',
    Space: 'Space',
    Tab: 'Tab',
};

const SUPPORTED_NAMED_CODES = new Set(Object.keys(NAMED_KEY_LABELS));

const isSupportedKeyCode = code =>
    /^Key[A-Z]$/.test(code) ||
    /^Digit[0-9]$/.test(code) ||
    /^F(?:[1-9]|1[0-9]|2[0-4])$/.test(code) ||
    SUPPORTED_NAMED_CODES.has(code);

const getKeyLabel = code => {
    if (/^Key[A-Z]$/.test(code)) {
        return code.slice(3);
    }

    if (/^Digit[0-9]$/.test(code)) {
        return code.slice(5);
    }

    return NAMED_KEY_LABELS[code] || code;
};

const parseDesktopShortcut = shortcut => {
    const tokens = String(shortcut || '')
        .split('+')
        .map(token => token.trim())
        .filter(Boolean);
    const keyCode = tokens.at(-1);

    if (!isSupportedKeyCode(keyCode)) {
        return null;
    }

    const modifierTokens = new Set(tokens.slice(0, -1));
    const hasOnlyKnownModifiers = [...modifierTokens].every(token =>
        MODIFIER_DEFINITIONS.some(modifier => modifier.accelerator === token)
    );

    if (
        !hasOnlyKnownModifiers ||
        modifierTokens.size !== tokens.length - 1 ||
        modifierTokens.size === 0
    ) {
        return null;
    }

    return {
        keyCode,
        modifiers: MODIFIER_DEFINITIONS.filter(modifier =>
            modifierTokens.has(modifier.accelerator)
        ),
    };
};

const serializeDesktopShortcut = ({ keyCode, modifiers }) =>
    [...modifiers.map(modifier => modifier.accelerator), keyCode].join('+');

const normalizeDesktopShortcut = (
    shortcut,
    fallback = DEFAULT_DESKTOP_GLOBAL_SHORTCUT
) => {
    const parsedShortcut = parseDesktopShortcut(shortcut);

    return parsedShortcut ? serializeDesktopShortcut(parsedShortcut) : fallback;
};

const normalizeDesktopShortcuts = shortcuts => {
    const normalizedShortcuts = Object.fromEntries(
        Object.entries(DEFAULT_DESKTOP_SHORTCUTS).map(
            ([commandId, defaultShortcut]) => [
                commandId,
                normalizeDesktopShortcut(
                    shortcuts?.[commandId],
                    defaultShortcut
                ),
            ]
        )
    );
    const values = Object.values(normalizedShortcuts);

    return new Set(values).size === values.length
        ? normalizedShortcuts
        : { ...DEFAULT_DESKTOP_SHORTCUTS };
};

const assertUniqueDesktopShortcuts = shortcuts => {
    const values = Object.values(shortcuts);

    if (new Set(values).size !== values.length) {
        throw new Error('Desktop shortcuts must be unique');
    }
};

const createDesktopShortcutFromKeyboardEvent = event => {
    if (!event?.code || MODIFIER_CODES.has(event.code)) {
        return null;
    }

    if (!isSupportedKeyCode(event.code)) {
        return null;
    }

    const modifiers = MODIFIER_DEFINITIONS.filter(
        modifier => event[modifier.eventProperty]
    );

    if (modifiers.length === 0) {
        return null;
    }

    return serializeDesktopShortcut({
        keyCode: event.code,
        modifiers,
    });
};

const getDesktopShortcutKeyLabels = shortcut => {
    const parsedShortcut = parseDesktopShortcut(
        normalizeDesktopShortcut(shortcut)
    );

    return [
        ...parsedShortcut.modifiers.map(modifier => modifier.symbol),
        getKeyLabel(parsedShortcut.keyCode),
    ];
};

const formatDesktopShortcut = shortcut =>
    getDesktopShortcutKeyLabels(shortcut).join('');

const describeDesktopShortcut = shortcut => {
    const parsedShortcut = parseDesktopShortcut(
        normalizeDesktopShortcut(shortcut)
    );

    return [
        ...parsedShortcut.modifiers.map(modifier => modifier.description),
        getKeyLabel(parsedShortcut.keyCode),
    ].join(' + ');
};

export {
    createDesktopShortcutFromKeyboardEvent,
    assertUniqueDesktopShortcuts,
    DEFAULT_DESKTOP_CREATION_SHORTCUTS,
    DEFAULT_DESKTOP_GLOBAL_SHORTCUT,
    DEFAULT_DESKTOP_SHORTCUTS,
    describeDesktopShortcut,
    formatDesktopShortcut,
    getDesktopShortcutKeyLabels,
    normalizeDesktopShortcut,
    normalizeDesktopShortcuts,
};
