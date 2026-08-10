import { describe, expect, it } from 'vitest';
import type { ColumnVisibility } from '../../core/domain/types';
import { resolveColumnShortcut } from './columnShortcuts';

const allOpen = (): ColumnVisibility => ({
    details: true,
    items: true,
    lists: true,
    timeline: true,
});

describe('resolveColumnShortcut', () => {
    it.each([
        ['i', 'items'],
        ['l', 'lists'],
        ['t', 'timeline'],
    ] as const)('opens and focuses the %s column shortcut', (key, column) => {
        const visibility = allOpen();
        visibility[column] = false;

        expect(resolveColumnShortcut(key, visibility)).toEqual({
            focusColumn: column,
            visibility: { ...visibility, [column]: true },
        });
    });

    it.each([
        ['i', 'items'],
        ['l', 'lists'],
        ['t', 'timeline'],
    ] as const)('collapses the open %s column shortcut', (key, column) => {
        const visibility = allOpen();

        expect(resolveColumnShortcut(key, visibility)).toEqual({
            focusColumn: null,
            visibility: { ...visibility, [column]: false },
        });
    });

    it('keeps the final open column visible', () => {
        const visibility: ColumnVisibility = {
            details: false,
            items: true,
            lists: false,
            timeline: false,
        };

        expect(resolveColumnShortcut('i', visibility)).toEqual({
            focusColumn: null,
            visibility,
        });
    });

    it('ignores unrelated keys', () => {
        expect(resolveColumnShortcut('x', allOpen())).toBeNull();
    });
});
