import type { TextSelection } from './sentences';

export interface SelectionWrapper {
    close: string;
    open: string;
}

const WRAPPERS: Readonly<Record<string, SelectionWrapper>> = {
    '"': { close: '"', open: '"' },
    "'": { close: "'", open: "'" },
    '(': { close: ')', open: '(' },
    '*': { close: '*', open: '*' },
    '[': { close: ']', open: '[' },
    '`': { close: '`', open: '`' },
    '_': { close: '_', open: '_' },
    '{': { close: '}', open: '{' },
};

export const selectionWrapperForInput = (
    input: string | null
): SelectionWrapper | null => (input ? (WRAPPERS[input] ?? null) : null);

export const wrapTextSelection = (
    text: string,
    selection: TextSelection,
    wrapper: SelectionWrapper
): { selection: TextSelection; text: string } | null => {
    if (
        selection.start < 0 ||
        selection.end > text.length ||
        selection.start >= selection.end
    ) {
        return null;
    }
    return {
        selection: {
            direction: selection.direction,
            end: selection.end + wrapper.open.length,
            start: selection.start + wrapper.open.length,
        },
        text: `${text.slice(0, selection.start)}${wrapper.open}${text.slice(selection.start, selection.end)}${wrapper.close}${text.slice(selection.end)}`,
    };
};

export const extendBullet = (
    text: string,
    selection: TextSelection
): { selection: TextSelection; text: string } => {
    const before = text.slice(0, selection.start);
    const after = text.slice(selection.end);
    const lineStart = before.lastIndexOf('\n') + 1;
    const line = before.slice(lineStart);
    const prefix = /^(\s*(?:[-*+>]|•)\s+)/u.exec(line)?.[1] ?? '';
    const insertion = `\n${prefix}`;
    const cursor = before.length + insertion.length;
    return {
        selection: { direction: 'none', end: cursor, start: cursor },
        text: `${before}${insertion}${after}`,
    };
};

export const indentLines = (
    text: string,
    selection: TextSelection,
    outdent: boolean
): { selection: TextSelection; text: string } => {
    const lineStart =
        text.lastIndexOf('\n', Math.max(0, selection.start - 1)) + 1;
    const lineEndIndex = text.indexOf('\n', selection.end);
    const lineEnd = lineEndIndex === -1 ? text.length : lineEndIndex;
    const source = text.slice(lineStart, lineEnd);
    const lines = source.split('\n');
    let startDelta = 0;
    let endDelta = 0;
    const nextLines = lines.map((line, index) => {
        if (outdent) {
            const removed = /^ {1,2}/.exec(line)?.[0].length ?? 0;
            if (index === 0) startDelta -= removed;
            endDelta -= removed;
            return line.slice(removed);
        }
        if (index === 0) startDelta += 2;
        endDelta += 2;
        return `  ${line}`;
    });
    return {
        selection: {
            direction: selection.direction,
            end: selection.end + endDelta,
            start: selection.start + startDelta,
        },
        text: `${text.slice(0, lineStart)}${nextLines.join('\n')}${text.slice(lineEnd)}`,
    };
};
