import React from 'react';
import styled from 'styled-components';
import useDrop from '../hooks/useDrop';
import minutesToHeight from '../utils/minutesToHeight';
import AppColumn from './AppColumn';
import Box from './atoms/Box';
import { GhostButton } from './atoms/Button';
import FlexBox from './atoms/FlexBox';
import OptionBar from './OptionBar';
import TaskCard from './TaskCard';
import { COLORS, GRID_UNIT } from './atoms/tokens';

const Container = styled(AppColumn).attrs({
    label: 'Backlog',
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

export default ({
    appActions,
    appData,
    selectedTaskId,
    tasks,
    onClickTask,
    ...otherProps
}) => {
    const {
        onChangeTheme,
        onSelectTask,
        onUpdateTask,
        onUpdateTasks,
    } = appActions;
    const { theme } = appData;
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
            <OptionBar
                options={['DARK', 'LIGHT']}
                renderOption={option => option.toLowerCase()}
                renderSelectedOption={option => `${option} mode`}
                selectedOption={theme}
                onChange={onChangeTheme}
            />
            <FlexBox direction="column" spacing={1} padding={1}>
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
            </FlexBox>
        </Container>
    );
};
