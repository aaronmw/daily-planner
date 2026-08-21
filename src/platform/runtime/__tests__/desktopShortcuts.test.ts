import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_DESKTOP_SHORTCUTS } from '../../../core/application/commandIds';
import {
    desktopShortcutCoordinator,
    describeShortcut,
    shortcutFromKeyboardEvent,
    shortcutKeyLabels,
    shortcutKeyLabelsFromKeyboardEvent,
    validateShortcutMap,
} from '../desktopShortcuts';

const getPlatformAdapter = vi.hoisted(() => vi.fn());

vi.mock('../platformAdapter', () => ({
    getPlatformAdapter,
}));

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

    it('records modifier-free candidates for in-app shortcut editing', () => {
        const event = new KeyboardEvent('keydown', {
            code: 'KeyN',
            key: 'n',
        });

        expect(shortcutFromKeyboardEvent(event)).toBe('KeyN');
        expect(shortcutKeyLabels('KeyN')).toEqual(['N']);
        expect(() => validateShortcutMap({ 'create-item': 'KeyN' })).toThrow(
            'modifier'
        );
    });

    it('formats modifier-only and completed keyboard-event previews', () => {
        expect(
            shortcutKeyLabelsFromKeyboardEvent(
                new KeyboardEvent('keydown', {
                    code: 'MetaLeft',
                    key: 'Meta',
                    metaKey: true,
                })
            )
        ).toEqual(['⌘']);

        expect(
            shortcutKeyLabelsFromKeyboardEvent(
                new KeyboardEvent('keydown', {
                    code: 'KeyP',
                    key: 'p',
                    metaKey: true,
                    shiftKey: true,
                })
            )
        ).toEqual(['⇧', '⌘', 'P']);
    });

    it('waits for deferred disposal before registering the next shortcuts', async () => {
        const operations: string[] = [];
        let resolveOriginalRegistration: (() => void) | undefined;
        let resolveCleanup: (() => void) | undefined;
        const original = DEFAULT_DESKTOP_SHORTCUTS;
        const next = {
            ...DEFAULT_DESKTOP_SHORTCUTS,
            'create-item': 'Shift+Control+Alt+Super+KeyN',
        } as const;
        getPlatformAdapter.mockReturnValue({
            registerGlobalShortcuts: vi.fn(async shortcuts => {
                if (shortcuts === original) {
                    operations.push('register:original');
                    await new Promise<void>(resolve => {
                        resolveOriginalRegistration = resolve;
                    });
                    return () =>
                        new Promise<void>(resolve => {
                            resolveCleanup = () => {
                                operations.push('unregister:original');
                                resolve();
                            };
                        });
                }
                operations.push('register:next');
                return () => undefined;
            }),
        });

        const originalUpdate = desktopShortcutCoordinator.update(original);
        const disposal = desktopShortcutCoordinator.dispose();
        const update = desktopShortcutCoordinator.update(next);

        await Promise.resolve();
        expect(resolveOriginalRegistration).toBeTypeOf('function');
        resolveOriginalRegistration?.();
        await originalUpdate;
        await Promise.resolve();
        expect(resolveCleanup).toBeTypeOf('function');
        resolveCleanup?.();
        await Promise.all([disposal, update]);

        expect(operations).toEqual([
            'register:original',
            'unregister:original',
            'register:next',
        ]);

        await desktopShortcutCoordinator.dispose();
    });

    it('retains a failed cleanup so disposal can be retried', async () => {
        const cleanup = vi
            .fn<() => Promise<void>>()
            .mockRejectedValueOnce(new Error('Native unregister failed'))
            .mockResolvedValue(undefined);
        const registerGlobalShortcuts = vi.fn(async () => cleanup);
        getPlatformAdapter.mockReturnValue({ registerGlobalShortcuts });

        await desktopShortcutCoordinator.update(DEFAULT_DESKTOP_SHORTCUTS);

        await expect(desktopShortcutCoordinator.dispose()).rejects.toThrow(
            'Native unregister failed'
        );
        await desktopShortcutCoordinator.dispose();

        expect(cleanup).toHaveBeenCalledTimes(2);

        await desktopShortcutCoordinator.update(DEFAULT_DESKTOP_SHORTCUTS);
        expect(registerGlobalShortcuts).toHaveBeenCalledTimes(2);
        await desktopShortcutCoordinator.dispose();
    });
});
