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