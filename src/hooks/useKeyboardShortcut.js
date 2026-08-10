import { useEffect } from 'react';
import uniq from 'lodash/uniq';
import isInput from '../utils/isInput';

const keyboardShortcutHandlers = {};
const DEFAULT_SCOPING_ELEMENT_REF = {};

const standardizeSequence = sequence =>
    String(sequence)
        .toLowerCase()
        .replaceAll(' ', '')
        .split('+')
        .sort()
        .join('+');

const buildKeySequenceFromEvent = evt => {
    const keysDown = [];

    if (evt.ctrlKey) {
        keysDown.push('control');
    }

    if (evt.shiftKey) {
        keysDown.push('shift');
    }

    if (evt.metaKey) {
        keysDown.push('cmd');
    }

    keysDown.push(evt.key);

    return standardizeSequence(uniq(keysDown).join('+'));
};

const registerKeyboardShortcut = (namespace, sequence, handler) => {
    const tidiedSequence = standardizeSequence(sequence);

    if (keyboardShortcutHandlers[tidiedSequence] === undefined) {
        keyboardShortcutHandlers[tidiedSequence] = {};
    }

    keyboardShortcutHandlers[tidiedSequence][namespace] = handler;

    return () => {
        if (keyboardShortcutHandlers[tidiedSequence]?.[namespace] !== handler) {
            return;
        }

        delete keyboardShortcutHandlers[tidiedSequence][namespace];

        if (!Object.keys(keyboardShortcutHandlers[tidiedSequence]).length) {
            delete keyboardShortcutHandlers[tidiedSequence];
        }
    };
};

const handleAllKeyPresses = evt => {
    const currentSequence = buildKeySequenceFromEvent(evt);
    const handlers = keyboardShortcutHandlers[currentSequence] || {};

    Object.keys(handlers).forEach(namespace => {
        handlers[namespace](evt);
    });
};

const useKeyboardShortcut = (
    namespace,
    oneOrMoreSequences,
    handler,
    scopingElementRef = DEFAULT_SCOPING_ELEMENT_REF
) => {
    if (!namespace.length) {
        throw new Error(
            'A namespace must be provided to register keyboard shortcuts'
        );
    }

    useEffect(() => {
        const scopedHandler = scopingElementRef.current
            ? evt => {
                  if (document.activeElement === scopingElementRef.current) {
                      return handler(evt);
                  }
              }
            : evt => {
                  if (!isInput(evt.target)) {
                      return handler(evt);
                  }
              };

        const sequences = Array.isArray(oneOrMoreSequences)
            ? oneOrMoreSequences
            : [oneOrMoreSequences];
        const unregisterShortcuts = sequences.map(sequence =>
            registerKeyboardShortcut(namespace, sequence, scopedHandler)
        );

        document.addEventListener('keydown', handleAllKeyPresses);

        return () => {
            unregisterShortcuts.forEach(unregisterShortcut =>
                unregisterShortcut()
            );
            document.removeEventListener('keydown', handleAllKeyPresses);
        };
    }, [handler, namespace, oneOrMoreSequences, scopingElementRef]);
};

export default useKeyboardShortcut;
