const map = L.map('map', {
    zoomControl: false,
    minZoom: 2
}).setView([20, 0], 2);

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

let isdarkmode = true;
darklayer.addTo(map);
document.body.classList.add('dark-mode');

const themetogglecontrol = L.Control.extend({
    onAdd: function(map) {
        const button = L.DomUtil.create('button', 'theme-toggle-button');
        button.innerHTML = 'Light Mode';
        
        button.onclick = function(){
            isdarkmode = !isdarkmode;

            if (isdarkmode) {
                map.removeLayer(lightlayer);
                darklayer.addTo(map);
                document.body.classList.add('dark-mode');
                button.innerHTML = 'Light Mode';
            } else {
                map.removeLayer(darklayer);
                lightlayer.addTo(map);
                document.body.classList.remove('dark-mode');
                button.innerHTML = 'Night Mode';
            }
        }
        return button;
    }
});

new themetogglecontrol({ position: 'topright' }).addTo(map);

map.on('click', function(e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    const times = SunCalc.getTimes(new Date(), lat, lng);

    const sunrisestr = times.sunrise.toLocaleTimeString('en-us', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
    const sunsetstr = times.sunset.toLocaleTimeString('en-us', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });

    const popupcontent = `
        <strong>Location Information</strong><br>
        Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}<br><br>
        <strong>Sunrise:</strong> ${sunrisestr}<br>
        <strong>Sunset:</strong> ${sunsetstr}
    `;

    L.popup()
        .setLatLng(e.latlng)
        .setContent(popupcontent)
        .openOn(map);
});