self.addEventListener('push', event => {
    event.waitUntil(
        self.registration.showNotification('Daily Planner update', {
            body: 'Open Daily Planner to view the encrypted update.',
            data: { url: '/' },
        })
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        self.clients.matchAll({ type: 'window' }).then(clients => {
            const existing = clients.find(client => 'focus' in client);
            return existing ? existing.focus() : self.clients.openWindow('/');
        })
    );
});
