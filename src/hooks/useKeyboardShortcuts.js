import mapKeys from 'lodash/mapKeys';
import uniq from 'lodash/uniq';

const useKeyboardShortcuts = keyMap => {
    const onKeyDown = evt => {
        const keysPressed = [];

        if (evt.shiftKey) {
            keysPressed.push('shift');
        }

        if (evt.metaKey) {
            keysPressed.push('cmd');
        }

        keysPressed.push(evt.key.toLowerCase());

        const sortedKeysPressed = uniq(keysPressed).sort();

        mapKeys(keyMap, (handler, sequence) => {
            const sequenceArray = sequence
                .split('+')
                .map(key => key.trim())
                .sort();

            if (sortedKeysPressed.join('+') === sequenceArray.join('+')) {
                handler(evt);
            }
        });
    };

    return [onKeyDown];
};

export default useKeyboardShortcuts;
