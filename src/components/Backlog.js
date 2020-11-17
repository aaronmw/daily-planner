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
import { COLORS, DEFAULT_TASK_ICON, GRID_UNIT } from './atoms/tokens';

const Container = styled(AppColumn).attrs({
    label: 'Backlog',
})(
    ({ hasTasks, isTargetedForDrop, theme }) => `
        background-color: ${COLORS[theme.name].SHADED};
        flex-grow: 1;
        overflow: ${hasTasks ? 'auto' : 'visible'};
    `
);

const BacklogDropZone = styled(Box).attrs({
    isFlexible: true,
})(
    ({ isTargetedForDrop, theme }) => `
        box-shadow: ${
            isTargetedForDrop
                ? `0 0 0 5px ${COLORS[theme.name].BORDER_HOVER} inset`
                : 'initial'
        };
        position: relative;
    `
);

const CreateFirstTaskTip = styled(Box)`
    position: absolute;
    left: calc(100% + ${GRID_UNIT} * 2);
    top: 50%;
    transform: translateY(-50%);
    white-space: nowrap;
`;

const Backlog = ({
    appActions,
    appData,
    selectedTaskId,
    tasks,
    onClickTask,
    ...otherProps
}) => {
    const { onChangeTheme, onCreateTask, onUpdateTask } = appActions;
    const { theme } = appData;
    const [dropProps] = useDrop('task-id', taskId =>
        onUpdateTask(taskId, {
            scheduled: false,
        })
    );
    const unscheduledTasks = tasks.filter(task => !task.scheduled);
    const hasTasks = tasks.length;

    const handleClickNewTask = () => onCreateTask();

    return (
        <Container {...otherProps}>
            <OptionBar
                options={['DARK', 'LIGHT']}
                renderOption={option => option.toLowerCase()}
                renderSelectedOption={option => `${option} mode`}
                selectedOption={theme}
                onChange={onChangeTheme}
            />
            <BacklogDropZone {...dropProps}>
                <FlexBox
                    justify="flex-start"
                    direction="column"
                    spacing={1}
                    padding={1}
                    style={{
                        bottom: 0,
                        left: 0,
                        overflow: hasTasks ? 'auto' : 'visible',
                        position: 'absolute',
                        right: 0,
                        top: 0,
                    }}
                >
                    <div style={{ position: 'relative', width: '100%' }}>
                        {!hasTasks && (
                            <CreateFirstTaskTip>
                                <span
                                    role="img"
                                    aria-label="left-pointing hand"
                                >
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
                    {unscheduledTasks.map(task => (
                        <TaskCard
                            key={task.id}
                            appActions={appActions}
                            isActive={selectedTaskId === task.id}
                            task={task}
                        />
                    ))}
                </FlexBox>
            </BacklogDropZone>
        </Container>
    );
};

export default Backlog;
