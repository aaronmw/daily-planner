import extendBulletedListAtCursor from '../extendBulletedLinesAtCursor';

const initialValue = [
    `- Apples`,
    `  - Granny Smith`,
    `  - Gala`,
    `- Bananas`,
    `- Pears`,
].join('\n');

const tests = [
    {
        given: initialValue,
        selection: { after: '- Pears' },
        it: 'Extends list if last in string',
        expect: {
            newCursorPosition: 55,
            newText: [
                `- Apples`,
                `  - Granny Smith`,
                `  - Gala`,
                `- Bananas`,
                `- Pears`,
                `- `,
            ].join('\n'),
        },
    },
    {
        given: initialValue,
        selection: { after: '- Gala' },
        it: 'Extends nested lists',
        expect: {
            newCursorPosition: 39,
            newText: [
                `- Apples`,
                `  - Granny Smith`,
                `  - Gala`,
                `  - `,
                `- Bananas`,
                `- Pears`,
            ].join('\n'),
        },
    },
    {
        given: initialValue,
        selection: { from: 'ears', to: 'ears' },
        it: 'Removes any selected text when extending a list',
        expect: {
            newCursorPosition: 51,
            newText: [
                `- Apples`,
                `  - Granny Smith`,
                `  - Gala`,
                `- Bananas`,
                `- P`,
                `- `,
            ].join('\n'),
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

        const bulletedText = extendBulletedListAtCursor({
            text: test.given,
            selectionStart,
            selectionEnd,
        });

        expect(bulletedText.newText).toBe(test.expect.newText);
        expect(bulletedText.newCursorPosition).toBe(
            test.expect.newCursorPosition
        );
    });
});
