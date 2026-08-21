import { describe, expect, it } from 'vitest';
import {
    effectiveItemDurationMinutes,
    ITEM_DURATION_ESTIMATES,
    itemDurationEstimateIndex,
    nextItemDurationEstimate,
} from './itemDuration';

describe('item duration estimates', () => {
    it('exposes the five duration choices with 60 minutes as the 30+ sentinel', () => {
        expect(ITEM_DURATION_ESTIMATES).toEqual([
            { label: '1', minutes: 1 },
            { label: '5', minutes: 5 },
            { label: '15', minutes: 15 },
            { label: '30', minutes: 30 },
            { label: '30+', minutes: 60 },
        ]);
    });

    it('treats every legacy estimate above 30 minutes as 30+', () => {
        expect(effectiveItemDurationMinutes(45)).toBe(60);
        expect(effectiveItemDurationMinutes(120)).toBe(60);
        expect(itemDurationEstimateIndex(90)).toBe(4);
    });

    it('cycles through the canonical estimates and wraps after 30+', () => {
        expect([1, 5, 15, 30, 60].map(nextItemDurationEstimate)).toEqual([
            5, 15, 30, 60, 1,
        ]);
        expect(nextItemDurationEstimate(120)).toBe(1);
        expect(nextItemDurationEstimate(20)).toBe(30);
    });
});
