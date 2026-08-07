import { useCallback, useState } from 'react';

const noop = () => {};

export default function useArmedAction({
    disabled = false,
    onConfirm = noop,
} = {}) {
    const [isArmed, setIsArmed] = useState(false);

    const disarm = useCallback(() => setIsArmed(false), []);
    const activate = useCallback(
        event => {
            event?.preventDefault();
            event?.stopPropagation();

            if (disabled) {
                return;
            }

            if (!isArmed) {
                setIsArmed(true);
                return;
            }

            setIsArmed(false);
            onConfirm();
        },
        [disabled, isArmed, onConfirm]
    );

    return {
        activate,
        disarm,
        isArmed,
    };
}
