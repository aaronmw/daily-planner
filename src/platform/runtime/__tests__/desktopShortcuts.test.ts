import { describe, expect, it } from 'vitest';
import { DEFAULT_DESKTOP_SHORTCUTS } from '../../../core/application/commandIds';
import {
    describeShortcut,
    shortcutFromKeyboardEvent,
    shortcutKeyLabels,
    validateShortcutMap,
} from '../desktopShortcuts';

describe('desktop shortcuts', () => {
    it('formats the default planner accelerator', () => {
        const shortcut = DEFAULT_DESKTOP_SHORTCUTS['show-planner'];
        expect(shortcutKeyLabels(shortcut)).toEqual(['⇧', '⌃', '⌥', '⌘', 'P']);
        expect(describeShortcut(shortcut)).toBe(
            'Shift + Control + Option + Command + P'
        );
    });

    it('records physical keys and rejects duplicate bindings', () => {
        const event = new KeyboardEvent('keydown', {
            code: 'KeyL',
            ctrlKey: true,
            metaKey: true,
            shiftKey: true,
        });
        expect(shortcutFromKeyboardEvent(event)).toBe(
            'Shift+Control+Super+KeyL'
        );
        expect(() =>
            validateShortcutMap({
                ...DEFAULT_DESKTOP_SHORTCUTS,
                'create-item': DEFAULT_DESKTOP_SHORTCUTS['create-list'],
            })
        ).toThrow('unique');
    });
});
