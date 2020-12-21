import '../sass/style.scss';

import { $, $$ } from './modules/bling';
import autocomplete from './modules/autocomplete';
import typeAhead from './modules/typeAhead';
import makeMap from './modules/map';
import ajaxHeart from './modules/heart'

autocomplete($('#address'), $('#lat'), $('#lng'))


typeAhead($('.search'));

const mapOptions = { zoom: 10 }

navigator.geolocation.getCurrentPosition(({coords}) => {
  mapOptions.center = { lat: coords.latitude, lng: coords.longitude };
  makeMap($('#map'), mapOptions);
}, () => {
  mapOptions.center = { lat: 43.2, lng: -79.8 }
  makeMap($('#map'), mapOptions);
})


const hearts = $$('form.heart');
hearts.on('click', ajaxHeart);