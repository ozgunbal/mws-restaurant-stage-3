import idb from 'idb';

export const dbPromise = idb.open('restaurant-review', 1, upgradeDb => {
  var store = upgradeDb.createObjectStore('restaurants', {
    keyPath: 'id'
  })
  var reviewStore = upgradeDb.createObjectStore('reviews', { keyPath: 'id' });
  var pendingStore = upgradeDb.createObjectStore('pending', { keyPath: 'id' });
});

/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants() {
    return fetch(`${DBHelper.DATABASE_URL}/restaurants`)
      .then(response => response.json());
  }

  /**
   * If relevant data exits at IndexDb, server from there
   * else fetch from API
   * 
   */
  static fetchOrServeFromIdb() {
    return DBHelper.getRestaurants().then(restaurants => {
      if (restaurants.length > 0) {
        return restaurants;
      } else {
        return DBHelper.fetchRestaurants().then(restaurants => {
          DBHelper.putRestaurants(restaurants);
          return restaurants;
        })
      }
    })
  }

  /**
   * Writes given restaurants data to IndexDb
   * @param {Object[]} restaurants 
   */
  static putRestaurants(restaurants) {
    dbPromise.then(db => {
      if (!db) return;

      const tx = db.transaction('restaurants', 'readwrite');
      const store = tx.objectStore('restaurants');
      restaurants.forEach(restaurant => {
        store.put(restaurant);
      });
    })
  }

  /**
   * Get restaurants data from IndexDb
   */
  static getRestaurants() {
    return dbPromise.then(db => {
      if (!db) return;

      return db.transaction('restaurants')
        .objectStore('restaurants').getAll();
    })
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id) {
    // fetch all restaurants with proper error handling.
    return DBHelper.fetchOrServeFromIdb().then(restaurants => {
      const restaurant = restaurants.find(r => r.id == id);
      return restaurant ? restaurant : 'Restaurant does not exist';
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine) {
    return DBHelper.fetchOrServeFromIdb().then(restaurants =>
      restaurants.filter(r => r.cuisine_type == cuisine)
    );
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood) {
    return DBHelper.fetchOrServeFromIdb().then(restaurants =>
      restaurants.filter(r => r.neighborhood == neighborhood)
    );
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood) {
    return DBHelper.fetchOrServeFromIdb().then(restaurants => {
      let results = restaurants
      if (cuisine != 'all') { // filter by cuisine
        results = results.filter(r => r.cuisine_type == cuisine);
      }
      if (neighborhood != 'all') { // filter by neighborhood
        results = results.filter(r => r.neighborhood == neighborhood);
      }
      return results;
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods() {
    return DBHelper.fetchOrServeFromIdb().then(restaurants => {
      // Get all neighborhoods from all restaurants
      const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
      // Remove duplicates from neighborhoods
      const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
      return uniqueNeighborhoods;
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines() {
    return DBHelper.fetchOrServeFromIdb().then(restaurants => {
      // Get all cuisines from all restaurants
      const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
      // Remove duplicates from cuisines
      const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
      return uniqueCuisines;
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph || restaurant.id}.jpg`);
  }

  /**
   * Restaurant alternative text of image
   */
  static imageAltTextForRestaurant(restaurant) {
    return restaurant.alternateText;
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP
    }
    );
    return marker;
  }

  /**
   * Gets reviews from IndexDb by restaurant id
   * @param {number} id
   */
  static getReviewsByRestaurandId(id) {
    const reviewsFromIdb = dbPromise.then(db => {
      if (!db) return;

      return db.transaction('reviews')
        .objectStore('reviews').getAll().then(reviews =>
          reviews.filter(review => review.restaurant_id == id)
        );
    });

    const pendingReviews = DBHelper.idBPendingStore('readonly').then(pendingStore =>
      pendingStore.getAll().then(reviews =>
        reviews.filter(review => review.restaurant_id == id)
      )
    );

    return Promise.all([reviewsFromIdb,pendingReviews]).then(reviews => 
      [].concat.apply(...reviews)
    );
  }

  /**
   * Fetch reviews for restaurant with given id
   * @param {number} id 
   */
  static fetchReviewsByRestaurantId(id) {
    return fetch(`${DBHelper.DATABASE_URL}/reviews/?restaurant_id=${id}`)
      .then(response => response.json());
  }

  /**
   * If relevant data exits at IndexDb, server from there
   * else fetch from API
   * @param {number} id 
   */
  static fetchOrServeReviewsByRestaurantIdFromIdb(id) {
    return DBHelper.getReviewsByRestaurandId(id).then(reviews => {
      if (reviews.length > 0) {
        return reviews;
      } else {
        return DBHelper.fetchReviewsByRestaurantId(id).then(reviews => {
          DBHelper.putReviews(reviews);
          return reviews;
        })
      }
    })
  }

  /**
  * Puts given review data to IndexDb
  * @param {Object[]} reviews 
  */
  static putReviews(reviews) {
    dbPromise.then(db => {
      if (!db) return;

      const tx = db.transaction('reviews', 'readwrite');
      const store = tx.objectStore('reviews');
      reviews.forEach(review => {
        store.put(review);
      });
    })
  }

  static favouriteRestaurant(restaurantId, isFavourite) {
    const choice = isFavourite == "true";
    return fetch(`${DBHelper.DATABASE_URL}/restaurants/${restaurantId}/?is_favorite=${!choice}`, {
      method: 'PUT'
    }).then((res) => res.json()).then(restaurant => restaurant.is_favorite == "true");
  }

  static addNewReview(reviewData) {
    return navigator.serviceWorker.ready.then(reg => {
      if ('sync' in reg) {
        DBHelper.idBPendingStore('readwrite').then(reviewStore => reviewStore.put(reviewData))
          .then(() => {
            reg.sync.register('reviews');
          }).catch(err => {
            console.error(err);
            fetch(`${DBHelper.DATABASE_URL}/reviews`, { method: 'POST', body: JSON.stringify(reviewData) })
              .then(res => res.json());
          })
      }
    });
  }

  static idBReviewStore(mode) {
    return dbPromise.then(db => {
      if (!db) return Promise.reject();

      const tx = db.transaction('reviews', mode);
      const store = tx.objectStore('reviews');
      return store;
    });
  }

  static idBPendingStore(mode) {
    return dbPromise.then(db => {
      if (!db) return Promise.reject();

      const tx = db.transaction('pending', mode);
      const store = tx.objectStore('pending');
      return store;
    });
  }

  static getId () {
    // This can change to uuid
    // Numbers given between 1000 and 2000
    return 1000 + Math.floor(Math.random() * 100);
  }
}

export default DBHelper;