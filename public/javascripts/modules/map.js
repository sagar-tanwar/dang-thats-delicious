import axios from 'axios';
import { $ } from './bling';

function loadPlaces (map, lat = 43.2, lng = -79.8) {
  axios
    .get(`/api/stores/near?lat=${lat}&lng=${lng}`)
    .then(res => {
      const places = res.data;
      if(!places.length) {
        alert('No places nearby!');
        return;
      }

      // create a bounds
      const bounds = new google.maps.LatLngBounds();
      const infoWindow = new google.maps.InfoWindow();

      const markers = places.map(place => {
        const position = { 
          lat: place.location.coordinates[1], 
          lng: place.location.coordinates[0] 
        };
        bounds.extend(position);
        const marker = new google.maps.Marker({ position, map })
        marker.place = place;
        return marker;
      })

      // show a info window when someone clicks on a marker
      markers.forEach(marker => marker.addListener('click', function () {
        const {slug, name, photo, location} = this.place;
        const html = `
          <div class="popup">
            <a href="/store/${slug}">
              <img src="/uploads/${photo || 'store.png'}" alt="${name}" />
              <p>${name} - ${location.address}</p>
            </a>
          </div>
        `;
        infoWindow.setContent(html);
        infoWindow.open(map, this);
      }))
      
      // zoom the map to fit all the markers
      map.setCenter(bounds.getCenter());
      map.fitBounds(bounds);
    })
    .catch(err => console.error(err))
}

function makeMap (mapDiv, mapOptions) {
  if(!mapDiv) return;

  const map = new google.maps.Map(mapDiv, mapOptions);
  loadPlaces(map, mapOptions.center.lat, mapOptions.center.lng);

  const autocomplete = new google.maps.places.Autocomplete($('input[name=geolocate]'))
  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    loadPlaces (map, place.geometry.location.lat(), place.geometry.location.lng())
  })
}

export default makeMap;