import { describe, expect, it } from 'vitest';
import { wrapTextSelection } from '../textEditing';

describe('wrapTextSelection', () => {
    it.each(['forward', 'backward'] as const)(
        'wraps a %s selection without selecting the punctuation',
        direction => {
            expect(
                wrapTextSelection(
                    'hello world',
                    { direction, end: 5, start: 0 },
                    { close: ')', open: '(' }
                )
            ).toEqual({
                selection: { direction, end: 6, start: 1 },
                text: '(hello) world',
            });
        }
    );
});
