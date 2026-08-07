import React, {
    Fragment,
    memo,
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import range from 'lodash/range';
import useDrop from '../hooks/useDrop';
import AppColumn from './AppColumn';
import TaskCard from './TaskCard';
import TimelineDropZone from './TimelineDropZone';
import strToHoursAndMinutes from '../utils/strToHoursAndMinutes';
import { getAnchoredScrollTop } from '../utils/plannerGeometry';
import { getVisibleScheduledTasks } from '../utils/plannerIndexes';
import { COPY, INTERACTION_ANIMATION_DURATION } from './atoms/tokens';

const easeInOut = progress =>
    progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

const Container = props => (
    <AppColumn label={COPY.LABEL_FOR_TIMELINE} {...props} />
);

const Timeline = ({
    appActions,
    appData,
    selectedTaskId,
    from,
    to,
    ...otherProps
}) => {
    const [timelineDropProps] = useDrop({ 'task-id': () => {} });
    const [currentTime, setCurrentTime] = useState(null);
    const [currentHour, currentMinute] = strToHoursAndMinutes(currentTime);
    const [fromHour, fromMinutes] = strToHoursAndMinutes(from);
    const { isDraggingTask, plannerIndexes, timelineHoursPerScreen } = appData;
    const [isLoaded, setIsLoaded] = useState(false);
    const [toHour, toMinutes] = strToHoursAndMinutes(to);
    const totalHours = toHour - fromHour;
    const totalMinutes =
        toHour * 60 + toMinutes - (fromHour * 60 + fromMinutes);
    const currentTimeMarkerRef = useRef(null);
    const timelineContainerRef = useRef(null);
    const zoomAnimationFrameRef = useRef(null);
    const animatedPixelsPerMinuteRef = useRef(null);
    const previousHoursPerScreenRef = useRef(timelineHoursPerScreen);
    const timelineStartMinute = fromHour * 60 + fromMinutes;
    const [visibleRange, setVisibleRange] = useState({
        visibleEndMinute: timelineStartMinute + timelineHoursPerScreen * 60,
        visibleStartMinute: timelineStartMinute,
    });

    const updateVisibleRange = useCallback(() => {
        const container = timelineContainerRef.current;

        if (!container || container.clientHeight <= 0) {
            return;
        }

        const pixelsPerMinute =
            animatedPixelsPerMinuteRef.current ||
            container.clientHeight / (timelineHoursPerScreen * 60);
        const visibleStartMinute =
            timelineStartMinute + container.scrollTop / pixelsPerMinute;

        setVisibleRange({
            visibleEndMinute:
                visibleStartMinute + container.clientHeight / pixelsPerMinute,
            visibleStartMinute,
        });
    }, [timelineHoursPerScreen, timelineStartMinute]);

    const scheduledTasks = useMemo(
        () =>
            getVisibleScheduledTasks(plannerIndexes.scheduledTaskEntries, {
                maxDurationMinutes: plannerIndexes.maxScheduledDurationMinutes,
                overscanMinutes: 60,
                ...visibleRange,
            }),
        [plannerIndexes, visibleRange]
    );

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

    useEffect(() => {
        const container = timelineContainerRef.current;

        if (!container) {
            return undefined;
        }

        let scrollFrame = null;
        const handleScroll = () => {
            if (scrollFrame !== null) {
                return;
            }

            scrollFrame = requestAnimationFrame(() => {
                scrollFrame = null;
                updateVisibleRange();
            });
        };

        container.addEventListener('scroll', handleScroll, { passive: true });
        updateVisibleRange();

        return () => {
            container.removeEventListener('scroll', handleScroll);
            if (scrollFrame !== null) {
                cancelAnimationFrame(scrollFrame);
            }
        };
    }, [updateVisibleRange]);

    useLayoutEffect(() => {
        const container = timelineContainerRef.current;
        const previousHoursPerScreen = previousHoursPerScreenRef.current;
        previousHoursPerScreenRef.current = timelineHoursPerScreen;

        if (
            !container ||
            container.clientHeight <= 0 ||
            previousHoursPerScreen === timelineHoursPerScreen
        ) {
            return undefined;
        }

        if (zoomAnimationFrameRef.current !== null) {
            cancelAnimationFrame(zoomAnimationFrameRef.current);
        }

        const currentPixelsPerMinute =
            animatedPixelsPerMinuteRef.current ||
            container.clientHeight / (previousHoursPerScreen * 60);
        const nextPixelsPerMinute =
            container.clientHeight / (timelineHoursPerScreen * 60);
        const currentScrollTop = container.scrollTop;
        const nextScrollTop = getAnchoredScrollTop(
            currentScrollTop,
            currentPixelsPerMinute,
            nextPixelsPerMinute
        );
        const reduceMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)'
        ).matches;

        if (reduceMotion) {
            animatedPixelsPerMinuteRef.current = nextPixelsPerMinute;
            container.scrollTop = nextScrollTop;
            updateVisibleRange();
            return undefined;
        }

        const startedAt = performance.now();
        let animationFrameId = null;
        let isCancelled = false;
        const animateZoom = now => {
            if (isCancelled) {
                return;
            }

            const progress = Math.min(
                1,
                (now - startedAt) / INTERACTION_ANIMATION_DURATION
            );
            const easedProgress = easeInOut(progress);
            const currentAnimatedPixelsPerMinute =
                currentPixelsPerMinute +
                (nextPixelsPerMinute - currentPixelsPerMinute) * easedProgress;

            animatedPixelsPerMinuteRef.current = currentAnimatedPixelsPerMinute;
            container.scrollTop =
                currentScrollTop +
                (nextScrollTop - currentScrollTop) * easedProgress;
            updateVisibleRange();

            if (progress < 1) {
                animationFrameId = requestAnimationFrame(animateZoom);
                zoomAnimationFrameRef.current = animationFrameId;
            } else {
                zoomAnimationFrameRef.current = null;
            }
        };

        animationFrameId = requestAnimationFrame(animateZoom);
        zoomAnimationFrameRef.current = animationFrameId;

        return () => {
            isCancelled = true;

            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId);
            }

            if (zoomAnimationFrameRef.current === animationFrameId) {
                zoomAnimationFrameRef.current = null;
            }
        };
    }, [timelineHoursPerScreen, updateVisibleRange]);

    const cancelZoomAnchor = () => {
        if (zoomAnimationFrameRef.current !== null) {
            cancelAnimationFrame(zoomAnimationFrameRef.current);
            zoomAnimationFrameRef.current = null;
        }

        const container = timelineContainerRef.current;
        if (container?.clientHeight) {
            animatedPixelsPerMinuteRef.current =
                container.clientHeight / (timelineHoursPerScreen * 60);
            updateVisibleRange();
        }
    };

    return (
        <Container {...otherProps}>
            <div
                className="planner-timeline-container absolute inset-0 overflow-auto select-none"
                data-drop-targeted={timelineDropProps.isTargetedForDrop}
                ref={timelineContainerRef}
                onTouchStart={cancelZoomAnchor}
                onWheel={cancelZoomAnchor}
                {...timelineDropProps}
            >
                {scheduledTasks.map(task => {
                    const [hours, mins] = strToHoursAndMinutes(
                        task.scheduled_time
                    );
                    const offsetMinutes =
                        hours * 60 + mins - (fromHour * 60 + fromMinutes);

                    return (
                        <TaskCard
                            key={task.id}
                            cardThemeStyle={plannerIndexes.themeByListId.get(
                                task.list_id
                            )}
                            cardContext="timeline"
                            isActive={selectedTaskId === task.id}
                            isInteractionDisabled={isDraggingTask}
                            isShowingListManager={appData.isShowingListManager}
                            className="planner-timeline-task-card absolute left-[calc(var(--spacing-grid)*3)] right-[var(--spacing-grid)]"
                            onImmediatelySelectTask={
                                appActions.onImmediatelySelectTask
                            }
                            onTransitionToTask={appActions.onTransitionToTask}
                            startOffsetMinutes={offsetMinutes}
                            task={task}
                        />
                    );
                })}
                <div
                    ref={currentTimeMarkerRef}
                    className="planner-current-time-marker pointer-events-none absolute left-0 right-0 z-10 h-px bg-red-600"
                    style={{
                        '--planner-current-time-offset-minutes':
                            currentHour * 60 +
                            currentMinute -
                            (fromHour * 60 + fromMinutes),
                    }}
                />
                <TimelineDropZone
                    appActions={appActions}
                    totalMinutes={totalMinutes}
                />
                {range(totalHours).map(hour => (
                    <Fragment key={hour}>
                        <div className="planner-timeline-half-hour relative">
                            <div
                                className="planner-timeline-label"
                                data-hidden={hour === 0}
                            >
                                {(fromHour + hour) % 12 || 12}:00
                            </div>
                        </div>
                        <div className="planner-timeline-half-hour relative">
                            <div className="planner-timeline-label" data-faded>
                                {(fromHour + hour) % 12 || 12}:30
                            </div>
                        </div>
                    </Fragment>
                ))}
            </div>
        </Container>
    );
};

export default memo(Timeline);
