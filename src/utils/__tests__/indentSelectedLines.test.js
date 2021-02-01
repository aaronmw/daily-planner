import indentSelectedLines from '../indentSelectedLines';

const tabCharacter = '  ';

const initialValue = [
    `- Apples`,
    `- Blueberries`,
    `- Cherries`,
    `${tabCharacter}- Red`,
    ``,
    `${tabCharacter}- Pink`,
].join('\n');

const tests = [
    {
        debug: true,
        given: `\n${initialValue}`,
        selection: { from: '-', to: '\n' }, // |-•Apples
        expectSelection: { from: '-', to: `\n${tabCharacter}` }, // ••|-•Apples
        it: 'Indents a single line if cursor at start of the line',
        expect: [
            ``,
            `${tabCharacter}- Apples`,
            `- Blueberries`,
            `- Cherries`,
            `${tabCharacter}- Red`,
            ``,
            `${tabCharacter}- Pink`,
        ].join('\n'),
    },
    {
        given: initialValue,
        selection: { from: '- Apples', to: 'Pink' },
        it: 'Indents each line of entire selection',
        expect: [
            `${tabCharacter}- Apples`,
            `${tabCharacter}- Blueberries`,
            `${tabCharacter}- Cherries`,
            `${tabCharacter}${tabCharacter}- Red`,
            `${tabCharacter}`,
            `${tabCharacter}${tabCharacter}- Pink`,
        ].join('\n'),
    },
    {
        given: initialValue,
        selection: { from: 'Red', to: 'Pink' },
        it: 'Indents only lines that intersect the selection',
        expect: [
            `- Apples`,
            `- Blueberries`,
            `- Cherries`,
            `${tabCharacter}${tabCharacter}- Red`,
            `${tabCharacter}`,
            `${tabCharacter}${tabCharacter}- Pink`,
        ].join('\n'),
    },
    {
        given: initialValue,
        it:
            'Indents only selected lines if selection starts at beginning of a line',
        selection: { from: `${tabCharacter}- Red`, to: 'Pink' },
        expect: [
            `- Apples`,
            `- Blueberries`,
            `- Cherries`,
            `${tabCharacter}${tabCharacter}- Red`,
            `${tabCharacter}`,
            `${tabCharacter}${tabCharacter}- Pink`,
        ].join('\n'),
    },
    {
        given: initialValue,
        it: 'Outdents only indented lines within the selection',
        selection: { from: '- Apples', to: 'Pink' },
        outdent: true,
        expect: [
            `- Apples`,
            `- Blueberries`,
            `- Cherries`,
            `- Red`,
            ``,
            `- Pink`,
        ].join('\n'),
    },
    {
        given: initialValue,
        it: 'Outdents a single line',
        selection: { from: `${tabCharacter}- Red`, to: 'Red' },
        outdent: true,
        expectSelection: { from: '- Red', to: 'Red' },
        expect: [
            `- Apples`,
            `- Blueberries`,
            `- Cherries`,
            `- Red`,
            ``,
            `${tabCharacter}- Pink`,
        ].join('\n'),
    },
    {
        given: initialValue,
        it: 'Outdents a single line, with no selection',
        selection: { from: `- Red`, to: `- Cherries\n${tabCharacter}` }, // ••|- Red
        outdent: true,
        expectSelection: { from: '- Red', to: '- Cherries\n' },
        expect: [
            `- Apples`,
            `- Blueberries`,
            `- Cherries`,
            `- Red`,
            ``,
            `${tabCharacter}- Pink`,
        ].join('\n'),
    },
    {
        given: initialValue,
        it: 'Does nothing when attempting to outdent an un-indented line',
        selection: { from: 'Blue', to: 'Blue' },
        outdent: true,
        expect: initialValue,
    },
];

tests.forEach(test => {
    it(test.it, () => {
        const { from, to } = test.selection;
        const selectionStart = test.given.indexOf(from);
        const selectionEnd = test.given.indexOf(to) + to.length;

        const {
            newText,
            newSelectionStart,
            newSelectionEnd,
        } = indentSelectedLines({
            text: test.given,
            selectionStart,
            selectionEnd,
            tabCharacter,
            outdent: test.outdent,
        });

        const newFromKeyword = test.expectSelection
            ? test.expectSelection.from
            : from;

        const newToKeyword = test.expectSelection
            ? test.expectSelection.to
            : to;

        const accurateSelectionStart = newText.indexOf(newFromKeyword);

        const accurateSelectionEnd =
            newText.indexOf(newToKeyword) + newToKeyword.length;

        expect(newText).toBe(test.expect);
        expect(newSelectionStart).toBe(accurateSelectionStart);
        expect(newSelectionEnd).toBe(accurateSelectionEnd);
    });
});
