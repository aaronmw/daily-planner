import type { PlannerItem } from '../../core/domain/types';

const lowerBound = (items: readonly PlannerItem[], minute: number): number => {
    let low = 0;
    let high = items.length;
    while (low < high) {
        const middle = Math.floor((low + high) / 2);
        if ((items[middle]?.scheduledStartMinutes ?? Infinity) < minute) {
            low = middle + 1;
        } else {
            high = middle;
        }
    }
    return low;
};

export const scheduledItemsInWindow = (
    sortedItems: readonly PlannerItem[],
    visibleStart: number,
    visibleEnd: number,
    overscanMinutes = 60
): PlannerItem[] => {
    if (sortedItems.length === 0) return [];
    const maximumDuration = sortedItems.reduce(
        (maximum, item) => Math.max(maximum, item.durationMinutes),
        0
    );
    const rangeStart = Math.max(
        0,
        visibleStart - overscanMinutes - maximumDuration
    );
    const rangeEnd = visibleEnd + overscanMinutes;
    const from = lowerBound(sortedItems, rangeStart);
    const to = lowerBound(sortedItems, rangeEnd);
    return sortedItems.slice(from, to).filter(item => {
        const start = item.scheduledStartMinutes;
        return (
            start !== null &&
            start + item.durationMinutes > visibleStart - overscanMinutes
        );
    });
};
