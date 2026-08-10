import { describe, expect, it } from 'vitest';
import { createPlannerList, createPlannerItem } from '../factories';
import { plannerListSchema, plannerItemSchema } from '../schemas';

describe('planner domain', () => {
    it('creates strict UUID-backed entities with canonical item fields', () => {
        const list = createPlannerList({ label: 'Today' });
        const item = createPlannerItem({ listId: list.id });

        expect(plannerListSchema.parse(list)).toEqual(list);
        expect(plannerItemSchema.parse(item)).toEqual(item);
        expect(item.durationMinutes).toBe(30);
        expect(item.scheduledStartMinutes).toBeNull();
    });

    it('creates monotonically increasing fractional item keys', () => {
        const list = createPlannerList();
        const first = createPlannerItem({ listId: list.id });
        const second = createPlannerItem({
            afterOrderKey: first.orderKey,
            listId: list.id,
        });

        expect(first.orderKey < second.orderKey).toBe(true);
    });
});
