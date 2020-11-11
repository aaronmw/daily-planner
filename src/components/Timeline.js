import React, { Fragment, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import range from 'lodash/range';
import CurrentTimeMarker from './CurrentTimeMarker';
import TaskCard from './TaskCard';
import TimelineDropZone from './TimelineDropZone';
import { strToHoursAndMinutes } from '../utils/strToHoursAndMinutes';
import {
    COLOR_PRIMARY,
    GRID_UNIT,
    HOURS_AT_ONCE,
    MIN_SLOT_HEIGHT,
} from '../tokens';

const Container = styled.div`
    position: relative;
    height: 100vh;
    overflow: auto;
`;

const TimelineMarker = styled.div(
    ({ hoursAtOnce, isFaded }) => `
        position: relative;
        height: calc(100vh / ${hoursAtOnce * 2});
        min-height: ${MIN_SLOT_HEIGHT};
        opacity: ${isFaded ? 0.25 : 0.5};
    `
);

const TimelineMarkerLabel = styled.div(
    ({ hideLabel }) => `
        position: absolute;
        top: 0;
        width: 100%;
        transform: translateY(-50%);
        background: white;
        text-align: right;
        padding-right: calc(100% - 60px);
        color: ${hideLabel ? 'transparent' : 'inherit'}
    
        &:before {
            content: '';
            position: absolute;
            right: 0;
            left: 70px;
            top: 50%;
            height: 1px;
            background-color: ${COLOR_PRIMARY};
        }
    `
);

const StyledScheduledTaskCard = styled(TaskCard)(
    ({ offsetMinutes }) => `
        position: absolute;
        left: calc(${GRID_UNIT} * 3);
        right: ${GRID_UNIT};
        top: max(
            100vh / (${HOURS_AT_ONCE} * 60) * ${offsetMinutes},
            ${MIN_SLOT_HEIGHT} * 2 * ${offsetMinutes} / 60
        );
        z-index: 2;
    `
);

const ScheduledTaskCard = ({ offsetMinutes, task, ...otherProps }) => (
    <StyledScheduledTaskCard
        offsetMinutes={offsetMinutes}
        task={task}
        {...otherProps}
    />
);

const Timeline = ({
    activeTaskId,
    from,
    hoursAtOnce,
    tasks,
    to,
    onClickTask,
    onUpdateState,
    ...otherProps
}) => {
    const [currentTime, setCurrentTime] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [fromHour, fromMinutes] = strToHoursAndMinutes(from);
    const [toHour, toMinutes] = strToHoursAndMinutes(to);
    const [currentHour, currentMinute] = strToHoursAndMinutes(currentTime);
    const totalHours = toHour - fromHour;
    const totalMinutes =
        toHour * 60 + toMinutes - (fromHour * 60 + fromMinutes);
    const timelineContainerRef = useRef(null);
    const currentTimeMarkerRef = useRef(null);

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setCurrentTime(`${now.getHours()}:${now.getMinutes()}`);
            setIsLoaded(true);
        };
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
                currentTimeMarkerRef.current.offsetTop - 30
            );
        }
    }, [isLoaded, currentTimeMarkerRef, timelineContainerRef]);

    return (
        <Container ref={timelineContainerRef} {...otherProps}>
            {tasks.map(task => {
                const [hours, mins] = strToHoursAndMinutes(task.schedule.time);
                const offsetMinutes =
                    hours * 60 + mins - (fromHour * 60 + fromMinutes);
                return (
                    <ScheduledTaskCard
                        key={task.id}
                        isActive={activeTaskId === task.id}
                        offsetMinutes={offsetMinutes}
                        task={task}
                        onClick={onClickTask.bind(this, task.id)}
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
                totalMinutes={totalMinutes}
                onUpdateState={onUpdateState}
            />
            {range(totalHours).map(hour => (
                <Fragment key={hour}>
                    <TimelineMarker hoursAtOnce={hoursAtOnce}>
                        <TimelineMarkerLabel hideLabel={hour === 0}>
                            {fromHour + hour}:00
                        </TimelineMarkerLabel>
                    </TimelineMarker>
                    <TimelineMarker isFaded hoursAtOnce={hoursAtOnce}>
                        <TimelineMarkerLabel>
                            {fromHour + hour}:30
                        </TimelineMarkerLabel>
                    </TimelineMarker>
                </Fragment>
            ))}
        </Container>
    );
};

export default Timeline;
