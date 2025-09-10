import { basemaps } from './map.js';

const sunriselayer = L.layerGroup();
const daylightlayer = L.layerGroup();
const sunsetlayer = L.layerGroup();

const overlaymaps = {
    "Sunrise Times (Local)": sunriselayer,
    "Sunset Times (Local)": sunsetlayer,
    "Daylight Hours": daylightlayer
};

let getcurrentdate = () => new Date();
let mapinstance;

export function updatemaplayers() {
    if (mapinstance.hasLayer(sunriselayer)) updatesunriselayer();
    if (mapinstance.hasLayer(daylightlayer)) updatedaylightlayer();
    if (mapinstance.hasLayer(sunsetlayer)) updatesunsetlayer();
}

const sunrisecolors = ['#2c003e', '#7a004b', '#d83c3e', '#ff962d', '#fffa73', '#87ceeb'];
const sunrisedomain = [4, 5, 6, 7, 8, 10];
const sunrisecolorscale = chroma.scale(sunrisecolors).domain(sunrisedomain).mode('lch');

const sunriselegend = L.control({position: 'bottomright'});
sunriselegend.onAdd = function (map) {
    const div = L.DomUtil.create('div', 'info-legend');
    const gradientcss = 'linear-gradient(to right, ' + sunrisecolors.join(', ') + ')';
    div.innerHTML = `<h4>Local Sunrise Time</h4><div class="legend-gradient" style="background: ${gradientcss};"></div><div class="legend-labels"><span>${sunrisedomain[0]}:00 AM</span><span>${sunrisedomain[sunrisedomain.length - 1]}:00 AM</span></div>`;
    return div;
};

function updatesunriselayer() {
    sunriselayer.clearLayers();
    const calculationdate = new Date(getcurrentdate().setHours(12, 0, 0, 0));
    const bounds = mapinstance.getBounds();
    const zoom = mapinstance.getZoom();
    const gridcells = zoom < 5 ? 30 : 40;
    const west = bounds.getWest(), east = bounds.getEast(), north = bounds.getNorth(), south = bounds.getSouth();
    const latstep = (north - south) / gridcells;
    const lngstep = (east - west) / gridcells;
    for (let lat = south; lat < north; lat += latstep) {
        for (let lng = west; lng < east; lng += lngstep) {
            const times = SunCalc.getTimes(calculationdate, lat, lng);
            const timezone = tzlookup(lat, lng);
            const dateobj = new Date(times.sunrise);
            const hour = parseInt(dateobj.toLocaleTimeString('en-GB', { timeZone: timezone, hour: 'numeric' }));
            const minute = parseInt(dateobj.toLocaleTimeString('en-GB', { timeZone: timezone, minute: 'numeric' }));
            const localhour = hour + (minute / 60);
            const rectangle = L.rectangle([[lat, lng], [lat + latstep, lng + lngstep]], { color: getsunrisecolor(localhour), weight: 0, fillOpacity: 0.5 });
            sunriselayer.addLayer(rectangle);
        }
    }
}

function getsunrisecolor(hourofday) {
    if (isNaN(hourofday) || hourofday < sunrisedomain[0] || hourofday > sunrisedomain[sunrisedomain.length - 1]) {
        return 'transparent';
    }
    return sunrisecolorscale(hourofday).hex();
}

const daylightcolors = ['#0d0887', '#7e03a8', '#cb4778', '#f89540', '#f0f921'];
const daylightdomain = [0, 6, 12, 18, 24];
const daylightcolorscale = chroma.scale(daylightcolors).domain(daylightdomain);

const daylightlegend = L.control({position: 'bottomright'});
daylightlegend.onAdd = function (map) {
    const div = L.DomUtil.create('div', 'info-legend');
    const gradientcss = 'linear-gradient(to right, ' + daylightcolors.join(', ') + ')';
    div.innerHTML = `<h4>Daylight Duration</h4><div class="legend-gradient" style="background: ${gradientcss};"></div><div class="legend-labels"><span>${daylightdomain[0]} Hours</span><span>${daylightdomain[daylightdomain.length - 1]} Hours</span></div>`;
    return div;
};

function updatedaylightlayer() {
    const calculationdate = new Date(getcurrentdate().setHours(12, 0, 0, 0));
    daylightlayer.clearLayers();
    const bounds = mapinstance.getBounds();
    const zoom = mapinstance.getZoom();
    const gridcells = zoom < 5 ? 30 : 40;
    const west = bounds.getWest(), east = bounds.getEast(), north = bounds.getNorth(), south = bounds.getSouth();
    const latstep = (north - south) / gridcells;
    const lngstep = (east - west) / gridcells;
    for (let lat = south; lat < north; lat += latstep) {
        for (let lng = west; lng < east; lng += lngstep) {
            const times = SunCalc.getTimes(calculationdate, lat, lng);
            let durationhours = 0;
            if (!isNaN(times.sunrise.getTime()) && !isNaN(times.sunset.getTime())) {
                const durationms = times.sunset.getTime() - times.sunrise.getTime();
                durationhours = durationms / (1000 * 60 * 60);
            } else {
                const sunposnoon = SunCalc.getPosition(calculationdate, lat, lng);
                if (sunposnoon.altitude > 0) durationhours = 24;
            }
            const rectangle = L.rectangle([[lat, lng], [lat + latstep, lng + lngstep]], { color: getdaylightcolor(durationhours), weight: 0, fillOpacity: 0.5 });
            daylightlayer.addLayer(rectangle);
        }
    }
}

