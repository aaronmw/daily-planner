import {
    getPersistentStorageKey,
    PERSISTENCE_NAMESPACE,
} from '../usePersistentState';

describe('persistent state namespace', () => {
    it('isolates the duration schema from pre-release storage', () => {
        expect(PERSISTENCE_NAMESPACE).toBe('daily-planner:v2');
        expect(getPersistentStorageKey('tasks')).toBe(
            'daily-planner:v2:tasks'
        );
        expect(getPersistentStorageKey('tasks')).not.toBe('tasks');
    });
});
