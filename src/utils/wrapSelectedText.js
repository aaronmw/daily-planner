import getLineData from './getLineData';

const wrapSelectedText = ({
    insertAfter = '',
    insertBefore = '',
    mustHaveSelection = false,
    selectionEnd,
    selectionStart,
    text,
    wrapAtAnyCursorLocation = false,
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

    const hasSelectedText = selectionStart !== selectionEnd;

    if (mustHaveSelection && !hasSelectedText) {
        return returnObj;
    }

    const {
        allTextBeforeSelection,
        allTextAfterSelection,
        allTextWithinSelection,
    } = selectionData;

    const somethingRightOfCursor = /^\S/.test(allTextAfterSelection);

    const somethingLeftOfCursor = /\S$/.test(allTextBeforeSelection);

    if (
        !wrapAtAnyCursorLocation &&
        !hasSelectedText &&
        (somethingLeftOfCursor || somethingRightOfCursor)
    ) {
        return returnObj;
    } else {
        returnObj.newText = [
            allTextBeforeSelection,
            insertBefore,
            allTextWithinSelection,
            insertAfter,
            allTextAfterSelection,
        ].join('');

        returnObj.newSelectionStart += insertBefore.length;
        returnObj.newSelectionEnd += insertBefore.length;
    }

    return returnObj;
};

export default wrapSelectedText;
