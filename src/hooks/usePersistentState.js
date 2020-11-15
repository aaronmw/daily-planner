import { useEffect, useState } from 'react';

const usePersistentState = (key, initialState) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [state, setState] = useState(initialState);

    useEffect(() => {
        if (!isLoaded) {
            const savedState = window.localStorage.getItem(key);
            setState(JSON.parse(savedState) || initialState);
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

export default usePersistentState;
