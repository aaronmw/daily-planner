import getLineData from './getLineData';

const mapSelectedLines = ({ text, selectionStart, selectionEnd, modifier }) => {
    const { lineData, selectionData } = getLineData({
        text,
        selectionStart,
        selectionEnd,
    });

    const {
        linesAfterSelection,
        linesBeforeSelection,
        linesWithinSelection,
    } = selectionData;

    const modifiedSelectedLines = linesWithinSelection.map((line, index) => {
        return modifier({
            line,
            index,
            data: lineData[index],
            selectionData,
        });
    });

    return linesBeforeSelection
        .concat(modifiedSelectedLines, linesAfterSelection)
        .join('\n');
};

export default mapSelectedLines;
