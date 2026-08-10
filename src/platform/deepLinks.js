import { isDesktopRuntime } from './runtime';

export const DAILY_PLANNER_DEEP_LINK_EVENT = 'daily-planner:deep-link-received';

export const parseDailyPlannerDeepLink = value => {
    try {
        const url = new URL(value);
        const pathParts = url.pathname.split('/').filter(Boolean);
        const hostParts = url.host ? [url.host] : [];
        const parts = hostParts.concat(pathParts);

        if (parts[0] === 'auth' && parts[1] === 'callback') {
            return { type: 'auth', url };
        }

        if (parts[0] === 'share' && parts[1]) {
            return { listId: decodeURIComponent(parts[1]), type: 'share', url };
        }
    } catch {
        return null;
    }

    return null;
};

export const dispatchDailyPlannerDeepLink = value => {
    window.dispatchEvent(
        new CustomEvent(DAILY_PLANNER_DEEP_LINK_EVENT, { detail: value })
    );
};

export const subscribeToDailyPlannerDeepLinks = callback => {
    if (typeof window === 'undefined') {
        return () => {};
    }

    const onCustomEvent = event => callback(event.detail);
    window.addEventListener(DAILY_PLANNER_DEEP_LINK_EVENT, onCustomEvent);

    if (!isDesktopRuntime()) {
        return () =>
            window.removeEventListener(
                DAILY_PLANNER_DEEP_LINK_EVENT,
                onCustomEvent
            );
    }

    let disposed = false;
    let unlistenOpenUrl;
    let unlistenSingleInstance;

    void Promise.all([
        import('@tauri-apps/plugin-deep-link'),
        import('@tauri-apps/api/event'),
    ]).then(async ([deepLink, events]) => {
        const current = await deepLink.getCurrent();
        current?.forEach(value => callback(value));

        unlistenOpenUrl = await deepLink.onOpenUrl(urls => {
            urls.forEach(value => callback(value));
        });
        unlistenSingleInstance = await events.listen(
            'daily-planner://single-instance-deep-links',
            event => {
                const urls = Array.isArray(event.payload) ? event.payload : [];
                urls.forEach(value => callback(value));
            }
        );

        if (disposed) {
            unlistenOpenUrl?.();
            unlistenSingleInstance?.();
        }
    });

    return () => {
        disposed = true;
        unlistenOpenUrl?.();
        unlistenSingleInstance?.();
        window.removeEventListener(
            DAILY_PLANNER_DEEP_LINK_EVENT,
            onCustomEvent
        );
    };
};
