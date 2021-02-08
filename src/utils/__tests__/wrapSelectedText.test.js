import wrapSelectedText from '../wrapSelectedText';

const initialValue = [
    `The quick brown`,
    `fox jumped over`,
    `the lazy dog.`,
    `There were`,
    `no casualties.`,
].join('\n');

const tests = [
    {
        given: initialValue,
        selection: { from: 'jumped', to: 'jumped' },
        it: 'Wraps single word selection',
        expect: {
            newText: [
                `The quick brown`,
                `fox **jumped** over`,
                `the lazy dog.`,
                `There were`,
                `no casualties.`,
            ].join('\n'),
            newSelectionStart: 22,
            newSelectionEnd: 28,
        },
    },
    {
        given: initialValue,
        selection: { from: 'The quick', to: 'no casualties.' },
        it: 'Wraps entire string selection',
        expect: {
            newText: [
                `**The quick brown`,
                `fox jumped over`,
                `the lazy dog.`,
                `There were`,
                `no casualties.**`,
            ].join('\n'),
            newSelectionStart: 2,
            newSelectionEnd: 73,
        },
    },
    {
        given: initialValue,
        selection: { from: 'jumped over', to: 'the lazy' },
        it: 'Wraps multi-line selection',
        expect: {
            newText: [
                `The quick brown`,
                `fox **jumped over`,
                `the lazy** dog.`,
                `There were`,
                `no casualties.`,
            ].join('\n'),
            newSelectionStart: 22,
            newSelectionEnd: 42,
        },
    },
    {
        given: initialValue,
        selection: { after: 'jump' },
        it: 'Does nothing if there is text to the right of the cursor',
        expect: {
            newText: [
                `The quick brown`,
                `fox jump****ed over`,
                `the lazy dog.`,
                `There were`,
                `no casualties.`,
            ].join('\n'),
            newSelectionStart: 26,
            newSelectionEnd: 26,
        },
    },
];

tests.forEach(test => {
    it(test.it, () => {
        const after = test.selection.after;
        const from = test.selection.from;
        const to = test.selection.to;
        const selectionEnd = after
            ? test.given.indexOf(after) + after.length
            : test.given.indexOf(to) + to.length;
        const selectionStart = after ? selectionEnd : test.given.indexOf(from);

        const resultObj = wrapSelectedText({
            insertAfter: '**',
            insertBefore: '**',
            selectionEnd,
            selectionStart,
            text: test.given,
            wrapAtAnyCursorLocation: true,
        });

        Object.keys(test.expect).forEach(expectedProperty => {
            expect(resultObj[expectedProperty]).toStrictEqual(
                test.expect[expectedProperty]
            );
        });
    });
});
