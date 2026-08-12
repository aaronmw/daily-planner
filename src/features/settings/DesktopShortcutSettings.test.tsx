import {
    act,
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    DEFAULT_DESKTOP_SHORTCUTS,
    PLANNER_COMMAND_IDS,
    type PlannerCommandId,
} from '../../core/application/commandIds';
import { ShortcutProvider } from '../shortcuts/ShortcutProvider';
import { desktopShortcutCoordinator } from '../../platform/runtime/desktopShortcuts';
import { DesktopShortcutSettings } from './DesktopShortcutSettings';

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

const renderSettings = () => {
    const onUpdate = vi.fn();
    const dispose = vi
        .spyOn(desktopShortcutCoordinator, 'dispose')
        .mockResolvedValue();
    const update = vi
        .spyOn(desktopShortcutCoordinator, 'update')
        .mockResolvedValue();
    render(
        <ShortcutProvider>
            <DesktopShortcutSettings
                onUpdate={onUpdate}
                shortcuts={DEFAULT_DESKTOP_SHORTCUTS}
            />
        </ShortcutProvider>
    );
    return { dispose, onUpdate, update };
};

const editShowPlanner = async () => {
    const user = userEvent.setup();
    await user.click(
        screen.getByRole('button', {
            name: 'Edit shortcut for Show Daily Planner',
        })
    );
    return user;
};

const createDeferred = () => {
    let resolve!: () => void;
    const promise = new Promise<void>(complete => {
        resolve = complete;
    });
    return { promise, resolve };
};

