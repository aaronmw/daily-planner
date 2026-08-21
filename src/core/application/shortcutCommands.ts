import { PLANNER_COMMAND_IDS, type PlannerCommandId } from './commandIds';

type ShortcutModifier = 'alt' | 'control' | 'meta' | 'shift';

export interface RuntimeShortcutDefinition {
    code: string;
    id: string;
    key: string;
    keyLabel: string;
    modifiers: readonly ShortcutModifier[];
}

export const APP_SHORTCUT_IDS = {
    createItem: 'app-create-item',
    cycleDuration: 'cycle-duration',
    cycleTheme: 'cycle-theme',
    selectItems: 'select-items-1-9',
    switchLists: 'switch-lists',
    toggleItems: 'toggle-items',
    toggleLists: 'toggle-lists',
    toggleTimeline: 'toggle-timeline',
    reorderItems: 'reorder-items',
} as const;

export type AppShortcutId =
    (typeof APP_SHORTCUT_IDS)[keyof typeof APP_SHORTCUT_IDS];
export type ConfigurableShortcutId =
    `app:${AppShortcutId}` | `desktop:${PlannerCommandId}`;
export type ShortcutFamily = 'digits-1-9' | 'vertical-arrows';

export interface ConfigurableShortcutCommand {
    defaultAssignment: string;
    family?: ShortcutFamily;
    icon: string;
    id: ConfigurableShortcutId;
    label: string;
    scope: 'app' | 'desktop';
    settingId: AppShortcutId | PlannerCommandId;
}

export interface ShortcutAssignments {
    app: Partial<Record<AppShortcutId, string>>;
    desktop: Partial<Record<PlannerCommandId, string>>;
}

export const DEFAULT_APP_SHORTCUTS: Record<AppShortcutId, string> = {
    [APP_SHORTCUT_IDS.createItem]: 'Super+KeyN',
    [APP_SHORTCUT_IDS.cycleDuration]: 'Super+KeyD',
    [APP_SHORTCUT_IDS.cycleTheme]: 'Shift+Super+KeyD',
    [APP_SHORTCUT_IDS.selectItems]: 'Super+Digit1',
    [APP_SHORTCUT_IDS.switchLists]: 'Shift+Super+ArrowUp',
    [APP_SHORTCUT_IDS.toggleItems]: 'Super+KeyI',
    [APP_SHORTCUT_IDS.toggleLists]: 'Super+KeyL',
    [APP_SHORTCUT_IDS.toggleTimeline]: 'Super+KeyT',
    [APP_SHORTCUT_IDS.reorderItems]: 'Super+ArrowUp',
};

