const CACHE_VERSION = 'bayan-v1.3'; // غيرنا الإصدار حتى نجبر التليفون يحدث
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;

// الملفات الأساسية للتشغيل بدون نت
const STATIC_FILES = [
    './',
    './index.html',
    './manifest.json',
    './icon.png',
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@400;600;700;800&display=swap'
];

self.addEventListener('install', (event) => {
    self.skipWaiting(); // إجبار الحارس الجديد على استلام المهمة فوراً
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            return cache.addAll(STATIC_FILES);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    // مسح أي ذاكرة قديمة
                    if (key !== STATIC_CACHE && key !== DYNAMIC_CACHE) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const url = event.request.url;

    // استثناء الصوتيات حتى لا تنترس ذاكرة التليفون
    if (url.includes('.mp3') || url.includes('mp3quran.net')) {
        event.respondWith(fetch(event.request));
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse; // إذا موجودة بالذاكرة (أوفلاين) رجعها
            }

            return fetch(event.request).then((networkResponse) => {
                if (!networkResponse || networkResponse.status !== 200 || (networkResponse.type !== 'basic' && networkResponse.type !== 'cors')) {
                    return networkResponse;
                }
                const responseToCache = networkResponse.clone();
                caches.open(DYNAMIC_CACHE).then((cache) => {
                    cache.put(event.request, responseToCache);
                });
                return networkResponse;
            }).catch(() => {
                // السحر هنا: إذا فصل النت وطلب الصفحة الرئيسية، رجع الـ index من الذاكرة
                if (event.request.mode === 'navigate' || event.request.headers.get('accept').includes('text/html')) {
                    return caches.match('./index.html');
                }
            });
        })
    );
});
