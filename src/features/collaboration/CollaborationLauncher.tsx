import { lazy, Suspense } from 'react';
import { IconButton } from '../shell/IconButton';

const CollaborationDialog = lazy(async () => {
    const module = await import('./CollaborationDialog');
    return { default: module.CollaborationDialog };
});

export function CollaborationLauncher() {
    return (
        <Suspense
            fallback={
                <IconButton disabled icon="user-plus" label="Loading sharing" />
            }
        >
            <CollaborationDialog />
        </Suspense>
    );
}
