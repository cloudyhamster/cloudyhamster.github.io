import { mapcontroller } from './modules/mapcontroller.js';
import { layermanager } from './modules/layermanager.js';
import { uicontroller } from './modules/uicontroller.js';
import { layerconfigs } from './modules/config.js';
import { debounce } from './modules/utils.js';

export class app {
    constructor() {
        this.mapcontroller = new mapcontroller();
        
        const debouncedlayerupdate = debounce(() => this.layermanager.updateallactivelayers(), 500);

        this.uicontroller = new uicontroller(
            () => this.layermanager.updateallactivelayers(),
            debouncedlayerupdate
        );
        
        this.layermanager = new layermanager(
            this.mapcontroller.map,
            layerconfigs,
            () => this.uicontroller.getcurrentdate()
        );
    }
}