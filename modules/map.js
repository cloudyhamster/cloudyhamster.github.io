export const map = L.map('map', {
    zoomControl: false,
    minZoom: 5
}).setView([20, 0], 5);

L.control.zoom({
    position: 'topleft'
}).addTo(map);

const lightlayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 21,
    attribution: '© OpenStreetMap contributors & © CartoDB'
});

const darklayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 21,
    attribution: '© OpenStreetMap contributors & © CartoDB'
});

export const basemaps = { "Light": lightlayer, "Dark": darklayer };

darklayer.addTo(map);
document.body.classList.add('dark-mode');

map.on('baselayerchange', function(e) {
    if (e.name === 'Light') {
        document.body.classList.remove('dark-mode');
    } else {
        document.body.classList.add('dark-mode');
    }
});

map.on('load', function() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                map.flyTo([lat, lon], 10);
            },
            function() {
                console.log('geolocation permission denied by user');
            }
        );
    }
});