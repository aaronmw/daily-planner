import getLineData from './getLineData';

const wrapSelectedText = ({
    text,
    selectionStart,
    selectionEnd,
    insertBefore = '',
    insertAfter = '',
}) => {
    const returnObj = {
        newText: text,
        newSelectionStart: selectionStart,
        newSelectionEnd: selectionEnd,
    };

    const { selectionData } = getLineData({
        text,
        selectionStart,
        selectionEnd,
    });

    const {
        allTextBeforeSelection,
        allTextAfterSelection,
        allTextWithinSelection,
    } = selectionData;

    returnObj.newText = [
        allTextBeforeSelection,
        insertBefore,
        allTextWithinSelection,
        insertAfter,
        allTextAfterSelection,
    ].join('');

    returnObj.newSelectionStart += insertBefore.length;
    returnObj.newSelectionEnd += insertBefore.length;

    return returnObj;
};

export default wrapSelectedText;