export const CONFIGURABLE_SHORTCUT_COMMANDS: readonly ConfigurableShortcutCommand[] =
    [
        {
            defaultAssignment: 'Shift+Control+Alt+Super+KeyP',
            icon: 'window-restore',
            id: `desktop:${PLANNER_COMMAND_IDS.showPlanner}`,
            label: 'Show Daily Planner',
            scope: 'desktop',
            settingId: PLANNER_COMMAND_IDS.showPlanner,
        },
        {
            defaultAssignment: 'Shift+Control+Alt+Super+KeyL',
            icon: 'rectangle-list',
            id: `desktop:${PLANNER_COMMAND_IDS.createList}`,
            label: 'New List',
            scope: 'desktop',
            settingId: PLANNER_COMMAND_IDS.createList,
        },
        {
            defaultAssignment: 'Shift+Control+Alt+Super+KeyT',
            icon: 'square-check',
            id: `desktop:${PLANNER_COMMAND_IDS.createItem}`,
            label: 'New Item',
            scope: 'desktop',
            settingId: PLANNER_COMMAND_IDS.createItem,
        },
        {
            defaultAssignment:
                DEFAULT_APP_SHORTCUTS[APP_SHORTCUT_IDS.createItem],
            icon: 'square-plus',
            id: `app:${APP_SHORTCUT_IDS.createItem}`,
            label: 'Create Item',
            scope: 'app',
            settingId: APP_SHORTCUT_IDS.createItem,
        },
        {
            defaultAssignment:
                DEFAULT_APP_SHORTCUTS[APP_SHORTCUT_IDS.toggleItems],
            icon: 'square-check',
            id: `app:${APP_SHORTCUT_IDS.toggleItems}`,
            label: 'Items',
            scope: 'app',
            settingId: APP_SHORTCUT_IDS.toggleItems,
        },
        {
            defaultAssignment:
                DEFAULT_APP_SHORTCUTS[APP_SHORTCUT_IDS.toggleLists],
            icon: 'rectangle-list',
            id: `app:${APP_SHORTCUT_IDS.toggleLists}`,
            label: 'Lists',
            scope: 'app',
            settingId: APP_SHORTCUT_IDS.toggleLists,
        },
        {
            defaultAssignment:
                DEFAULT_APP_SHORTCUTS[APP_SHORTCUT_IDS.toggleTimeline],
            icon: 'calendar-day',
            id: `app:${APP_SHORTCUT_IDS.toggleTimeline}`,
            label: 'Timeline',
            scope: 'app',
            settingId: APP_SHORTCUT_IDS.toggleTimeline,
        },
        {
            defaultAssignment:
                DEFAULT_APP_SHORTCUTS[APP_SHORTCUT_IDS.cycleTheme],
            icon: 'moon',
            id: `app:${APP_SHORTCUT_IDS.cycleTheme}`,
            label: 'Lighting Mode',
            scope: 'app',
            settingId: APP_SHORTCUT_IDS.cycleTheme,
        },
        {
            defaultAssignment:
                DEFAULT_APP_SHORTCUTS[APP_SHORTCUT_IDS.cycleDuration],
            icon: 'clock',
            id: `app:${APP_SHORTCUT_IDS.cycleDuration}`,
            label: 'Cycle Item Duration',
            scope: 'app',
            settingId: APP_SHORTCUT_IDS.cycleDuration,
        },
        {
            defaultAssignment:
                DEFAULT_APP_SHORTCUTS[APP_SHORTCUT_IDS.selectItems],
            family: 'digits-1-9',
            icon: 'list-ol',
            id: `app:${APP_SHORTCUT_IDS.selectItems}`,
            label: 'Select Items 1–9',
            scope: 'app',
            settingId: APP_SHORTCUT_IDS.selectItems,
        },
        {
            defaultAssignment:
                DEFAULT_APP_SHORTCUTS[APP_SHORTCUT_IDS.reorderItems],
            family: 'vertical-arrows',
            icon: 'arrows-up-down',
            id: `app:${APP_SHORTCUT_IDS.reorderItems}`,
            label: 'Move Item Up/Down',
            scope: 'app',
            settingId: APP_SHORTCUT_IDS.reorderItems,
        },
        {
            defaultAssignment:
                DEFAULT_APP_SHORTCUTS[APP_SHORTCUT_IDS.switchLists],
            family: 'vertical-arrows',
            icon: 'arrow-right-arrow-left',
            id: `app:${APP_SHORTCUT_IDS.switchLists}`,
            label: 'Switch List Up/Down',
            scope: 'app',
            settingId: APP_SHORTCUT_IDS.switchLists,
        },
    ];

const MODIFIER_ORDER = ['Shift', 'Control', 'Alt', 'Super'] as const;
const SUPPORTED_CODE =
    /^(?:Key[A-Z]|Digit[0-9]|Arrow(?:Up|Down|Left|Right)|F(?:[1-9]|1[0-9]|2[0-4])|Backspace|Enter|Escape|Space|Tab)$/;

const parseAssignment = (assignment: string) => {
    const tokens = assignment.split('+').filter(Boolean);
    const code = tokens.at(-1) ?? '';
    const modifierTokens = tokens.slice(0, -1);
    const modifiers = new Set(modifierTokens);
    if (
        !SUPPORTED_CODE.test(code) ||
        modifiers.size !== modifierTokens.length ||
        modifierTokens.some(
            token =>
                !MODIFIER_ORDER.includes(
                    token as (typeof MODIFIER_ORDER)[number]
                )
        )
    ) {
        return null;
    }
    return {
        code,
        modifiers: MODIFIER_ORDER.filter(modifier => modifiers.has(modifier)),
    };
};

const assignmentWithCode = (
    modifiers: readonly string[],
    code: string
): string => [...modifiers, code].join('+');

const definitionModifier: Record<string, ShortcutModifier> = {
    Alt: 'alt',
    Control: 'control',
    Shift: 'shift',
    Super: 'meta',
};

const definitionKey = (code: string): { key: string; keyLabel: string } => {
    if (/^Key[A-Z]$/.test(code)) {
        const key = code.slice(3);
        return { key: key.toLocaleLowerCase(), keyLabel: key };
    }
    if (/^Digit[0-9]$/.test(code)) {
        const key = code.slice(5);
        return { key, keyLabel: key };
    }
    const labels: Record<string, string> = {
        ArrowDown: '↓',
        ArrowLeft: '←',
        ArrowRight: '→',
        ArrowUp: '↑',
        Backspace: 'Delete',
        Enter: 'Return',
        Escape: 'Escape',
        Space: 'Space',
        Tab: 'Tab',
    };
    return { key: code, keyLabel: labels[code] ?? code };
};

