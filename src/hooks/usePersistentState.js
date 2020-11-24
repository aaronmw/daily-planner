import { useEffect, useState } from 'react';

export default (key, initialState) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [state, setState] = useState(initialState);

    useEffect(() => {
        if (!isLoaded) {
            const savedState = window.localStorage.getItem(key);
            setState(
                ![null, 'undefined'].includes(savedState)
                    ? JSON.parse(savedState)
                    : initialState
            );
            setIsLoaded(true);
        }
    }, [key, initialState, isLoaded]);

    useEffect(() => {
        if (isLoaded) {
            window.localStorage.setItem(key, JSON.stringify(state));
        }
    }, [isLoaded, key, state]);

    return [state, setState];
};
