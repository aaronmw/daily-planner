import React, { memo } from 'react';
import useDrop from '../hooks/useDrop';
import minutesToHeight from '../utils/minutesToHeight';
import toInt from '../utils/toInt';
import { GhostButton } from './atoms/Button';
import { COPY } from './atoms/tokens';
import TaskCard, { TaskCardContainer } from './TaskCard';

const TaskList = ({ appActions, appData, ...otherProps }) => {
    const { onChangeTaskPosition, onCreateTask } = appActions;

    const { incompleteTasks, lists, selectedListId } = appData;

    const selectedList = lists.find(list => list.id === selectedListId);

    const unscheduledTasks = incompleteTasks.filter(
        task =>
            !task.scheduled &&
            task.list_id === selectedListId &&
            !selectedList.isArchived
    );

    const [taskCardDropProps] = useDrop({
        'task-id': (taskId, evt) => {
            const droppedOnTaskId = toInt(evt.currentTarget.dataset.taskId);
            const droppedOnTaskIndex = appData.tasks.findIndex(
                task => task.id === droppedOnTaskId
            );
            onChangeTaskPosition(taskId, droppedOnTaskIndex);
        },
    });

    return (
        <TaskCardContainer {...otherProps}>
            <GhostButton
                style={{
                    height: minutesToHeight(30),
                }}
                title={COPY.TIPS.CREATE_NEW_TASK}
                onClick={() => onCreateTask()}
            >
                {COPY.CREATE_TASK_LABEL}
            </GhostButton>
            {unscheduledTasks.map(task => (
                <TaskCard
                    key={task.id}
                    appActions={appActions}
                    appData={appData}
                    task={task}
                    {...taskCardDropProps}
                />
            ))}
        </TaskCardContainer>
    );
};

export default memo(TaskList);
