export class mapcontroller {
    constructor() {
        this.map = L.map('map', { zoomControl: false, minZoom: 3 }).setView([20, 0], 3);
        this.basemaps = this._createbasemaps();
        this._addzoomcontrol();
        this._addbasemaplayercontrol();
        this._setinitialbasemap();
        this._handlebasemapchange();
        this._handleuserlocation();
    }

    _createbasemaps() {
        const light = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 21,
            attribution: '© OpenStreetMap contributors & © CartoDB'
        });
        const dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 21,
            attribution: '© OpenStreetMap contributors & © CartoDB'
        });
        return { "Light": light, "Dark": dark };
    }

    _addzoomcontrol() {
        L.control.zoom({ position: 'topleft' }).addTo(this.map);
    }
    
    _addbasemaplayercontrol() {
        this.layercontrol = L.control.layers(this.basemaps, {}, { position: 'topright' }).addTo(this.map);
    }

    _setinitialbasemap() {
        this.basemaps.Dark.addTo(this.map);
        document.body.classList.add('dark-mode');
    }

    _handlebasemapchange() {
        this.map.on('baselayerchange', (e) => {
            document.body.classList.toggle('dark-mode', e.name === 'Dark');
        });
    }

    _handleuserlocation() {
        this.map.on('load', () => {
            navigator.geolocation?.getCurrentPosition(
                (position) => {
                    this.map.flyTo([position.coords.latitude, position.coords.longitude], 10);
                },
                () => {
                    console.log('geolocation permission denied by user.');
                }
            );
        });
    }
}