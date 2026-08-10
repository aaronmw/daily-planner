import { describe, expect, it } from 'vitest';
import { initialTimelineMinute, timelineMinuteHeight } from '../timelineScale';

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
