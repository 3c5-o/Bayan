const CACHE_VERSION = 'bayan-v1.8';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;

const STATIC_FILES = ['./', './index.html', './manifest.json', './icon.png'];

self.addEventListener('install', (event) => {
    self.skipWaiting(); 
    event.waitUntil(caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_FILES)));
});

self.addEventListener('activate', (event) => {
    event.waitUntil(caches.keys().then(keys => Promise.all(keys.map(key => { if (key !== STATIC_CACHE && key !== DYNAMIC_CACHE) return caches.delete(key); }))));
    return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const url = event.request.url;
    if (url.includes('.mp3') || url.includes('mp3quran.net') || url.includes('actions.google.com/sounds')) {
        event.respondWith(fetch(event.request)); return;
    }
    event.respondWith(caches.match(event.request).then(cachedRes => {
        if (cachedRes) return cachedRes; 
        return fetch(event.request).then(netRes => {
            if (!netRes || netRes.status !== 200 || (netRes.type !== 'basic' && netRes.type !== 'cors')) return netRes;
            const resClone = netRes.clone();
            caches.open(DYNAMIC_CACHE).then(cache => cache.put(event.request, resClone));
            return netRes;
        }).catch(() => { if (event.request.mode === 'navigate') return caches.match('./index.html'); });
    }));
});
