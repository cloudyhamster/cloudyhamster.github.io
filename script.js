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
const daylightlayer = L.layerGroup();

const overlaymaps = {
    "Sunrise Times (Local)": sunriselayer,
    "Daylight Hours": daylightlayer
};

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
    div.innerHTML = `<h4>Local Sunrise Time</h4><div class="legend-gradient" style="background: ${gradientcss};"></div><div class="legend-labels"><span>${sunrisedomain[0]}:00 AM</span><span>${sunrisedomain[sunrisedomain.length - 1]}:00 AM</span></div>`;
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
            const times = SunCalc.getTimes(getcurrentdate(), lat, lng);
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
    daylightlayer.clearLayers();
    const bounds = map.getBounds();
    const zoom = map.getZoom();
    const gridcells = zoom < 4 ? 20 : 30;
    const west = bounds.getWest(), east = bounds.getEast(), north = bounds.getNorth(), south = bounds.getSouth();
    const latstep = (north - south) / gridcells;
    const lngstep = (east - west) / gridcells;
    for (let lat = south; lat < north; lat += latstep) {
        for (let lng = west; lng < east; lng += lngstep) {
            const times = SunCalc.getTimes(getcurrentdate(), lat, lng);
            let durationhours = 0;
            if (!isNaN(times.sunrise.getTime()) && !isNaN(times.sunset.getTime())) {
                const durationms = times.sunset.getTime() - times.sunset.getTime();
                durationhours = durationms / (1000 * 60 * 60);
            } else {
                const sunposnoon = SunCalc.getPosition(getcurrentdate(), lat, lng);
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

function updatemaplayers() {
    if (map.hasLayer(sunriselayer)) {
        updatesunriselayer();
    }
    if (map.hasLayer(daylightlayer)) {
        updatedaylightlayer();
    }
}

map.on('overlayadd', function(e) {
    updatemaplayers();
    if (e.name === "Sunrise Times (Local)") sunriselegend.addTo(map);
    else if (e.name === "Daylight Hours") daylightlegend.addTo(map);
});

map.on('overlayremove', function(e) {
    if (e.name === "Sunrise Times (Local)") {
        sunriselayer.clearLayers();
        sunriselegend.remove();
    } else if (e.name === "Daylight Hours") {
        daylightlayer.clearLayers();
        daylightlegend.remove();
    }
});

map.on('moveend', updatemaplayers);

map.on('click', function(e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    const times = SunCalc.getTimes(getcurrentdate(), lat, lng);
    const timezone = tzlookup(lat, lng);
    const sunrisestr = times.sunrise.toLocaleTimeString('en-us', { hour: '2-digit', minute: '2-digit', timeZone: timezone, timeZoneName: 'short' });
    const sunsetstr = times.sunset.toLocaleTimeString('en-us', { hour: '2-digit', minute: '2-digit', timeZone: timezone, timeZoneName: 'short' });
    const popupcontent = `<strong>Location Information</strong><br>Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}<br>Timezone: ${timezone.replace('_', ' ')}<br><br><strong>Sunrise:</strong> ${sunrisestr}<br><strong>Sunset:</strong> ${sunsetstr}`;
    L.popup().setLatLng(e.latlng).setContent(popupcontent).openOn(map);
});

const datedisplay = document.getElementById('date-display');
const timedisplay = document.getElementById('time-display');
const basedate = new Date();
basedate.setHours(0, 0, 0, 0);
let currenttimeoffsethours = 12.0;

function getcurrentdate() {
    const d = new Date(basedate);
    // --- THIS IS THE FIX ---
    const hour = Math.floor(currenttimeoffsethours);
    const minute = Math.round((currenttimeoffsethours % 1) * 60);
    d.setHours(hour, minute);
    // -----------------------
    return d;
}

function updatedisplay() {
    const currentdate = getcurrentdate();
    const dateoptions = { month: 'long', day: 'numeric', year: 'numeric' };
    const timeoptions = { hour: 'numeric', minute: '2-digit' };
    datedisplay.textContent = currentdate.toLocaleDateString('en-us', dateoptions);
    timedisplay.textContent = currentdate.toLocaleTimeString('en-us', timeoptions);
}

function createslider(config) {
    const container = document.getElementById(config.elementid);
    const track = container.querySelector('.slider-track');
    let isdragging = false;
    let startx;
    let trackoffset = 0;
    let currenttrackoffset = 0;
    let currentvalue = config.initialindex;
    let lastactiveindex = -1;

    function init() {
        track.innerHTML = '';
        for (let i = 0; i < config.totalitems; i++) {
            const item = config.itemgenerator(i);
            track.appendChild(item);
        }
        updateslider(config.initialindex, false);
    }
    
    function updatehighlight(value) {
        const activeindex = Math.floor(value);
        if (activeindex === lastactiveindex) return;
        
        const oldactive = track.querySelector('.slider-item.active');
        if (oldactive) oldactive.classList.remove('active');
        
        const newactive = track.querySelector(`.slider-item[data-index="${activeindex}"]`);
        if (newactive) newactive.classList.add('active');

        lastactiveindex = activeindex;
    }

    function updateslider(value, isanimated = true) {
        currentvalue = value;
        const containerwidth = container.offsetWidth;
        trackoffset = - (currentvalue * config.itemwidth) + (containerwidth / 2);
        if (isanimated) {
            track.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)';
        } else {
            track.style.transition = 'none';
        }
        track.style.transform = `translateX(${trackoffset}px)`;
        updatehighlight(value);
        config.onupdate(currentvalue, true);
    }
    
    function ondragstart(e) {
        isdragging = true;
        startx = e.pageX || e.touches[0].pageX;
        currenttrackoffset = trackoffset;
        track.style.transition = 'none';
        document.body.classList.add('dragging');
        document.addEventListener('mousemove', ondragmove);
        document.addEventListener('mouseup', ondragend);
        document.addEventListener('touchmove', ondragmove);
        document.addEventListener('touchend', ondragend);
    }

    function ondragmove(e) {
        if (!isdragging) return;
        e.preventDefault();
        const currentx = e.pageX || e.touches[0].pageX;
        const diff = currentx - startx;
        const newtrackoffset = currenttrackoffset + diff;
        track.style.transform = `translateX(${newtrackoffset}px)`;

        const containerwidth = container.offsetWidth;
        const newvalue = (-newtrackoffset + (containerwidth / 2)) / config.itemwidth;
        currentvalue = Math.max(0, Math.min(config.totalitems - 1, newvalue));
        
        updatehighlight(currentvalue);
        config.onupdate(currentvalue, false);
    }

    function ondragend(e) {
        if (!isdragging) return;
        isdragging = false;
        document.body.classList.remove('dragging');
        
        document.removeEventListener('mousemove', ondragmove);
        document.removeEventListener('mouseup', ondragend);
        document.removeEventListener('touchmove', ondragmove);
        document.removeEventListener('touchend', ondragend);
        
        updateslider(currentvalue, true);
    }

    container.addEventListener('mousedown', ondragstart);
    container.addEventListener('touchstart', ondragstart, { passive: true });
    init();
}

createslider({
    elementid: 'time-slider',
    itemwidth: 80,
    totalitems: 25,
    initialindex: 12,
    itemgenerator: (i) => {
        const item = document.createElement('div');
        item.classList.add('slider-item');
        item.dataset.index = i;
        const date = new Date();
        date.setHours(i, 0, 0, 0);
        if (i < 24) {
            const hourlabel = document.createElement('div');
            hourlabel.classList.add('hour-label');
            hourlabel.textContent = date.toLocaleTimeString('en-us', { hour: 'numeric' });
            item.appendChild(hourlabel);
        }
        const majortick = document.createElement('div');
        majortick.classList.add('time-tick', 'tick-major');
        majortick.style.left = '0%';
        item.appendChild(majortick);
        if (i < 24) {
            const mediumtick = document.createElement('div');
            mediumtick.classList.add('time-tick', 'tick-medium');
            mediumtick.style.left = '50%';
            item.appendChild(mediumtick);
            const minortick1 = document.createElement('div');
            minortick1.classList.add('time-tick', 'tick-minor');
            minortick1.style.left = '25%';
            item.appendChild(minortick1);
            const minortick2 = document.createElement('div');
            minortick2.classList.add('time-tick', 'tick-minor');
            minortick2.style.left = '75%';
            item.appendChild(minortick2);
        }
        return item;
    },
    onupdate: (value, isfinal) => {
        currenttimeoffsethours = value;
        updatedisplay();
        if (isfinal) {
            updatemaplayers();
        }
    }
});

updatedisplay();