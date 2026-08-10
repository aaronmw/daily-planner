import type { ColumnVisibility, PlannerColumn } from '../../core/domain/types';

export type ShortcutColumn = Extract<
    PlannerColumn,
    'items' | 'lists' | 'timeline'
>;

const SHORTCUT_COLUMNS: Record<string, ShortcutColumn> = {
    i: 'items',
    l: 'lists',
    t: 'timeline',
};

export interface ColumnShortcutResult {
    focusColumn: ShortcutColumn | null;
    visibility: ColumnVisibility;
}

export function resolveColumnShortcut(
    key: string,
    visibility: ColumnVisibility
): ColumnShortcutResult | null {
    const column = SHORTCUT_COLUMNS[key.toLowerCase()];
    if (!column) return null;

    if (!visibility[column]) {
        return {
            focusColumn: column,
            visibility: { ...visibility, [column]: true },
        };
    }

    const openCount = Object.values(visibility).filter(Boolean).length;
    if (openCount === 1) {
        return { focusColumn: null, visibility };
    }

    return {
        focusColumn: null,
        visibility: { ...visibility, [column]: false },
    };
}
