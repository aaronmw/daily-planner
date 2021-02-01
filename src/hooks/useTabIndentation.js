import useKeyboardShortcut from './useKeyboardShortcut';
import indentSelectedLines from '../utils/indentSelectedLines';
import isInput from '../utils/isInput';
import triggerInputChange from '../utils/triggerInputChange';

const keyboardShortcutNamespace = 'useTabIndentation';

const useTabIndentation = (elementRef, tabCharacter = '  ') => {
    useKeyboardShortcut(
        keyboardShortcutNamespace,
        ['tab', 'shift + tab'],
        evt => {
            const targetElement = evt.target;

            if (!isInput(evt.target)) {
                return true;
            }

            evt.preventDefault();

            const {
                newText,
                newSelectionStart,
                newSelectionEnd,
            } = indentSelectedLines({
                text: targetElement.value,
                selectionStart: targetElement.selectionStart,
                selectionEnd: targetElement.selectionEnd,
                tabCharacter,
                outdent: evt.shiftKey,
            });

            triggerInputChange(targetElement, newText);
            targetElement.selectionStart = newSelectionStart;
            targetElement.selectionEnd = newSelectionEnd;
        },
        elementRef
    );
};

export default useTabIndentation;
