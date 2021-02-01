import useKeyboardShortcut from './useKeyboardShortcut';
import extendBulletedListAtCursor from '../utils/extendBulletedLinesAtCursor';
import triggerInputChange from '../utils/triggerInputChange';
import isInput from '../utils/isInput';

const keyboardShortcutNamespace = 'useBulletedLists';

const useBulletedLists = (
    elementRef,
    bulletCharacters = ['*', '•', '>', '-']
) => {
    useKeyboardShortcut(
        keyboardShortcutNamespace,
        ['enter'],
        evt => {
            const targetElement = evt.target;

            if (!isInput(evt.target)) {
                return true;
            }

            evt.preventDefault();

            const { newText, newCursorPosition } = extendBulletedListAtCursor({
                text: targetElement.value,
                selectionStart: targetElement.selectionStart,
                selectionEnd: targetElement.selectionEnd,
                bulletCharacters,
            });

            triggerInputChange(targetElement, newText);
            targetElement.selectionStart = newCursorPosition;
            targetElement.selectionEnd = newCursorPosition;
        },
        elementRef
    );
};

export default useBulletedLists;
