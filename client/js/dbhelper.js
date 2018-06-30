import idb from 'idb';

const dbPromise = idb.open('restaurant-review', 1, upgradeDb => {
  var store = upgradeDb.createObjectStore('restaurants', {
    keyPath: 'id'
  })
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
    return `http://localhost:${port}/restaurants`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants() {
    return fetch(DBHelper.DATABASE_URL)
      .then(response => response.json());
  }

  /**
   * If relevant data exits at IndexDb, server from there
   * else fetch from API
   * 
   */
  static fetchOrServeFromIdb () {
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
  static putRestaurants (restaurants) {
    dbPromise.then(db => {
      if(!db) return;

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
  static getRestaurants () {
    return dbPromise.then(db => {
      if(!db) return;

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
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

}

export default DBHelper;