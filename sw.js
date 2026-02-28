const CACHE_NAME = 'bayan-app-v1.1';

// عند تثبيت التطبيق
self.addEventListener('install', (event) => {
    console.log('[Service Worker] تم التثبيت بنجاح');
    self.skipWaiting();
});

// عند تفعيل التطبيق
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] تم التفعيل');
    return self.clients.claim();
});

// عند طلب أي بيانات (حاليا نمررها للنت طبيعي، وبالتحديثات الجاية نضيف الأوفلاين)
self.addEventListener('fetch', (event) => {
    event.respondWith(fetch(event.request));
});
