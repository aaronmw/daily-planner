/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;
const appUrl = new URL(import.meta.env.BASE_URL, self.location.origin).href;

self.addEventListener('push', event => {
    event.waitUntil(
        self.registration.showNotification('Daily Planner update', {
            body: 'Open Daily Planner to view the encrypted update.',
            data: { url: appUrl },
        })
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        self.clients.matchAll({ type: 'window' }).then(clients => {
            const existing = clients.find(client => 'focus' in client);
            return existing?.focus() ?? self.clients.openWindow(appUrl);
        })
    );
});

export {};
