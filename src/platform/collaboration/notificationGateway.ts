import { getEnvironment } from '../../config/environment';
import { isDesktopRuntime } from '../runtime/platformAdapter';
import { requireSupabaseClient } from './supabaseClient';

const SUBSCRIPTION_KEY = 'daily-planner:v5:push-subscription-id';

const base64UrlBytes = (value: string): Uint8Array<ArrayBuffer> => {
    const padding = '='.repeat((4 - (value.length % 4)) % 4);
    const decoded = atob(
        `${value}${padding}`.replace(/-/g, '+').replace(/_/g, '/')
    );
    return Uint8Array.from(decoded, character => character.charCodeAt(0));
};

const subscriptionKey = (
    subscription: PushSubscription,
    name: PushEncryptionKeyName
): string => {
    const key = subscription.getKey(name);
    if (!key) throw new Error('The push subscription is incomplete.');
    return btoa(String.fromCharCode(...new Uint8Array(key)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '');
};

export const enableNotifications = async (): Promise<void> => {
    if (isDesktopRuntime()) {
        const notifications = await import('@tauri-apps/plugin-notification');
        const granted =
            (await notifications.isPermissionGranted()) ||
            (await notifications.requestPermission()) === 'granted';
        if (!granted)
            throw new Error('Notification permission was not granted.');
        return;
    }
    if (
        !('serviceWorker' in navigator) ||
        !('PushManager' in window) ||
        !('Notification' in window)
    ) {
        throw new Error('This browser does not support notifications.');
    }
    const vapidKey = getEnvironment().VITE_VAPID_PUBLIC_KEY;
    if (!vapidKey) throw new Error('Push notifications are not configured.');
    if ((await Notification.requestPermission()) !== 'granted') {
        throw new Error('Notification permission was not granted.');
    }
    const registration = await navigator.serviceWorker.register(
        `${import.meta.env.BASE_URL}sw.js`
    );
    await navigator.serviceWorker.ready;
    const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
            applicationServerKey: base64UrlBytes(vapidKey),
            userVisibleOnly: true,
        }));
    const id = localStorage.getItem(SUBSCRIPTION_KEY) ?? crypto.randomUUID();
    const result = await requireSupabaseClient().rpc(
        'upsert_push_subscription',
        {
            p_auth: subscriptionKey(subscription, 'auth'),
            p_endpoint: subscription.endpoint,
            ...(subscription.expirationTime
                ? {
                      p_expiration_time: new Date(
                          subscription.expirationTime
                      ).toISOString(),
                  }
                : {}),
            p_p256dh: subscriptionKey(subscription, 'p256dh'),
            p_platform: 'web',
            p_subscription_id: id,
        }
    );
    if (result.error) throw result.error;
    localStorage.setItem(SUBSCRIPTION_KEY, id);
};

export const disableNotifications = async (): Promise<void> => {
    if (isDesktopRuntime()) return;
    if (!('serviceWorker' in navigator)) return;
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    await subscription?.unsubscribe();
    const id = localStorage.getItem(SUBSCRIPTION_KEY);
    if (id) {
        const result = await requireSupabaseClient().rpc(
            'delete_push_subscription',
            { p_subscription_id: id }
        );
        if (result.error && result.error.code !== 'P0002') throw result.error;
    }
    localStorage.removeItem(SUBSCRIPTION_KEY);
};

export const showGenericNotification = async (): Promise<void> => {
    const options = {
        body: 'Open Daily Planner to view the encrypted update.',
        title: 'Daily Planner update',
    };
    if (isDesktopRuntime()) {
        const { sendNotification } =
            await import('@tauri-apps/plugin-notification');
        sendNotification(options);
        return;
    }
    if (!('serviceWorker' in navigator)) return;
    const registration = await navigator.serviceWorker.getRegistration();
    await registration?.showNotification(options.title, {
        body: options.body,
        data: { url: '/' },
    });
};
