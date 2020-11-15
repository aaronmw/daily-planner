import React from 'react';
import styled from 'styled-components';
import useDrop from '../hooks/useDrop';
import minutesToHeight from '../utils/minutesToHeight';
import Box from './atoms/Box';
import { GhostButton } from './atoms/Button';
import FlexBox from './atoms/FlexBox';
import TaskCard from './TaskCard';
import { COLORS, GRID_UNIT } from '../tokens';

const Container = styled(FlexBox).attrs({
    align: 'stretch',
    direction: 'column',
    justify: 'flex-start',
    padding: 1,
    spacing: 1,
})(
    ({ isTargetedForDrop, theme }) => `
        background-color: ${COLORS[theme.name].SHADED};
        box-shadow: ${
            isTargetedForDrop
                ? `0 0 0 5px ${COLORS[theme.name].BORDER_HOVER} inset`
                : 'initial'
        };
        flex-grow: 1;
    `
);

const CreateFirstTaskTip = styled(Box)`
    position: absolute;
    left: calc(100% + ${GRID_UNIT} * 2);
    top: 50%;
    transform: translateY(-50%);
    white-space: nowrap;
`;

const WaitingArea = ({
    appActions,
    selectedTaskId,
    tasks,
    onClickTask,
    ...otherProps
}) => {
    const { onSelectTask, onUpdateTask, onUpdateTasks } = appActions;
    const [dropProps] = useDrop('task-id', taskId =>
        onUpdateTask(taskId, {
            scheduled: false,
        })
    );
    const incompleteTasks = tasks.filter(task => !task.scheduled);

    const handleClickNewTask = () => {
        const newTaskId = Date.now();
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        onUpdateTasks({
            [newTaskId]: {
                icon: '📌',
                id: newTaskId,
                isComplete: false,
                label: 'New Task',
                notes: '',
                scheduled: false,
                scheduled_minutes: 30,
                scheduled_time: `${currentHour}:${currentMinute}`,
            },
        });
        onSelectTask(newTaskId);
    };

    return (
        <Container {...dropProps} {...otherProps}>
            <div style={{ position: 'relative', width: '100%' }}>
                {tasks.length === 0 && (
                    <CreateFirstTaskTip>
                        <span role="img" aria-label="left-pointing hand">
                            👈
                        </span>{' '}
                        Create your first task
                    </CreateFirstTaskTip>
                )}
                <GhostButton
                    style={{
                        height: minutesToHeight(30),
                    }}
                    onClick={handleClickNewTask}
                >
                    New Task
                </GhostButton>
            </div>
            {incompleteTasks.map(task => (
                <TaskCard
                    key={task.id}
                    appActions={appActions}
                    isActive={selectedTaskId === task.id}
                    task={task}
                />
            ))}
        </Container>
    );
};

export default WaitingArea;
