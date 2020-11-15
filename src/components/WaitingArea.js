import React from 'react';
import styled from 'styled-components';
import useDrop from '../hooks/useDrop';
import minutesToHeight from '../utils/minutesToHeight';
import { GhostButton } from './atoms/Button';
import TaskCard from './TaskCard';
import { COLORS, GRID_UNIT } from '../tokens';

const Container = styled.div(
    ({ isTargetedForDrop, theme }) => `
        background-color: ${COLORS[theme.name].SHADED};
        box-shadow: ${
            isTargetedForDrop
                ? `0 0 0 5px ${COLORS[theme.name].BORDER_HOVER} inset`
                : 'initial'
        };
        flex-grow: 1;
        padding: ${GRID_UNIT};

        & > * + * {
            margin-top: calc(${GRID_UNIT} / 2);
        }
    `
);

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
            <GhostButton
                style={{
                    height: minutesToHeight(30),
                }}
                onClick={handleClickNewTask}
            >
                New Task
            </GhostButton>
            {tasks.map(task => (
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
