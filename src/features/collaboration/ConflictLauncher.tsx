import { lazy, Suspense } from 'react';
import { useCollaborationSelector } from '../../core/collaboration/CollaborationContext';

const ConflictResolver = lazy(async () => {
    const module = await import('./ConflictResolver');
    return { default: module.ConflictResolver };
});

export function ConflictLauncher() {
    const hasConflicts = useCollaborationSelector(
        state => state.conflicts.length > 0
    );
    if (!hasConflicts) return null;
    return (
        <Suspense fallback={null}>
            <ConflictResolver />
        </Suspense>
    );
}
