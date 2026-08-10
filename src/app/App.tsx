import { PlannerCommandsProvider } from '../core/application/plannerContext';
import { PlannerStoreProvider } from '../core/store/plannerContext';
import { PlannerShell } from '../features/shell/PlannerShell';
import { CollaborationProvider } from '../core/collaboration/CollaborationContext';

export function App() {
    return (
        <PlannerStoreProvider>
            <CollaborationProvider>
                <PlannerCommandsProvider>
                    <PlannerShell />
                </PlannerCommandsProvider>
            </CollaborationProvider>
        </PlannerStoreProvider>
    );
}