function getdaylightcolor(hourofday) {
    if (isNaN(hourofday)) return 'transparent';
    return daylightcolorscale(hourofday).hex();
}

const sunsetcolors = ['#fde725', '#f89540', '#e56b5d', '#cb4778', '#a32f8d', '#7e03a8', '#4b0055'];
const sunsetdomain = [15, 16, 17, 18, 19, 21, 23];
const sunsetcolorscale = chroma.scale(sunsetcolors).domain(sunsetdomain).mode('lch');

const sunsetlegend = L.control({position: 'bottomright'});
sunsetlegend.onAdd = function (map) {
    const div = L.DomUtil.create('div', 'info-legend');
    const gradientcss = 'linear-gradient(to right, ' + sunsetcolors.join(', ') + ')';
    div.innerHTML = `<h4>Local Sunset Time</h4><div class="legend-gradient" style="background: ${gradientcss};"></div><div class="legend-labels"><span>3:00 PM</span><span>11:00 PM</span></div>`;
    return div;
};

function updatesunsetlayer() {
    sunsetlayer.clearLayers();
    const calculationdate = new Date(getcurrentdate().setHours(12, 0, 0, 0));
    const bounds = mapinstance.getBounds();
    const zoom = mapinstance.getZoom();
    const gridcells = zoom < 5 ? 30 : 40;
    const west = bounds.getWest(), east = bounds.getEast(), north = bounds.getNorth(), south = bounds.getSouth();
    const latstep = (north - south) / gridcells;
    const lngstep = (east - west) / gridcells;
    for (let lat = south; lat < north; lat += latstep) {
        for (let lng = west; lng < east; lng += lngstep) {
            const times = SunCalc.getTimes(calculationdate, lat, lng);
            const timezone = tzlookup(lat, lng);
            const dateobj = new Date(times.sunset);
            const hour = parseInt(dateobj.toLocaleTimeString('en-GB', { timeZone: timezone, hour: 'numeric' }));
            const minute = parseInt(dateobj.toLocaleTimeString('en-GB', { timeZone: timezone, minute: 'numeric' }));
            const localhour = hour + (minute / 60);
            const rectangle = L.rectangle([[lat, lng], [lat + latstep, lng + lngstep]], { color: getsunsetcolor(localhour), weight: 0, fillOpacity: 0.5 });
            sunsetlayer.addLayer(rectangle);
        }
    }
}

function getsunsetcolor(hourofday) {
    if (isNaN(hourofday) || hourofday < sunsetdomain[0] || hourofday > sunsetdomain[sunsetdomain.length - 1]) {
        return 'transparent';
    }
    return sunsetcolorscale(hourofday).hex();
}

function debounce(func, wait) {
    let timeout;
    const debounced = function(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
    debounced.cancel = function() {
        clearTimeout(timeout);
    };
    return debounced;
}

const debouncedupdatemaplayers = debounce(updatemaplayers, 250);

let activelegend = null;
function removealllegends() {
    if(activelegend) {
        activelegend.remove();
        activelegend = null;
    }
}

export function initializeLayers(map, dateGetter) {
    mapinstance = map;
    getcurrentdate = dateGetter;
    L.control.layers(basemaps, overlaymaps, { position: 'topright' }).addTo(mapinstance);

    mapinstance.on('overlayadd', function(e) {
        removealllegends();
        updatemaplayers();
        if (e.name === "Sunrise Times (Local)") activelegend = sunriselegend.addTo(mapinstance);
        else if (e.name === "Daylight Hours") activelegend = daylightlegend.addTo(mapinstance);
        else if (e.name === "Sunset Times (Local)") activelegend = sunsetlegend.addTo(mapinstance);
    });

    mapinstance.on('overlayremove', function(e) {
        if (e.name === "Sunrise Times (Local)") sunriselayer.clearLayers();
        else if (e.name === "Daylight Hours") daylightlayer.clearLayers();
        else if (e.name === "Sunset Times (Local)") sunsetlayer.clearLayers();
        removealllegends();
    });

    mapinstance.on('moveend', debouncedupdatemaplayers);

    mapinstance.on('click', function(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        const times = SunCalc.getTimes(getcurrentdate(), lat, lng);
        const timezone = tzlookup(lat, lng);
        const sunrisestr = times.sunrise.toLocaleTimeString('en-us', { hour: '2-digit', minute: '2-digit', timeZone: timezone, timeZoneName: 'short' });
        const sunsetstr = times.sunset.toLocaleTimeString('en-us', { hour: '2-digit', minute: '2-digit', timeZone: timezone, timeZoneName: 'short' });
        const popupcontent = `<strong>Location Information</strong><br>Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}<br>Timezone: ${timezone.replace('_', ' ')}<br><br><strong>Sunrise:</strong> ${sunrisestr}<br><strong>Sunset:</strong> ${sunsetstr}`;
        L.popup().setLatLng(e.latlng).setContent(popupcontent).openOn(mapinstance);
    });
}