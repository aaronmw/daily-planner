import {
    buildPlannerIndexes,
    getVisibleScheduledTasks,
} from '../plannerIndexes';

const lists = [
    { id: 1, label: 'One' },
    { id: 2, label: 'Two' },
];

const tasks = [
    {
        id: 'early-overlap',
        list_id: 1,
        duration_minutes: 120,
        scheduled: true,
        scheduled_time: '6:00',
        isComplete: false,
    },
    {
        id: 'inside',
        list_id: 1,
        duration_minutes: 30,
        scheduled: true,
        scheduled_time: '8:30',
        isComplete: false,
    },
    {
        id: 'at-end',
        list_id: 2,
        duration_minutes: 30,
        scheduled: true,
        scheduled_time: '10:00',
        isComplete: false,
    },
    {
        id: 'unscheduled',
        list_id: 2,
        duration_minutes: 45,
        scheduled: false,
        scheduled_time: '9:00',
        isComplete: false,
    },
    {
        id: 'trashed',
        list_id: 2,
        duration_minutes: 15,
        scheduled: false,
        scheduled_time: '9:00',
        isComplete: true,
    },
];

describe('planner indexes', () => {
    it('builds stable lookup collections in one pass', () => {
        const indexes = buildPlannerIndexes(
            lists,
            tasks,
            list => `theme:${list.id}`
        );

        expect(indexes.listById.get(2)).toBe(lists[1]);
        expect(indexes.themeByListId.get(2)).toBe('theme:2');
        expect(indexes.taskById.get('inside')).toBe(tasks[1]);
        expect(indexes.tasksByListId.get(1)).toEqual(tasks.slice(0, 2));
        expect(indexes.unscheduledTasksByListId.get(2)).toEqual([tasks[3]]);
        expect(indexes.incompleteTasks.map(task => task.id)).toEqual([
            'early-overlap',
            'inside',
            'at-end',
            'unscheduled',
        ]);
        expect(indexes.trashedTasks).toEqual([tasks[4]]);
        expect(indexes.trashedLists).toEqual([]);
        expect(
            indexes.scheduledTaskEntries.map(entry => entry.task.id)
        ).toEqual(['early-overlap', 'inside', 'at-end']);
        expect(indexes.maxScheduledDurationMinutes).toBe(120);
    });

    it('includes only scheduled tasks intersecting the time window', () => {
        const indexes = buildPlannerIndexes(lists, tasks);
        const visibleTasks = getVisibleScheduledTasks(
            indexes.scheduledTaskEntries,
            {
                maxDurationMinutes: indexes.maxScheduledDurationMinutes,
                overscanMinutes: 0,
                visibleEndMinute: 10 * 60,
                visibleStartMinute: 7 * 60 + 30,
            }
        );

        expect(visibleTasks.map(task => task.id)).toEqual([
            'early-overlap',
            'inside',
        ]);
    });

    it('matches a full intersection filter across a large task set', () => {
        const largeTasks = Array.from({ length: 10000 }, (_, index) => ({
            id: index,
            list_id: 1,
            duration_minutes: [15, 30, 45, 60][index % 4],
            scheduled: true,
            scheduled_time: `${Math.floor(index / 60) % 24}:${index % 60}`,
            isComplete: false,
        }));
        const indexes = buildPlannerIndexes(lists, largeTasks);
        const options = {
            maxDurationMinutes: indexes.maxScheduledDurationMinutes,
            overscanMinutes: 60,
            visibleStartMinute: 8 * 60,
            visibleEndMinute: 12 * 60,
        };
        const rangeStart = options.visibleStartMinute - options.overscanMinutes;
        const rangeEnd = options.visibleEndMinute + options.overscanMinutes;
        const expected = indexes.scheduledTaskEntries
            .filter(
                entry =>
                    entry.startMinute < rangeEnd && entry.endMinute > rangeStart
            )
            .map(entry => entry.task.id);

        expect(
            getVisibleScheduledTasks(indexes.scheduledTaskEntries, options).map(
                task => task.id
            )
        ).toEqual(expected);
    });
});
