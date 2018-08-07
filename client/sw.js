import DBHelper from './js/dbhelper';

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

self.addEventListener('sync', function (event) {
    if (event.tag === "reviews") {
        event.waitUntil(
            DBHelper.idBPendingStore('readonly').then(pendingStore =>
                pendingStore.getAll()
            ).then(reviews =>
                // send the reviews to the server
                Promise.all(reviews.map(review => (
                    fetch(`${DBHelper.DATABASE_URL}/reviews`, {
                        method: 'POST',
                        body: JSON.stringify(review),
                        headers: {
                            'Accept': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                            'Content-Type': 'application/json'
                        }
                    }).then(resp => resp.json())
                    .then(sentReview => {
                        // Delete pending reviews
                        DBHelper.idBPendingStore('readwrite').then(pendingStore => 
                            pendingStore.delete(sentReview.id)
                        )
                        // Put reviews into their store sync with the serverDB
                        DBHelper.idBReviewStore('readwrite').then(reviewStore =>
                            reviewStore.put(sentReview)
                        )
                    })
                ))
                ).catch(err => console.error(err))
            )
        )
    }
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
