import type { ShortcutDefinition, ShortcutModifier } from './ShortcutProvider';

const modifierEventKeys: Record<
    ShortcutModifier,
    keyof Pick<KeyboardEvent, 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey'>
> = {
    alt: 'altKey',
    control: 'ctrlKey',
    meta: 'metaKey',
    shift: 'shiftKey',
};

const modifierAriaLabels: Record<ShortcutModifier, string> = {
    alt: 'Alt',
    control: 'Control',
    meta: 'Meta',
    shift: 'Shift',
};

const normalizeKey = (key: string) => key.toLocaleLowerCase();

export const shortcutAriaKeys = (shortcut: ShortcutDefinition) =>
    [
        ...shortcut.modifiers.map(modifier => modifierAriaLabels[modifier]),
        shortcut.keyLabel,
    ].join('+');

export const matchesShortcut = (
    event: Pick<
        KeyboardEvent,
        'altKey' | 'code' | 'ctrlKey' | 'key' | 'metaKey' | 'shiftKey'
    >,
    shortcut: ShortcutDefinition
) => {
    if (
        shortcut.code && event.code
            ? event.code !== shortcut.code
            : normalizeKey(event.key) !== normalizeKey(shortcut.key)
    ) {
        return false;
    }
    const requiredModifiers = new Set(shortcut.modifiers);
    return (Object.keys(modifierEventKeys) as ShortcutModifier[]).every(
        modifier =>
            event[modifierEventKeys[modifier]] ===
            requiredModifiers.has(modifier)
    );
};
