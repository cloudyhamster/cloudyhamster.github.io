const map = L.map('map', {
    zoomControl: false,
    minZoom: 2
}).setView([20, 0], 3);

L.control.zoom({
    position: 'topleft'
}).addTo(map);

const lightlayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors & © CartoDB'
});

const darklayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors & © CartoDB'
});

const basemaps = { "Light": lightlayer, "Dark": darklayer };
const sunriselayer = L.layerGroup();
const overlaymaps = { "Sunrise Times (Local)": sunriselayer };

darklayer.addTo(map);
document.body.classList.add('dark-mode');
let isdarkmode = true;

const layercontrol = L.control.layers(basemaps, overlaymaps, { position: 'topright' }).addTo(map);
map.on('baselayerchange', function(e) {
    if (e.name === 'Light') {
        document.body.classList.remove('dark-mode');
        isdarkmode = false;
    } else {
        document.body.classList.add('dark-mode');
        isdarkmode = true;
    }
});

const sunrisecolors = ['#2c003e', '#7a004b', '#d83c3e', '#ff962d', '#fffa73', '#87ceeb'];
const sunrisedomain = [4, 5, 6, 7, 8, 10];
const sunrisecolorscale = chroma.scale(sunrisecolors).domain(sunrisedomain).mode('lch');

const sunriselegend = L.control({position: 'bottomright'});
sunriselegend.onAdd = function (map) {
    const div = L.DomUtil.create('div', 'info-legend');
    const gradientcss = 'linear-gradient(to right, ' + sunrisecolors.join(', ') + ')';

    div.innerHTML = `
        <h4>Local Sunrise Time</h4>
        <div class="legend-gradient" style="background: ${gradientcss};"></div>
        <div class="legend-labels">
            <span>${sunrisedomain[0]}:00 AM</span>
            <span>${sunrisedomain[sunrisedomain.length - 1]}:00 AM</span>
        </div>
    `;
    return div;
};

function updatesunriselayer() {
    sunriselayer.clearLayers();
    const bounds = map.getBounds();
    const zoom = map.getZoom();
    const gridcells = zoom < 4 ? 20 : 30;
    const west = bounds.getWest(), east = bounds.getEast(), north = bounds.getNorth(), south = bounds.getSouth();
    const latstep = (north - south) / gridcells;
    const lngstep = (east - west) / gridcells;

    for (let lat = south; lat < north; lat += latstep) {
        for (let lng = west; lng < east; lng += lngstep) {
            const times = SunCalc.getTimes(new Date(), lat, lng);
            const timezone = tzlookup(lat, lng);
            
            const dateobj = new Date(times.sunrise);
            const hour = parseInt(dateobj.toLocaleTimeString('en-GB', { timeZone: timezone, hour: 'numeric' }));
            const minute = parseInt(dateobj.toLocaleTimeString('en-GB', { timeZone: timezone, minute: 'numeric' }));
            const localhour = hour + (minute / 60);

            const rectangle = L.rectangle([
                [lat, lng], [lat + latstep, lng + lngstep]
            ], {
                color: getsunrisecolor(localhour),
                weight: 0,
                fillOpacity: 0.5
            });
            sunriselayer.addLayer(rectangle);
        }
    }
}

function getsunrisecolor(hourofday) {
    if (isNaN(hourofday)) return 'transparent';

    if (hourofday < sunrisedomain[0] || hourofday > sunrisedomain[sunrisedomain.length - 1]) {
        return 'transparent';
    }
    
    return sunrisecolorscale(hourofday).hex();
}

map.on('overlayadd', function(e) {
    if (e.name === "Sunrise Times (Local)") {
        updatesunriselayer();
        sunriselegend.addTo(map);
    }
});
map.on('overlayremove', function(e) {
    if (e.name === "Sunrise Times (Local)") {
        sunriselayer.clearLayers();
        sunriselegend.remove();
    }
});
map.on('moveend', function() {
    if (map.hasLayer(sunriselayer)) {
        updatesunriselayer();
    }
});

map.on('click', function(e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    const times = SunCalc.getTimes(new Date(), lat, lng);
    const timezone = tzlookup(lat, lng);
    const sunrisestr = times.sunrise.toLocaleTimeString('en-us', { hour: '2-digit', minute: '2-digit', timeZone: timezone, timeZoneName: 'short' });
    const sunsetstr = times.sunset.toLocaleTimeString('en-us', { hour: '2-digit', minute: '2-digit', timeZone: timezone, timeZoneName: 'short' });

    const popupcontent = `
        <strong>Location Information</strong><br>
        Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}<br>
        Timezone: ${timezone.replace('_', ' ')}<br><br>
        <strong>Sunrise:</strong> ${sunrisestr}<br>
        <strong>Sunset:</strong> ${sunsetstr}
    `;
    L.popup().setLatLng(e.latlng).setContent(popupcontent).openOn(map);
});