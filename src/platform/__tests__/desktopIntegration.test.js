const mockRegister = jest.fn(() => Promise.resolve());
const mockUnregister = jest.fn(() => Promise.resolve());

jest.mock('../runtime', () => ({ isDesktopRuntime: () => true }));
jest.mock('@tauri-apps/plugin-global-shortcut', () => ({
    register: mockRegister,
    unregister: mockUnregister,
}));

import {
    acquireDesktopIntegration,
    changeDesktopShortcuts,
    createDesktopShortcutHandler,
    shortcutMapsMatch,
} from '../desktopIntegration';
import { DEFAULT_DESKTOP_SHORTCUTS } from '../desktopShortcut';
import { PLANNER_COMMANDS } from '../../utils/plannerCommands';

describe('desktop command dispatch', () => {
    beforeEach(() => {
        mockRegister.mockClear();
        mockUnregister.mockClear();
    });

    it('dispatches a pressed shortcut exactly once and ignores release', () => {
        const onCommand = jest.fn();
        const handler = createDesktopShortcutHandler(
            DEFAULT_DESKTOP_SHORTCUTS,
            onCommand
        );
        const shortcut =
            DEFAULT_DESKTOP_SHORTCUTS[PLANNER_COMMANDS.CREATE_TASK];

        handler({ shortcut, state: 'Released' });
        handler({ shortcut, state: 'Pressed' });

        expect(onCommand).toHaveBeenCalledTimes(1);
        expect(onCommand).toHaveBeenCalledWith(PLANNER_COMMANDS.CREATE_TASK);
    });

    it('compares command maps independently of object identity', () => {
        expect(
            shortcutMapsMatch(DEFAULT_DESKTOP_SHORTCUTS, {
                ...DEFAULT_DESKTOP_SHORTCUTS,
            })
        ).toBe(true);
        expect(
            shortcutMapsMatch(DEFAULT_DESKTOP_SHORTCUTS, {
                ...DEFAULT_DESKTOP_SHORTCUTS,
                [PLANNER_COMMANDS.CREATE_TASK]: 'Shift+Super+KeyK',
            })
        ).toBe(false);
    });

    it('restores prior registrations when a changed shortcut is unavailable', async () => {
        const release = acquireDesktopIntegration(
            DEFAULT_DESKTOP_SHORTCUTS,
            jest.fn()
        );
        await changeDesktopShortcuts(DEFAULT_DESKTOP_SHORTCUTS);
        const nextShortcuts = {
            ...DEFAULT_DESKTOP_SHORTCUTS,
            [PLANNER_COMMANDS.CREATE_TASK]: 'Shift+Super+KeyK',
        };

        mockRegister
            .mockRejectedValueOnce(new Error('Unavailable'))
            .mockResolvedValueOnce();

        await expect(changeDesktopShortcuts(nextShortcuts)).rejects.toThrow(
            'Unavailable'
        );
        expect(mockUnregister).toHaveBeenCalledWith(
            Object.values(DEFAULT_DESKTOP_SHORTCUTS)
        );
        expect(mockRegister).toHaveBeenLastCalledWith(
            Object.values(DEFAULT_DESKTOP_SHORTCUTS),
            expect.any(Function)
        );

        release();
        await changeDesktopShortcuts(DEFAULT_DESKTOP_SHORTCUTS);
    });
});
