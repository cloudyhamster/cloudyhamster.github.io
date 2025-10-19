export class uicontroller {
    constructor(onfinalupdate, ontemporaryupdate) {
        this.onfinalupdate = onfinalupdate;
        this.ontemporaryupdate = ontemporaryupdate;
        this.selecteddate = new Date();
        this.destroycurrentslider = () => {};

        this._querydomelements();
        this._binduievents();
        this._updatedisplay();
        this._initializetimeslider();
    }

    getcurrentdate() {
        return this.selecteddate;
    }

    _querydomelements() {
        this.datebutton = document.getElementById('date-display-button');
        this.timebutton = document.getElementById('time-display-button');
        this.slidercontainer = document.getElementById('slider-container');
    }

    _binduievents() {
        this.timebutton.addEventListener('click', this._initializetimeslider.bind(this));
        this.datebutton.addEventListener('click', this._initializedayslider.bind(this));
    }
    
    _updatedisplay() {
        const dateoptions = { month: 'long', day: 'numeric', year: 'numeric' };
        const timeoptions = { hour: 'numeric', minute: '2-digit' };
        this.datebutton.textContent = this.selecteddate.toLocaleDateString('en-us', dateoptions);
        this.timebutton.textContent = this.selecteddate.toLocaleTimeString('en-us', timeoptions);
    }

    _initializetimeslider() {
        this.destroycurrentslider();
        this.timebutton.classList.add('active');
        this.datebutton.classList.remove('active');

        const config = {
            mode: 'time',
            itemwidth: 80,
            totalitems: 25,
            initialindex: this.selecteddate.getHours() + (this.selecteddate.getMinutes() / 60),
            itemgenerator: this._createtimeitem,
            onupdate: (value) => {
                let hour = Math.floor(value);
                let minute = Math.round((value % 1) * 60);

                if (hour >= 24) {
                    hour = 23;
                    minute = 59;
                }

                this.selecteddate.setHours(hour, minute);
            }
        };
        this.destroycurrentslider = this._createslider(config);
    }

    _initializedayslider() {
        this.destroycurrentslider();
        this.datebutton.classList.add('active');
        this.timebutton.classList.remove('active');

        const dayofyear = Math.floor((this.selecteddate - new Date(this.selecteddate.getFullYear(), 0, 1)) / 86400000);
        
        const config = {
            mode: 'day',
            itemwidth: 20,
            totalitems: 365,
            initialindex: dayofyear,
            itemgenerator: this._createdayitem.bind(this),
            onupdate: (value) => {
                const newdate = new Date(this.selecteddate.getFullYear(), 0, Math.floor(value) + 1);
                this.selecteddate.setDate(newdate.getDate());
                this.selecteddate.setMonth(newdate.getMonth());
            }
        };
        this.destroycurrentslider = this._createslider(config);
    }
    
    _createtimeitem(i) {
        const item = document.createElement('div');
        item.className = 'slider-item';
        item.dataset.index = i;
        item.style.width = '80px';
        if (i < 24) {
            const date = new Date(); date.setHours(i, 0, 0, 0);
            item.innerHTML = `<div class="hour-label">${date.toLocaleTimeString('en-us', { hour: 'numeric' })}</div><div class="time-tick tick-major" style="left: 0%;"></div><div class="time-tick tick-medium" style="left: 50%;"></div><div class="time-tick tick-minor" style="left: 25%;"></div><div class="time-tick tick-minor" style="left: 75%;"></div>`;
        }
        return item;
    }

    _createdayitem(i) {
        const item = document.createElement('div');
        item.className = 'slider-item';
        item.dataset.index = i;
        item.style.width = '20px';
        
        const date = new Date(this.selecteddate.getFullYear(), 0, i + 1);
        const day = date.getDate();

        if (day === 15) {
            item.innerHTML += `<div class="month-label">${date.toLocaleDateString('en-us', { month: 'short' }).toUpperCase()}</div>`;
        }
        
        let tickclass = 'tick-minor';
        if (day === 1) tickclass = 'tick-major';
        else if (day % 5 === 0) tickclass = 'tick-medium';
        
        item.innerHTML += `<div class="time-tick ${tickclass}" style="left: 0%;"></div>`;
        return item;
    }

    _createslider(config) {
        this.slidercontainer.dataset.mode = config.mode;
        const track = this.slidercontainer.querySelector('.slider-track');
        track.innerHTML = '';
        
        for (let i = 0; i < config.totalitems; i++) {
            track.appendChild(config.itemgenerator(i));
        }

        let isdragging = false, startx, trackoffset, currenttrackoffset, currentvalue = config.initialindex, lastactiveindex = -1;

        const updatehighlight = () => {
            const activeindex = Math.floor(currentvalue);
            if (activeindex === lastactiveindex) return;
            track.querySelector('.slider-item.active')?.classList.remove('active');
            track.querySelector(`.slider-item[data-index="${activeindex}"]`)?.classList.add('active');
            lastactiveindex = activeindex;
        };
        
        const updateslider = (isanimated = true) => {
            trackoffset = - (currentvalue * config.itemwidth) + (this.slidercontainer.offsetWidth / 2);
            track.style.transition = isanimated ? 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)' : 'none';
            track.style.transform = `translateX(${trackoffset}px)`;
            updatehighlight();
            config.onupdate(currentvalue);
            this._updatedisplay();
        };

        const ondragmove = (e) => {
            if (!isdragging) return;
            const currentx = e.pageX || e.touches[0].pageX;
            const diff = currentx - startx;
            const newtrackoffset = currenttrackoffset + diff;
            track.style.transform = `translateX(${newtrackoffset}px)`;
            
            const newvalue = (-newtrackoffset + (this.slidercontainer.offsetWidth / 2)) / config.itemwidth;
            currentvalue = Math.max(0, Math.min(config.totalitems - 1, newvalue));
            
            updatehighlight();
            config.onupdate(currentvalue);
            this._updatedisplay();
            this.ontemporaryupdate();
        };

        const ondragend = () => {
            if (!isdragging) return;
            isdragging = false;
            document.body.classList.remove('dragging');
            document.removeEventListener('mousemove', ondragmove);
            document.removeEventListener('mouseup', ondragend);
            this.ontemporaryupdate.cancel();
            updateslider();
            this.onfinalupdate();
        };

        const ondragstart = (e) => {
            isdragging = true;
            startx = e.pageX || e.touches[0].pageX;
            currenttrackoffset = trackoffset;
            track.style.transition = 'none';
            document.body.classList.add('dragging');
            document.addEventListener('mousemove', ondragmove);
            document.addEventListener('mouseup', ondragend);
        };

        this.slidercontainer.addEventListener('mousedown', ondragstart);
        updateslider(false);

        return () => this.slidercontainer.removeEventListener('mousedown', ondragstart);
    }
}