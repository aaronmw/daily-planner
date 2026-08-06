'use client';

import PlannerLayout from './components/PlannerLayout';
import usePlannerApp from './hooks/usePlannerApp';

export default function App() {
    const planner = usePlannerApp();

    return <PlannerLayout planner={planner} />;
}
