import React, { memo, useCallback } from 'react';
import usePlannerViewportHeight from '../hooks/usePlannerViewportHeight';
import { getTaskEstimatedSize } from '../utils/virtualization';
import FlexBox from './atoms/FlexBox';
import { COPY } from './atoms/tokens';
import TaskCard from './TaskCard';
import TrashedCard from './TrashedCard';
import VirtualCollection from './VirtualCollection';

const getTaskKey = task => task.id;

const TrashedTasks = ({ appActions, appData, ...otherProps }) => {
    const { onImmediatelySelectTask, onTransitionToTask, onUpdateTask } =
        appActions;
    const {
        effectiveRelativeCardSizingEnabled,
        isShowingListManager,
        plannerIndexes,
        timelineHoursPerScreen,
    } = appData;
    const deletedTasks = plannerIndexes.trashedTasks;
    const viewportHeight = usePlannerViewportHeight();
    const estimateSize = useCallback(
        index =>
            getTaskEstimatedSize({
                durationMinutes: deletedTasks[index].duration_minutes,
                hoursPerScreen: timelineHoursPerScreen,
                relativeCardSizingEnabled: effectiveRelativeCardSizingEnabled,
                viewportHeight,
            }),
        [
            deletedTasks,
            effectiveRelativeCardSizingEnabled,
            timelineHoursPerScreen,
            viewportHeight,
        ]
    );
    const renderTask = useCallback(
        task => (
            <TrashedCard
                restoreButtonTitle={COPY.LABEL_FOR_RESTORING_TASK}
                style={{ width: '100%' }}
                onRestore={() => onUpdateTask(task.id, { isComplete: false })}
            >
                <TaskCard
                    cardThemeStyle={plannerIndexes.themeByListId.get(
                        task.list_id
                    )}
                    isActive
                    isShowingListManager={isShowingListManager}
                    onImmediatelySelectTask={onImmediatelySelectTask}
                    onTransitionToTask={onTransitionToTask}
                    task={task}
                />
            </TrashedCard>
        ),
        [
            isShowingListManager,
            onImmediatelySelectTask,
            onTransitionToTask,
            onUpdateTask,
            plannerIndexes.themeByListId,
        ]
    );

    if (!deletedTasks.length) {
        return (
            <FlexBox
                align="center"
                isFlexible
                justify="center"
                style={{ opacity: 0.6 }}
            >
                {COPY.EMPTY_TRASHED_TASKS}
            </FlexBox>
        );
    }

    return (
        <VirtualCollection
            {...otherProps}
            className="planner-task-card-list"
            estimateSize={estimateSize}
            getItemKey={getTaskKey}
            items={deletedTasks}
            renderItem={renderTask}
        />
    );
};

export default memo(TrashedTasks);
