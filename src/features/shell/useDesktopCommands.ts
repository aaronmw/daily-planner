import { useEffect } from 'react';
import {
    PLANNER_COMMAND_IDS,
    type PlannerCommandId,
} from '../../core/application/commandIds';
import { usePlannerCommands } from '../../core/application/plannerContext';
import { usePlannerSelector } from '../../core/store/plannerContext';
import { getPlatformAdapter } from '../../platform/runtime/platformAdapter';
import { desktopShortcutCoordinator } from '../../platform/runtime/desktopShortcuts';

export function useDesktopCommands() {
    const commands = usePlannerCommands();
    const shortcuts = usePlannerSelector(
        state => state.preferences.desktopShortcuts
    );

    useEffect(() => {
        const execute = (commandId: PlannerCommandId) => {
            let result: Promise<unknown>;
            if (commandId === PLANNER_COMMAND_IDS.createList) {
                result = commands.createList();
            } else if (commandId === PLANNER_COMMAND_IDS.createItem) {
                result = commands.createItem();
            } else {
                result = getPlatformAdapter().showPlanner();
            }
            void result.catch(error => {
                console.error('Could not run planner command.', error);
            });
        };
        desktopShortcutCoordinator.setHandler(execute);
    }, [commands]);

    useEffect(() => {
        void desktopShortcutCoordinator.update(shortcuts).catch(error => {
            console.error('Could not register global shortcuts.', error);
        });
    }, [shortcuts]);

    useEffect(() => {
        return () => {
            void desktopShortcutCoordinator.dispose();
        };
    }, []);
}
