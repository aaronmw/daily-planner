import { describe, expect, it } from 'vitest';
import { PLANNER_COMMAND_IDS } from './commandIds';
import {
    APP_SHORTCUT_IDS,
    CONFIGURABLE_SHORTCUT_COMMANDS,
    assignShortcut,
    expandShortcutAssignment,
    findShortcutConflicts,
    normalizeShortcutCandidate,
    shortcutDefinitionsFor,
    type ShortcutAssignments,
} from './shortcutCommands';

const command = (id: string) => {
    const result = CONFIGURABLE_SHORTCUT_COMMANDS.find(
        candidate => candidate.id === id
    );
    if (!result) throw new Error(`Missing command ${id}`);
    return result;
};

describe('configurable shortcut commands', () => {
    it('normalizes any recorded selection digit into the 1–9 family', () => {
        const selectItems = command(`app:${APP_SHORTCUT_IDS.selectItems}`);

        expect(
            normalizeShortcutCandidate(selectItems, 'Shift+Super+Digit3')
        ).toBe('Shift+Super+Digit1');
        expect(
            expandShortcutAssignment(selectItems, 'Shift+Super+Digit1')
        ).toEqual(
            Array.from(
                { length: 9 },
                (_, index) => `Shift+Super+Digit${index + 1}`
            )
        );
        expect(
            shortcutDefinitionsFor(selectItems, 'Shift+Super+Digit1').map(
                shortcut => ({
                    key: shortcut.key,
                    keyLabel: shortcut.keyLabel,
                    modifiers: shortcut.modifiers,
                })
            )
        ).toEqual(
            Array.from({ length: 9 }, (_, index) => ({
                key: String(index + 1),
                keyLabel: String(index + 1),
                modifiers: ['shift', 'meta'],
            }))
        );
    });

    it('allows modifier-free in-app candidates but rejects them for global commands', () => {
        expect(
            normalizeShortcutCandidate(
                command(`app:${APP_SHORTCUT_IDS.createItem}`),
                'KeyN'
            )
        ).toBe('KeyN');
        expect(
            normalizeShortcutCandidate(
                command(`desktop:${PLANNER_COMMAND_IDS.createItem}`),
                'KeyN'
            )
        ).toBeNull();
    });

    it('finds conflicts against every concrete member of a shortcut family', () => {
        const assignments: ShortcutAssignments = {
            app: {
                [APP_SHORTCUT_IDS.createItem]: 'Shift+Super+Digit3',
                [APP_SHORTCUT_IDS.selectItems]: 'Super+Digit1',
            },
            desktop: {},
        };

        expect(
            findShortcutConflicts(
                assignments,
                `app:${APP_SHORTCUT_IDS.selectItems}`,
                'Shift+Super+Digit1'
            ).map(conflict => conflict.id)
        ).toEqual([`app:${APP_SHORTCUT_IDS.createItem}`]);
    });

    it('assigns a conflicting chord to the target and unassigns displaced actions', () => {
        const assignments: ShortcutAssignments = {
            app: {
                [APP_SHORTCUT_IDS.createItem]: 'Super+KeyN',
                [APP_SHORTCUT_IDS.cycleTheme]: 'Super+KeyD',
            },
            desktop: {
                [PLANNER_COMMAND_IDS.showPlanner]: 'Super+KeyD',
            },
        };

        expect(
            assignShortcut(
                assignments,
                `app:${APP_SHORTCUT_IDS.createItem}`,
                'Super+KeyD',
                { displaceConflicts: true }
            )
        ).toEqual({
            app: {
                [APP_SHORTCUT_IDS.createItem]: 'Super+KeyD',
            },
            desktop: {},
        });
    });
});
