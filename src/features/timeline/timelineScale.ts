const COLUMN_HEADER_HEIGHT = 45;
const MINIMUM_MINUTE_HEIGHT = 0.25;

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
