let destroycurrentslider = () => {};
const datebutton = document.getElementById('date-display-button');
const timebutton = document.getElementById('time-display-button');
const basedate = new Date();
basedate.setHours(0,0,0,0);
let currenttimeoffsethours = new Date().getHours() + (new Date().getMinutes() / 60);

export function getcurrentdate() {
    const d = new Date(basedate);
    d.setMilliseconds(d.getMilliseconds() + (currenttimeoffsethours * 60 * 60 * 1000));
    return d;
}

function updatedisplay() {
    const currentdate = getcurrentdate();
    const dateoptions = { month: 'long', day: 'numeric', year: 'numeric' };
    const timeoptions = { hour: 'numeric', minute: '2-digit' };
    datebutton.textContent = currentdate.toLocaleDateString('en-us', dateoptions);
    timebutton.textContent = currentdate.toLocaleTimeString('en-us', timeoptions);
}

function createslider(config) {
    const container = document.getElementById(config.elementid);
    container.dataset.mode = config.mode;
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
        
        track.querySelectorAll('.slider-item.active').forEach(i => i.classList.remove('active'));
        const newactive = track.querySelector(`.slider-item[data-index="${activeindex}"]`);
        if (newactive) newactive.classList.add('active');
        lastactiveindex = activeindex;
    }

    function updateslider(value, isanimated = true) {
        currentvalue = value;
        const containerwidth = container.offsetWidth;
        trackoffset = - (currentvalue * config.itemwidth) + (containerwidth / 2);
        if (isanimated) track.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)';
        else track.style.transition = 'none';
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
        updateslider(currentvalue, true);
    }
    
    container.addEventListener('mousedown', ondragstart);
    init();

    return () => {
        container.removeEventListener('mousedown', ondragstart);
    };
}

function normalizestate() {
    const currentdate = getcurrentdate();
    basedate.setFullYear(currentdate.getFullYear());
    basedate.setMonth(currentdate.getMonth());
    basedate.setDate(currentdate.getDate());
    currenttimeoffsethours = currentdate.getHours() + (currentdate.getMinutes() / 60);
}

export function initializeSliders(updatemaplayers, debouncedupdatemaplayers) {
    function initializetimer() {
        destroycurrentslider();
        normalizestate();
        timebutton.classList.add('active');
        datebutton.classList.remove('active');

        const timesliderconfig = {
            elementid: 'slider-container',
            mode: 'time',
            itemwidth: 80,
            totalitems: 25,
            initialindex: currenttimeoffsethours,
            itemgenerator: (i) => {
                const item = document.createElement('div');
                item.classList.add('slider-item');
                item.dataset.index = i;
                item.style.width = '80px';
                if (i < 24) {
                    const date = new Date(); date.setHours(i, 0, 0, 0);
                    const hourlabel = document.createElement('div');
                    hourlabel.classList.add('hour-label');
                    hourlabel.textContent = date.toLocaleTimeString('en-us', { hour: 'numeric' });
                    item.appendChild(hourlabel);
                }
                const majortick = document.createElement('div'); majortick.classList.add('time-tick', 'tick-major'); majortick.style.left = '0%'; item.appendChild(majortick);
                if (i < 24) {
                    const mediumtick = document.createElement('div'); mediumtick.classList.add('time-tick', 'tick-medium'); mediumtick.style.left = '50%'; item.appendChild(mediumtick);
                    const minortick1 = document.createElement('div'); minortick1.classList.add('time-tick', 'tick-minor'); minortick1.style.left = '25%'; item.appendChild(minortick1);
                    const minortick2 = document.createElement('div'); minortick2.classList.add('time-tick', 'tick-minor'); minortick2.style.left = '75%'; item.appendChild(minortick2);
                }
                return item;
            },
            onupdate: (value, isfinal) => {
                currenttimeoffsethours = value;
                updatedisplay();
                if (isfinal) {
                    debouncedupdatemaplayers.cancel();
                    updatemaplayers();
                } else {
                    debouncedupdatemaplayers();
                }
            }
        };
        destroycurrentslider = createslider(timesliderconfig);
    }

    function initializedaytimer() {
        destroycurrentslider();
        normalizestate();
        datebutton.classList.add('active');
        timebutton.classList.remove('active');
        
        const dayofyear = Math.floor((basedate - new Date(basedate.getFullYear(), 0, 1)) / (1000 * 60 * 60 * 24));

        const daysliderconfig = {
            elementid: 'slider-container',
            mode: 'day',
            itemwidth: 20,
            totalitems: 365,
            initialindex: dayofyear,
            itemgenerator: (i) => {
                const item = document.createElement('div');
                item.classList.add('slider-item');
                item.dataset.index = i;
                item.style.width = '20px';
                
                const currentdate = new Date(basedate.getFullYear(), 0, i + 1);
                const dayofmonth = currentdate.getDate();

                if (dayofmonth === 15) {
                    const monthlabel = document.createElement('div');
                    monthlabel.classList.add('month-label');
                    monthlabel.textContent = currentdate.toLocaleDateString('en-us', { month: 'short' }).toUpperCase();
                    item.appendChild(monthlabel);
                }
                
                const tick = document.createElement('div');
                tick.classList.add('time-tick');
                tick.style.left = '0%';
                if (dayofmonth === 1) {
                    tick.classList.add('tick-major');
                } else if (dayofmonth % 5 === 0) {
                    tick.classList.add('tick-medium');
                } else {
                    tick.classList.add('tick-minor');
                }
                item.appendChild(tick);

                return item;
            },
            onupdate: (value, isfinal) => {
                const newdayofyear = Math.floor(value);
                basedate.setMonth(0);
                basedate.setDate(newdayofyear + 1);
                updatedisplay();
                if (isfinal) {
                    debouncedupdatemaplayers.cancel();
                    updatemaplayers();
                } else {
                    debouncedupdatemaplayers();
                }
            }
        };
        destroycurrentslider = createslider(daysliderconfig);
    }

    timebutton.addEventListener('click', initializetimer);
    datebutton.addEventListener('click', initializedaytimer);

    updatedisplay();
    initializetimer();
}