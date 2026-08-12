import { PlannerCommandsProvider } from '../core/application/plannerContext';
import { PlannerStoreProvider } from '../core/store/plannerContext';
import { PlannerShell } from '../features/shell/PlannerShell';
import { CollaborationProvider } from '../core/collaboration/CollaborationContext';
import { ItemDragProvider } from '../features/items/ItemDragProvider';
import { ShortcutProvider } from '../features/shortcuts/ShortcutProvider';

export function App() {
    return (
        <PlannerStoreProvider>
            <CollaborationProvider>
                <PlannerCommandsProvider>
                    <ShortcutProvider>
                        <ItemDragProvider>
                            <PlannerShell />
                        </ItemDragProvider>
                    </ShortcutProvider>
                </PlannerCommandsProvider>
            </CollaborationProvider>
        </PlannerStoreProvider>
    );
}
