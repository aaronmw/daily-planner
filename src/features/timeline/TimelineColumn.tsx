import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { usePlannerSelector } from '../../core/store/plannerContext';
import { ItemCard } from '../items/ItemCard';
import { scheduledItemsInWindow } from './scheduledWindow';
import { currentTimelineMinute, initialTimelineMinute } from './timelineScale';
import { useTimelineItemDropTarget } from './useTimelineItemDropTarget';

const DAY_MINUTES = 24 * 60;

const formatMinute = (minute: number): string => {
    const hour = Math.floor(minute / 60) % 24;
    const suffix = hour >= 12 ? 'PM' : 'AM';
    return `${hour % 12 || 12}:00 ${suffix}`;
};

interface TimelineColumnProps {
    focusRequestId?: number;
    minuteHeight: number;
}

function CurrentTimeMarker({ pixelsPerMinute }: { pixelsPerMinute: number }) {
    const [minute, setMinute] = useState(() =>
        currentTimelineMinute(new Date())
    );

    useEffect(() => {
        const timer = window.setInterval(() => {
            setMinute(currentTimelineMinute(new Date()));
        }, 1_000);
        return () => window.clearInterval(timer);
    }, []);

    return (
        <div
            aria-label="Current time"
            className="pointer-events-none absolute left-0 right-0 z-20 h-[var(--planner-stroke-width)] bg-red-600"
            style={{ top: minute * pixelsPerMinute }}
        />
    );
}

