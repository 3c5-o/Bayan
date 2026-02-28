importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

// إعدادات مشروعك بفايربيس
firebase.initializeApp({
  apiKey: "AIzaSyDGMQ3EE9gkdWgsRj3pmzUe6NXUezUuTuE",
  authDomain: "bayan-app-9fd42.firebaseapp.com",
  projectId: "bayan-app-9fd42",
  storageBucket: "bayan-app-9fd42.firebasestorage.app",
  messagingSenderId: "540422084494",
  appId: "1:540422084494:web:a2f344a79e66da4406f6df"
});

const messaging = firebase.messaging();

// استلام الإشعارات والتطبيق بالخلفية أو مغلق
messaging.onBackgroundMessage((payload) => {
  console.log('رسالة بالخلفية: ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: './icon.png',
    badge: './icon.png',
    dir: 'rtl'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// --- بقية كود الحارس لتشغيل التطبيق أوفلاين ---
const CACHE_VERSION = 'bayan-v1.7'; // حدثنا الإصدار حتى يسحب ملف index.html الكامل الجديد
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;

const STATIC_FILES = [
    './',
    './index.html',
    './manifest.json',
    './icon.png'
];

self.addEventListener('install', (event) => {
    self.skipWaiting(); 
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

    // استثناء ملفات الصوت وقاعدة بيانات فايربيس من التخزين حتى لا تصير مشاكل
    if (url.includes('.mp3') || url.includes('mp3quran.net') || url.includes('actions.google.com/sounds') || url.includes('firestore.googleapis.com')) {
        event.respondWith(fetch(event.request));
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse; 
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
                if (event.request.mode === 'navigate' || event.request.headers.get('accept').includes('text/html')) {
                    return caches.match('./index.html');
                }
            });
        })
    );
});
