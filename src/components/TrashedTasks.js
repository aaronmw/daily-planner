import React, { memo, useCallback } from 'react';
import { canWrite, ROLES } from '../collaboration/roles';
import usePlannerViewportHeight from '../hooks/usePlannerViewportHeight';
import { getTaskEstimatedSize } from '../utils/virtualization';
import FlexBox from './atoms/FlexBox';
import { COPY } from './atoms/tokens';
import TaskCard from './TaskCard';
import TrashedCard from './TrashedCard';
import VirtualCollection from './VirtualCollection';

const getTaskKey = task => task.id;

const TrashedTasks = ({ appActions, appData, ...otherProps }) => {
    const { onTransitionToTask, onUpdateTask } = appActions;
    const {
        effectiveRelativeCardSizingEnabled,
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
        task => {
            const canRestore =
                !appData.collaboration?.isEnabled ||
                canWrite(
                    appData.collaboration?.roleByListId?.get(task.list_id) ||
                        ROLES.READ
                );
            return (
                <TrashedCard
                    restoreDisabled={!canRestore}
                    restoreButtonTitle={
                        canRestore
                            ? COPY.LABEL_FOR_RESTORING_TASK
                            : 'Write access is required to restore this task.'
                    }
                    style={{ width: '100%' }}
                    onRestore={() =>
                        onUpdateTask(task.id, { isComplete: false })
                    }
                >
                    <TaskCard
                        cardThemeStyle={plannerIndexes.themeByListId.get(
                            task.list_id
                        )}
                        isActive
                        isMutable={false}
                        creatorProfile={appData.collaboration?.getProfileForList?.(
                            task.list_id,
                            task.creator_identity_id
                        )}
                        isCreatorPresent={appData.collaboration?.presenceByIdentityId?.has(
                            task.creator_identity_id
                        )}
                        onTransitionToTask={onTransitionToTask}
                        task={task}
                        showCreatorAvatar={
                            (appData.collaboration?.membersByListId?.get(
                                task.list_id
                            )?.length || 0) > 1
                        }
                    />
                </TrashedCard>
            );
        },
        [
            appData.collaboration,
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
