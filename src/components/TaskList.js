import React, { memo, useCallback, useMemo } from 'react';
import useDrop from '../hooks/useDrop';
import usePlannerViewportHeight from '../hooks/usePlannerViewportHeight';
import toInt from '../utils/toInt';
import { getTaskEstimatedSize } from '../utils/virtualization';
import { GhostButton } from './atoms/Button';
import { COPY } from './atoms/tokens';
import TaskCard from './TaskCard';
import VirtualCollection from './VirtualCollection';

const CREATE_TASK_ITEM = { id: 'create-task', kind: 'create-task' };
const getTaskListItemKey = item => item.id;

const TaskList = ({ appActions, appData, ...otherProps }) => {
    const {
        onChangeTaskPosition,
        onCreateTask,
        onImmediatelySelectTask,
        onTransitionToTask,
    } = appActions;
    const {
        effectiveRelativeCardSizingEnabled,
        isShowingListManager,
        plannerIndexes,
        selectedListId,
        selectedTaskId,
        timelineHoursPerScreen,
        tasks,
    } = appData;
    const selectedList = plannerIndexes.listById.get(selectedListId);
    const unscheduledTasks = useMemo(
        () =>
            selectedList?.isArchived
                ? []
                : plannerIndexes.unscheduledTasksByListId.get(selectedListId) ||
                  [],
        [plannerIndexes.unscheduledTasksByListId, selectedList, selectedListId]
    );
    const items = useMemo(
        () => [CREATE_TASK_ITEM, ...unscheduledTasks],
        [unscheduledTasks]
    );
    const taskIndexById = useMemo(
        () =>
            new Map(
                unscheduledTasks.map((task, index) => [task.id, index + 1])
            ),
        [unscheduledTasks]
    );
    const viewportHeight = usePlannerViewportHeight();
    const estimateSize = useCallback(
        index => {
            const item = items[index];
            const durationMinutes =
                item.kind === 'create-task' ? 30 : item.duration_minutes;

            return getTaskEstimatedSize({
                durationMinutes,
                hoursPerScreen: timelineHoursPerScreen,
                relativeCardSizingEnabled: effectiveRelativeCardSizingEnabled,
                viewportHeight,
            });
        },
        [
            items,
            effectiveRelativeCardSizingEnabled,
            timelineHoursPerScreen,
            viewportHeight,
        ]
    );
    const [taskCardDropProps] = useDrop({
        'task-id': (taskId, evt) => {
            const droppedOnTaskId = toInt(evt.currentTarget.dataset.taskId);
            const droppedOnTaskIndex = tasks.findIndex(
                task => task.id === droppedOnTaskId
            );
            onChangeTaskPosition(taskId, droppedOnTaskIndex);
        },
    });
    const renderItem = useCallback(
        item =>
            item.kind === 'create-task' ? (
                <GhostButton
                    className="planner-create-task-button"
                    title={COPY.TIPS.CREATE_NEW_TASK}
                    onClick={() => onCreateTask()}
                >
                    {COPY.CREATE_TASK_LABEL}
                </GhostButton>
            ) : (
                <TaskCard
                    cardThemeStyle={plannerIndexes.themeByListId.get(
                        item.list_id
                    )}
                    isActive={item.id === selectedTaskId}
                    isShowingListManager={isShowingListManager}
                    onImmediatelySelectTask={onImmediatelySelectTask}
                    onTransitionToTask={onTransitionToTask}
                    task={item}
                    {...taskCardDropProps}
                />
            ),
        [
            isShowingListManager,
            onCreateTask,
            onImmediatelySelectTask,
            onTransitionToTask,
            plannerIndexes.themeByListId,
            selectedTaskId,
            taskCardDropProps,
        ]
    );

    return (
        <VirtualCollection
            {...otherProps}
            className="planner-task-card-list"
            estimateSize={estimateSize}
            focusSelected
            getItemKey={getTaskListItemKey}
            items={items}
            renderItem={renderItem}
            selectedIndex={taskIndexById.get(selectedTaskId) ?? -1}
        />
    );
};

export default memo(TaskList);
