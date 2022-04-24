mapboxgl.accessToken = mapToken;

const coordinates = JSON.parse(campground.coordinates);
const popUpMarkup = `
<strong><a href="/campgrounds/${campground.id}">${campground.title}</a><strong>
<p>${campground.description.substring(0, 20)}...</p>;
`;

const map = new mapboxgl.Map({
  container: "map", // container ID
  style: "mapbox://styles/mapbox/streets-v11", // style URL
  center: coordinates, // starting position [lng, lat]
  zoom: 9, // starting zoom
});
const marker = new mapboxgl.Marker()
  .setLngLat(coordinates)
  .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(popUpMarkup))
  .addTo(map);
