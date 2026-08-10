export interface TextSelection {
    direction: 'backward' | 'forward' | 'none';
    end: number;
    start: number;
}

export interface SentenceSegment {
    active: boolean;
    complete: boolean | null;
    dimmed: boolean;
    end: number;
    incomplete: boolean;
    kind: 'gap' | 'sentence';
    start: number;
    text: string;
}

const TERMINAL_PUNCTUATION = /[.!?…]["')\]}]*$/u;

const segmenter =
    typeof Intl !== 'undefined' && 'Segmenter' in Intl
        ? new Intl.Segmenter('en', { granularity: 'sentence' })
        : null;

const splitSentences = (text: string): string[] => {
    if (text.length === 0) return [''];
    if (segmenter) {
        const segments = Array.from(
            segmenter.segment(text),
            item => item.segment
        );
        return segments.length > 0 ? segments : [text];
    }
    return text.match(/[^.!?…]+(?:[.!?…]+["')\]}]*(?:\s+|$)|$)/gu) ?? [text];
};

interface SentenceRange {
    complete: boolean;
    end: number;
    start: number;
    text: string;
}

export const sentenceRanges = (text: string): SentenceRange[] => {
    const ranges: SentenceRange[] = [];
    let paragraphStart = 0;
    for (const paragraph of text.split('\n')) {
        let sentenceStart = paragraphStart;
        for (const sentence of splitSentences(paragraph)) {
            const end = sentenceStart + sentence.length;
            const trimmed = sentence.trim();
            ranges.push({
                complete:
                    trimmed.length === 0 || TERMINAL_PUNCTUATION.test(trimmed),
                end,
                start: sentenceStart,
                text: sentence,
            });
            sentenceStart = end;
        }
        paragraphStart += paragraph.length + 1;
    }
    return ranges;
};

export const sentenceDisplaySegments = (
    text: string,
    selection: TextSelection,
    options: {
        focusAssistEnabled: boolean;
        highlightIncompleteSentencesEnabled: boolean;
    }
): SentenceSegment[] => {
    const ranges = sentenceRanges(text);
    const active = ranges.filter(range => {
        if (selection.start !== selection.end) {
            return selection.start < range.end && selection.end > range.start;
        }
        return (
            selection.start >= range.start &&
            (selection.start < range.end ||
                (range.end === text.length && selection.start === range.end))
        );
    });
    const segments: Omit<
        SentenceSegment,
        'active' | 'dimmed' | 'incomplete'
    >[] = [];
    let cursor = 0;
    for (const range of ranges) {
        if (range.start > cursor) {
            segments.push({
                complete: null,
                end: range.start,
                kind: 'gap',
                start: cursor,
                text: text.slice(cursor, range.start),
            });
        }
        segments.push({ ...range, kind: 'sentence' });
        cursor = range.end;
    }
    if (cursor < text.length) {
        segments.push({
            complete: null,
            end: text.length,
            kind: 'gap',
            start: cursor,
            text: text.slice(cursor),
        });
    }
    return segments.map(segment => {
        const isActive =
            segment.kind === 'sentence' &&
            active.some(
                range =>
                    range.start === segment.start && range.end === segment.end
            );
        return {
            ...segment,
            active: isActive,
            dimmed:
                segment.kind === 'sentence' &&
                options.focusAssistEnabled &&
                !isActive,
            incomplete:
                segment.kind === 'sentence' &&
                options.highlightIncompleteSentencesEnabled &&
                segment.complete === false &&
                !isActive,
        };
    });
};
