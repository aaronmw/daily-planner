import React from 'react';
import styled from 'styled-components';
import range from 'lodash/range';
import {
    COLOR_PRIMARY,
    HOURS_AT_ONCE,
    MIN_SLOT_HEIGHT,
    TIMELINE_FROM,
} from '../tokens';
import { minutesToTime } from '../utils/minutesToTime';
import { strToHoursAndMinutes } from '../utils/strToHoursAndMinutes';
import useDrop from './hooks/useDrop';

const Container = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
`;

const StyledTimelineDropTarget = styled.div(
    ({ isTargetedForDrop }) => `
        position: relative;
        width: 100%;
        height: max(
            100vh / (${HOURS_AT_ONCE} * 60) * 15,
            ${MIN_SLOT_HEIGHT} * 2 * 15 / 60
        );
        z-index: 1;
        border-top: ${isTargetedForDrop ? `4px dotted ${COLOR_PRIMARY}` : ''};
    `
);

const TimelineDropTarget = ({
    quarterInMinutes,
    onUpdateState,
    ...otherProps
}) => {
    const [fromHours, fromMinutes] = strToHoursAndMinutes(TIMELINE_FROM);
    const newOffsetMinutes =
        fromHours * 60 + fromMinutes + quarterInMinutes * 15;
    const newTime = minutesToTime(newOffsetMinutes);
    const [dropProps] = useDrop('task-id', taskId =>
        onUpdateState({
            tasks: {
                [taskId]: {
                    schedule: {
                        active: true,
                        time: newTime,
                    },
                },
            },
        })
    );

    return <StyledTimelineDropTarget {...dropProps} {...otherProps} />;
};

const TimelineDropZone = ({ totalMinutes, onUpdateState, ...otherProps }) => {
    return (
        <Container {...otherProps}>
            {range(totalMinutes / 15).map(quarterInMinutes => (
                <TimelineDropTarget
                    key={quarterInMinutes}
                    quarterInMinutes={quarterInMinutes}
                    onUpdateState={onUpdateState}
                />
            ))}
        </Container>
    );
};

export default TimelineDropZone;
