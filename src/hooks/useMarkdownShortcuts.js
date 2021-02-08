import wrapSelectedText from '../utils/wrapSelectedText';
import useKeyboardShortcut from './useKeyboardShortcut';
import isInput from '../utils/isInput';
import triggerInputChange from '../utils/triggerInputChange';

const KEY_MAP = {
    '(': {
        otherKeys: ['shift'],
        insertBefore: '(',
        insertAfter: ')',
    },
    '[': {
        otherKeys: [],
        insertBefore: '[',
        insertAfter: ']',
    },
    '`': {
        otherKeys: [],
        insertBefore: '`',
        insertAfter: '`',
    },
    '~': {
        otherKeys: ['shift'],
        insertBefore: '```\n',
        insertAfter: '\n```',
    },
    "'": {
        otherKeys: [],
        insertBefore: "'",
        insertAfter: "'",
    },
    '"': {
        otherKeys: ['shift'],
        insertBefore: '"',
        insertAfter: '"',
    },
    '>': {
        otherKeys: ['shift'],
        insertBefore: '> ',
        insertAfter: '',
    },
    'b': {
        otherKeys: ['cmd'],
        insertBefore: '**',
        insertAfter: '**',
        wrapAtAnyCursorLocation: true,
    },
    'i': {
        otherKeys: ['cmd'],
        insertBefore: '_',
        insertAfter: '_',
        wrapAtAnyCursorLocation: true,
    },
    'x': {
        otherKeys: ['shift'],
        insertBefore: '~',
        insertAfter: '~',
        wrapAtAnyCursorLocation: true,
    },
};

const sequencesFromKeyMap = Object.keys(KEY_MAP).map(keyName =>
    KEY_MAP[keyName].otherKeys.concat(keyName).join(' + ')
);

const keyboardShortcutNamespace = 'useMarkdownShortcuts';

const useMarkdownShortcuts = elementRef => {
    useKeyboardShortcut(
        keyboardShortcutNamespace,
        sequencesFromKeyMap,
        evt => {
            const targetElement = evt.target;

            if (!isInput(evt.target)) {
                return true;
            }

            const keyMap = KEY_MAP[evt.key.toLowerCase()];

            const { selectionStart, selectionEnd } = targetElement;

            const {
                insertBefore,
                insertAfter,
                mustHaveSelection,
                wrapAtAnyCursorLocation,
            } = keyMap;

            const text = targetElement.value;

            const {
                newText,
                newSelectionStart,
                newSelectionEnd,
            } = wrapSelectedText({
                insertAfter,
                insertBefore,
                mustHaveSelection,
                selectionEnd,
                selectionStart,
                text,
                wrapAtAnyCursorLocation,
            });

            if (newText !== text) {
                evt.preventDefault();

                triggerInputChange(targetElement, newText);
                targetElement.selectionStart = newSelectionStart;
                targetElement.selectionEnd = newSelectionEnd;
            }
        },
        elementRef
    );
};

export default useMarkdownShortcuts;
