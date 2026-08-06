import strToMinutes from './strToMinutes';

const getDurationMinutes = task =>
    Math.max(0, Number(task.duration_minutes) || 0);

const buildPlannerIndexes = (
    lists,
    tasks,
    buildListTheme = () => undefined
) => {
    const listById = new Map();
    const taskById = new Map();
    const themeByListId = new Map();
    const tasksByListId = new Map();
    const unscheduledTasksByListId = new Map();
    const incompleteTasks = [];
    const trashedLists = [];
    const trashedTasks = [];
    const scheduledTaskEntries = [];
    let maxScheduledDurationMinutes = 0;

    lists.forEach(list => {
        listById.set(list.id, list);
        themeByListId.set(list.id, buildListTheme(list));
        tasksByListId.set(list.id, []);
        unscheduledTasksByListId.set(list.id, []);

        if (list.isArchived) {
            trashedLists.push(list);
        }
    });

    tasks.forEach(task => {
        taskById.set(task.id, task);

        if (task.isComplete) {
            trashedTasks.push(task);
            return;
        }

        incompleteTasks.push(task);

        if (!tasksByListId.has(task.list_id)) {
            tasksByListId.set(task.list_id, []);
        }
        tasksByListId.get(task.list_id).push(task);

        if (!task.scheduled) {
            if (!unscheduledTasksByListId.has(task.list_id)) {
                unscheduledTasksByListId.set(task.list_id, []);
            }
            unscheduledTasksByListId.get(task.list_id).push(task);
            return;
        }

        const durationMinutes = getDurationMinutes(task);
        const startMinute = strToMinutes(task.scheduled_time);
        scheduledTaskEntries.push({
            endMinute: startMinute + durationMinutes,
            startMinute,
            task,
        });
        maxScheduledDurationMinutes = Math.max(
            maxScheduledDurationMinutes,
            durationMinutes
        );
    });

    scheduledTaskEntries.sort(
        (left, right) => left.startMinute - right.startMinute
    );

    return {
        incompleteTasks,
        listById,
        maxScheduledDurationMinutes,
        scheduledTaskEntries,
        taskById,
        tasksByListId,
        themeByListId,
        trashedLists,
        trashedTasks,
        unscheduledTasksByListId,
    };
};

const findFirstPossibleIntersection = (entries, earliestStartMinute) => {
    let lowerBound = 0;
    let upperBound = entries.length;

    while (lowerBound < upperBound) {
        const midpoint = Math.floor((lowerBound + upperBound) / 2);

        if (entries[midpoint].startMinute < earliestStartMinute) {
            lowerBound = midpoint + 1;
        } else {
            upperBound = midpoint;
        }
    }

    return lowerBound;
};

const getVisibleScheduledTasks = (
    entries,
    {
        maxDurationMinutes = 0,
        overscanMinutes = 60,
        visibleEndMinute,
        visibleStartMinute,
    }
) => {
    const rangeStart = visibleStartMinute - overscanMinutes;
    const rangeEnd = visibleEndMinute + overscanMinutes;
    const firstIndex = findFirstPossibleIntersection(
        entries,
        rangeStart - maxDurationMinutes
    );
    const visibleTasks = [];

    for (let index = firstIndex; index < entries.length; index += 1) {
        const entry = entries[index];

        if (entry.startMinute >= rangeEnd) {
            break;
        }

        if (entry.endMinute > rangeStart) {
            visibleTasks.push(entry.task);
        }
    }

    return visibleTasks;
};

export { buildPlannerIndexes, getVisibleScheduledTasks };
