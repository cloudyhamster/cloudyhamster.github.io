let destroycurrentslider = () => {};
const datebutton = document.getElementById('date-display-button');
const timebutton = document.getElementById('time-display-button');
const selecteddate = new Date();

export function getcurrentdate() {
    return new Date(selecteddate.getTime());
}

function updatedisplay() {
    const dateoptions = { month: 'long', day: 'numeric', year: 'numeric' };
    const timeoptions = { hour: 'numeric', minute: '2-digit' };
    datebutton.textContent = selecteddate.toLocaleDateString('en-us', dateoptions);
    timebutton.textContent = selecteddate.toLocaleTimeString('en-us', timeoptions);
}

function isLeapYear(y) {
    return (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
}
function daysInYear(y) {
    return isLeapYear(y) ? 366 : 365;
}

function findNearestValidTimeInDay(year, month, day, hour, minute) {
    const targetMs = new Date(year, month, day, hour, minute, 0, 0).getTime();
    const dayStartMs = new Date(year, month, day, 0, 0, 0, 0).getTime();
    const dayEndMs = new Date(year, month, day + 1, 0, 0, 0, 0).getTime() - 1;
    if (new Date(targetMs).getDate() === day) {
        const nd = new Date(targetMs);
        return { h: nd.getHours(), m: nd.getMinutes() };
    }
    const maxDeltaMinutes = 180;
    for (let d = 1; d <= maxDeltaMinutes; d++) {
        const forwardMs = targetMs + d * 60000;
        if (forwardMs <= dayEndMs && new Date(forwardMs).getDate() === day) {
            const nd = new Date(forwardMs);
            return { h: nd.getHours(), m: nd.getMinutes() };
        }
        const backMs = targetMs - d * 60000;
        if (backMs >= dayStartMs && new Date(backMs).getDate() === day) {
            const nd = new Date(backMs);
            return { h: nd.getHours(), m: nd.getMinutes() };
        }
    }
    const fallbackForward = Math.max(dayStartMs, Math.min(dayEndMs, targetMs));
    const nd = new Date(fallbackForward);
    return { h: nd.getHours(), m: nd.getMinutes() };
}

function createslider(config) {
    const container = document.getElementById(config.elementid);
    container.dataset.mode = config.mode;
    const track = container.querySelector('.slider-track');
    let isdragging = false;
    let startx = 0;
    let trackoffset = 0;
    let currenttrackoffset = 0;
    let currentvalue = config.initialindex;
    let lastactiveindex = -1;
    let lastNotifiedValue = currentvalue;
    let resizeobserver = null;

    function computeLayout() {
        const containerwidth = container.offsetWidth;
        return { containerwidth };
    }

    function recenterToValue(val, animate = true, isfinal = false, notify = true) {
        currentvalue = Math.max(0, Math.min(config.totalitems - 1, val));
        const { containerwidth } = computeLayout();
        trackoffset = - (currentvalue * config.itemwidth) + (containerwidth / 2);
        if (animate) track.style.transition = 'transform 0.28s cubic-bezier(0.25, 0.8, 0.25, 1)';
        else track.style.transition = 'none';
        track.style.transform = `translateX(${trackoffset}px)`;
        updatehighlight(currentvalue);
        if (notify) {
            config.onupdate(currentvalue, !!isfinal);
            lastNotifiedValue = currentvalue;
        } else {
            lastNotifiedValue = currentvalue;
        }
    }

    function init() {
        track.innerHTML = '';
        for (let i = 0; i < config.totalitems; i++) {
            const item = config.itemgenerator(i);
            item.dataset.index = i;
            track.appendChild(item);
        }
        recenterToValue(config.initialindex, false, false, false);
    }

    function updatehighlight(value) {
        const activeindex = Math.floor(value);
        if (activeindex === lastactiveindex) return;
        track.querySelectorAll('.slider-item.active').forEach(i => i.classList.remove('active'));
        const newactive = track.querySelector(`.slider-item[data-index="${activeindex}"]`);
        if (newactive) newactive.classList.add('active');
        lastactiveindex = activeindex;
    }

    function onPointerDown(e) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        isdragging = true;
        startx = e.pageX;
        currenttrackoffset = trackoffset;
        track.style.transition = 'none';
        document.body.classList.add('dragging');
        try { container.setPointerCapture && container.setPointerCapture(e.pointerId); } catch (err) {}
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
    }

    function onPointerMove(e) {
        if (!isdragging) return;
        e.preventDefault();
        const currentx = e.pageX;
        const diff = currentx - startx;
        const rawNewOffset = currenttrackoffset + diff;
        track.style.transform = `translateX(${rawNewOffset}px)`;
        const { containerwidth } = computeLayout();
        const newvalue = (-rawNewOffset + (containerwidth / 2)) / config.itemwidth;
        const boundedValue = Math.max(0, Math.min(config.totalitems - 1, newvalue));
        currentvalue = boundedValue;
        updatehighlight(currentvalue);
        const minDelta = config.minUpdateDelta ?? 1;
        if (Math.abs(currentvalue - lastNotifiedValue) >= minDelta) {
            lastNotifiedValue = currentvalue;
            config.onupdate(currentvalue, false);
        }
    }

    function onPointerUp(e) {
        if (!isdragging) return;
        isdragging = false;
        document.body.classList.remove('dragging');
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        const { containerwidth } = computeLayout();
        const transform = window.getComputedStyle(track).transform;
        let transformX = trackoffset;
        if (transform && transform !== 'none') {
            const m = transform.match(/matrix\(([^)]+)\)/);
            if (m) {
                const vals = m[1].split(',').map(s => parseFloat(s.trim()));
                transformX = vals[4];
            }
        }
        const finalValue = (-transformX + (containerwidth / 2)) / config.itemwidth;
        const boundedValue = Math.max(0, Math.min(config.totalitems - 1, finalValue));
        recenterToValue(boundedValue, true, true, true);
    }

    function onResize() {
        recenterToValue(currentvalue, false, false, false);
    }

    container.addEventListener('pointerdown', onPointerDown);
    resizeobserver = new ResizeObserver(onResize);
    resizeobserver.observe(container);
    init();

    return () => {
        try {
            container.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            if (resizeobserver) resizeobserver.disconnect();
        } catch (err) {}
    };
}

