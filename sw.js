const CACHE_VERSION = 'bayan-v1.2';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;

// 1. الملفات الأساسية اللي لازم تنحفظ أول ما يفتح التطبيق
const STATIC_FILES = [
    './',
    './index.html',
    './manifest.json',
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@400;600;700;800&display=swap'
];

// عند تثبيت التطبيق: تحميل الملفات الأساسية
self.addEventListener('install', (event) => {
    console.log('[حارس الخلفية] جاري تثبيت ملفات الواجهة الأساسية...');
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            return cache.addAll(STATIC_FILES);
        })
    );
    self.skipWaiting();
});

// عند التفعيل: تنظيف الذاكرة من أي تحديثات قديمة
self.addEventListener('activate', (event) => {
    console.log('[حارس الخلفية] تم التفعيل وتنظيف الملفات القديمة...');
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== STATIC_CACHE && key !== DYNAMIC_CACHE) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// عند طلب أي بيانات من التطبيق (العمل أوفلاين)
self.addEventListener('fetch', (event) => {
    const url = event.request.url;

    // استثناء الصوتيات من الحفظ التلقائي حتى لا تمتلىء ذاكرة الهاتف
    if (url.includes('.mp3') || url.includes('mp3quran.net')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // استراتيجية العمل: ابحث بالذاكرة، إذا ماكو جيب من النت واحفظ نسخة للمستقبل
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // إذا البيانات موجودة بالذاكرة (أوفلاين)، رجعها فوراً
            if (cachedResponse) {
                return cachedResponse;
            }

            // إذا ماكو، جيبها من الإنترنت
            return fetch(event.request).then((networkResponse) => {
                // التأكد إن الاستجابة صالحة قبل لا نحفظها
                if (!networkResponse || networkResponse.status !== 200 || (networkResponse.type !== 'basic' && networkResponse.type !== 'cors')) {
                    return networkResponse;
                }

                // ننسخ البيانات لأنها تنقري مرة وحدة فقط
                const responseToCache = networkResponse.clone();

                // حفظها بالكاش الديناميكي حتى تشتغل بدون نت المرة الجاية
                caches.open(DYNAMIC_CACHE).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return networkResponse;
            }).catch((error) => {
                console.log('[حارس الخلفية] لا يوجد اتصال بالإنترنت، والملف غير محفوظ سابقاً.', error);
                // هنا مستقبلاً نكدر نرجع واجهة صغيرة تكول "أنت غير متصل بالإنترنت"
            });
        })
    );
});
