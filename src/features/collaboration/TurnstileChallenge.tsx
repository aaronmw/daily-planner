import { useEffect, useRef } from 'react';
import { getEnvironment } from '../../config/environment';

declare global {
    interface Window {
        turnstile?: {
            remove(widgetId: string): void;
            render(
                element: HTMLElement,
                options: {
                    'callback'(token: string): void;
                    'error-callback'(): void;
                    'sitekey': string;
                    'theme': 'auto';
                }
            ): string;
        };
    }
}

let scriptPromise: Promise<void> | null = null;

const loadTurnstile = (): Promise<void> => {
    if (window.turnstile) return Promise.resolve();
    scriptPromise ??= new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.async = true;
        script.defer = true;
        script.src =
            'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.addEventListener('load', () => resolve(), { once: true });
        script.addEventListener(
            'error',
            () => reject(new Error('Could not load security check.')),
            { once: true }
        );
        document.head.append(script);
    });
    return scriptPromise;
};

export function TurnstileChallenge({
    onError,
    onToken,
}: {
    onError: (message: string) => void;
    onToken: (token: string) => void;
}) {
    const elementRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        let widgetId: string | null = null;
        let cancelled = false;
        void loadTurnstile()
            .then(() => {
                if (cancelled || !elementRef.current || !window.turnstile)
                    return;
                widgetId = window.turnstile.render(elementRef.current, {
                    'callback': onToken,
                    'error-callback': () =>
                        onError('The security check failed.'),
                    'sitekey': getEnvironment().VITE_TURNSTILE_SITE_KEY,
                    'theme': 'auto',
                });
            })
            .catch(error =>
                onError(
                    error instanceof Error
                        ? error.message
                        : 'The security check failed.'
                )
            );
        return () => {
            cancelled = true;
            if (widgetId) window.turnstile?.remove(widgetId);
        };
    }, [onError, onToken]);
    return <div className="min-h-[65px]" ref={elementRef} />;
}
