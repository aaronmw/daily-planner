import React, { memo } from 'react';
import styled from 'styled-components';
import useDrop from '../hooks/useDrop';
import minutesToHeight from '../utils/minutesToHeight';
import toInt from '../utils/toInt';
import AppColumn from './AppColumn';
import Box from './atoms/Box';
import { GhostButton, ToggleButton } from './atoms/Button';
import FlexBox from './atoms/FlexBox';
import OptionBar from './OptionBar';
import TaskCard from './TaskCard';
import { COLORS, COPY, DEFAULT_TASK_ICON, GRID_UNIT } from './atoms/tokens';
import ToolBar from './ToolBar';

const Container = styled(AppColumn).attrs({
    label: 'Backlog',
})(
    ({ hasTasks, theme }) => `
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

const BacklogToggleButton = ({
    isBacklogVisibleOrDraggingTask,
    onChangeBacklogVisibility,
}) => (
    <ToggleButton
        isActive={isBacklogVisibleOrDraggingTask}
        title={
            isBacklogVisibleOrDraggingTask
                ? COPY.backlog_hide
                : COPY.backlog_show
        }
        onClick={() =>
            onChangeBacklogVisibility(!isBacklogVisibleOrDraggingTask)
        }
    >
        {isBacklogVisibleOrDraggingTask ? '👈' : '👉'}
    </ToggleButton>
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
    const {
        onChangeBacklogVisibility,
        onChangeTaskPosition,
        onChangeTheme,
        onCreateTask,
        onUpdateTask,
    } = appActions;
    const { isBacklogVisibleOrDraggingTask, theme } = appData;
    const [backlogDropProps] = useDrop('task-id', (taskId, evt) => {
        onUpdateTask(taskId, {
            scheduled: false,
        });
    });
    const [taskCardDropProps] = useDrop('task-id', (taskId, evt) => {
        const droppedOnTaskId = toInt(evt.currentTarget.dataset.taskId);
        const droppedOnTaskIndex = appData.tasks.findIndex(
            task => task.id === droppedOnTaskId
        );
        onChangeTaskPosition(taskId, droppedOnTaskIndex);
    });
    const unscheduledTasks = tasks.filter(task => !task.scheduled);
    const hasTasks = tasks.length;

    const handleClickNewTask = () => onCreateTask();

    return (
        <Container {...otherProps}>
            {!isBacklogVisibleOrDraggingTask ? (
                <BacklogToggleButton
                    isBacklogVisibleOrDraggingTask={
                        isBacklogVisibleOrDraggingTask
                    }
                    onChangeBacklogVisibility={onChangeBacklogVisibility}
                />
            ) : (
                <>
                    <ToolBar>
                        <ToggleButton
                            isActive={theme === 'DARK'}
                            title={
                                theme === 'DARK'
                                    ? COPY.toggle_light_mode
                                    : COPY.toggle_dark_mode
                            }
                            onClick={() =>
                                onChangeTheme(
                                    theme === 'LIGHT' ? 'DARK' : 'LIGHT'
                                )
                            }
                        >
                            {theme === 'LIGHT' ? '🌚' : '🌞'}
                        </ToggleButton>
                        <BacklogToggleButton
                            isBacklogVisibleOrDraggingTask={
                                isBacklogVisibleOrDraggingTask
                            }
                            onChangeBacklogVisibility={
                                onChangeBacklogVisibility
                            }
                        />
                    </ToolBar>
                    <BacklogDropZone {...backlogDropProps}>
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
                            <div
                                style={{ position: 'relative', width: '100%' }}
                            >
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
                                    appData={appData}
                                    isActive={selectedTaskId === task.id}
                                    task={task}
                                    {...taskCardDropProps}
                                />
                            ))}
                        </FlexBox>
                    </BacklogDropZone>
                </>
            )}
        </Container>
    );
};

export default memo(Backlog);
