import { describe, expect, it } from 'vitest';
import { nextGridIndex, type GridDirection } from '../gridNavigation';

const move = (
    index: number,
    direction: GridDirection,
    count = 4,
    columns = 3
) => nextGridIndex({ columns, count, direction, index });

describe('responsive list-grid navigation', () => {
    it('clamps vertical movement into an incomplete final row', () => {
        expect(move(1, 'down')).toBe(3);
        expect(move(2, 'down')).toBe(3);
        expect(move(3, 'up')).toBe(0);
    });

    it('preserves columns in five-column layouts and stops at edges', () => {
        expect(move(1, 'down', 8, 5)).toBe(6);
        expect(move(4, 'down', 8, 5)).toBe(7);
        expect(move(7, 'down', 8, 5)).toBe(7);
        expect(move(0, 'left', 8, 5)).toBe(0);
        expect(move(7, 'right', 8, 5)).toBe(7);
    });
});
