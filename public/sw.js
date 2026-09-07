/**
 * Service worker — cache d'assets pour un démarrage instantané et un mode dégradé hors ligne.
 *
 * Stratégie volontairement conservatrice, adaptée à un jeu dont l'état vit côté serveur :
 *  - les IMAGES, POLICES et SONS (les ~150 Mo de cartes, fonds et portraits) sont mis en cache
 *    à l'usage (`stale-while-revalidate`) : c'est là que se joue la fluidité perçue, un joueur
 *    qui revient ne re-télécharge pas les portraits de ses dieux ;
 *  - la NAVIGATION passe par le réseau d'abord, avec repli sur le cache puis sur une page hors
 *    ligne : jamais servir une page de jeu périmée alors que le réseau est disponible ;
 *  - tout ce qui touche à SUPABASE (auth, parties, profil) n'est JAMAIS mis en cache — servir
 *    un état de partie périmé casserait le multijoueur.
 */

const VERSION = 'gods-v1';
const STATIC_CACHE = `${VERSION}-static`;
const ASSET_CACHE = `${VERSION}-assets`;
const OFFLINE_URL = '/offline.html';

/** Le strict minimum pour afficher quelque chose sans réseau. */
const PRECACHE_URLS = [
    OFFLINE_URL,
    '/icons/icon-192.png',
    '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches
            .open(STATIC_CACHE)
            .then((cache) => cache.addAll(PRECACHE_URLS))
            // Un asset manquant ne doit pas empêcher l'installation du worker.
            .catch(() => undefined)
            .then(() => self.skipWaiting()),
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys
                        .filter((key) => !key.startsWith(VERSION))
                        .map((key) => caches.delete(key)),
                ),
            )
            .then(() => self.clients.claim()),
    );
});

/** Les assets lourds et immuables du jeu : images, polices, audio. */
function isCacheableAsset(request, url) {
    if (request.destination === 'image' || request.destination === 'font' || request.destination === 'audio') {
        return true;
    }
    return /\.(png|jpg|jpeg|webp|avif|svg|gif|woff2?|ttf|otf|mp3|ogg)$/i.test(url.pathname);
}

self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Le cache HTTP ne concerne que les GET ; le reste (POST vers les Edge Functions) passe droit.
    if (request.method !== 'GET') return;

    const url = new URL(request.url);

    // Jamais de cache pour l'API Supabase : auth, état de partie, profil doivent être frais.
    if (url.hostname.endsWith('.supabase.co') || url.pathname.startsWith('/api/')) return;

    // Ressources tierces (Google Fonts...) : on laisse le navigateur gérer.
    if (url.origin !== self.location.origin) return;

    // Navigation : réseau d'abord, cache en secours, page hors ligne en dernier recours.
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const copy = response.clone();
                    caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy)).catch(() => undefined);
                    return response;
                })
                .catch(async () => (await caches.match(request)) || (await caches.match(OFFLINE_URL)) || Response.error()),
        );
        return;
    }

    // Assets : on sert le cache immédiatement et on rafraîchit en tâche de fond.
    if (isCacheableAsset(request, url)) {
        event.respondWith(
            caches.open(ASSET_CACHE).then(async (cache) => {
                const cached = await cache.match(request);
                const network = fetch(request)
                    .then((response) => {
                        if (response.ok) cache.put(request, response.clone()).catch(() => undefined);
                        return response;
                    })
                    .catch(() => cached);

                return cached || network;
            }),
        );
    }
});

/** Permet à la page de forcer l'activation d'une nouvelle version sans attendre la fermeture des onglets. */
self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
