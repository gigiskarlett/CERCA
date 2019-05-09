//foursquare venue
const clientSecret = "ODC4U4DJV14HN0ZV4HPYJ3YUYPBMN3YCL40JS0C0DX3NPAZC";
const versionApi = "20181101";
const clientId = "JJKCIBIBQ2L2ACKIQ2SFIIG4YFXU1UAJKSGMGUCKNYEO3TCS";
const venueSearchURL = "https://api.foursquare.com/v2/venues/explore";

//google geocoding
const geoCodingUrl = `https://maps.googleapis.com/maps/api/geocode/json`;
const geoCodingClientKey = `AIzaSyC7B7GvOsWcm329Cf0Yl7Li7tW0u5wUlxM`;

//Weather app
const appid = "c1030d35c644039241e355758547f2ec";
const openWeatherUrl = "https://api.openweathermap.org/data/2.5/weather";
const unit = "imperial";

// map variables
var map;
var bounds;

// stores state data
let state = {
  query: {
    place: "",
    address: ""
  },
  venues: [],
  markers: [],
  images: [],
  location: {
    lat: "",
    lng: ""
  },
  selectedVenue: {},
  weatherJson: {}
};

/////////////////////////////////////////////////////////

$(() => {
  bindEventHandlers();
});

//binds event handlers
const bindEventHandlers = () => {
  handleLandingPageFormSubmit();
  handleResultsPageFormSubmit();
  handleSearchResultsClick();

  toggleSidebar();
  closeModal();
  markerHover();
  removeMarkers();
};

/////////////////////////////////////////////////////////

//Initiates map
function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 34.0522, lng: -118.2437 },
    zoom: 3,
    zoomControlOptions: {
      position: google.maps.ControlPosition.TOP_RIGHT
    },
    fullScreenControl: false,
    mapTypeControl: false,
    streetViewControl: false,
    streetViewControlOptions: {
      position: google.maps.ControlPosition.RIGHT_CENTER
    }
  });
  map.setOptions({ minZoom: 2, maxZoom: 28 });
  bounds = new google.maps.LatLngBounds();
}

/////////////////////////////////////////////////////////

//makes sidebar hide and unhide on click of button
function toggleSidebar() {
  $("#show-hide").click(function() {
    var currentStyle = $("#sidebar").css("width");
    if (currentStyle === "0px") {
      $("#sidebar").css("width", "calc(100% - 35px)");
      $("#search-results", ".results-search-background").show();
    } else {
      $("#sidebar").css("width", "0");
      $("#search-results", ".results-search-background").hide();
    }
  });
}

//closes modal
function closeModal() {
  $(".popup-overlay").click(function(event) {
    $("#search-modal").hide();
  });
}

//adds animation when hovering over venue on sidebar
function markerHover() {
  $("#search-results").on("mouseover", ".result", function(e) {
    var index = $(this).attr("data-index");

    state.markers[index].setAnimation(google.maps.Animation.BOUNCE);
  });

  $("#search-results").on("touchstart", ".result", function(e) {
    var index = $(this).attr("data-index");

    state.markers[index].setAnimation(google.maps.Animation.BOUNCE);
  });

  $("#search-results").on("mouseout", ".result", function(e) {
    var index = $(this).attr("data-index");
    state.markers[index].setAnimation(-1);
  });

  $("#search-results").on("touchend", ".result", function(e) {
    var index = $(this).attr("data-index");
    state.markers[index].setAnimation(-1);
  });
}

function removeMarkers() {
  $(".js-sidebar-submit").on("click", function() {
    for (i = 0; i < state.markers.length; i++) {
      state.markers[i].setMap(null);
    }
  });
}

///////////////////////////////////////////////////////

//listens for search submit on landing page
const handleLandingPageFormSubmit = () => {
  $("#landing-page-form").submit(event => {
    event.preventDefault();

    state.query.place = $("#landing-place-query").val();
    state.query.address = $("#landing-address-query").val();

    fetchVenues();
  });
};

//listens for search submit on side bar
const handleResultsPageFormSubmit = () => {
  $("#results-page-form").submit(event => {
    event.preventDefault();

    state.query.place = $("#results-place-query").val();
    state.query.address = $("#results-address-query").val();

    fetchVenues();
  });
};

const fetchVenues = (maxResults = 10) => {
  const params = {
    query: state.query.place,
    near: state.query.address,
    v: versionApi,
    client_id: clientId,
    client_secret: clientSecret,
    limit: maxResults
  };
  const queryString = formatQueryParamsPlaces(params);
  const url = venueSearchURL + "?" + queryString;

  fetch(url)
    .then(response => response.json())
    .then(results => {
      state.venues = results.response.groups[0].items;

      displayResults();
    })
    .catch(err => {
      $(".js-error-message").html(
        "Whoops! We currently don't have anything available for your search. Please try another search."
      );
    });
};

