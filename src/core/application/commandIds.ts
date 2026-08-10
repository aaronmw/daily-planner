export const PLANNER_COMMAND_IDS = {
    createList: 'create-list',
    createItem: 'create-item',
    showPlanner: 'show-planner',
} as const;

export type PlannerCommandId =
    (typeof PLANNER_COMMAND_IDS)[keyof typeof PLANNER_COMMAND_IDS];

export const DEFAULT_DESKTOP_SHORTCUTS: Record<PlannerCommandId, string> = {
    [PLANNER_COMMAND_IDS.createList]: 'Shift+Control+Alt+Super+KeyL',
    [PLANNER_COMMAND_IDS.createItem]: 'Shift+Control+Alt+Super+KeyT',
    [PLANNER_COMMAND_IDS.showPlanner]: 'Shift+Control+Alt+Super+KeyP',
};
