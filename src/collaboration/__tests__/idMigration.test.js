import { isPlannerUuid, migratePlannerIds } from '../idMigration';

const existingUuid = '11111111-1111-4111-8111-111111111111';
const generatedListUuid = '22222222-2222-4222-8222-222222222222';
const generatedTaskUuid = '33333333-3333-4333-8333-333333333333';
const existingTaskUuid = '44444444-4444-4444-8444-444444444444';

describe('planner UUID migration', () => {
    it('maps legacy IDs and relationships without mutating planner data', () => {
        const state = {
            lists: [
                { id: 1, label: 'Legacy' },
                { id: existingUuid, label: 'Already migrated' },
            ],
            tasks: [
                { id: 10, list_id: 1, label: 'Task' },
                {
                    id: existingTaskUuid,
                    list_id: existingUuid,
                    label: 'Existing task',
                },
            ],
            selectedListId: 1,
            selectedTaskId: 10,
        };
        const original = JSON.parse(JSON.stringify(state));
        const generated = [generatedListUuid, generatedTaskUuid];
        const result = migratePlannerIds(state, {
            createId: () => generated.shift(),
        });

        expect(result.lists.map(list => list.id)).toEqual([
            generatedListUuid,
            existingUuid,
        ]);
        expect(result.tasks).toEqual([
            {
                id: generatedTaskUuid,
                list_id: generatedListUuid,
                label: 'Task',
            },
            {
                id: existingTaskUuid,
                list_id: existingUuid,
                label: 'Existing task',
            },
        ]);
        expect(result.selectedListId).toBe(generatedListUuid);
        expect(result.selectedTaskId).toBe(generatedTaskUuid);
        expect(result.listIdMap.get(1)).toBe(generatedListUuid);
        expect(result.taskIdMap.get(10)).toBe(generatedTaskUuid);
        expect(state).toEqual(original);
    });

    it('generates RFC 4122 version-4 UUIDs by default', () => {
        const result = migratePlannerIds({
            lists: [{ id: 1 }],
            tasks: [],
            selectedListId: 1,
            selectedTaskId: null,
        });

        expect(isPlannerUuid(result.lists[0].id)).toBe(true);
    });

    it('rejects duplicate IDs and orphaned task relationships', () => {
        expect(() =>
            migratePlannerIds({
                lists: [{ id: 1 }, { id: 1 }],
                tasks: [],
            })
        ).toThrow(/duplicate list/i);
        expect(() =>
            migratePlannerIds({
                lists: [{ id: 1 }],
                tasks: [{ id: 2, list_id: 999 }],
            })
        ).toThrow(/unknown list/i);
    });

    it('rejects a UUID reused by a list and a task', () => {
        expect(() =>
            migratePlannerIds({
                lists: [{ id: existingUuid }],
                tasks: [{ id: existingUuid, list_id: existingUuid }],
            })
        ).toThrow(/duplicate planner UUID/i);
    });
});
