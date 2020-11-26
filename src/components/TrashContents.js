import React, { memo } from 'react';
import FlexBox from './atoms/FlexBox';
import { COPY } from './atoms/tokens';
import TaskCard from './TaskCard';

const TrashContents = ({ appActions, appData, ...otherProps }) => {
    const { selectedTaskId, tasks } = appData;

    const deletedTasks = tasks.filter(task => task.isComplete);

    const hasDeletedTasks = deletedTasks.length;

    return (
        <>
            {!hasDeletedTasks && (
                <FlexBox
                    align="center"
                    isFlexible
                    justify="center"
                    style={{ opacity: 0.6 }}
                >
                    {COPY.EMPTY_TRASH}
                </FlexBox>
            )}
            {!!hasDeletedTasks && (
                <FlexBox
                    isFlexible
                    justify="flex-start"
                    direction="column"
                    spacing={0.5}
                    padding={1}
                    {...otherProps}
                >
                    {deletedTasks.map(task => (
                        <TaskCard
                            key={task.id}
                            appActions={appActions}
                            appData={appData}
                            isActive={selectedTaskId === task.id}
                            task={task}
                        />
                    ))}
                </FlexBox>
            )}
        </>
    );
};

export default memo(TrashContents);
