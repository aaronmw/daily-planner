import { describe, expect, it } from 'vitest';
import { createItemId } from '../../../core/domain/ids';
import { resolveItemListInsertion } from '../itemListInsertion';

const first = createItemId();
const second = createItemId();
const third = createItemId();
const itemIds = [first, second, third];
const rows = [
    { id: first, size: 60, start: 72 },
    { id: second, size: 60, start: 132 },
    { id: third, size: 60, start: 192 },
];

describe('resolveItemListInsertion', () => {
    it('resolves the top slot before the first item', () => {
        expect(resolveItemListInsertion(80, itemIds, rows)).toEqual({
            index: 0,
            nextId: first,
            previousId: null,
        });
    });

    it('resolves a slot between rendered items', () => {
        expect(resolveItemListInsertion(190, itemIds, rows)).toEqual({
            index: 2,
            nextId: third,
            previousId: second,
        });
    });

    it('resolves the slot after the final rendered item', () => {
        expect(resolveItemListInsertion(260, itemIds, rows)).toEqual({
            index: 3,
            nextId: null,
            previousId: third,
        });
    });

    it('resolves the first slot in an empty list', () => {
        expect(resolveItemListInsertion(100, [], [])).toEqual({
            index: 0,
            nextId: null,
            previousId: null,
        });
    });
});
