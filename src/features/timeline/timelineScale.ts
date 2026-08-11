const COLUMN_HEADER_HEIGHT = 45;
const DAY_MINUTES = 24 * 60;
const MINIMUM_MINUTE_HEIGHT = 0.25;
const TIMELINE_DRAG_SNAP_MINUTES = 5;

export function currentTimelineMinute(now: Date): number {
    return (
        now.getHours() * 60 +
        now.getMinutes() +
        now.getSeconds() / 60 +
        now.getMilliseconds() / 60_000
    );
}

export function initialTimelineMinute(now: Date): number {
    return Math.max(0, now.getHours() * 60 + now.getMinutes() - 60);
}

export function timelineMinuteHeight(
    plannerHeight: number,
    hoursPerScreen: number
): number {
    const timelineViewportHeight = Math.max(
        0,
        plannerHeight - COLUMN_HEADER_HEIGHT
    );
    return Math.max(
        MINIMUM_MINUTE_HEIGHT,
        timelineViewportHeight / (hoursPerScreen * 60)
    );
}

export function snapTimelineDragMinute(
    rawMinute: number,
    durationMinutes: number
): number {
    const snappedMinute =
        Math.round(rawMinute / TIMELINE_DRAG_SNAP_MINUTES) *
        TIMELINE_DRAG_SNAP_MINUTES;
    const latestStartMinute = Math.max(0, DAY_MINUTES - durationMinutes);
    return Math.max(0, Math.min(latestStartMinute, snappedMinute));
}
