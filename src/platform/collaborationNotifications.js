import { createPlannerId } from '../collaboration';
import { isDesktopRuntime } from './runtime';
import { getSupabaseConfiguration, requireSupabaseClient } from './supabase';

const PUSH_SUBSCRIPTION_KEY = 'daily-planner:push-subscription-id';

const base64UrlBytes = value => {
    const padding = '='.repeat((4 - (value.length % 4)) % 4);
    const decoded = atob(
        `${value}${padding}`.replace(/-/g, '+').replace(/_/g, '/')
    );
    return Uint8Array.from(decoded, character => character.charCodeAt(0));
};

const subscriptionKey = (subscription, name) => {
    const key = subscription.getKey(name);
    if (!key) throw new Error('The push subscription is incomplete.');
    let binary = '';
    for (const byte of new Uint8Array(key)) {
        binary += String.fromCharCode(byte);
    }
    return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '');
};

export const enableCollaborationNotifications = async () => {
    if (isDesktopRuntime()) {
        const notifications = await import('@tauri-apps/plugin-notification');
        const granted =
            (await notifications.isPermissionGranted()) ||
            (await notifications.requestPermission()) === 'granted';
        if (!granted) {
            throw new Error('Notification permission was not granted.');
        }
        return true;
    }

    if (
        !('serviceWorker' in navigator) ||
        !('PushManager' in window) ||
        !('Notification' in window)
    ) {
        throw new Error('This browser does not support notifications.');
    }
    const { vapidPublicKey } = getSupabaseConfiguration();
    if (!vapidPublicKey) {
        throw new Error('Push notifications are not configured.');
    }
    if ((await Notification.requestPermission()) !== 'granted') {
        throw new Error('Notification permission was not granted.');
    }
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    const subscription =
        (await registration.pushManager.getSubscription()) ||
        (await registration.pushManager.subscribe({
            applicationServerKey: base64UrlBytes(vapidPublicKey),
            userVisibleOnly: true,
        }));
    const subscriptionId =
        localStorage.getItem(PUSH_SUBSCRIPTION_KEY) || createPlannerId();
    const result = await requireSupabaseClient().rpc(
        'upsert_push_subscription',
        {
            p_auth: subscriptionKey(subscription, 'auth'),
            p_endpoint: subscription.endpoint,
            p_expiration_time: subscription.expirationTime
                ? new Date(subscription.expirationTime).toISOString()
                : null,
            p_p256dh: subscriptionKey(subscription, 'p256dh'),
            p_platform: 'web',
            p_subscription_id: subscriptionId,
        }
    );
    if (result.error) throw result.error;
    localStorage.setItem(PUSH_SUBSCRIPTION_KEY, subscriptionId);
    return true;
};

export const disableCollaborationNotifications = async () => {
    if (isDesktopRuntime()) return false;
    const registration = await navigator.serviceWorker?.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    await subscription?.unsubscribe();
    const subscriptionId = localStorage.getItem(PUSH_SUBSCRIPTION_KEY);
    if (subscriptionId) {
        const result = await requireSupabaseClient().rpc(
            'delete_push_subscription',
            { p_subscription_id: subscriptionId }
        );
        if (result.error && result.error.code !== 'P0002') throw result.error;
    }
    localStorage.removeItem(PUSH_SUBSCRIPTION_KEY);
    return false;
};

export const showGenericCollaborationNotification = async () => {
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
    const registration = await navigator.serviceWorker?.getRegistration();
    await registration?.showNotification(options.title, {
        body: options.body,
        data: { url: '/' },
    });
};
