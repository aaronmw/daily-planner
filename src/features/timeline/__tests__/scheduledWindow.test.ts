import { describe, expect, it } from 'vitest';
import {
    createPlannerList,
    createPlannerItem,
} from '../../../core/domain/factories';
import type { PlannerItem } from '../../../core/domain/types';
import { scheduledItemsInWindow } from '../scheduledWindow';

const list = createPlannerList();
const itemAt = (start: number, duration = 30): PlannerItem => ({
    ...createPlannerItem({ listId: list.id }),
    durationMinutes: duration,
    scheduledStartMinutes: start,
});

describe('scheduledItemsInWindow', () => {
    it('includes long items that begin before the visible range', () => {
        const long = itemAt(60, 300);
        expect(scheduledItemsInWindow([long], 300, 360, 0)).toEqual([long]);
    });

    it('matches a complete interval filter', () => {
        const items = [
            itemAt(0, 15),
            itemAt(60, 120),
            itemAt(240),
            itemAt(600),
        ];
        const expected = items.filter(item => {
            const start = item.scheduledStartMinutes!;
            return start < 360 + 60 && start + item.durationMinutes > 180 - 60;
        });
        expect(scheduledItemsInWindow(items, 180, 360)).toEqual(expected);
    });
});
