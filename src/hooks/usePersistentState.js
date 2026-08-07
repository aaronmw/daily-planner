import { useEffect, useState } from 'react';

const PERSISTENCE_NAMESPACE = 'daily-planner:v2';
const getPersistentStorageKey = key => `${PERSISTENCE_NAMESPACE}:${key}`;
const identity = value => value;

export default (key, initialState, normalizeLoadedState = identity) => {
    const storageKey = getPersistentStorageKey(key);
    const [isLoaded, setIsLoaded] = useState(false);
    const [state, setState] = useState(initialState);

    useEffect(() => {
        if (!isLoaded) {
            const savedState = window.localStorage.getItem(storageKey);
            setState(
                normalizeLoadedState(
                    ![null, 'undefined'].includes(savedState)
                        ? JSON.parse(savedState)
                        : initialState
                )
            );
            setIsLoaded(true);
        }
    }, [initialState, isLoaded, normalizeLoadedState, storageKey]);

    useEffect(() => {
        if (isLoaded) {
            window.localStorage.setItem(storageKey, JSON.stringify(state));
        }
    }, [isLoaded, state, storageKey]);

    return [state, setState];
};

export { getPersistentStorageKey, PERSISTENCE_NAMESPACE };
