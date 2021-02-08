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
        linesBeforeSelection,
        partialLineBeforeSelection,
    } = selectionData;

    const bulletMatcher = new RegExp(`^\\s*[${bulletCharacters.join('')}][ ]`);

    const lineStartsWithBullet = bulletMatcher.test(partialLineBeforeSelection);

    const whiteSpaceAndBullet = lineStartsWithBullet
        ? partialLineBeforeSelection.match(bulletMatcher)[0]
        : null;

    const charactersToInsert = lineStartsWithBullet
        ? partialLineBeforeSelection.match(bulletMatcher)[0]
        : '';

    const lineIsEmptyListItem =
        partialLineBeforeSelection === whiteSpaceAndBullet &&
        (allTextAfterSelection === '' || allTextAfterSelection[0] === '\n');

    if (lineIsEmptyListItem) {
        returnObj.newText = `${linesBeforeSelection.join(
            '\n'
        )}\n\n${allTextAfterSelection}`;

        returnObj.newCursorPosition =
            selectionStart - partialLineBeforeSelection.length + 1;
    } else {
        returnObj.newText = `${allTextBeforeSelection}\n${charactersToInsert}${allTextAfterSelection}`;

        returnObj.newCursorPosition =
            selectionStart + charactersToInsert.length + 1;
    }

    return returnObj;
};

export default extendBulletedListAtCursor;
