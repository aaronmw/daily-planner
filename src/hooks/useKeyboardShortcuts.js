import { useEffect } from 'react';
import mapKeys from 'lodash/mapKeys';
import uniq from 'lodash/uniq';

const useKeyboardShortcuts = (keyMap, dependencies) => {
    useEffect(() => {
        const onKeyDown = evt => {
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
                    handler(evt);
                }
            });
        };

        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [dependencies, keyMap]);
};

export default useKeyboardShortcuts;
