import { useSyncExternalStore } from 'react';

const COLOR_SCHEME_QUERY = '(prefers-color-scheme: dark)';

const getColorSchemeSnapshot = () => {
    if (typeof window === 'undefined' || !window.matchMedia) {
        return 'DARK';
    }

    return window.matchMedia(COLOR_SCHEME_QUERY).matches ? 'DARK' : 'LIGHT';
};

const subscribeToColorScheme = callback => {
    if (typeof window === 'undefined' || !window.matchMedia) {
        return () => {};
    }

    const mediaQuery = window.matchMedia(COLOR_SCHEME_QUERY);
    mediaQuery.addEventListener('change', callback);

    return () => mediaQuery.removeEventListener('change', callback);
};

export default function useSystemThemeName() {
    return useSyncExternalStore(
        subscribeToColorScheme,
        getColorSchemeSnapshot,
        () => 'DARK'
    );
}
