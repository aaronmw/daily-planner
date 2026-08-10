import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_DESKTOP_SHORTCUTS } from '../../../core/application/commandIds';

const register = vi.fn();
const unregister = vi.fn();

vi.mock('@tauri-apps/plugin-global-shortcut', () => ({
    register,
    unregister,
}));

import { TauriPlatformAdapter } from '../platformAdapter';

describe('TauriPlatformAdapter shortcuts', () => {
    beforeEach(() => {
        register.mockReset();
        unregister.mockReset();
        register.mockResolvedValue(undefined);
        unregister.mockResolvedValue(undefined);
    });

    it('restores the previous registration transactionally and dispatches only Pressed', async () => {
        const adapter = new TauriPlatformAdapter();
        const dispatched: string[] = [];
        await adapter.registerGlobalShortcuts(
            DEFAULT_DESKTOP_SHORTCUTS,
            command => dispatched.push(command)
        );
        const previousValues = Object.values(DEFAULT_DESKTOP_SHORTCUTS);
        const next = {
            ...DEFAULT_DESKTOP_SHORTCUTS,
            'create-item': 'Shift+Control+Alt+Super+N',
        } as const;
        register
            .mockRejectedValueOnce(new Error('Unavailable shortcut'))
            .mockResolvedValueOnce(undefined);

        await expect(
            adapter.registerGlobalShortcuts(next, () => undefined)
        ).rejects.toThrow('Unavailable shortcut');

        expect(unregister).toHaveBeenCalledWith(previousValues);
        expect(register).toHaveBeenLastCalledWith(
            previousValues,
            expect.any(Function)
        );
        const restoredHandler = register.mock.calls.at(-1)?.[1] as
            ((event: { shortcut: string; state: string }) => void) | undefined;
        expect(restoredHandler).toBeTypeOf('function');
        restoredHandler?.({
            shortcut: DEFAULT_DESKTOP_SHORTCUTS['create-item'],
            state: 'Released',
        });
        restoredHandler?.({
            shortcut: DEFAULT_DESKTOP_SHORTCUTS['create-item'],
            state: 'Pressed',
        });
        expect(dispatched).toEqual(['create-item']);
    });
});
