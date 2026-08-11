import { describe, expect, it } from 'vitest';
import {
    initialTimelineMinute,
    snapTimelineDragMinute,
    timelineMinuteHeight,
} from '../timelineScale';
import * as currentTimelineScale from '../timelineScale';

interface LiveTimelineScale {
    currentTimelineMinute?: (now: Date) => number;
}

const liveTimelineScale = currentTimelineScale as LiveTimelineScale;

describe('currentTimelineMinute', () => {
    it('includes seconds so the current-time marker advances between minutes', () => {
        expect(liveTimelineScale.currentTimelineMinute).toBeTypeOf('function');
        expect(
            liveTimelineScale.currentTimelineMinute!(
                new Date(2026, 7, 10, 14, 35, 30)
            )
        ).toBe(14 * 60 + 35.5);
    });
});

describe('initialTimelineMinute', () => {
    it('starts one hour before the current local time', () => {
        expect(initialTimelineMinute(new Date(2026, 7, 10, 14, 35))).toBe(
            13 * 60 + 35
        );
    });

    it('clamps the initial position to midnight', () => {
        expect(initialTimelineMinute(new Date(2026, 7, 10, 0, 45))).toBe(0);
    });
});

describe('timelineMinuteHeight', () => {
    it('derives the scale from the planner viewport and column header', () => {
        expect(timelineMinuteHeight(645, 10)).toBe(1);
        expect(timelineMinuteHeight(645, 5)).toBe(2);
    });

    it('keeps a usable minimum before the planner has been measured', () => {
        expect(timelineMinuteHeight(0, 10)).toBe(0.25);
    });
});

describe('snapTimelineDragMinute', () => {
    it('snaps a dragged item to the nearest five-minute increment', () => {
        expect(snapTimelineDragMinute(612, 30)).toBe(610);
        expect(snapTimelineDragMinute(613, 30)).toBe(615);
    });

    it('clamps a dragged item to midnight', () => {
        expect(snapTimelineDragMinute(-4, 30)).toBe(0);
    });

    it('keeps the full dragged item inside the end of the day', () => {
        expect(snapTimelineDragMinute(1439, 30)).toBe(1410);
    });
});