export function TimelineColumn({
    focusRequestId = 0,
    minuteHeight,
}: TimelineColumnProps) {
    const scheduledItemIds = usePlannerSelector(
        state => state.scheduledItemIds
    );
    const itemsById = usePlannerSelector(state => state.itemsById);
    const selectedItemId = usePlannerSelector(state => state.selectedItemId);
    const hoursPerScreen = usePlannerSelector(
        state => state.preferences.timelineHoursPerScreen
    );
    const containerRef = useRef<HTMLDivElement>(null);
    const dropPreviewRef = useRef<HTMLDivElement>(null);
    const focusFrameRef = useRef<number | null>(null);
    const fulfilledFocusRequestRef = useRef(0);
    const [initialTopMinute] = useState(() =>
        initialTimelineMinute(new Date())
    );
    const topMinuteRef = useRef(initialTopMinute);
    const [visibleRange, setVisibleRange] = useState({
        end: initialTopMinute + hoursPerScreen * 60,
        start: initialTopMinute,
    });
    const pixelsPerMinute = minuteHeight;
    const { draggedItemId, dropPreviewMinute } = useTimelineItemDropTarget(
        containerRef,
        pixelsPerMinute,
        dropPreviewRef
    );
    const draggedItem = draggedItemId
        ? (itemsById.get(draggedItemId) ?? null)
        : null;
    const scheduledItems = useMemo(
        () =>
            scheduledItemIds.flatMap(id => {
                const item = itemsById.get(id);
                return item ? [item] : [];
            }),
        [scheduledItemIds, itemsById]
    );
    const visibleItems = useMemo(
        () =>
            scheduledItemsInWindow(
                scheduledItems,
                visibleRange.start,
                visibleRange.end
            ),
        [scheduledItems, visibleRange]
    );

    useLayoutEffect(() => {
        const element = containerRef.current;
        if (!element) return;
        element.scrollTop = topMinuteRef.current * pixelsPerMinute;
        const appliedTopMinute = element.scrollTop / pixelsPerMinute;
        topMinuteRef.current = appliedTopMinute;
        setVisibleRange({
            end: appliedTopMinute + hoursPerScreen * 60,
            start: appliedTopMinute,
        });
    }, [hoursPerScreen, pixelsPerMinute]);

    useEffect(() => {
        if (
            focusRequestId === 0 ||
            focusRequestId === fulfilledFocusRequestRef.current
        ) {
            return;
        }

        fulfilledFocusRequestRef.current = focusRequestId;
        const container = containerRef.current;
        if (!container) return;
        const selectedItem = selectedItemId
            ? itemsById.get(selectedItemId)
            : null;
        if (selectedItem?.scheduledStartMinutes == null) {
            container.focus({ preventScroll: true });
            return;
        }

        const start = Math.max(0, selectedItem.scheduledStartMinutes - 30);
        topMinuteRef.current = start;
        container.scrollTop = start * pixelsPerMinute;

        if (focusFrameRef.current !== null) {
            cancelAnimationFrame(focusFrameRef.current);
        }
        const focusWhenMounted = (attemptsRemaining: number) => {
            focusFrameRef.current = requestAnimationFrame(() => {
                const target = container.querySelector<HTMLElement>(
                    `[data-item-id="${selectedItem.id}"]`
                );
                if (target) {
                    focusFrameRef.current = null;
                    target.focus({ preventScroll: true });
                } else if (attemptsRemaining > 0) {
                    focusWhenMounted(attemptsRemaining - 1);
                } else {
                    focusFrameRef.current = null;
                    container.focus({ preventScroll: true });
                }
            });
        };
        focusFrameRef.current = requestAnimationFrame(() => {
            setVisibleRange({
                end: start + hoursPerScreen * 60,
                start,
            });
            focusWhenMounted(3);
        });
    }, [
        focusRequestId,
        hoursPerScreen,
        itemsById,
        pixelsPerMinute,
        selectedItemId,
    ]);

    useEffect(
        () => () => {
            if (focusFrameRef.current !== null) {
                cancelAnimationFrame(focusFrameRef.current);
            }
        },
        []
    );

    const updateVisibleRange = () => {
        const element = containerRef.current;
        if (!element) return;
        const start = element.scrollTop / pixelsPerMinute;
        topMinuteRef.current = start;
        setVisibleRange({
            end: start + element.clientHeight / pixelsPerMinute,
            start,
        });
    };

    const ticks = Array.from({ length: 49 }, (_, index) => index * 30);

    return (
        <div
            aria-label="Timeline schedule"
            className="planner-timeline-container relative h-full overflow-auto select-none"
            onScroll={updateVisibleRange}
            ref={containerRef}
            tabIndex={-1}
        >
            <div
                className="relative min-w-[280px]"
                style={{ height: DAY_MINUTES * pixelsPerMinute }}
            >
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 z-30"
                    data-timeline-drag-layer="true"
                >
                    {draggedItem && dropPreviewMinute !== null && (
                        <div
                            className="planner-timeline-drag-preview pointer-events-none absolute left-[72px] right-3"
                            data-timeline-drop-preview="true"
                            ref={dropPreviewRef}
                            style={{
                                height:
                                    draggedItem.durationMinutes *
                                    pixelsPerMinute,
                                top: dropPreviewMinute * pixelsPerMinute,
                            }}
                        />
                    )}
                </div>
                {ticks.map(minute => (
                    <div
                        className="absolute left-0 right-0 h-0 text-planner-text-faded"
                        data-timeline-minute={minute}
                        key={minute}
                        style={{ top: minute * pixelsPerMinute }}
                    >
                        <time className="absolute left-0 top-0 w-[72px] -translate-y-1/2 px-2 text-right text-[0.85rem]">
                            {minute % 60 === 0 ? formatMinute(minute) : ''}
                        </time>
                        <span className="absolute left-[72px] right-0 top-0 h-[var(--planner-stroke-width)] bg-planner-border opacity-30" />
                    </div>
                ))}
                {visibleItems.map(item => (
                    <div
                        className="absolute left-[72px] right-3"
                        key={item.id}
                        style={{
                            top:
                                (item.scheduledStartMinutes ?? 0) *
                                pixelsPerMinute,
                        }}
                    >
                        <ItemCard context="timeline" id={item.id} />
                    </div>
                ))}
                <CurrentTimeMarker pixelsPerMinute={pixelsPerMinute} />
            </div>
        </div>
    );
}