export function initializeSliders(updatemaplayers, debouncedupdatemaplayers) {
    function safeDestroy() {
        if (typeof debouncedupdatemaplayers?.cancel === 'function') debouncedupdatemaplayers.cancel();
        destroycurrentslider();
        destroycurrentslider = () => {};
    }

    function initializetimer() {
        safeDestroy();
        timebutton.classList.add('active');
        datebutton.classList.remove('active');
        const timesliderconfig = {
            elementid: 'slider-container',
            mode: 'time',
            itemwidth: 80,
            totalitems: 25,
            initialindex: selecteddate.getHours() + (selecteddate.getMinutes() / 60),
            minUpdateDelta: 1 / 60,
            itemgenerator: (i) => {
                const item = document.createElement('div');
                item.classList.add('slider-item');
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
                const clampedVal = Math.max(0, Math.min(23.999, value));
                const hour = Math.floor(clampedVal);
                const minute = Math.round((clampedVal % 1) * 60);
                const y = selecteddate.getFullYear();
                const m = selecteddate.getMonth();
                const d = selecteddate.getDate();
                const valid = findNearestValidTimeInDay(y, m, d, hour, minute);
                selecteddate.setHours(valid.h, valid.m, 0, 0);
                updatedisplay();
                if (isfinal) {
                    if (typeof debouncedupdatemaplayers?.cancel === 'function') debouncedupdatemaplayers.cancel();
                    updatemaplayers();
                } else {
                    debouncedupdatemaplayers();
                }
            }
        };
        destroycurrentslider = createslider(timesliderconfig);
    }

    function initializedaytimer() {
        safeDestroy();
        datebutton.classList.add('active');
        timebutton.classList.remove('active');
        const year = selecteddate.getFullYear();
        const totaldays = daysInYear(year);
        const msPerDay = 1000 * 60 * 60 * 24;
        const dayofyear = Math.floor((selecteddate - new Date(year, 0, 1)) / msPerDay);
        const daysliderconfig = {
            elementid: 'slider-container',
            mode: 'day',
            itemwidth: 20,
            totalitems: totaldays,
            initialindex: dayofyear,
            minUpdateDelta: 1,
            itemgenerator: (i) => {
                const item = document.createElement('div');
                item.classList.add('slider-item');
                item.style.width = '20px';
                const currentdate = new Date(year, 0, i + 1);
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
                let newdayofyear = Math.floor(value);
                newdayofyear = Math.max(0, Math.min(totaldays - 1, newdayofyear));
                const newDate = new Date(year, 0, newdayofyear + 1);
                const h = selecteddate.getHours();
                const m = selecteddate.getMinutes();
                selecteddate.setFullYear(year, newDate.getMonth(), newDate.getDate());
                selecteddate.setHours(h, m, 0, 0);
                updatedisplay();
                if (isfinal) {
                    if (typeof debouncedupdatemaplayers?.cancel === 'function') debouncedupdatemaplayers.cancel();
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
