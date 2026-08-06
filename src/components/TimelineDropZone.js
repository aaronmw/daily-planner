import React, { memo } from 'react';
import range from 'lodash/range';
import { TIMELINE_FROM } from './atoms/tokens';
import minutesToTime from '../utils/minutesToTime';
import strToHoursAndMinutes from '../utils/strToHoursAndMinutes';
import useDrop from '../hooks/useDrop';

const TimelineDropTarget = memo(
    ({ appActions, quarterInMinutes, ...otherProps }) => {
        const { onUpdateTask } = appActions;
        const [fromHours, fromMinutes] = strToHoursAndMinutes(TIMELINE_FROM);
        const newOffsetMinutes =
            fromHours * 60 + fromMinutes + quarterInMinutes * 15;
        const newTime = minutesToTime(newOffsetMinutes);
        const [dropProps] = useDrop({
            'task-id': taskId =>
                onUpdateTask(taskId, {
                    isComplete: false,
                    scheduled: true,
                    scheduled_time: newTime,
                }),
        });

        return (
            <div
                className="planner-timeline-drop-target relative z-[1] w-full"
                data-drop-targeted={dropProps.isTargetedForDrop}
                {...dropProps}
                {...otherProps}
            />
        );
    }
);

const TimelineDropZone = memo(
    ({ appActions, totalMinutes, ...otherProps }) => (
        <div className="absolute inset-0 h-full w-full" {...otherProps}>
            {range(totalMinutes / 15).map(quarterInMinutes => (
                <TimelineDropTarget
                    key={quarterInMinutes}
                    appActions={appActions}
                    quarterInMinutes={quarterInMinutes}
                />
            ))}
        </div>
    )
);

export default TimelineDropZone;
