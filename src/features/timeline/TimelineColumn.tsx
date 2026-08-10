import {
    type DragEvent,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { usePlannerCommands } from '../../core/application/plannerContext';
import { usePlannerSelector } from '../../core/store/plannerContext';
import { ItemCard } from '../items/ItemCard';
import { scheduledItemsInWindow } from './scheduledWindow';

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

export function TimelineColumn({
    focusRequestId = 0,
    minuteHeight,
}: TimelineColumnProps) {
    const commands = usePlannerCommands();
    const scheduledItemIds = usePlannerSelector(
        state => state.scheduledItemIds
    );
    const itemsById = usePlannerSelector(state => state.itemsById);
    const selectedItemId = usePlannerSelector(state => state.selectedItemId);
    const hoursPerScreen = usePlannerSelector(
        state => state.preferences.timelineHoursPerScreen
    );
    const containerRef = useRef<HTMLDivElement>(null);
    const focusFrameRef = useRef<number | null>(null);
    const fulfilledFocusRequestRef = useRef(0);
    const topMinuteRef = useRef(6 * 60);
    const [visibleRange, setVisibleRange] = useState({
        end: 16 * 60,
        start: 6 * 60,
    });
    const pixelsPerMinute = minuteHeight;
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
        setVisibleRange({
            end: topMinuteRef.current + hoursPerScreen * 60,
            start: topMinuteRef.current,
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

    const dropItem = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const id = event.dataTransfer.getData(
            'application/x-daily-planner-item-id'
        );
        const item = Array.from(itemsById.values()).find(
            item => item.id === id
        );
        const element = containerRef.current;
        if (!item || !element) return;
        const bounds = element.getBoundingClientRect();
        const minute = Math.max(
            0,
            Math.min(
                DAY_MINUTES - 15,
                Math.round(
                    (element.scrollTop + event.clientY - bounds.top) /
                        pixelsPerMinute /
                        15
                ) * 15
            )
        );
        void commands.updateItem(item.id, { scheduledStartMinutes: minute });
    };

    const ticks = Array.from({ length: 49 }, (_, index) => index * 30);
    const now = new Date();
    const currentMinute = now.getHours() * 60 + now.getMinutes();

    return (
        <div
            aria-label="Timeline schedule"
            className="relative h-full overflow-auto select-none"
            onDragOver={event => event.preventDefault()}
            onDrop={dropItem}
            onScroll={updateVisibleRange}
            ref={containerRef}
            tabIndex={-1}
        >
            <div
                className="relative min-w-[280px]"
                style={{ height: DAY_MINUTES * pixelsPerMinute }}
            >
                {ticks.map(minute => (
                    <div
                        className="absolute left-0 right-0 flex items-center text-planner-text-faded"
                        data-timeline-minute={minute}
                        key={minute}
                        style={{ top: minute * pixelsPerMinute }}
                    >
                        <time className="w-[72px] shrink-0 px-2 text-right text-[0.85rem]">
                            {minute % 60 === 0 ? formatMinute(minute) : ''}
                        </time>
                        <span className="h-[var(--planner-stroke-width)] flex-1 bg-planner-border opacity-30" />
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
                <div
                    aria-label="Current time"
                    className="pointer-events-none absolute left-0 right-0 z-20 h-[var(--planner-stroke-width)] bg-red-600"
                    style={{ top: currentMinute * pixelsPerMinute }}
                />
            </div>
        </div>
    );
}
