import getLineData from '../getLineData';

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
        selection: { from: 'The quick', to: 'casualties.' },
        it: 'Gets data for complete selection',
        expect: {
            selectionData: {
                allTextBeforeSelection: '',
                allTextAfterSelection: '',
                allTextWithinSelection: initialValue,
                linesBeforeSelection: [],
                linesAfterSelection: [],
                linesWithinSelection: initialValue.split('\n'),
                partialLineBeforeSelection: '',
                indexOfFirstSelectedLine: 0,
                relativeCursorPosition: 0,
            },
            lineData: {
                0: {
                    indexOfFirstCharacter: 0,
                },
            },
        },
    },
    {
        given: initialValue,
        selection: { from: 'jumped', to: 'were' },
        it: 'Gets data for partial multi-line selection',
        expect: {
            selectionData: {
                allTextBeforeSelection: 'The quick brown\nfox ',
                allTextAfterSelection: '\nno casualties.',
                allTextWithinSelection:
                    'jumped over\nthe lazy dog.\nThere were',
                linesBeforeSelection: ['The quick brown'],
                linesAfterSelection: ['no casualties.'],
                linesWithinSelection: [
                    'fox jumped over',
                    'the lazy dog.',
                    'There were',
                ],
                partialLineBeforeSelection: 'fox ',
                indexOfFirstSelectedLine: 16,
                relativeCursorPosition: 4,
            },
            lineData: {
                0: {
                    indexOfFirstCharacter: 0,
                },
            },
        },
    },
    {
        given: initialValue,
        selection: { from: '\n', to: 'brown\n' },
        it: 'Gets data for selection of a single newline character',
        expect: {
            selectionData: {
                allTextBeforeSelection: 'The quick brown',
                allTextAfterSelection:
                    'fox jumped over\nthe lazy dog.\nThere were\nno casualties.',
                allTextWithinSelection: '\n',
                linesBeforeSelection: [],
                linesAfterSelection: [
                    'the lazy dog.',
                    'There were',
                    'no casualties.',
                ],
                partialLineBeforeSelection: 'The quick brown',
                indexOfFirstSelectedLine: 0,
                relativeCursorPosition: 15,
            },
            lineData: {
                0: {
                    indexOfFirstCharacter: 0,
                },
            },
        },
    },
];

tests.forEach(test => {
    it(test.it, () => {
        const { lines, lineData, selectionData } = getLineData({
            text: test.given,
            selectionStart: test.given.indexOf(test.selection.from),
            selectionEnd:
                test.given.indexOf(test.selection.to) +
                test.selection.to.length,
        });

        Object.keys(test.expect.lineData).forEach(expectedLineIndex => {
            Object.keys(test.expect.lineData[expectedLineIndex]).forEach(
                expectedLineProperty => {
                    expect(
                        lineData[expectedLineIndex][expectedLineProperty]
                    ).toBe(
                        test.expect.lineData[expectedLineIndex][
                            expectedLineProperty
                        ]
                    );
                }
            );
        });

        Object.keys(test.expect.selectionData).forEach(
            expectedSelectionProperty => {
                expect(selectionData[expectedSelectionProperty]).toStrictEqual(
                    test.expect.selectionData[expectedSelectionProperty]
                );
            }
        );
    });
});
