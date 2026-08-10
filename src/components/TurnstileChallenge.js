import React, { useEffect, useRef } from 'react';

const TurnstileChallenge = ({ onChange, siteKey }) => {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!siteKey) {
            onChange(null);
            return undefined;
        }

        let cancelled = false;
        let widgetId = null;
        let retryTimer = null;

        const render = () => {
            if (cancelled || !containerRef.current) return;
            if (!window.turnstile) {
                retryTimer = window.setTimeout(render, 100);
                return;
            }
            widgetId = window.turnstile.render(containerRef.current, {
                'callback': token => onChange(token),
                'error-callback': () => onChange(null),
                'expired-callback': () => onChange(null),
                'sitekey': siteKey,
                'theme': 'auto',
            });
        };

        render();
        return () => {
            cancelled = true;
            if (retryTimer !== null) window.clearTimeout(retryTimer);
            if (widgetId !== null) window.turnstile?.remove(widgetId);
        };
    }, [onChange, siteKey]);

    return siteKey ? (
        <div className="planner-turnstile" ref={containerRef} />
    ) : null;
};

export default TurnstileChallenge;
