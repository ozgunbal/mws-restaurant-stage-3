import DBHelper from './dbhelper';

let restaurants,
  neighborhoods,
  cuisines
var map
var markers = []

/**
 * Fetch all neighborhoods and set their HTML.
 */
const fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods().then(neighborhoods => {
    self.neighborhoods = neighborhoods;
    fillNeighborhoodsHTML();
  }).catch(error => console.error(error));
}

/**
 * Renders DOM Element with given properties and attributes
 */
function renderElement({ type, props = {}, attributes = {}, children = [] }) {
  const element = document.createElement(type);
  Object.keys(props).forEach(key => element[key] = props[key]);
  Object.keys(attributes).forEach(key => element.setAttribute(key, attributes[key]));
  children.forEach(child => element.appendChild(child));
  return element;
}

/**
 * Set neighborhoods HTML.
 */
const fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = renderElement({
      type: 'option',
      props: {
        innerHTML: neighborhood,
        value: neighborhood
      },
      attributes: { role: 'option' }
    });
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
const fetchCuisines = () => {
  DBHelper.fetchCuisines().then(cuisines => {
    self.cuisines = cuisines;
    fillCuisinesHTML();
  }).catch(error => console.error(error));
}

/**
 * Set cuisines HTML.
 */
const fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = renderElement({
      type: 'option',
      props: {
        innerHTML: cuisine,
        value: cuisine
      },
      attributes: { role: 'option' }
    });
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  self.markers = [];
  updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
const updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood)
    .then(restaurants => {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }).catch(error => console.error(error));
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
const resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
const fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();

  const favButtons = document.querySelectorAll('.fav-btn');
  favButtons.forEach(favButton => {
    favButton.addEventListener('click', (event) => {
      const button = event.target;
      const { id, favourite } = event.target.dataset;
      DBHelper.favouriteRestaurant(id, favourite).then(choice => {
        button.innerHTML = choice ? 'Remove from Favourite' : 'Add to Favourite'
        button.dataset.favourite = choice;
      })
    })
  });
}

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = (restaurant) => {
  const li = renderElement({ type: 'li' });

  const favouriteSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" height="50" width="46">
      <polygon points="19.8, 2.2, 6.6, 43.56, 39.6, 17.16, 0, 17.16, 33, 43.56" style="fill-rule:nonzero;"/>
    </svg>`;

  const parser = new DOMParser();
  const favouriteButton = parser.parseFromString(favouriteSVG, "image/svg+xml").documentElement;
  console.log(favouriteButton);

  const itemChildren = [
    {
      type: 'img',
      props: {
        className: 'restaurant-img',
        src: DBHelper.imageUrlForRestaurant(restaurant),
        alt: DBHelper.imageAltTextForRestaurant(restaurant)
      }
    },
    
    {
      type: 'h2',
      props: { innerHTML: restaurant.name },
      attributes: { role: 'heading', tabIndex: 0 }
    },
    {
      type: 'div',
      attributes: { class: 'fav-btn', "data-id": restaurant.id, "data-favourite": restaurant.is_favorite },
      children: [favouriteButton]
    },
    {
      type: 'p',
      props: { innerHTML: restaurant.neighborhood }
    },
    {
      type: 'p',
      props: { innerHTML: restaurant.address }
    },
    {
      type: 'a',
      props: {
        innerHTML: 'View Details',
        href: DBHelper.urlForRestaurant(restaurant)
      }
    }
  ];

  itemChildren.forEach(child => {
    li.append(
      renderElement(child)
    )
  });

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}

/**
 * Register Service Worker
 */

const registerServiceWorker = () => {
  if (!navigator.serviceWorker) return;

  navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(function (reg) {
    console.log('Service worker registration succeeded');
  }).catch(function (error) {
    console.log('Service worker registration failed: ' + error);
  })
}

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  registerServiceWorker();
  fetchNeighborhoods();
  fetchCuisines();
  if (!navigator.onLine) updateRestaurants();
});