import getLineData from './getLineData';

const extendBulletedListAtCursor = ({
    text,
    selectionStart,
    selectionEnd,
    bulletCharacters = ['*', '•', '>', '-'],
}) => {
    const returnObj = {
        newText: text,
        newCursorPosition: selectionStart,
    };

    const { selectionData } = getLineData({
        text,
        selectionStart,
        selectionEnd,
    });

    const {
        allTextBeforeSelection,
        allTextAfterSelection,
        partialLineBeforeSelection,
    } = selectionData;

    const bulletMatcher = new RegExp(`^\\s*[${bulletCharacters.join('')}][ ]`);

    const lineStartsWithBullet = bulletMatcher.test(partialLineBeforeSelection);

    const charactersToInsert = lineStartsWithBullet
        ? partialLineBeforeSelection.match(bulletMatcher)[0]
        : '';

    returnObj.newText = `${allTextBeforeSelection}\n${charactersToInsert}${allTextAfterSelection}`;

    returnObj.newCursorPosition =
        selectionStart + charactersToInsert.length + 1;

    return returnObj;
};

export default extendBulletedListAtCursor;
