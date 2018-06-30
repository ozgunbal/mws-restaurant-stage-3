import DBHelper from './dbhelper';

let restaurant;
var map;

/**
 * Loads the content when offline
 */
const offlineLoad = () => {
  if (!navigator.onLine) {
    fetchRestaurantFromURL((error, restaurant) => {
      if (error) { // Got an error!
        console.error(error);
      } else {
        fillBreadcrumb();
      }
    });
  }
}

/**
 * Renders DOM Element with given properties and attributes
 */
function renderElement({ type, props = {}, attributes = {} }) {
  const element = document.createElement(type);
  Object.keys(props).forEach(key => element[key] = props[key]);
  Object.keys(attributes).forEach(key => element.setAttribute(key, attributes[key]));
  return element;
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
const fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id).then(restaurant => {
      self.restaurant = restaurant;
      fillRestaurantHTML();
      callback(null, restaurant)
    }).catch(error => console.error(error));
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
const fillRestaurantHTML = (restaurant = self.restaurant) => {
  const mapElement = document.getElementById('map');
  mapElement.setAttribute('aria-label', `Restaurant ${restaurant.name} on the map`);
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = DBHelper.imageAltTextForRestaurant(restaurant);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
const fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = renderElement({ type: 'tr' })
    const day = renderElement({
      type: 'td',
      props: { innerHTML: key }
    });
    row.appendChild(day);

    const time = renderElement({
      type: 'td',
      props: { innerHTML: operatingHours[key] }
    });
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
const fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = renderElement({
    type: 'h3',
    props: {
      innerHTML: 'Reviews',
      tabIndex: 0,
      id: 'review-list-header'
    },
    attributes: { role: 'heading' }
  });
  container.appendChild(title);

  if (!reviews) {
    const noReviews = renderElement({
      type: 'p',
      props: { innerHTML: 'No reviews yet!' }
    });
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
const createReviewHTML = (review) => {
  const li = renderElement({
    type: 'li',
    attributes: { role: 'listitem' }
  });

  const reviewTop = renderElement({
    type: 'div',
    props: { className: 'reviewer-top' }
  });

  const reviewTopChildren = [
    {
      type: 'p',
      props: {
        innerHTML: review.name,
        className: 'reviewer-name'
      }
    },
    {
      type: 'p',
      props: {
        innerHTML: review.date,
        className: 'reviewer-date'
      }
    }
  ];

  reviewTopChildren.forEach(child => {
    reviewTop.appendChild(
      renderElement(child)
    )
  });

  const reviewBottom = renderElement({
    type: 'div',
    props: { className: 'reviewer-bottom' }
  });

  const reviewBottomChildren = [
    {
      type: 'p',
      props: {
        innerHTML: `Rating: ${review.rating}`,
        className: 'reviewer-rating'
      }
    },
    {
      type: 'p',
      props: { innerHTML: review.comments }
    }
  ];

  reviewBottomChildren.forEach(child => {
    reviewBottom.appendChild(
      renderElement(child)
    )
  });

  li.appendChild(reviewTop);
  li.appendChild(reviewBottom);  

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
const fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.querySelector('#breadcrumb>ol');
  const li = renderElement({
    type: 'li',
    props: { innerHTML: restaurant.name },
    attributes: { 'aria-current': 'page' }
  })
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
const getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

document.addEventListener('DOMContentLoaded', (event) => {
  offlineLoad();
});