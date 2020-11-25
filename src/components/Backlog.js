import React, { memo } from 'react';
import styled from 'styled-components';
import useDrop from '../hooks/useDrop';
import minutesToHeight from '../utils/minutesToHeight';
import toInt from '../utils/toInt';
import AppColumn from './AppColumn';
import Box from './atoms/Box';
import { GhostButton, ToggleButton } from './atoms/Button';
import FlexBox from './atoms/FlexBox';
import TaskCard from './TaskCard';
import { COLORS, COPY, GRID_UNIT, ICONS } from './atoms/tokens';
import ToolBar from './ToolBar';

const Container = styled(AppColumn)(
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
                ? `0 0 0 5px ${COLORS[theme.name].TASK_BORDER_HOVER} inset`
                : 'initial'
        };
        position: relative;
    `
);

const BacklogToggleButton = ({
    isBacklogVisible,
    onChangeIsShowingBacklog,
}) => (
    <ToggleButton
        isActive={isBacklogVisible}
        title={COPY.TIPS.TOGGLE_BACKLOG}
        onClick={() => onChangeIsShowingBacklog(!isBacklogVisible)}
    >
        {isBacklogVisible ? ICONS.LEFT : ICONS.RIGHT}
    </ToggleButton>
);

const CreateFirstTaskTip = styled(Box)`
    position: absolute;
    left: calc(100% + ${GRID_UNIT} * 2);
    top: 50%;
    transform: translateY(-50%);
    white-space: nowrap;
`;

const Backlog = ({ appActions, appData, ...otherProps }) => {
    const {
        onChangeIsShowingBacklog,
        onChangeTaskPosition,
        onChangeTheme,
        onCreateTask,
        onUpdateTask,
    } = appActions;
    const {
        incompleteTasks,
        isBacklogVisible,
        lists,
        selectedListId,
        selectedTaskId,
        theme,
    } = appData;
    const selectedList = lists.find(list => list.id === selectedListId);
    const unscheduledTasks = incompleteTasks.filter(
        task =>
            !task.scheduled &&
            task.list_id === selectedListId &&
            !selectedList.isArchived
    );
    const hasTasks = unscheduledTasks.length;

    const [backlogDropProps] = useDrop({
        'task-id': taskId => {
            onUpdateTask(taskId, {
                list_id: selectedListId,
                scheduled: false,
            });
        },
    });

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
        <Container
            label={!isBacklogVisible ? '' : selectedList.label}
            {...otherProps}
        >
            {!isBacklogVisible ? (
                <BacklogToggleButton
                    isBacklogVisible={isBacklogVisible}
                    onChangeIsShowingBacklog={onChangeIsShowingBacklog}
                />
            ) : (
                <>
                    <ToolBar>
                        <ToggleButton
                            isActive={theme === 'DARK'}
                            title={COPY.TIPS.TOGGLE_DARK_MODE}
                            onClick={() =>
                                onChangeTheme(
                                    theme === 'LIGHT' ? 'DARK' : 'LIGHT'
                                )
                            }
                        >
                            {theme === 'LIGHT'
                                ? ICONS.DARK_MODE
                                : ICONS.LIGHT_MODE}
                        </ToggleButton>
                        <BacklogToggleButton
                            isBacklogVisible={isBacklogVisible}
                            onChangeIsShowingBacklog={onChangeIsShowingBacklog}
                        />
                    </ToolBar>
                    <BacklogDropZone {...backlogDropProps}>
                        <FlexBox
                            justify="flex-start"
                            direction="column"
                            spacing={0.5}
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
                                            {ICONS.LEFT}
                                        </span>{' '}
                                        Create your first task
                                    </CreateFirstTaskTip>
                                )}
                                <GhostButton
                                    style={{
                                        height: minutesToHeight(30),
                                    }}
                                    title={COPY.TIPS.CREATE_NEW_TASK}
                                    onClick={() => onCreateTask()}
                                >
                                    {COPY.CREATE_TASK_LABEL}
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