describe('DesktopShortcutSettings', () => {
    it('shows each command with its configured keycaps and an edit control', () => {
        renderSettings();

        expect(screen.getByText('Show Daily Planner')).toBeVisible();
        expect(
            document.querySelector('.fa-window-restore')
        ).toBeInTheDocument();
        expect(
            screen.getByTestId('show-planner-shortcut-keys')
        ).toHaveTextContent('⇧⌃⌥⌘P');
        expect(
            screen.getByRole('button', {
                name: 'Edit shortcut for Show Daily Planner',
            })
        ).toHaveAttribute('aria-pressed', 'false');
    });

    it('suspends native shortcuts and persists the complete map only after registration', async () => {
        const { dispose, onUpdate, update } = renderSettings();
        await editShowPlanner();

        expect(dispose).toHaveBeenCalledOnce();
        fireEvent.keyDown(window, {
            code: 'MetaLeft',
            key: 'Meta',
            metaKey: true,
        });
        expect(
            screen.getByTestId('show-planner-shortcut-keys')
        ).toHaveTextContent('⌘');

        const registered = createDeferred();
        update.mockImplementationOnce(() => registered.promise);
        fireEvent.keyDown(window, {
            code: 'KeyP',
            key: 'p',
            metaKey: true,
        });

        expect(onUpdate).not.toHaveBeenCalled();
        await waitFor(() =>
            expect(update).toHaveBeenCalledWith({
                ...DEFAULT_DESKTOP_SHORTCUTS,
                [PLANNER_COMMAND_IDS.showPlanner]: 'Super+KeyP',
            })
        );
        expect(onUpdate).not.toHaveBeenCalled();

        registered.resolve();
        await waitFor(() =>
            expect(onUpdate).toHaveBeenCalledWith({
                ...DEFAULT_DESKTOP_SHORTCUTS,
                [PLANNER_COMMAND_IDS.showPlanner]: 'Super+KeyP',
            })
        );
    });

    it('shows a suspension failure inline and allows retrying the start', async () => {
        const { dispose } = renderSettings();
        dispose
            .mockRejectedValueOnce(new Error('Native suspension failed'))
            .mockResolvedValueOnce();

        await editShowPlanner();

        expect(
            await screen.findByText(
                'Could not start shortcut editing: Native suspension failed'
            )
        ).toBeVisible();
        expect(
            screen.getByRole('button', {
                name: 'Edit shortcut for Show Daily Planner',
            })
        ).toHaveAttribute('aria-pressed', 'false');

        await editShowPlanner();

        expect(dispose).toHaveBeenCalledTimes(2);
        expect(
            screen.getByRole('button', {
                name: 'Stop editing shortcut for Show Daily Planner',
            })
        ).toHaveAttribute('aria-pressed', 'true');
    });

    it('cancels a deferred suspension when the pencil loses focus', async () => {
        const { dispose, update } = renderSettings();
        const suspension = createDeferred();
        dispose.mockReturnValueOnce(suspension.promise);
        const pencil = screen.getByRole('button', {
            name: 'Edit shortcut for Show Daily Planner',
        });

        fireEvent.click(pencil);
        expect(pencil).toHaveAttribute('aria-pressed', 'true');

        fireEvent.blur(pencil);
        await act(async () => suspension.resolve());

        await waitFor(() =>
            expect(update).toHaveBeenCalledWith(DEFAULT_DESKTOP_SHORTCUTS)
        );
        expect(
            screen.getByRole('button', {
                name: 'Edit shortcut for Show Daily Planner',
            })
        ).toHaveAttribute('aria-pressed', 'false');
    });

    it('restores the saved native shortcuts when Escape cancels recording', async () => {
        const { update } = renderSettings();
        await editShowPlanner();

        fireEvent.keyDown(window, { code: 'Escape', key: 'Escape' });

        await waitFor(() =>
            expect(update).toHaveBeenCalledWith(DEFAULT_DESKTOP_SHORTCUTS)
        );
    });

    it('does not persist a deferred candidate after Escape restores the saved shortcuts', async () => {
        const { onUpdate, update } = renderSettings();
        const candidateRegistration = createDeferred();
        const registeredMaps: Readonly<Record<PlannerCommandId, string>>[] = [];
        update.mockImplementation(async shortcuts => {
            await candidateRegistration.promise;
            registeredMaps.push(shortcuts);
        });
        await editShowPlanner();

        fireEvent.keyDown(window, {
            code: 'KeyP',
            key: 'p',
            metaKey: true,
        });
        fireEvent.keyDown(window, { code: 'Escape', key: 'Escape' });
        candidateRegistration.resolve();

        await waitFor(() => expect(registeredMaps).toHaveLength(2));
        expect(registeredMaps.at(-1)).toBe(DEFAULT_DESKTOP_SHORTCUTS);
        expect(onUpdate).not.toHaveBeenCalled();
        expect(
            screen.getByRole('button', {
                name: 'Edit shortcut for Show Daily Planner',
            })
        ).toHaveAttribute('aria-pressed', 'false');
    });

    it('keeps the pending candidate pencil available to cancel and restore', async () => {
        const { onUpdate, update } = renderSettings();
        const candidateRegistration = createDeferred();
        const registeredMaps: Readonly<Record<PlannerCommandId, string>>[] = [];
        update.mockImplementation(async shortcuts => {
            await candidateRegistration.promise;
            registeredMaps.push(shortcuts);
        });
        const user = await editShowPlanner();

        fireEvent.keyDown(window, {
            code: 'KeyP',
            key: 'p',
            metaKey: true,
        });
        const pencil = screen.getByRole('button', {
            name: 'Stop editing shortcut for Show Daily Planner',
        });
        expect(pencil).not.toBeDisabled();

        await user.click(pencil);
        candidateRegistration.resolve();

        await waitFor(() => expect(registeredMaps).toHaveLength(2));
        expect(registeredMaps.at(-1)).toBe(DEFAULT_DESKTOP_SHORTCUTS);
        expect(onUpdate).not.toHaveBeenCalled();
        expect(
            screen.getByRole('button', {
                name: 'Edit shortcut for Show Daily Planner',
            })
        ).toHaveAttribute('aria-pressed', 'false');
    });

    it('restores the saved native shortcuts when recording loses focus', async () => {
        const { update } = renderSettings();
        await editShowPlanner();

        fireEvent.blur(window);

        await waitFor(() =>
            expect(update).toHaveBeenCalledWith(DEFAULT_DESKTOP_SHORTCUTS)
        );
    });

    it('returns to the saved keycaps after modifiers are released while listening', async () => {
        renderSettings();
        await editShowPlanner();

        fireEvent.keyDown(window, {
            code: 'MetaLeft',
            key: 'Meta',
            metaKey: true,
        });
        fireEvent.keyUp(window, {
            code: 'MetaLeft',
            key: 'Meta',
            metaKey: false,
        });

        expect(
            screen.getByTestId('show-planner-shortcut-keys')
        ).toHaveTextContent('⇧⌃⌥⌘P');
    });

    it('retains the listening error and allows retrying after a registration failure', async () => {
        const { onUpdate, update } = renderSettings();
        update
            .mockRejectedValueOnce(new Error('That shortcut is unavailable.'))
            .mockResolvedValueOnce();
        await editShowPlanner();

        fireEvent.keyDown(window, {
            code: 'KeyP',
            key: 'p',
            metaKey: true,
        });

        await waitFor(() =>
            expect(
                screen.getByText('That shortcut is unavailable.')
            ).toBeVisible()
        );
        expect(onUpdate).not.toHaveBeenCalled();

        fireEvent.keyDown(window, {
            code: 'KeyP',
            key: 'p',
            metaKey: true,
        });

        await waitFor(() =>
            expect(onUpdate).toHaveBeenCalledWith({
                ...DEFAULT_DESKTOP_SHORTCUTS,
                [PLANNER_COMMAND_IDS.showPlanner]: 'Super+KeyP',
            })
        );
    });

    it('restores the saved native map when preference persistence throws', async () => {
        const { onUpdate, update } = renderSettings();
        onUpdate.mockImplementationOnce(() => {
            throw new Error('Preference storage failed');
        });
        await editShowPlanner();

        fireEvent.keyDown(window, {
            code: 'KeyP',
            key: 'p',
            metaKey: true,
        });

        await waitFor(() => expect(update).toHaveBeenCalledTimes(2));
        expect(update).toHaveBeenNthCalledWith(1, {
            ...DEFAULT_DESKTOP_SHORTCUTS,
            [PLANNER_COMMAND_IDS.showPlanner]: 'Super+KeyP',
        });
        expect(update).toHaveBeenNthCalledWith(2, DEFAULT_DESKTOP_SHORTCUTS);
        expect(
            screen.getByText(
                'Could not save shortcut: Preference storage failed'
            )
        ).toBeVisible();
    });

    it('reports preference and restoration failures separately', async () => {
        const { onUpdate, update } = renderSettings();
        update
            .mockResolvedValueOnce()
            .mockRejectedValueOnce(new Error('Native restoration failed'));
        onUpdate.mockImplementationOnce(() => {
            throw new Error('Preference storage failed');
        });
        await editShowPlanner();

        fireEvent.keyDown(window, {
            code: 'KeyP',
            key: 'p',
            metaKey: true,
        });

        expect(
            await screen.findByText(
                'Could not save shortcut: Preference storage failed. Restoring the previous shortcut also failed: Native restoration failed'
            )
        ).toBeVisible();
        expect(update).toHaveBeenLastCalledWith(DEFAULT_DESKTOP_SHORTCUTS);
    });
});
