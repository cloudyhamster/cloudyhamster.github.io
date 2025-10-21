const backendUrl = "https://site-backend-d1nf.onrender.com"; 
const loader = document.getElementById('loader');

const map = L.map('map', {
    zoomControl: false,
    attributionControl: false,
    minZoom: 3
}).setView([20, 0], 2);

L.control.zoom({ position: 'topright' }).addTo(map);
L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(map);

const darkTiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO'
});
const lightTiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
});

const baseMaps = { "Light": lightTiles, "Dark": darkTiles };
L.control.layers(baseMaps, null, { position: 'topright' }).addTo(map);

darkTiles.addTo(map);
document.body.classList.add('dark-mode');

map.on('baselayerchange', function(e) {
    document.body.classList.toggle('dark-mode', e.name === 'Dark');
});

let geojsonLayer;
let lastDrawnShape;
let countrySelect;

L.Control.CountrySelect = L.Control.extend({
    onAdd: function(map) {
        const container = L.DomUtil.create('div', 'leaflet-control-country-select leaflet-bar');
        countrySelect = L.DomUtil.create('select', '', container);
        countrySelect.innerHTML = '<option value="">-- Select a Country --</option>';
        L.DomEvent.disableClickPropagation(container);
        return container;
    }
});
new L.Control.CountrySelect({ position: 'topleft' }).addTo(map);


let scoreControl;
L.Control.Score = L.Control.extend({
    onAdd: function(map) {
        const container = L.DomUtil.create('div', 'leaflet-control-score');
        L.DomEvent.disableClickPropagation(container);
        this._container = container;
        this.update();
        return this._container;
    },
    update: function(countryName, score) {
        let content = '<h4>Select a country and draw a shape.</h4>';
        if (countryName && score !== undefined) {
            const scorePercent = (score * 100).toFixed(2) + '%';
            content = `<h4>${countryName}</h4><p>${scorePercent}</p>`;
        }
        this._container.innerHTML = content;
    }
});

scoreControl = new L.Control.Score({ position: 'bottomright' });
scoreControl.addTo(map);


fetch('countries.geojson')
    .then(response => response.json())
    .then(data => {
        geojsonLayer = L.geoJSON(data, {
            style: { color: "#4a83ec", weight: 1, fillColor: "#555", fillOpacity: 0.2 }
        }).addTo(map);
        
        const countryNames = data.features
            .map(feature => feature.properties.name)
            .filter(name => name)
            .sort();
        
        countryNames.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            countrySelect.appendChild(option);
        });
    });

const drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);
const drawControl = new L.Control.Draw({
    position: 'topright',
    draw: { polygon: true, rectangle: true, circle: false, marker: false, polyline: false, circlemarker: false },
    edit: { featureGroup: drawnItems }
});
map.addControl(drawControl);

map.on(L.Draw.Event.CREATED, function (event) {
    drawnItems.clearLayers();
    const layer = event.layer;
    drawnItems.addLayer(layer);
    lastDrawnShape = layer.toGeoJSON();
    
    const selectedCountry = countrySelect.value;
    if (selectedCountry) {
        calculateSimilarity(lastDrawnShape, selectedCountry);
    } else {
        alert("Please select a country from the dropdown first.");
        drawnItems.clearLayers();
    }
});

countrySelect.addEventListener('change', function(event) {
    const selectedCountryName = event.target.value;
    resetMapStyles();

    if (!selectedCountryName) return;

    if (lastDrawnShape) {
        calculateSimilarity(lastDrawnShape, selectedCountryName);
    }
    
    geojsonLayer.eachLayer(layer => {
        if (layer.feature.properties.name === selectedCountryName) {
            map.fitBounds(layer.getBounds());
        }
    });
});

function calculateSimilarity(shapeGeoJSON, countryName) {
    loader.classList.remove('hidden');
    scoreControl.update(countryName); 
    const coordinates = shapeGeoJSON.geometry.coordinates[0];
    const payload = { country_name: countryName, shape_coords: coordinates };

    fetch(`${backendUrl}/calculate_single`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        return response.json();
    })
    .then(data => {
        loader.classList.add('hidden');
        scoreControl.update(countryName, data.score);
        visualizeResult(countryName, data.score);
    })
    .catch(error => {
        loader.classList.add('hidden');
        scoreControl.update(); 
        console.error("Error calculating similarity:", error);
        alert("An error occurred. Please check the console for details.");
    });
}

function visualizeResult(countryName, score) {
    geojsonLayer.eachLayer(layer => {
        if (layer.feature.properties.name === countryName) {
            layer.setStyle({ fillColor: getColorForScore(score), fillOpacity: 0.75 });
        }
    });
}

function getColorForScore(score) {
    const hue = score * 120;
    return `hsl(${hue}, 90%, 50%)`;
}

function resetMapStyles() {
    if (geojsonLayer) {
        geojsonLayer.setStyle({ color: "#4a83ec", weight: 1, fillColor: "#555", fillOpacity: 0.2 });
    }
    scoreControl.update(); 
}