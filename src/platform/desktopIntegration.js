import {
    assertUniqueDesktopShortcuts,
    DEFAULT_DESKTOP_SHORTCUTS,
    normalizeDesktopShortcuts,
} from './desktopShortcut';
import { isDesktopRuntime } from './runtime';

let consumerCount = 0;
let desiredShortcuts = { ...DEFAULT_DESKTOP_SHORTCUTS };
let registeredShortcuts = {};
let commandHandler = null;
let synchronizationPromise = Promise.resolve();

const shortcutMapsMatch = (left, right) => {
    const leftEntries = Object.entries(left);
    const rightEntries = Object.entries(right);

    return (
        leftEntries.length === rightEntries.length &&
        leftEntries.every(
            ([commandId, shortcut]) => right[commandId] === shortcut
        )
    );
};

const createDesktopShortcutHandler = (shortcuts, onCommand) => event => {
    if (event.state !== 'Pressed') {
        return;
    }

    const commandEntry = Object.entries(shortcuts).find(
        ([, shortcut]) => shortcut === event.shortcut
    );

    if (commandEntry) {
        onCommand?.(commandEntry[0]);
    }
};

const registerShortcutMap = async (register, shortcuts) => {
    const shortcutValues = Object.values(shortcuts);

    if (!shortcutValues.length) {
        return;
    }

    await register(
        shortcutValues,
        createDesktopShortcutHandler(shortcuts, commandId =>
            commandHandler?.(commandId)
        )
    );
};

const synchronizeRegistration = () => {
    const operation = synchronizationPromise
        .catch(() => {})
        .then(async () => {
            const { register, unregister } =
                await import('@tauri-apps/plugin-global-shortcut');
            const nextShortcuts = consumerCount > 0 ? desiredShortcuts : {};

            if (shortcutMapsMatch(registeredShortcuts, nextShortcuts)) {
                return;
            }

            const previousShortcuts = registeredShortcuts;
            const previousValues = Object.values(previousShortcuts);

            if (previousValues.length) {
                await unregister(previousValues);
                registeredShortcuts = {};
            }

            if (!Object.keys(nextShortcuts).length) {
                return;
            }

            try {
                await registerShortcutMap(register, nextShortcuts);
                registeredShortcuts = { ...nextShortcuts };
            } catch (error) {
                if (previousValues.length) {
                    await registerShortcutMap(register, previousShortcuts);
                    registeredShortcuts = { ...previousShortcuts };
                }

                throw error;
            }
        });

    synchronizationPromise = operation;

    return operation;
};

export const acquireDesktopIntegration = (shortcuts, onCommand) => {
    if (!isDesktopRuntime()) {
        return () => {};
    }

    desiredShortcuts = normalizeDesktopShortcuts(shortcuts);
    assertUniqueDesktopShortcuts(desiredShortcuts);
    commandHandler = onCommand;
    consumerCount += 1;
    synchronizeRegistration().catch(error => {
        console.error('Could not register the global shortcuts.', error);
    });

    let isReleased = false;

    return () => {
        if (isReleased) {
            return;
        }

        isReleased = true;
        consumerCount = Math.max(0, consumerCount - 1);

        if (consumerCount === 0) {
            commandHandler = null;
        }

        synchronizeRegistration().catch(error => {
            console.error('Could not unregister the global shortcuts.', error);
        });
    };
};

export const changeDesktopShortcuts = async shortcuts => {
    assertUniqueDesktopShortcuts(shortcuts);
    const nextShortcuts = normalizeDesktopShortcuts(shortcuts);
    assertUniqueDesktopShortcuts(nextShortcuts);

    if (!isDesktopRuntime()) {
        return;
    }

    const previousShortcuts = desiredShortcuts;
    desiredShortcuts = nextShortcuts;

    try {
        await synchronizeRegistration();
    } catch (error) {
        desiredShortcuts = previousShortcuts;
        await synchronizeRegistration().catch(() => {});
        throw error;
    }
};

export { createDesktopShortcutHandler, shortcutMapsMatch };
