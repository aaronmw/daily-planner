import React from 'react';
import styled from 'styled-components';
import range from 'lodash/range';
import { COLORS, TIMELINE_FROM } from './atoms/tokens';
import minutesToHeight from '../utils/minutesToHeight';
import minutesToTime from '../utils/minutesToTime';
import strToHoursAndMinutes from '../utils/strToHoursAndMinutes';
import useDrop from '../hooks/useDrop';

const Container = styled.div`
    bottom: 0;
    height: 100%;
    left: 0;
    position: absolute;
    right: 0;
    top: 0;
    width: 100%;
`;

const StyledTimelineDropTarget = styled.div(
    ({ isTargetedForDrop, theme }) => `
        position: relative;
        width: 100%;
        height: ${minutesToHeight(15)};
        z-index: 1;
        border-top: ${
            isTargetedForDrop ? `4px dotted ${COLORS[theme.name].PRIMARY}` : ''
        };
    `
);

const TimelineDropTarget = ({
    appActions,
    quarterInMinutes,
    ...otherProps
}) => {
    const { onUpdateTask } = appActions;
    const [fromHours, fromMinutes] = strToHoursAndMinutes(TIMELINE_FROM);
    const newOffsetMinutes =
        fromHours * 60 + fromMinutes + quarterInMinutes * 15;
    const newTime = minutesToTime(newOffsetMinutes);
    const [dropProps] = useDrop('task-id', taskId =>
        onUpdateTask(taskId, {
            scheduled: true,
            scheduled_time: newTime,
        })
    );

    return <StyledTimelineDropTarget {...dropProps} {...otherProps} />;
};

const TimelineDropZone = ({ appActions, totalMinutes, ...otherProps }) => (
    <Container {...otherProps}>
        {range(totalMinutes / 15).map(quarterInMinutes => (
            <TimelineDropTarget
                key={quarterInMinutes}
                appActions={appActions}
                quarterInMinutes={quarterInMinutes}
            />
        ))}
    </Container>
);

export default TimelineDropZone;
