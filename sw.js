// ── ScoreKeeper Service Worker ────────────────────────────────
// À placer à la RACINE du dépôt GitHub (même niveau qu'index.html)

const APP_VERSION = 'V20260611 19H00';
const CACHE_NAME = `scorekeeper-${APP_VERSION}`;

// Ressources à mettre en cache lors de l'installation
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
];

// ── INSTALL : mise en cache des ressources essentielles ────────
self.addEventListener('install', event => {
  console.log('[SW] Installation...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Mise en cache des ressources');
      // On tente le cache de chaque ressource individuellement
      // pour éviter qu'une seule erreur bloque tout
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(url =>
          cache.add(url).catch(err =>
            console.warn('[SW] Impossible de mettre en cache :', url, err)
          )
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// ── ACTIVATE : nettoyage des anciens caches ────────────────────
self.addEventListener('activate', event => {
  console.log('[SW] Activation...');
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('[SW] Suppression ancien cache :', name);
            return caches.delete(name);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH : stratégie Cache First avec fallback réseau ─────────
self.addEventListener('fetch', event => {
  // On ignore les requêtes non-GET
  if (event.request.method !== 'GET') return;

  // On ignore les extensions Chrome et autres URL non-http
  const url = new URL(event.request.url);
  if (!url.protocol.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // Ressource trouvée en cache → on la retourne directement
      if (cachedResponse) {
        // En arrière-plan, on tente de mettre à jour le cache
        // (stale-while-revalidate pour les ressources réseau)
        if (url.hostname !== self.location.hostname) {
          fetch(event.request)
            .then(networkResponse => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then(cache =>
                  cache.put(event.request, networkResponse.clone())
                );
              }
            })
            .catch(() => {}); // silencieux si hors ligne
        }
        return cachedResponse;
      }

      // Pas en cache → on va chercher sur le réseau
      return fetch(event.request)
        .then(networkResponse => {
          // On ne met en cache que les réponses valides
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }

          // Mise en cache de la nouvelle ressource
          caches.open(CACHE_NAME).then(cache =>
            cache.put(event.request, networkResponse.clone())
          );

          return networkResponse;
        })
        .catch(() => {
          // Hors ligne et pas en cache : fallback sur index.html
          // (utile pour les navigations directes)
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
        });
    })
  );
});
