import { describe, expect, it } from 'vitest';
import { timelineMinuteHeight } from '../timelineScale';

describe('timelineMinuteHeight', () => {
    it('derives the scale from the planner viewport and column header', () => {
        expect(timelineMinuteHeight(645, 10)).toBe(1);
        expect(timelineMinuteHeight(645, 5)).toBe(2);
    });

    it('keeps a usable minimum before the planner has been measured', () => {
        expect(timelineMinuteHeight(0, 10)).toBe(0.25);
    });
});
