const getLineData = ({ text, selectionStart, selectionEnd }) => {
    const lines = text.split('\n');
    const allTextBeforeSelection = text.substring(0, selectionStart);
    const allTextAfterSelection = text.substring(selectionEnd);
    const linesBeforeSelection =
        allTextBeforeSelection.indexOf('\n') !== -1
            ? allTextBeforeSelection.split('\n').slice(0, -1)
            : [];
    const linesAfterSelection =
        allTextAfterSelection.indexOf('\n') !== -1
            ? allTextAfterSelection.split('\n').slice(1)
            : [];
    const indexOfFirstSelectedLine = linesBeforeSelection.length
        ? linesBeforeSelection.join('\n').length + 1
        : 0;
    const relativeCursorPosition = selectionStart - indexOfFirstSelectedLine;
    const partialLineBeforeSelection = text.substring(
        indexOfFirstSelectedLine,
        indexOfFirstSelectedLine + relativeCursorPosition
    );
    const linesWithinSelection = lines.slice(
        linesBeforeSelection.length,
        lines.length - linesAfterSelection.length
    );
    const allTextWithinSelection = text.substring(selectionStart, selectionEnd);
    const lineData = [];

    lines.forEach((line, lineIndex) => {
        const indexOfFirstCharacter =
            lines.slice(0, lineIndex).join('\n').length +
            (lineIndex === 0 ? 0 : 1);

        lineData[lineIndex] = {
            line,
            indexOfFirstCharacter,
        };
    });

    const returnObj = {
        lines,
        lineData,
        selectionData: {
            allTextBeforeSelection,
            allTextAfterSelection,
            allTextWithinSelection,
            linesAfterSelection,
            linesBeforeSelection,
            linesWithinSelection,
            partialLineBeforeSelection,
            indexOfFirstSelectedLine,
            relativeCursorPosition,
        },
    };

    return returnObj;
};

export default getLineData;
