import { useEffect, useState } from 'react';
import mapKeys from 'lodash/mapKeys';
import uniq from 'lodash/uniq';

const INPUT_TAG_NAMES = ['input', 'textarea'];

const isInput = node =>
    node.tagName &&
    INPUT_TAG_NAMES.map(tagName => tagName.toLowerCase()).includes(
        node.tagName.toLowerCase()
    );

const buildKeyboardShortcutHandler = (keyMap, scopedToElementRef) => evt => {
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

    const currentKeySequence = uniq(keysDown)
        .map(keyDown => keyDown.toLowerCase())
        .sort()
        .join('+');

    mapKeys(keyMap, (handler, sequence) => {
        const shortcutKeySequence = sequence
            .split('+')
            .map(key => key.trim().toLowerCase())
            .sort()
            .join('+');

        if (currentKeySequence === shortcutKeySequence) {
            const scopedElement = scopedToElementRef.current;
            const scopedToAnInput = scopedElement && isInput(scopedElement);
            const elementWithFocusIsAnInput = isInput(document.activeElement);

            if (scopedToAnInput) {
                evt.stopPropagation();
            }

            if (!scopedToAnInput && elementWithFocusIsAnInput) {
                return false;
            }

            return handler(evt);
        }
    });
};

const useGlobalKeyboardShortcuts = (
    keyMap,
    targetElementRef = { current: null }
) => {
    useEffect(() => {
        const onKeyDown = buildKeyboardShortcutHandler(
            keyMap,
            targetElementRef
        );

        document.addEventListener('keydown', onKeyDown);

        return () => document.removeEventListener('keydown', onKeyDown);
    }, [keyMap]);
};

export default useGlobalKeyboardShortcuts;
