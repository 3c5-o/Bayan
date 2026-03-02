const CACHE_NAME = 'bayan-cache-v2.0'; // تم التحديث إلى الإصدار 2.0

// الملفات الأساسية اللي لازم تنحفظ بالجهاز
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json'
];

// 1. حدث التثبيت (Install)
self.addEventListener('install', (event) => {
    self.skipWaiting(); // تفعيل التحديث فوراً
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('تم فتح الكاش وتخزين الملفات للإصدار 2.0');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// 2. حدث التفعيل (Activate): مسح الكاش القديم
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    // إذا اسم الكاش القديم يختلف عن الجديد، امسحه
                    if (cache !== CACHE_NAME) {
                        console.log('تم مسح الكاش القديم:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim(); // السيطرة على المتصفح فوراً
});

// 3. حدث جلب البيانات (Fetch)
self.addEventListener('fetch', (event) => {
    // نتجاهل طلبات غير الـ GET
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => {
                console.log('أنت الآن في وضع عدم الاتصال (Offline Mode)');
            });

            return cachedResponse || fetchPromise;
        })
    );
});