export function normalizeShortcutCandidate(
    command: ConfigurableShortcutCommand,
    candidate: string
): string | null {
    const parsed = parseAssignment(candidate);
    if (
        !parsed ||
        (command.scope === 'desktop' && parsed.modifiers.length === 0)
    ) {
        return null;
    }

    if (command.family === 'digits-1-9') {
        if (!/^Digit[1-9]$/.test(parsed.code)) return null;
        return assignmentWithCode(parsed.modifiers, 'Digit1');
    }
    if (command.family === 'vertical-arrows') {
        if (parsed.code !== 'ArrowUp' && parsed.code !== 'ArrowDown')
            return null;
        return assignmentWithCode(parsed.modifiers, 'ArrowUp');
    }
    return assignmentWithCode(parsed.modifiers, parsed.code);
}

export function expandShortcutAssignment(
    command: ConfigurableShortcutCommand,
    assignment: string
): readonly string[] {
    const normalized = normalizeShortcutCandidate(command, assignment);
    if (!normalized) return [];
    const parsed = parseAssignment(normalized);
    if (!parsed) return [];
    if (command.family === 'digits-1-9') {
        return Array.from({ length: 9 }, (_, index) =>
            assignmentWithCode(parsed.modifiers, `Digit${index + 1}`)
        );
    }
    if (command.family === 'vertical-arrows') {
        return ['ArrowUp', 'ArrowDown'].map(code =>
            assignmentWithCode(parsed.modifiers, code)
        );
    }
    return [normalized];
}

export function shortcutDefinitionsFor(
    command: ConfigurableShortcutCommand,
    assignment: string | undefined
): readonly RuntimeShortcutDefinition[] {
    if (!assignment) return [];
    return expandShortcutAssignment(command, assignment).flatMap(
        (concreteAssignment, index) => {
            const parsed = parseAssignment(concreteAssignment);
            if (!parsed) return [];
            return [
                {
                    code: parsed.code,
                    id: `${command.id}:${index}`,
                    ...definitionKey(parsed.code),
                    modifiers: parsed.modifiers.flatMap(modifier => {
                        const result = definitionModifier[modifier];
                        return result ? [result] : [];
                    }),
                },
            ];
        }
    );
}

export function getShortcutAssignment(
    assignments: ShortcutAssignments,
    command: ConfigurableShortcutCommand
): string | undefined {
    return command.scope === 'desktop'
        ? assignments.desktop[command.settingId as PlannerCommandId]
        : assignments.app[command.settingId as AppShortcutId];
}

const withoutAssignment = (
    assignments: ShortcutAssignments,
    command: ConfigurableShortcutCommand
): ShortcutAssignments => {
    const next: ShortcutAssignments = {
        app: { ...assignments.app },
        desktop: { ...assignments.desktop },
    };
    if (command.scope === 'desktop') {
        next.desktop = Object.fromEntries(
            Object.entries(next.desktop).filter(
                ([id]) => id !== command.settingId
            )
        );
    } else {
        next.app = Object.fromEntries(
            Object.entries(next.app).filter(([id]) => id !== command.settingId)
        );
    }
    return next;
};

const withAssignment = (
    assignments: ShortcutAssignments,
    command: ConfigurableShortcutCommand,
    assignment: string
): ShortcutAssignments => {
    const next = withoutAssignment(assignments, command);
    if (command.scope === 'desktop') {
        next.desktop[command.settingId as PlannerCommandId] = assignment;
    } else {
        next.app[command.settingId as AppShortcutId] = assignment;
    }
    return next;
};

export const getConfigurableShortcutCommand = (id: ConfigurableShortcutId) =>
    CONFIGURABLE_SHORTCUT_COMMANDS.find(command => command.id === id) ?? null;

export function findShortcutConflicts(
    assignments: ShortcutAssignments,
    targetId: ConfigurableShortcutId,
    candidate: string
): readonly ConfigurableShortcutCommand[] {
    const target = getConfigurableShortcutCommand(targetId);
    if (!target) return [];
    const normalized = normalizeShortcutCandidate(target, candidate);
    if (!normalized) return [];
    const candidateAssignments = new Set(
        expandShortcutAssignment(target, normalized)
    );
    return CONFIGURABLE_SHORTCUT_COMMANDS.filter(command => {
        if (command.id === targetId) return false;
        const assignment = getShortcutAssignment(assignments, command);
        return (
            assignment !== undefined &&
            expandShortcutAssignment(command, assignment).some(value =>
                candidateAssignments.has(value)
            )
        );
    });
}

export function assignShortcut(
    assignments: ShortcutAssignments,
    targetId: ConfigurableShortcutId,
    candidate: string,
    options: { displaceConflicts: boolean }
): ShortcutAssignments {
    const target = getConfigurableShortcutCommand(targetId);
    if (!target) return assignments;
    const normalized = normalizeShortcutCandidate(target, candidate);
    if (!normalized) return assignments;
    const conflicts = findShortcutConflicts(assignments, targetId, normalized);
    if (conflicts.length > 0 && !options.displaceConflicts) return assignments;

    const displaced = conflicts.reduce(withoutAssignment, assignments);
    return withAssignment(displaced, target, normalized);
}
