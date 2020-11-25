import React, { Fragment, memo, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { transparentize } from 'polished';
import range from 'lodash/range';
import useDrop from '../hooks/useDrop';
import AppColumn from './AppColumn';
import TaskCard from './TaskCard';
import TimelineDropZone from './TimelineDropZone';
import strToHoursAndMinutes from '../utils/strToHoursAndMinutes';
import minutesToHeight from '../utils/minutesToHeight';
import { COLORS, GRID_UNIT } from './atoms/tokens';

const LINE_LABEL_WIDTH = '80px';

const Container = styled(AppColumn).attrs({
    label: "Today's Plan",
})``;

const TimelineContainer = styled.div(
    ({ isTargetedForDrop, theme }) => `
        bottom: 0;
        box-shadow: ${
            isTargetedForDrop
                ? `0 0 0 5px ${COLORS[theme.name].TASK_BORDER_HOVER} inset`
                : 'initial'
        };
        left: 0;
        overflow: auto;
        position: absolute;
        right: 0;
        top: 0;
        user-select: none;
    `
);

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
        padding-right: calc(100% - ${LINE_LABEL_WIDTH} + (${GRID_UNIT} * 0.5));
        position: absolute;
        text-align: right;
        top: 0;
        transform: translateY(-50%);
        width: 100%;

        &:before {
            background-color: ${COLORS[theme.name].BORDER};
            content: '';
            height: 1px;
            left: ${LINE_LABEL_WIDTH};
            opacity: ${isFaded ? 0.5 : 1};
            position: absolute;
            right: 0;
            top: 50%;
        }
    `
);

const ScheduledTaskCard = styled(TaskCard)(
    ({ isAnotherTaskBeingDragged, offsetMinutes }) => `
        left: calc(${GRID_UNIT} * 3);
        pointer-events: ${isAnotherTaskBeingDragged ? 'none' : 'all'};
        position: absolute;
        right: ${GRID_UNIT};
        top: ${minutesToHeight(offsetMinutes)};
        width: auto;
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
    appData,
    selectedTaskId,
    from,
    tasks,
    to,
    onClickTask,
    ...otherProps
}) => {
    const [timelineDropProps] = useDrop({ 'task-id': () => {} });
    const [currentTime, setCurrentTime] = useState(null);
    const [currentHour, currentMinute] = strToHoursAndMinutes(currentTime);
    const [fromHour, fromMinutes] = strToHoursAndMinutes(from);
    const { isDraggingTask } = appData;
    const [isLoaded, setIsLoaded] = useState(false);
    const scheduledTasks = tasks.filter(task => task.scheduled);
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
        const timer = setInterval(updateTime, 1000);
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
        <Container {...otherProps}>
            <TimelineContainer
                ref={timelineContainerRef}
                {...timelineDropProps}
            >
                {scheduledTasks.map(task => {
                    const [hours, mins] = strToHoursAndMinutes(
                        task.scheduled_time
                    );
                    const offsetMinutes =
                        hours * 60 + mins - (fromHour * 60 + fromMinutes);

                    return (
                        <ScheduledTaskCard
                            key={task.id}
                            appActions={appActions}
                            appData={appData}
                            isAnotherTaskBeingDragged={isDraggingTask}
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
            </TimelineContainer>
        </Container>
    );
};

export default memo(Timeline);
