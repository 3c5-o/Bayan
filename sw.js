const CACHE_NAME = 'bayan-cache-v2.0.0';

// الملفات الأساسية اللي لازم تنحفظ بالجهاز حتى يشتغل أوفلاين
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json'
];

// 1. حدث التثبيت (Install): حفظ الملفات الأساسية
self.addEventListener('install', (event) => {
    self.skipWaiting(); // تفعيل التحديث فوراً بدون انتظار
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('تم فتح الكاش وتخزين الملفات');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// 2. حدث التفعيل (Activate): مسح الكاش القديم (مهم جداً حتى يظهر التحديث الجديد)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('تم مسح الكاش القديم:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim(); // السيطرة على كل الصفحات المفتوحة فوراً
});

// 3. حدث جلب البيانات (Fetch): استراتيجية (Stale-While-Revalidate) الذكية
self.addEventListener('fetch', (event) => {
    // نتجاهل طلبات غير الـ GET (مثل POST)
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // جلب البيانات من الإنترنت لتحديث الكاش بالخلفية
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                // نخزن بس الملفات المحلية الصحيحة (نتجاهل الـ APIs الخارجية حتى ما يمتلئ الجهاز)
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // إذا ماكو إنترنت، ما نسوي شي لأن راح نرجع النسخة المخبأة (cachedResponse)
                console.log('أنت الآن في وضع عدم الاتصال (Offline Mode)');
            });

            // نرجع النسخة المخبأة فوراً (للسرعة)، وإذا ماكو ننتظر الـ fetch
            return cachedResponse || fetchPromise;
        })
    );
});
