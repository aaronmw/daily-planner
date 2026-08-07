const TERMINAL_PUNCTUATION = /[.!?…]["')\]}]*$/u;
const SENTENCE_SEGMENTER =
    typeof Intl !== 'undefined' && 'Segmenter' in Intl
        ? new Intl.Segmenter('en', { granularity: 'sentence' })
        : null;

const splitSentences = text => {
    if (text.length === 0) {
        return [''];
    }

    if (SENTENCE_SEGMENTER) {
        const segments = Array.from(
            SENTENCE_SEGMENTER.segment(text),
            ({ segment }) => segment
        );

        return segments.length > 0 ? segments : [text];
    }

    const matches = text.match(/[^.!?…]+(?:[.!?…]+["')\]}]*(?:\s+|$)|$)/gu);
    return matches && matches.length > 0 ? matches : [text];
};

export const sentenceRanges = text => {
    const ranges = [];
    let paragraphStart = 0;

    for (const paragraph of text.split('\n')) {
        let sentenceStart = paragraphStart;

        for (const sentence of splitSentences(paragraph)) {
            const end = sentenceStart + sentence.length;
            const trimmed = sentence.trim();

            ranges.push({
                start: sentenceStart,
                end,
                text: sentence,
                complete:
                    trimmed.length === 0 || TERMINAL_PUNCTUATION.test(trimmed),
            });
            sentenceStart = end;
        }

        paragraphStart += paragraph.length + 1;
    }

    return ranges;
};

export const sentenceHighlightSegments = text => {
    const segments = [];
    let cursor = 0;

    for (const sentence of sentenceRanges(text)) {
        if (sentence.start > cursor) {
            segments.push({
                kind: 'gap',
                start: cursor,
                end: sentence.start,
                text: text.slice(cursor, sentence.start),
                complete: null,
            });
        }

        segments.push({ ...sentence, kind: 'sentence' });
        cursor = sentence.end;
    }

    if (cursor < text.length) {
        segments.push({
            kind: 'gap',
            start: cursor,
            end: text.length,
            text: text.slice(cursor),
            complete: null,
        });
    }

    return segments;
};

const getActiveRanges = (ranges, textLength, selection) => {
    if (selection.start !== selection.end) {
        return ranges.filter(
            range => selection.start < range.end && selection.end > range.start
        );
    }

    const containingRange = ranges.find(
        range =>
            selection.start >= range.start &&
            (selection.start < range.end ||
                (range.end === textLength && selection.start === range.end))
    );

    return containingRange ? [containingRange] : [];
};

export const activeSentenceRanges = (text, selection) =>
    getActiveRanges(sentenceRanges(text), text.length, selection);

export const applySentenceDisplayState = (
    segments,
    { focusAssistEnabled, highlightIncompleteSentencesEnabled, selection }
) => {
    const sentenceSegments = segments.filter(
        segment => segment.kind === 'sentence'
    );
    const textLength = segments.at(-1)?.end || 0;
    const activeRanges = getActiveRanges(
        sentenceSegments,
        textLength,
        selection
    );

    return segments.map(segment => {
        const active =
            segment.kind === 'sentence' &&
            activeRanges.some(
                range =>
                    range.start === segment.start && range.end === segment.end
            );

        return {
            ...segment,
            active,
            dimmed:
                segment.kind === 'sentence' && focusAssistEnabled && !active,
            incomplete:
                segment.kind === 'sentence' &&
                highlightIncompleteSentencesEnabled &&
                segment.complete === false &&
                !active,
        };
    });
};

export const buildSentenceDisplaySegments = (
    text,
    { focusAssistEnabled, highlightIncompleteSentencesEnabled, selection }
) => {
    return applySentenceDisplayState(sentenceHighlightSegments(text), {
        focusAssistEnabled,
        highlightIncompleteSentencesEnabled,
        selection,
    });
};
