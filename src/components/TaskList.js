import React, { memo, useCallback, useMemo } from 'react';
import { canWrite, ROLES } from '../collaboration/roles';
import useDrop from '../hooks/useDrop';
import usePlannerViewportHeight from '../hooks/usePlannerViewportHeight';
import { getTaskEstimatedSize } from '../utils/virtualization';
import { GhostButton } from './atoms/Button';
import { COPY } from './atoms/tokens';
import TaskCard from './TaskCard';
import VirtualCollection from './VirtualCollection';

const CREATE_TASK_ITEM = { id: 'create-task', kind: 'create-task' };
const getTaskListItemKey = item => item.id;

const TaskList = ({ appActions, appData, ...otherProps }) => {
    const { onChangeTaskPosition, onCreateTask, onTransitionToTask } =
        appActions;
    const {
        effectiveRelativeCardSizingEnabled,
        labelEditSession,
        plannerIndexes,
        selectedListId,
        selectedTaskId,
        timelineHoursPerScreen,
        tasks,
    } = appData;
    const collaboration = appData.collaboration || {};
    const selectedList = plannerIndexes.listById.get(selectedListId);
    const canCreateTask =
        selectedList?.is_private_copy ||
        !collaboration.isEnabled ||
        canWrite(collaboration.roleByListId?.get(selectedListId) || ROLES.READ);
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
            const droppedOnTaskId = evt.currentTarget.dataset.taskId;
            const droppedOnTaskIndex = tasks.findIndex(
                task => String(task.id) === droppedOnTaskId
            );
            onChangeTaskPosition(taskId, droppedOnTaskIndex);
        },
    });
    const renderItem = useCallback(
        (item, itemIndex) =>
            item.kind === 'create-task' ? (
                <GhostButton
                    className="planner-create-task-button"
                    disabled={!canCreateTask}
                    title={
                        canCreateTask
                            ? COPY.TIPS.CREATE_NEW_TASK
                            : 'Write access is required to create tasks.'
                    }
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
                    isMutable={
                        plannerIndexes.listById.get(item.list_id)
                            ?.is_private_copy ||
                        !collaboration.isEnabled ||
                        canWrite(
                            collaboration.roleByListId?.get(item.list_id) ||
                                ROLES.READ
                        )
                    }
                    creatorProfile={collaboration.getProfileForList?.(
                        item.list_id,
                        item.creator_identity_id
                    )}
                    isCreatorPresent={collaboration.presenceByIdentityId?.has(
                        item.creator_identity_id
                    )}
                    onTransitionToTask={onTransitionToTask}
                    shortcutNumber={itemIndex <= 9 ? itemIndex : null}
                    task={item}
                    showCreatorAvatar={
                        (collaboration.membersByListId?.get(item.list_id)
                            ?.length || 0) > 1
                    }
                    {...taskCardDropProps}
                />
            ),
        [
            canCreateTask,
            collaboration.membersByListId,
            collaboration.presenceByIdentityId,
            collaboration.getProfileForList,
            collaboration.isEnabled,
            collaboration.roleByListId,
            onCreateTask,
            onTransitionToTask,
            plannerIndexes.listById,
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
            focusSelected={
                !(
                    labelEditSession?.entityType === 'task' &&
                    labelEditSession.entityId === selectedTaskId
                )
            }
            getItemKey={getTaskListItemKey}
            items={items}
            revealSelected
            renderItem={renderItem}
            selectedIndex={taskIndexById.get(selectedTaskId) ?? -1}
        />
    );
};

export default memo(TaskList);