//Displays search results
function displayResults() {
  $(".container").hide();
  $("#map-section").show();
  $("#sidebar").show();
  $("#show-hide").show();
  bounds = new google.maps.LatLngBounds();
  let renderedVenues = state.venues.map((venue, index) => {
    setVenueMarker(venue, index);
    getVenueImage(venue.venue.id, index);
    return renderSidebarvenue(venue, index);
  });
  map.fitBounds(bounds);
  map.panToBounds(bounds);
  map.setCenter(map.getCenter());
  $("#search-results").html(renderedVenues);
}

//Retrieves image for venue
function getVenueImage(venueID, index) {
  const params = {
    v: versionApi,
    client_id: clientId,
    client_secret: clientSecret,
    limit: 1
  };
  const queryString = formatQueryParamsPlaces(params);
  const url = `https://api.foursquare.com/v2/venues/${venueID}/photos?${queryString}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      let img = data.response.photos.items[0];
      let imgURL = `${img.prefix}300x300${img.suffix}`;
      $(`#image-${venueID}`).attr("src", imgURL);
      state.images[index] = imgURL;
    })
    .catch(error => {
      console.log(`error`, error);
    });
}

//Format query parameters
function formatQueryParamsPlaces(params) {
  const queryvenues = Object.keys(params).map(
    key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
  );
  return queryvenues.join("&");
}

//Creates side bar with search results
function renderSidebarvenue(venue, index, imgURL) {
  return `<section class="result js-result" data-index=${index}>
  <a href=# class="js-venue-name">
  <h3 class="venue-name">${venue.venue.name}</h3>
  </a>
  <div class="venue-img-container">
  <img class="venue-img" id="image-${
    venue.venue.id
  }" src="${imgURL}" alt="image-of-venue">
  </div>
  <p class="address">${venue.venue.location.formattedAddress}</p>
  </section>`;
}

//Set google map markers for venues
function setVenueMarker(venue, index) {
  var venueLocation = new google.maps.LatLng(
    venue.venue.location.lat,
    venue.venue.location.lng
  );
  var marker = new google.maps.Marker({
    position: venueLocation,
    title: venue.venue.name,
    map: map
  });
  bounds.extend(
    new google.maps.LatLng(marker.position.lat(), marker.position.lng())
  );
  state.markers[index] = marker;
}

//retrieves information on selected venue
const handleSearchResultsClick = () => {
  $("#search-results").on("click", ".result", function(event) {
    event.preventDefault();

    let index = $(event.currentTarget).attr("data-index");

    state.selectedVenue = state.venues[index].venue;
    state.imageURL = state.images[index];

    fetchSelectedVenue();
  });
};

//gets lat and long from selected venue and formats address to lat and long
const fetchSelectedVenue = () => {
  const geoCodingParams = {
    key: geoCodingClientKey,
    address: state.selectedVenue.location.formattedAddress
  };

  const geoCodingQueryString = formatGeoCodingParams(geoCodingParams);
  const geoUrl = geoCodingUrl + "?" + geoCodingQueryString;

  fetch(geoUrl)
    .then(response => response.json())
    .then(geoCodingResponseJson => {
      state.location.lat =
        geoCodingResponseJson.results[0].geometry.location.lat;
      state.location.lng =
        geoCodingResponseJson.results[0].geometry.location.lng;

      return fetchWeatherData();
    })
    .then(results => displaySelectedModal())
    .catch(error => alert(error));
};

//formats geocoding parameters
function formatGeoCodingParams(geoCodingParams) {
  const geoCodingQueryItems = Object.keys(geoCodingParams).map(
    key =>
      `${encodeURIComponent(key)}=${encodeURIComponent(geoCodingParams[key])}`
  );
  return geoCodingQueryItems.join("&");
}

function fetchWeatherData() {
  return fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${
      state.location.lat
    }&lon=${
      state.location.lng
    }&units=imperial&appid=c1030d35c644039241e355758547f2ec`
  )
    .then(response => response.json())
    .then(responseJson => {
      state.weatherJson = responseJson;
    });
}

//Displays modal when user clicks on venue
function displaySelectedModal() {
  $(".popup-content").html(`
    <h3 class="popup-name">${state.selectedVenue.name}</h2>
    <img class="venue-img" id="image-{venue.venue.id}" src="${
      state.imageURL
    }" alt="selected-venue-image">
    <p class="popup-address">${
      state.selectedVenue.location.formattedAddress
    }</p>
    <div id="cloud-background">
      <h4 class="temperature-tittle">Weather</h4>
      <p class="weather-description">${state.weatherJson.weather[0].main}</p>
        <p class="temperature">${state.weatherJson.main.temp} &#8457;</p>
    </div>
    `);
  $("#search-modal").show();
}
