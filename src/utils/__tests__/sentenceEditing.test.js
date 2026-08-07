import {
    activeSentenceRanges,
    buildSentenceDisplaySegments,
    sentenceHighlightSegments,
    sentenceRanges,
} from '../sentenceEditing';

describe('sentence parsing', () => {
    it('marks only terminally punctuated prose as complete', () => {
        expect(sentenceRanges('Hello there. Still thinking')).toMatchObject([
            { text: 'Hello there. ', complete: true },
            { text: 'Still thinking', complete: false },
        ]);
    });

    it('preserves paragraph breaks in the highlighted stream', () => {
        const text = 'Alpha.\n\nBeta.\nGamma without punctuation';
        const segments = sentenceHighlightSegments(text);

        expect(segments.map(segment => segment.text).join('')).toBe(text);
        expect(
            segments
                .filter(segment => segment.kind === 'gap')
                .map(segment => segment.text)
        ).toEqual(['\n', '\n', '\n']);
    });
});

describe('active sentence ranges', () => {
    const text = 'Alpha. Bravo. Charlie.';

    it('selects the sentence containing a collapsed caret', () => {
        expect(activeSentenceRanges(text, { start: 9, end: 9 })).toMatchObject([
            { start: 7, end: 14 },
        ]);
    });

    it('selects every sentence intersecting a range', () => {
        expect(activeSentenceRanges(text, { start: 2, end: 18 })).toMatchObject(
            [
                { start: 0, end: 7 },
                { start: 7, end: 14 },
                { start: 14, end: text.length },
            ]
        );
    });

    it('treats a range end at a sentence boundary as exclusive', () => {
        expect(activeSentenceRanges(text, { start: 2, end: 7 })).toMatchObject([
            { start: 0, end: 7 },
        ]);
    });
});

describe('sentence display segments', () => {
    const text = 'Alpha. Bravo unfinished';

    it('dims only sentences outside a collapsed caret', () => {
        const segments = buildSentenceDisplaySegments(text, {
            focusAssistEnabled: true,
            highlightIncompleteSentencesEnabled: true,
            selection: { start: 9, end: 9 },
        }).filter(segment => segment.kind === 'sentence');

        expect(
            segments.map(({ active, dimmed }) => ({ active, dimmed }))
        ).toEqual([
            { active: false, dimmed: true },
            { active: true, dimmed: false },
        ]);
    });

    it('keeps every selected sentence active', () => {
        const segments = buildSentenceDisplaySegments(text, {
            focusAssistEnabled: true,
            highlightIncompleteSentencesEnabled: true,
            selection: { start: 2, end: text.length },
        }).filter(segment => segment.kind === 'sentence');

        expect(segments.every(segment => segment.active)).toBe(true);
        expect(segments.every(segment => !segment.dimmed)).toBe(true);
    });

    it('marks incomplete sentences only when they are not active', () => {
        const [firstSentence, secondSentence] = buildSentenceDisplaySegments(
            text,
            {
                focusAssistEnabled: false,
                highlightIncompleteSentencesEnabled: true,
                selection: { start: 0, end: 0 },
            }
        ).filter(segment => segment.kind === 'sentence');

        expect(firstSentence.incomplete).toBe(false);
        expect(secondSentence.incomplete).toBe(true);
    });
});
