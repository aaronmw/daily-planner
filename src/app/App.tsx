import { PlannerCommandsProvider } from '../core/application/plannerContext';
import { PlannerStoreProvider } from '../core/store/plannerContext';
import { PlannerShell } from '../features/shell/PlannerShell';
import { CollaborationProvider } from '../core/collaboration/CollaborationContext';
import { ItemDragProvider } from '../features/items/ItemDragProvider';

export function App() {
    return (
        <PlannerStoreProvider>
            <CollaborationProvider>
                <PlannerCommandsProvider>
                    <ItemDragProvider>
                        <PlannerShell />
                    </ItemDragProvider>
                </PlannerCommandsProvider>
            </CollaborationProvider>
        </PlannerStoreProvider>
    );
}
