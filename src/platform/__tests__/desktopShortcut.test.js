import {
    assertUniqueDesktopShortcuts,
    createDesktopShortcutFromKeyboardEvent,
    DEFAULT_DESKTOP_CREATION_SHORTCUTS,
    DEFAULT_DESKTOP_GLOBAL_SHORTCUT,
    DEFAULT_DESKTOP_SHORTCUTS,
    describeDesktopShortcut,
    formatDesktopShortcut,
    normalizeDesktopShortcut,
    normalizeDesktopShortcuts,
} from '../desktopShortcut';
import { PLANNER_COMMANDS } from '../../utils/plannerCommands';

describe('desktop shortcuts', () => {
    test('uses the requested four-modifier P shortcut by default', () => {
        expect(DEFAULT_DESKTOP_GLOBAL_SHORTCUT).toBe(
            'Shift+Control+Alt+Super+KeyP'
        );
        expect(formatDesktopShortcut(DEFAULT_DESKTOP_GLOBAL_SHORTCUT)).toBe(
            '⇧⌃⌥⌘P'
        );
        expect(describeDesktopShortcut(DEFAULT_DESKTOP_GLOBAL_SHORTCUT)).toBe(
            'Shift + Control + Option + Command + P'
        );
    });

    test('defines distinct global creation commands', () => {
        expect(DEFAULT_DESKTOP_CREATION_SHORTCUTS).toEqual({
            [PLANNER_COMMANDS.CREATE_LIST]: 'Shift+Control+Alt+Super+KeyL',
            [PLANNER_COMMANDS.CREATE_TASK]: 'Shift+Control+Alt+Super+KeyT',
        });
        expect(DEFAULT_DESKTOP_SHORTCUTS).toEqual({
            [PLANNER_COMMANDS.CREATE_LIST]: 'Shift+Control+Alt+Super+KeyL',
            [PLANNER_COMMANDS.CREATE_TASK]: 'Shift+Control+Alt+Super+KeyT',
            [PLANNER_COMMANDS.SHOW_PLANNER]: 'Shift+Control+Alt+Super+KeyP',
        });
    });

    test('creates canonical accelerators from keyboard events', () => {
        expect(
            createDesktopShortcutFromKeyboardEvent({
                altKey: true,
                code: 'KeyK',
                ctrlKey: true,
                metaKey: false,
                shiftKey: false,
            })
        ).toBe('Control+Alt+KeyK');
    });

    test('waits for a non-modifier key and requires a modifier', () => {
        expect(
            createDesktopShortcutFromKeyboardEvent({
                code: 'ShiftLeft',
                shiftKey: true,
            })
        ).toBeNull();
        expect(
            createDesktopShortcutFromKeyboardEvent({
                code: 'KeyK',
                shiftKey: false,
            })
        ).toBeNull();
    });

    test('normalizes modifier order and falls back from invalid values', () => {
        expect(normalizeDesktopShortcut('Super+Shift+KeyP')).toBe(
            'Shift+Super+KeyP'
        );
        expect(normalizeDesktopShortcut('KeyP')).toBe(
            DEFAULT_DESKTOP_GLOBAL_SHORTCUT
        );
    });

    test('normalizes a complete command map and rejects collisions', () => {
        const normalized = normalizeDesktopShortcuts({
            ...DEFAULT_DESKTOP_SHORTCUTS,
            [PLANNER_COMMANDS.CREATE_TASK]: 'Super+Shift+KeyK',
        });

        expect(normalized[PLANNER_COMMANDS.CREATE_TASK]).toBe(
            'Shift+Super+KeyK'
        );
        expect(() =>
            assertUniqueDesktopShortcuts({
                ...normalized,
                [PLANNER_COMMANDS.CREATE_LIST]: 'Shift+Super+KeyK',
            })
        ).toThrow('Desktop shortcuts must be unique');
    });
});
