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
];

tests.forEach(test => {
    it(test.it, () => {
        const resultObj = wrapSelectedText({
            text: test.given,
            selectionStart: test.given.indexOf(test.selection.from),
            selectionEnd:
                test.given.indexOf(test.selection.to) +
                test.selection.to.length,
            insertBefore: '**',
            insertAfter: '**',
        });

        Object.keys(test.expect).forEach(expectedProperty => {
            expect(resultObj[expectedProperty]).toStrictEqual(
                test.expect[expectedProperty]
            );
        });
    });
});
