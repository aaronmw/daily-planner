import {
    selectionWrapperForInput,
    selectionWrapperForTextInput,
    wrapTextSelection,
} from '../editorSelection';

describe('selection wrapping', () => {
    it('wraps selected text and expands the forward selection', () => {
        expect(
            wrapTextSelection(
                'lazy',
                { start: 0, end: 4, direction: 'forward' },
                { open: '(', close: ')' }
            )
        ).toEqual({
            text: '(lazy)',
            selection: { start: 0, end: 6, direction: 'forward' },
        });
    });

    it('preserves backward selection direction', () => {
        expect(
            wrapTextSelection(
                'lazy',
                { start: 0, end: 4, direction: 'backward' },
                { open: '"', close: '"' }
            ).selection
        ).toEqual({ start: 0, end: 6, direction: 'backward' });
    });

    it('does not wrap a collapsed selection', () => {
        expect(
            wrapTextSelection(
                'lazy',
                { start: 2, end: 2, direction: 'none' },
                { open: '[', close: ']' }
            )
        ).toBeNull();
    });

    it.each([
        ['_', '_'],
        ['*', '*'],
        ['`', '`'],
        ["'", "'"],
        ['"', '"'],
        ['(', ')'],
        ['[', ']'],
        ['{', '}'],
    ])('maps %s to its matching wrapper', (input, close) => {
        expect(selectionWrapperForInput(input)).toEqual({
            open: input,
            close,
        });
    });

    it('ignores closing punctuation and unsupported characters', () => {
        expect(selectionWrapperForInput(')')).toBeNull();
        expect(selectionWrapperForInput('~')).toBeNull();
    });

    it('ignores composition and non-typing beforeinput events', () => {
        expect(
            selectionWrapperForTextInput({
                data: '(',
                inputType: 'insertCompositionText',
                isComposing: true,
            })
        ).toBeNull();
        expect(
            selectionWrapperForTextInput({
                data: '(',
                inputType: 'insertFromPaste',
            })
        ).toBeNull();
    });
});
