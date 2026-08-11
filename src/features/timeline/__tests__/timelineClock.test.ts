import { describe, expect, it } from 'vitest';
import {
    currentSecondKey,
    currentTimeParts,
    isCurrentTimeColonVisible,
    millisecondsUntilNextSecond,
} from '../timelineClock';

describe('timelineClock', () => {
    it('formats local time with minutes but no seconds', () => {
        expect(currentTimeParts(new Date(2026, 7, 11, 15, 4, 38))).toEqual({
            hour: '3',
            label: '3:04 PM',
            minute: '04',
            period: 'PM',
        });
    });

    it('alternates the colon on consecutive whole seconds', () => {
        const even = new Date(2026, 7, 11, 15, 4, 38);
        const odd = new Date(2026, 7, 11, 15, 4, 39);
        expect(isCurrentTimeColonVisible(even)).toBe(true);
        expect(isCurrentTimeColonVisible(odd)).toBe(false);
        expect(currentSecondKey(odd) - currentSecondKey(even)).toBe(1);
    });

    it('aligns the next callback to the real second boundary', () => {
        expect(
            millisecondsUntilNextSecond(
                new Date(2026, 7, 11, 15, 4, 38, 250)
            )
        ).toBe(750);
        expect(
            millisecondsUntilNextSecond(
                new Date(2026, 7, 11, 15, 4, 39, 0)
            )
        ).toBe(1_000);
    });
});
