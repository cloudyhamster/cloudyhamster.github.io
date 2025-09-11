export class layermanager {
    constructor(mapinstance, configs, getcurrentdate) {
        this.map = mapinstance;
        this.layerconfigs = configs;
        this.getcurrentdate = getcurrentdate;
        this.activelegend = null;
        this.overlaymaps = {};

        this._initializelayers();
        this._bindmapevents();
    }

    updateallactivelayers() {
        this.layerconfigs.forEach(config => {
            if (this.map.hasLayer(config.layer)) {
                this._updatelayer(config);
            }
        });
    }

    _initializelayers() {
        this.layerconfigs.forEach(config => {
            config.layer = L.layerGroup();
            this.overlaymaps[config.name] = config.layer;
            config.colorscale = chroma.scale(config.colors).domain(config.domain).mode('lch');
            config.legend = this._createlegend(config);
        });
        L.control.layers({}, this.overlaymaps, { position: 'topright' }).addTo(this.map);
    }
    
    _createlegend(config) {
        const legend = L.control({ position: 'bottomright' });
        legend.onAdd = () => {
            const div = L.DomUtil.create('div', 'info-legend');
            const gradientcss = `linear-gradient(to right, ${config.colors.join(', ')})`;
            div.innerHTML = `<h4>${config.name}</h4><div class="legend-gradient" style="background: ${gradientcss};"></div><div class="legend-labels"><span>${config.legendlabels.start}</span><span>${config.legendlabels.end}</span></div>`;
            return div;
        };
        return legend;
    }

    _bindmapevents() {
        this.map.on('overlayadd', this._handleoverlayadd.bind(this));
        this.map.on('overlayremove', this._handleoverlayremove.bind(this));
        this.map.on('moveend', this.updateallactivelayers.bind(this));
        this.map.on('click', this._handlemapclick.bind(this));
    }

    _handleoverlayadd(e) {
        this._removeactivelegend();
        const config = this.layerconfigs.find(c => c.name === e.name);
        if (config) {
            this._updatelayer(config);
            this.activelegend = config.legend.addTo(this.map);
        }
    }

    _handleoverlayremove(e) {
        this._removeactivelegend();
        const config = this.layerconfigs.find(c => c.name === e.name);
        if (config) {
            config.layer.clearLayers();
        }
    }

    _removeactivelegend() {
        this.activelegend?.remove();
        this.activelegend = null;
    }

    _getcolor(value, config) {
        const { domain, colorscale } = config;
        if (isNaN(value) || value < domain[0] || value > domain[domain.length - 1]) {
            return 'transparent';
        }
        return colorscale(value).hex();
    }
    
    _updatelayer(config) {
        config.layer.clearLayers();
        const date = new Date(this.getcurrentdate().setHours(12, 0, 0, 0));
        const bounds = this.map.getBounds();
        const zoom = this.map.getZoom();
        const gridcells = zoom < 5 ? 30 : 40;
        const [w, e, n, s] = [bounds.getWest(), bounds.getEast(), bounds.getNorth(), bounds.getSouth()];
        const latstep = (n - s) / gridcells;
        const lngstep = (e - w) / gridcells;

        for (let lat = s; lat < n; lat += latstep) {
            for (let lng = w; lng < e; lng += lngstep) {
                const value = config.getvalue(lat, lng, date);
                const color = this._getcolor(value, config);
                const rect = L.rectangle([[lat, lng], [lat + latstep, lng + lngstep]], {
                    color: color, weight: 0, fillOpacity: 0.5
                });
                config.layer.addLayer(rect);
            }
        }
    }
    
    _handlemapclick(e) {
        const { lat, lng } = e.latlng;
        const times = SunCalc.getTimes(this.getcurrentdate(), lat, lng);
        const timezone = tzlookup(lat, lng);
        const timeoptions = { hour: '2-digit', minute: '2-digit', timeZone: timezone, timeZoneName: 'short' };
        const sunrisestr = times.sunrise.toLocaleTimeString('en-us', timeoptions);
        const sunsetstr = times.sunset.toLocaleTimeString('en-us', timeoptions);
        
        const content = `<strong>Location Information</strong><br>Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}<br>Timezone: ${timezone.replace('_', ' ')}<br><br><strong>Sunrise:</strong> ${sunrisestr}<br><strong>Sunset:</strong> ${sunsetstr}`;
                         
        L.popup().setLatLng(e.latlng).setContent(content).openOn(this.map);
    }
}