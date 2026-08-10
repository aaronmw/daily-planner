'use client';

import PlannerLayout from './components/PlannerLayout';
import useDesktopIntegration from './hooks/useDesktopIntegration';
import usePlannerApp from './hooks/usePlannerApp';

export default function App() {
    const planner = usePlannerApp();
    useDesktopIntegration(
        planner.appData.desktopShortcuts,
        planner.appActions.onExecuteCommand
    );

    return <PlannerLayout planner={planner} />;
}
