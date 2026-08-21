import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    APP_SHORTCUT_IDS,
    DEFAULT_APP_SHORTCUTS,
} from '../../core/application/shortcutCommands';
import { DEFAULT_DESKTOP_SHORTCUTS } from '../../core/application/commandIds';
import { DEFAULT_PREFERENCES } from '../../core/store/plannerStore';
import { LocalStoragePreferenceRepository } from './preferences';

const PREFERENCES_KEY = 'daily-planner:v5:preferences';

describe('LocalStoragePreferenceRepository shortcut migration', () => {
    const values = new Map<string, string>();

    beforeEach(() => {
        values.clear();
        vi.stubGlobal('localStorage', {
            getItem: (key: string) => values.get(key) ?? null,
            setItem: (key: string, value: string) => values.set(key, value),
        });
    });

    it('adds default in-app shortcuts without discarding existing preferences', () => {
        localStorage.setItem(
            PREFERENCES_KEY,
            JSON.stringify({
                ...DEFAULT_PREFERENCES,
                appShortcuts: undefined,
                desktopShortcuts: {
                    ...DEFAULT_DESKTOP_SHORTCUTS,
                    'show-planner': 'Super+KeyP',
                },
                themeMode: 'dark',
            })
        );

        expect(new LocalStoragePreferenceRepository().load()).toMatchObject({
            appShortcuts: DEFAULT_APP_SHORTCUTS,
            desktopShortcuts: {
                ...DEFAULT_DESKTOP_SHORTCUTS,
                'show-planner': 'Super+KeyP',
            },
            themeMode: 'dark',
        });
    });

    it('moves the legacy command-D lighting shortcut to item duration', () => {
        const legacyShortcuts = Object.fromEntries(
            Object.entries(DEFAULT_APP_SHORTCUTS).filter(
                ([id]) => id !== APP_SHORTCUT_IDS.cycleDuration
            )
        ) as Partial<typeof DEFAULT_APP_SHORTCUTS>;
        legacyShortcuts[APP_SHORTCUT_IDS.cycleTheme] = 'Super+KeyD';
        localStorage.setItem(
            PREFERENCES_KEY,
            JSON.stringify({
                ...DEFAULT_PREFERENCES,
                appShortcuts: legacyShortcuts,
            })
        );

        expect(
            new LocalStoragePreferenceRepository().load().appShortcuts
        ).toMatchObject({
            [APP_SHORTCUT_IDS.cycleDuration]: 'Super+KeyD',
            [APP_SHORTCUT_IDS.cycleTheme]: 'Shift+Super+KeyD',
        });
    });
});
