import type { PreferenceRepository } from '../../core/application/ports';
import { plannerPreferencesSchema } from '../../core/domain/schemas';
import type { PlannerPreferences } from '../../core/domain/types';
import { DEFAULT_PREFERENCES } from '../../core/store/plannerStore';

const PREFERENCES_KEY = 'daily-planner:v5:preferences';

export class LocalStoragePreferenceRepository implements PreferenceRepository {
    load(): PlannerPreferences {
        const stored = localStorage.getItem(PREFERENCES_KEY);
        if (!stored) return DEFAULT_PREFERENCES;
        const parsed = plannerPreferencesSchema.safeParse(JSON.parse(stored));
        return parsed.success ? parsed.data : DEFAULT_PREFERENCES;
    }

    save(preferences: PlannerPreferences): void {
        const valid = plannerPreferencesSchema.parse(preferences);
        localStorage.setItem(PREFERENCES_KEY, JSON.stringify(valid));
    }
}
