// Service Worker para PWA - Fit Smart 360º
const CACHE_NAME = 'fit-smart-v5';
const urlsToCache = [
  '/',
  '/dashboard',
  '/manifest.json'
];

// ── Lembretes de hidratação ──────────────────────────────────────
let hydrationTimer = null;
let hydrationIntervalMs = 2 * 60 * 60 * 1000; // padrão: 2h

self.addEventListener('message', (event) => {
  const { type, intervalHours } = event.data || {};

  if (type === 'ENABLE_REMINDERS') {
    hydrationIntervalMs = (intervalHours || 2) * 60 * 60 * 1000;
    clearTimeout(hydrationTimer);
    scheduleHydration();
  } else if (type === 'DISABLE_REMINDERS') {
    clearTimeout(hydrationTimer);
    hydrationTimer = null;
  } else if (type === 'UPDATE_REMINDER_INTERVAL') {
    hydrationIntervalMs = (intervalHours || 2) * 60 * 60 * 1000;
    if (hydrationTimer !== null) {
      clearTimeout(hydrationTimer);
      scheduleHydration();
    }
  }
});

function scheduleHydration() {
  hydrationTimer = setTimeout(async () => {
    await self.registration.showNotification('💧 Hora de beber água!', {
      body: 'Mantenha-se hidratado para melhor desempenho no treino.',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'hydration',
      renotify: true,
      vibrate: [200, 100, 200],
    });
    scheduleHydration(); // agenda o próximo
  }, hydrationIntervalMs);
}

// Abre o app ao tocar na notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) return client.focus();
      }
      return clients.openWindow('/hidratacao');
    })
  );
});

// ── Cache / instalação ───────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) return caches.delete(name);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response;
      const fetchRequest = event.request.clone();
      return fetch(fetchRequest).then((res) => {
        if (!res || res.status !== 200 || res.type !== 'basic') return res;
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        return res;
      });
    })
  );
});
