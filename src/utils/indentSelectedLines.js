import mapSelectedLines from './mapSelectedLines';

const indentSelectedLines = ({
    text,
    selectionStart,
    selectionEnd,
    tabCharacter = '  ',
    outdent = false,
}) => {
    const returnObj = {
        newText: text,
        newSelectionStart: selectionStart,
        newSelectionEnd: selectionEnd,
    };

    const firstTabCharacter = new RegExp(`^(${tabCharacter}){1}`);

    returnObj.newText = mapSelectedLines({
        text,
        selectionStart,
        selectionEnd,
        modifier: ({ index, line, selectionData }) => {
            if (outdent) {
                const canOutdentLine = firstTabCharacter.test(line);
                const hasTabBeforeCursor = firstTabCharacter.test(
                    selectionData.partialLineBeforeSelection
                );

                if (canOutdentLine) {
                    if (index === 0 && hasTabBeforeCursor) {
                        returnObj.newSelectionStart -= tabCharacter.length;
                    }

                    returnObj.newSelectionEnd -= tabCharacter.length;

                    return line.replace(firstTabCharacter, '');
                }

                return line;
            } else {
                if (index === 0) {
                    returnObj.newSelectionStart += tabCharacter.length;
                }

                returnObj.newSelectionEnd += tabCharacter.length;

                return `${tabCharacter}${line}`;
            }
        },
    });

    return returnObj;
};

export default indentSelectedLines;
