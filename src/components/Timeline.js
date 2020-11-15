import range from 'lodash/range';
import { transparentize } from 'polished';
import React, { Fragment, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { COLORS, GRID_UNIT } from '../tokens';
import minutesToHeight from '../utils/minutesToHeight';
import { strToHoursAndMinutes } from '../utils/strToHoursAndMinutes';
import TaskCard from './TaskCard';
import TimelineDropZone from './TimelineDropZone';

const HALF_HOUR_LABEL_WIDTH = '80px';

const Container = styled.div`
    height: 100vh;
    overflow: auto;
    position: relative;
    user-select: none;
`;

const HalfHourRow = styled.div`
    position: relative;
    height: ${minutesToHeight(30)};
`;

const HalfHourLabel = styled.div(
    ({ hideLabel, isFaded, theme }) => `
        color: ${
            hideLabel
                ? 'transparent'
                : transparentize(isFaded ? 1 : 0, COLORS[theme.name].TEXT_FADED)
        };
        padding-right: calc(100% - ${HALF_HOUR_LABEL_WIDTH} + (${GRID_UNIT} * 0.5));
        position: absolute;
        text-align: right;
        top: 0;
        transform: translateY(-50%);
        width: 100%;
    
        &:before {
            background-color: ${transparentize(
                isFaded ? 0.8 : 0.5,
                COLORS[theme.name].BORDER_NEUTRAL
            )};
            content: '';
            height: 1px;
            left: ${HALF_HOUR_LABEL_WIDTH};
            position: absolute;
            right: 0;
            top: 50%;
        }
    `
);

const ScheduledTaskCard = styled(TaskCard)(
    ({ offsetMinutes }) => `
        position: absolute;
        left: calc(${GRID_UNIT} * 3);
        right: ${GRID_UNIT};
        top: ${minutesToHeight(offsetMinutes)};
        z-index: 2;
    `
);

const CurrentTimeMarker = styled.div(
    ({ offsetMinutes }) => `
        background-color: red;
        height: 1px;
        left: 0;
        pointer-events: none;
        position: absolute;
        right: 0;
        top: ${minutesToHeight(offsetMinutes)};
        z-index: 10;
    `
);

const Timeline = ({
    appActions,
    selectedTaskId,
    from,
    tasks,
    to,
    onClickTask,
    ...otherProps
}) => {
    const [currentTime, setCurrentTime] = useState(null);
    const [currentHour, currentMinute] = strToHoursAndMinutes(currentTime);
    const [fromHour, fromMinutes] = strToHoursAndMinutes(from);
    const [isLoaded, setIsLoaded] = useState(false);
    const [toHour, toMinutes] = strToHoursAndMinutes(to);
    const totalHours = toHour - fromHour;
    const totalMinutes =
        toHour * 60 + toMinutes - (fromHour * 60 + fromMinutes);
    const currentTimeMarkerRef = useRef(null);
    const timelineContainerRef = useRef(null);

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setCurrentTime(`${now.getHours()}:${now.getMinutes()}`);
            setIsLoaded(true);
        };
        updateTime();
        const timer = setInterval(updateTime, 500);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (
            isLoaded &&
            currentTimeMarkerRef.current &&
            timelineContainerRef.current
        ) {
            timelineContainerRef.current.scrollTo(
                0,
                currentTimeMarkerRef.current.offsetTop - 150
            );
        }
    }, [isLoaded, currentTimeMarkerRef, timelineContainerRef]);

    return (
        <Container ref={timelineContainerRef} {...otherProps}>
            {tasks.map(task => {
                const [hours, mins] = strToHoursAndMinutes(task.scheduled_time);
                const offsetMinutes =
                    hours * 60 + mins - (fromHour * 60 + fromMinutes);

                return (
                    <ScheduledTaskCard
                        key={task.id}
                        appActions={appActions}
                        isActive={selectedTaskId === task.id}
                        offsetMinutes={offsetMinutes}
                        task={task}
                    />
                );
            })}
            <CurrentTimeMarker
                ref={currentTimeMarkerRef}
                offsetMinutes={
                    currentHour * 60 +
                    currentMinute -
                    (fromHour * 60 + fromMinutes)
                }
            />
            <TimelineDropZone
                appActions={appActions}
                totalMinutes={totalMinutes}
            />
            {range(totalHours).map(hour => (
                <Fragment key={hour}>
                    <HalfHourRow>
                        <HalfHourLabel hideLabel={hour === 0}>
                            {(fromHour + hour) % 12 || 12}:00
                        </HalfHourLabel>
                    </HalfHourRow>
                    <HalfHourRow>
                        <HalfHourLabel isFaded>
                            {(fromHour + hour) % 12 || 12}:30
                        </HalfHourLabel>
                    </HalfHourRow>
                </Fragment>
            ))}
        </Container>
    );
};

export default Timeline;
