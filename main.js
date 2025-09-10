import { map } from './modules/map.js';
import { initializeLayers, updatemaplayers } from './modules/layers.js';
import { initializeSliders, getcurrentdate } from './modules/slider.js';

document.addEventListener('DOMContentLoaded', function() {
    initializeLayers(map, getcurrentdate);
    initializeSliders(updatemaplayers);
    updatemaplayers();
});