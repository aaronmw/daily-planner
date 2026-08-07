const TYPED_SELECTION_WRAPPERS = {
    '_': { open: '_', close: '_' },
    '*': { open: '*', close: '*' },
    '`': { open: '`', close: '`' },
    "'": { open: "'", close: "'" },
    '"': { open: '"', close: '"' },
    '(': { open: '(', close: ')' },
    '[': { open: '[', close: ']' },
    '{': { open: '{', close: '}' },
};

export const selectionWrapperForInput = input =>
    TYPED_SELECTION_WRAPPERS[input] || null;

export const selectionWrapperForTextInput = ({
    data,
    inputType,
    isComposing,
}) => {
    if (
        isComposing ||
        (inputType && inputType !== 'insertText') ||
        data == null
    ) {
        return null;
    }

    return selectionWrapperForInput(data);
};

export const wrapTextSelection = (text, selection, wrapper) => {
    if (
        !Number.isInteger(selection.start) ||
        !Number.isInteger(selection.end) ||
        selection.start < 0 ||
        selection.end > text.length ||
        selection.start >= selection.end ||
        !wrapper.open ||
        !wrapper.close
    ) {
        return null;
    }

    const selectedText = text.slice(selection.start, selection.end);

    return {
        text:
            text.slice(0, selection.start) +
            wrapper.open +
            selectedText +
            wrapper.close +
            text.slice(selection.end),
        selection: {
            start: selection.start,
            end: selection.end + wrapper.open.length + wrapper.close.length,
            direction: selection.direction,
        },
    };
};
