const staticCacheName = "restaurant-v1";
const imageCache = "restaurant-images";
const allCaches = [staticCacheName, imageCache];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(staticCacheName).then((cache) => (
            cache.addAll([
                '/',
                '/restaurant.html',
                '/js/main.bundle.js',
                '/js/restaurant_info.bundle.js',
                '/css/mainStyles.min.css',
                '/css/restaurantStyles.min.css',
                '/manifest.json'
            ])
        )).catch(error => console.log(error))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter(cacheName => !allCaches.includes(cacheName))
                    .map(cacheName => caches.delete(cacheName))
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    var requestUrl = new URL(event.request.url);

    if (requestUrl.origin === location.origin) {
        if (requestUrl.pathname.startsWith('/img/')) {
            event.respondWith(serverFromCache(event.request, imageCache));
            return;
        }
        if (requestUrl.pathname.startsWith('/restaurant.html')) {
            event.respondWith(serverFromCache(event.request, staticCacheName, { ignoreSearch: true }));
            return;
        }
    }

    event.respondWith(
        caches.match(event.request).then(response => response || fetch(event.request))
    );
});

function serverFromCache(request, cacheName, matchOptions) {
    return caches.open(cacheName).then((cache) => 
        cache.match(request.url, matchOptions).then((response) => 
            response ? 
                response :
                fetch(request).then((networkResponse) => {
                    cache.put(request.url, networkResponse.clone());
                    return networkResponse;
                })
        )
    );
}
