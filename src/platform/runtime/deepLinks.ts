import { listIdSchema, type ListId } from '../../core/domain/ids';
import { isDesktopRuntime } from './platformAdapter';

export type PlannerDeepLink =
    { type: 'auth'; url: URL } | { listId: ListId; type: 'share'; url: URL };

export const parsePlannerDeepLink = (value: string): PlannerDeepLink | null => {
    try {
        const url = new URL(value);
        const parts = [url.host, ...url.pathname.split('/')].filter(Boolean);
        if (parts[0] === 'auth' && parts[1] === 'callback') {
            return { type: 'auth', url };
        }
        if (parts[0] === 'share' && parts[1]) {
            const listId = listIdSchema.parse(decodeURIComponent(parts[1]));
            return { listId, type: 'share', url };
        }
        return null;
    } catch {
        return null;
    }
};

export const subscribeToPlannerDeepLinks = (
    callback: (value: string) => void
): (() => void) => {
    if (!isDesktopRuntime()) return () => undefined;
    let disposed = false;
    let unlistenOpenUrl: (() => void) | undefined;
    let unlistenSingleInstance: (() => void) | undefined;
    void Promise.all([
        import('@tauri-apps/plugin-deep-link'),
        import('@tauri-apps/api/event'),
    ]).then(async ([deepLink, events]) => {
        const current = await deepLink.getCurrent();
        current?.forEach(callback);
        unlistenOpenUrl = await deepLink.onOpenUrl(urls =>
            urls.forEach(callback)
        );
        unlistenSingleInstance = await events.listen(
            'daily-planner://single-instance-deep-links',
            event => {
                if (Array.isArray(event.payload)) {
                    event.payload.forEach(value => {
                        if (typeof value === 'string') callback(value);
                    });
                }
            }
        );
        if (disposed) {
            unlistenOpenUrl();
            unlistenSingleInstance();
        }
    });
    return () => {
        disposed = true;
        unlistenOpenUrl?.();
        unlistenSingleInstance?.();
    };
};
