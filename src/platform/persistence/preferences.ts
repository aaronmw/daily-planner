import type { PreferenceRepository } from '../../core/application/ports';
import {
    APP_SHORTCUT_IDS,
    DEFAULT_APP_SHORTCUTS,
} from '../../core/application/shortcutCommands';
import { plannerPreferencesSchema } from '../../core/domain/schemas';
import type { PlannerPreferences } from '../../core/domain/types';
import { DEFAULT_PREFERENCES } from '../../core/store/plannerStore';

const PREFERENCES_KEY = 'daily-planner:v5:preferences';
const LEGACY_CYCLE_THEME_SHORTCUT = 'Super+KeyD';

const migrateDurationShortcut = (
    preferences: PlannerPreferences
): PlannerPreferences => {
    const shortcuts = preferences.appShortcuts;
    if (
        shortcuts[APP_SHORTCUT_IDS.cycleDuration] !== undefined ||
        shortcuts[APP_SHORTCUT_IDS.cycleTheme] !== LEGACY_CYCLE_THEME_SHORTCUT
    ) {
        return preferences;
    }

    return {
        ...preferences,
        appShortcuts: {
            ...shortcuts,
            [APP_SHORTCUT_IDS.cycleDuration]:
                DEFAULT_APP_SHORTCUTS[APP_SHORTCUT_IDS.cycleDuration],
            [APP_SHORTCUT_IDS.cycleTheme]:
                DEFAULT_APP_SHORTCUTS[APP_SHORTCUT_IDS.cycleTheme],
        },
    };
};

export class LocalStoragePreferenceRepository implements PreferenceRepository {
    load(): PlannerPreferences {
        const stored = localStorage.getItem(PREFERENCES_KEY);
        if (!stored) return DEFAULT_PREFERENCES;
        const parsed = plannerPreferencesSchema.safeParse(JSON.parse(stored));
        return parsed.success
            ? migrateDurationShortcut(parsed.data as PlannerPreferences)
            : DEFAULT_PREFERENCES;
    }

    save(preferences: PlannerPreferences): void {
        const valid = plannerPreferencesSchema.parse(preferences);
        localStorage.setItem(PREFERENCES_KEY, JSON.stringify(valid));
    }
}
