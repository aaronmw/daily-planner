import type { ShortcutDefinition } from './ShortcutProvider';

const commandShortcut = (
    id: string,
    key: string,
    keyLabel = key.toLocaleUpperCase()
): ShortcutDefinition => ({
    id,
    key,
    keyLabel,
    modifiers: ['meta'],
});

export const ITEM_SELECTION_SHORTCUTS = Array.from({ length: 9 }, (_, index) =>
    commandShortcut(
        `select-item-${index + 1}`,
        String(index + 1),
        String(index + 1)
    )
);

export const CREATE_ITEM_SHORTCUT = commandShortcut('create-item', 'n');
export const CYCLE_THEME_SHORTCUT = commandShortcut('cycle-theme', 'd');
export const ITEMS_COLUMN_SHORTCUT = commandShortcut('toggle-items', 'i');
export const LISTS_COLUMN_SHORTCUT = commandShortcut('toggle-lists', 'l');
export const TIMELINE_COLUMN_SHORTCUT = commandShortcut('toggle-timeline', 't');
