import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_DESKTOP_SHORTCUTS } from '../../core/application/commandIds';
import {
    APP_SHORTCUT_IDS,
    DEFAULT_APP_SHORTCUTS,
    type ShortcutAssignments,
} from '../../core/application/shortcutCommands';
import { desktopShortcutCoordinator } from '../../platform/runtime/desktopShortcuts';
import { ShortcutProvider } from '../shortcuts/ShortcutProvider';
import { ShortcutSettings } from './ShortcutSettings';

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

const renderSettings = (overrides?: Partial<ShortcutAssignments>) => {
    const assignments: ShortcutAssignments = {
        app: { ...DEFAULT_APP_SHORTCUTS, ...overrides?.app },
        desktop: { ...DEFAULT_DESKTOP_SHORTCUTS, ...overrides?.desktop },
    };
    const onUpdate = vi.fn();
    vi.spyOn(desktopShortcutCoordinator, 'dispose').mockResolvedValue();
    const update = vi
        .spyOn(desktopShortcutCoordinator, 'update')
        .mockResolvedValue();
    render(
        <ShortcutProvider>
            <ShortcutSettings assignments={assignments} onUpdate={onUpdate} />
        </ShortcutProvider>
    );
    return { assignments, onUpdate, update };
};

const deferred = () => {
    let resolve!: () => void;
    const promise = new Promise<void>(complete => {
        resolve = complete;
    });
    return { promise, resolve };
};

describe('ShortcutSettings', () => {
    it('lists every configurable global and in-app command', () => {
        renderSettings();

        for (const label of [
            'Show Daily Planner',
            'New List',
            'New Item',
            'Create Item',
            'Items',
            'Lists',
            'Timeline',
            'Lighting Mode',
            'Cycle Item Duration',
            'Select Items 1–9',
            'Move Item Up/Down',
            'Switch List Up/Down',
        ]) {
            expect(screen.getByText(label)).toBeVisible();
        }
    });

    it('offers to displace a conflicting action and unassigns it on confirmation', async () => {
        const user = userEvent.setup();
        const { assignments, onUpdate } = renderSettings();
        await user.click(
            screen.getByRole('button', {
                name: 'Edit shortcut for Create Item',
            })
        );

        fireEvent.keyDown(window, {
            code: 'KeyD',
            key: 'd',
            metaKey: true,
        });

        expect(
            await screen.findByText(/already assigned to Cycle Item Duration/)
        ).toBeVisible();
        await user.click(screen.getByRole('button', { name: 'Use it here' }));

        await waitFor(() =>
            expect(onUpdate).toHaveBeenCalledWith({
                app: {
                    ...assignments.app,
                    [APP_SHORTCUT_IDS.createItem]: 'Super+KeyD',
                    [APP_SHORTCUT_IDS.cycleDuration]: undefined,
                },
                desktop: assignments.desktop,
            })
        );
    });

    it('normalizes a recorded selection digit into one 1–9 family assignment', async () => {
        const user = userEvent.setup();
        const { assignments, onUpdate } = renderSettings();
        await user.click(
            screen.getByRole('button', {
                name: 'Edit shortcut for Select Items 1–9',
            })
        );

        fireEvent.keyDown(window, {
            code: 'Digit3',
            key: '3',
            metaKey: true,
            shiftKey: true,
        });

        await waitFor(() =>
            expect(onUpdate).toHaveBeenCalledWith({
                app: {
                    ...assignments.app,
                    [APP_SHORTCUT_IDS.selectItems]: 'Shift+Super+Digit1',
                },
                desktop: assignments.desktop,
            })
        );
    });

    it('accepts a modifier-free in-app shortcut', async () => {
        const user = userEvent.setup();
        const { assignments, onUpdate } = renderSettings();
        await user.click(
            screen.getByRole('button', {
                name: 'Edit shortcut for Create Item',
            })
        );

        fireEvent.keyDown(window, { code: 'KeyC', key: 'c' });

        await waitFor(() =>
            expect(onUpdate).toHaveBeenCalledWith({
                app: {
                    ...assignments.app,
                    [APP_SHORTCUT_IDS.createItem]: 'KeyC',
                },
                desktop: assignments.desktop,
            })
        );
    });

    it('cancels a conflict without changing either assignment', async () => {
        const user = userEvent.setup();
        const { assignments, onUpdate, update } = renderSettings();
        await user.click(
            screen.getByRole('button', {
                name: 'Edit shortcut for Create Item',
            })
        );
        fireEvent.keyDown(window, {
            code: 'KeyD',
            key: 'd',
            metaKey: true,
        });
        await screen.findByText(/already assigned to Cycle Item Duration/);

        await user.click(screen.getByRole('button', { name: 'Cancel' }));

        expect(onUpdate).not.toHaveBeenCalled();
        await waitFor(() =>
            expect(update).toHaveBeenLastCalledWith(assignments.desktop)
        );
    });

    it('does not persist a deferred candidate after Escape restores the saved shortcuts', async () => {
        const user = userEvent.setup();
        const { assignments, onUpdate, update } = renderSettings();
        const registration = deferred();
        update.mockImplementationOnce(() => registration.promise);
        await user.click(
            screen.getByRole('button', {
                name: 'Edit shortcut for Create Item',
            })
        );

        fireEvent.keyDown(window, { code: 'KeyC', key: 'c' });
        fireEvent.keyDown(window, { code: 'Escape', key: 'Escape' });
        registration.resolve();

        await waitFor(() =>
            expect(update).toHaveBeenLastCalledWith(assignments.desktop)
        );
        expect(onUpdate).not.toHaveBeenCalled();
    });
});
