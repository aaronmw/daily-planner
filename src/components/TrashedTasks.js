import React, { memo } from 'react';
import FlexBox from './atoms/FlexBox';
import { COPY } from './atoms/tokens';
import TaskCard, { TaskCardContainer } from './TaskCard';
import TrashedCard from './TrashedCard';

const TrashedTasks = ({ appActions, appData, ...otherProps }) => {
    const { onUpdateTask } = appData;

    const { tasks } = appData;

    const deletedTasks = tasks.filter(task => task.isComplete);

    const hasDeletedTasks = deletedTasks.length;

    const handleRestoreTask = taskId =>
        onUpdateTask(taskId, { isComplete: false });

    return (
        <>
            {!hasDeletedTasks && (
                <FlexBox
                    align="center"
                    isFlexible
                    justify="center"
                    style={{ opacity: 0.6 }}
                >
                    {COPY.EMPTY_TRASHED_TASKS}
                </FlexBox>
            )}
            {!!hasDeletedTasks && (
                <TaskCardContainer {...otherProps}>
                    {deletedTasks.map(task => (
                        <TrashedCard
                            key={task.id}
                            restoreButtonTitle={COPY.LABEL_FOR_RESTORING_TASK}
                            style={{ width: '100%' }}
                            onRestore={handleRestoreTask.bind(this, task.id)}
                        >
                            <TaskCard
                                appActions={appActions}
                                appData={appData}
                                isActive
                                task={task}
                            />
                        </TrashedCard>
                    ))}
                </TaskCardContainer>
            )}
        </>
    );
};

export default memo(TrashedTasks);
