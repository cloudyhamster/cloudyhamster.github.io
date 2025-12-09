import { store } from '../state.js';
import { DIFFICULTY_COLORS, DIFFICULTY_PILL_CLASSES, NON_CANON_TOWERS, AREA_DISPLAY_NAMES, AREA_COLORS, AREA_PILL_CLASSES } from '../config.js';
import { hexToRgb, getTowerType, showNotification } from '../utils.js';
import { openModalWithTower } from '../ui/modals.js';

let isSpinning = false;
const CARD_SIZE = 220; 
const CARD_GAP = 16;
const TOTAL_ITEM_WIDTH = CARD_SIZE + CARD_GAP;
const TOTAL_CARDS = 80; 
const WINNER_INDEX = 65; 

let filterState = {
    minDiff: 1.0,
    maxDiff: 12.0,
    status: 'All', 
    types: new Set(['Tower', 'Citadel', 'Steeple']),
    areas: new Set(),
    lengths: new Set(['<20 minutes', '20+ minutes', '30+ minutes', '45+ minutes', '60+ minutes', '90+ minutes']),
    showNames: false
};

export function initRoulette() {
    const style = document.createElement('style');
    style.innerHTML = `
        .roulette-card-inner { width: 100%; height: 100%; position: relative; transform-style: preserve-3d; transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .roulette-card-front, .roulette-card-back { position: absolute; width: 100%; height: 100%; backface-visibility: hidden; -webkit-backface-visibility: hidden; display: flex; align-items: center; justify-content: center; border-radius: 0.75rem; background: #121212; border: 1px solid rgba(255,255,255,0.05); transform: translateZ(0); overflow: hidden; }
        .roulette-card-back { transform: rotateY(180deg); flex-direction: column; padding: 1.5rem; text-align: center; }
        .card-texture { position: absolute; inset: 0; opacity: 0.03; background: repeating-linear-gradient(45deg, #ffffff, #ffffff 1px, transparent 1px, transparent 10px); pointer-events: none; }
        .card-totem { display: flex; gap: 6px; align-items: flex-end; height: 60px; opacity: 0.8; }
        .totem-bar { width: 12px; background: currentColor; border-radius: 4px; box-shadow: 0 0 15px currentColor; }
        .totem-bar:nth-child(1) { height: 60%; opacity: 0.5; }
        .totem-bar:nth-child(2) { height: 100%; opacity: 1.0; }
        .totem-bar:nth-child(3) { height: 60%; opacity: 0.5; }
        @keyframes subtle-pulse { 0%, 100% { opacity: 0.6; transform: scaleY(1); } 50% { opacity: 1; transform: scaleY(1.05); } }
        .animate-totem { animation: subtle-pulse 3s infinite ease-in-out; }
        .history-item-anim { animation: slide-in-left 0.4s ease-out forwards; }
        @keyframes slide-in-left { 0% { opacity: 0; transform: translateX(-20px); } 100% { opacity: 1; transform: translateX(0); } }
        
        .roul-check-item { display: flex; align-items: center; gap: 12px; padding: 8px 12px; border-radius: 6px; cursor: pointer; user-select: none; transition: background 0.1s ease; width: 100%; box-sizing: border-box; }
        .roul-check-item:hover { background-color: rgba(255, 255, 255, 0.08) !important; }
        .roul-check-item input { appearance: none; -webkit-appearance: none; width: 18px; height: 18px; border: 2px solid currentColor !important; border-radius: 4px; background-color: transparent !important; box-shadow: none !important; outline: none !important; color: currentColor; display: grid; place-content: center; margin: 0; flex-shrink: 0; cursor: pointer; transition: background-color 0.1s ease; }
        .roul-check-item input:checked { background-color: currentColor !important; border-color: currentColor !important; background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='black' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e"); background-size: 12px 12px; background-position: center; background-repeat: no-repeat; }
        .pool-item { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; border-radius: 6px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); transition: all 0.2s; }
        .pool-item:hover { background: rgba(255,255,255,0.05); }

        .toggle-checkbox { right: calc(100% - 1.25rem); }
        .toggle-checkbox:checked { right: 0; border-color: #ffffff; }
        .toggle-checkbox:checked + .toggle-label { 
            background-color: #BE00FF; 
            box-shadow: 0 0 15px rgba(190, 0, 255, 0.4); 
            border-color: #BE00FF;
        }
    `;
    document.head.appendChild(style);

    const btn = document.getElementById('btn-spin-roulette');
    const detailsBtn = document.getElementById('roulette-view-details');
    const clearBtn = document.getElementById('btn-clear-history');
    const showNamesToggle = document.getElementById('toggle-show-names');
    
    if (btn) btn.addEventListener('click', spin);
    if (detailsBtn) detailsBtn.addEventListener('click', () => openModalWithTower(document.getElementById('roulette-winner-name').textContent));
    if (clearBtn) clearBtn.addEventListener('click', () => {
        document.getElementById('roulette-history').innerHTML = '<div id="history-empty" class="text-xs text-gray-700 italic px-2 py-4">Spin the wheel to see history...</div>';
    });

    if (showNamesToggle) {
        showNamesToggle.addEventListener('change', (e) => {
            filterState.showNames = e.target.checked;
            resetTrack(); 
        });
    }

    if (store.allTowers.length > 0) {
        initFilters();
        resetTrack();
    }
    store.subscribe('towersLoaded', () => {
        initFilters();
        resetTrack();
    });
}

function initFilters() {
    const minIn = document.getElementById('roul-diff-min');
    const maxIn = document.getElementById('roul-diff-max');
    
    if (minIn) {
        const newMin = minIn.cloneNode(true);
        minIn.parentNode.replaceChild(newMin, minIn);
        newMin.addEventListener('change', (e) => { filterState.minDiff = parseFloat(e.target.value) || 0; refreshState(); });
    }
    if (maxIn) {
        const newMax = maxIn.cloneNode(true);
        maxIn.parentNode.replaceChild(newMax, maxIn);
        newMax.addEventListener('change', (e) => { filterState.maxDiff = parseFloat(e.target.value) || 12; refreshState(); });
    }

    const statusBtns = document.querySelectorAll('.roul-status-btn');
    statusBtns.forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        updateBtnStyle(newBtn, newBtn.dataset.value === filterState.status);
        newBtn.addEventListener('click', () => {
            filterState.status = newBtn.dataset.value;
            document.querySelectorAll('.roul-status-btn').forEach(b => updateBtnStyle(b, b === newBtn));
            refreshState();
        });
    });

    const typeBtns = document.querySelectorAll('.roul-type-btn');
    typeBtns.forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        const val = newBtn.dataset.value;
        updateBtnStyle(newBtn, filterState.types.has(val));
        
        newBtn.addEventListener('click', () => {
            if (filterState.types.has(val)) filterState.types.delete(val);
            else filterState.types.add(val);
            updateBtnStyle(newBtn, filterState.types.has(val));
            refreshState();
        });
    });

    const areas = Array.from(new Set(store.allTowers.map(t => t.area).filter(Boolean)));
    filterState.areas = new Set(areas); 
    
    const hierarchyMap = {
        "Ring 1": ["Forgotten Ridge"], 
        "Ring 2": ["Garden Of Eesh%C3%B6L"], 
        "Ring 4": ["Silent Abyss"],
        "Ring 5": ["Lost River"], 
        "Ring 6": ["Ashen Towerworks"], 
        "Ring 8": ["The Starlit Archives"],
        "Zone 2": ["Arcane Area"], 
        "Zone 3": ["Paradise Atoll"]
    };
    let sortedAreaList = [];
    for (let i = 0; i <= 9; i++) {
        const ring = `Ring ${i}`;
        if (areas.includes(ring)) sortedAreaList.push({ name: ring, isSub: false });
        if (hierarchyMap[ring]) hierarchyMap[ring].forEach(sub => { if (areas.includes(sub)) sortedAreaList.push({ name: sub, isSub: true }); });
    }
    for (let i = 1; i <= 10; i++) {
        const zone = `Zone ${i}`;
        if (areas.includes(zone)) sortedAreaList.push({ name: zone, isSub: false });
        if (hierarchyMap[zone]) hierarchyMap[zone].forEach(sub => { if (areas.includes(sub)) sortedAreaList.push({ name: sub, isSub: true }); });
    }
    const caughtSet = new Set(sortedAreaList.map(x => x.name));
    areas.forEach(a => { if (!caughtSet.has(a)) sortedAreaList.push({ name: a, isSub: false }); });

    const areaList = document.getElementById('roul-area-list');
    const areaBtn = document.getElementById('roul-area-btn');
    const areaMenu = document.getElementById('roul-area-menu');
    
    if (areaList && areaList.children.length === 0) {
        sortedAreaList.forEach(item => {
            const display = AREA_DISPLAY_NAMES[item.name] || item.name;
            const el = createCheckboxItem(display, item.name, 
                () => filterState.areas.has(item.name),
                () => {
                    if (filterState.areas.has(item.name)) filterState.areas.delete(item.name);
                    else filterState.areas.add(item.name);
                    updateDropdownLabel(areaBtn, filterState.areas.size, areas.length, "Areas");
                    refreshState();
                },
                AREA_COLORS[item.name]
            );
            if (item.isSub) el.style.marginLeft = '16px';
            areaList.appendChild(el);
        });
        
        const newAreaBtn = areaBtn.cloneNode(true);
        areaBtn.parentNode.replaceChild(newAreaBtn, areaBtn);

        newAreaBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            areaMenu.classList.toggle('hidden');
            document.getElementById('roul-len-menu').classList.add('hidden');
        });
    }

    const lenList = document.getElementById('roul-len-list');
    const lenBtn = document.getElementById('roul-len-btn');
    const lenMenu = document.getElementById('roul-len-menu');
    const lengths = ['<20 minutes', '20+ minutes', '30+ minutes', '45+ minutes', '60+ minutes', '90+ minutes'];

    if (lenList && lenList.children.length === 0) {
        lengths.forEach(len => {
            const el = createCheckboxItem(len, len,
                () => filterState.lengths.has(len),
                () => {
                    if (filterState.lengths.has(len)) filterState.lengths.delete(len);
                    else filterState.lengths.add(len);
                    updateDropdownLabel(lenBtn, filterState.lengths.size, lengths.length, "Lengths");
                    refreshState();
                },
                '#FFA500'
            );
            lenList.appendChild(el);
        });

        const newLenBtn = lenBtn.cloneNode(true);
        lenBtn.parentNode.replaceChild(newLenBtn, lenBtn);

        newLenBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            lenMenu.classList.toggle('hidden');
            document.getElementById('roul-area-menu').classList.add('hidden');
        });
    }

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.relative')) {
            if(areaMenu) areaMenu.classList.add('hidden');
            if(lenMenu) lenMenu.classList.add('hidden');
        }
    });

    if(areaBtn) updateDropdownLabel(document.getElementById('roul-area-btn'), filterState.areas.size, areas.length, "Areas");
    if(lenBtn) updateDropdownLabel(document.getElementById('roul-len-btn'), filterState.lengths.size, lengths.length, "Lengths");
    
    renderMasterList();
}

function createCheckboxItem(text, value, isCheckedFn, toggleFn, colorHex) {
    const label = document.createElement('label');
    label.className = 'roul-check-item text-xs text-gray-300';
    
    const rgb = hexToRgb(colorHex) || [128, 128, 128];
    const bgStyle = `background: linear-gradient(90deg, rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.04) 0%, rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.01) 100%); border-left: 3px solid ${colorHex};`;
    label.style.cssText = bgStyle;
    label.style.color = colorHex;

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = isCheckedFn();
    
    const span = document.createElement('span');
    span.className = 'text-gray-200 font-medium';
    span.textContent = text;

    input.addEventListener('change', () => {
        toggleFn();
    });

    label.appendChild(input);
    label.appendChild(span);
    return label;
}

function updateBtnStyle(btn, isActive) {
    if (isActive) {
        btn.classList.remove('text-gray-400', 'hover:text-white');
        btn.classList.add('bg-[#BE00FF]', 'text-white');
    } else {
        btn.classList.remove('bg-[#BE00FF]', 'text-white');
        btn.classList.add('text-gray-400', 'hover:text-white');
    }
}

function updateDropdownLabel(btn, count, total, label) {
    if (!btn) return;
    const span = btn.querySelector('span');
    if (count === 0) span.textContent = "None Selected";
    else if (count === total) span.textContent = `All ${label}`;
    else span.textContent = `${count} ${label} Selected`;
}

function refreshState() {
    resetTrack();
    renderMasterList();
}

function getValidTowers() {
    const beatenSet = new Set(store.beatenTowers.map(t => t.name));

    return store.allTowers.filter(t => {
        if (NON_CANON_TOWERS.has(t.name)) return false;

        const num = t.number_difficulty || 0;
        if (num < filterState.minDiff || num > filterState.maxDiff) return false;

        const isBeaten = beatenSet.has(t.name);
        if (filterState.status === 'Completed' && !isBeaten) return false;
        if (filterState.status === 'Incomplete' && isBeaten) return false;

        if (!filterState.types.has(getTowerType(t.name))) return false;
        if (!filterState.areas.has(t.area)) return false;

        const rawLen = t.length || '<20 minutes';
        const cleanLen = rawLen.replace(' long', '').trim();
        if (!filterState.lengths.has(cleanLen)) return false;

        return true;
    });
}

function renderMasterList() {
    const container = document.getElementById('roulette-master-list');
    if (!container) return;

    container.classList.remove('gap-1');
    container.classList.add('gap-[2px]');

    const towers = getValidTowers();
    towers.sort((a, b) => (b.number_difficulty || 0) - (a.number_difficulty || 0));

    container.innerHTML = towers.map(t => {
        const diffColor = DIFFICULTY_COLORS[t.difficulty] || '#808080';
        const rgb = hexToRgb(diffColor) || [128, 128, 128];
        
        let textColor = diffColor;
        if (t.difficulty === 'Intense') textColor = '#9CA3AF';
        if (t.difficulty === 'Insane') textColor = '#60A5FA';

        const style = `
            background: linear-gradient(90deg, rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.08) 0%, rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.01) 100%); 
            border-left: 3px solid ${diffColor};
        `;
        
        return `
            <div class="pool-item flex items-center justify-between px-3 py-2 rounded border border-white/5 hover:bg-white/5 transition-colors cursor-default" style="${style}">
                <span class="text-xs font-bold text-gray-200 truncate pr-2" title="${t.name}">
                    ${t.name}
                </span>
                <span class="text-[10px] font-mono font-bold whitespace-nowrap" style="color:${textColor}">
                    ${t.difficulty}
                </span>
            </div>
        `;
    }).join('');
}

function resetTrack() {
    if (isSpinning) return;
    const track = document.getElementById('roulette-track');
    const btn = document.getElementById('btn-spin-roulette');
    
    if (!track) return;
    
    track.style.transition = 'none';
    track.style.transform = 'translateX(0px)';
    track.innerHTML = '';

    const towers = getValidTowers();
    
    if (towers.length === 0) {
        track.innerHTML = '<div class="text-gray-500 font-mono">No towers match your filters</div>';
        if(btn) { btn.disabled = true; btn.classList.add('opacity-50', 'cursor-not-allowed'); }
        return;
    }

    if(btn) { btn.disabled = false; btn.classList.remove('opacity-50', 'cursor-not-allowed'); }

    for (let i = 0; i < 15; i++) {
        const t = towers[Math.floor(Math.random() * towers.length)];
        track.appendChild(createCard(t));
    }
}

function spin() {
    if (isSpinning) return;
    const track = document.getElementById('roulette-track');
    const btn = document.getElementById('btn-spin-roulette');
    const resultEl = document.getElementById('roulette-result');
    const towers = getValidTowers();

    if (towers.length === 0) return;

    isSpinning = true;
    btn.disabled = true;
    btn.classList.add('opacity-50');
    
    resultEl.classList.remove('opacity-100', 'translate-y-0');
    resultEl.classList.add('opacity-0', 'translate-y-4');

    const winner = towers[Math.floor(Math.random() * towers.length)];

    track.innerHTML = '';
    track.style.transition = 'none';
    track.style.transform = 'translateX(0px)';

    for (let i = 0; i < TOTAL_CARDS; i++) {
        let t;
        if (i === WINNER_INDEX) {
            t = winner;
        } else {
            t = towers[Math.floor(Math.random() * towers.length)];
        }
        
        const card = createCard(t);
        if (i === WINNER_INDEX) card.id = 'winning-card'; 
        track.appendChild(card);
    }

    const randomOffset = (Math.random() * (CARD_SIZE - 40)) - ((CARD_SIZE - 40) / 2); 
    const distanceToMove = (WINNER_INDEX * TOTAL_ITEM_WIDTH) + (CARD_SIZE / 2) + randomOffset;

    track.offsetHeight; 

    track.style.transition = 'transform 6s cubic-bezier(0.1, 0.9, 0.2, 1.0)';
    track.style.transform = `translateX(-${distanceToMove}px)`;

    setTimeout(() => {
        isSpinning = false;
        btn.disabled = false;
        btn.classList.remove('opacity-50');
        
        const winningCard = document.getElementById('winning-card');
        if (winningCard) {
            const inner = winningCard.querySelector('.roulette-card-inner');
            inner.style.transform = 'rotateY(180deg)';
            
            winningCard.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            winningCard.style.zIndex = '50';
            winningCard.style.transform = 'scale(1.1)'; 
            
            const diffColor = DIFFICULTY_COLORS[winner.difficulty] || '#ffffff';
            const rgb = hexToRgb(diffColor) || [255, 255, 255];
            
            winningCard.style.boxShadow = `0 0 45px rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.5)`;
            winningCard.style.borderColor = diffColor;
        }

        showResult(winner);
        addToHistory(winner); 
    }, 6000); 
}

function addToHistory(tower) {
    const container = document.getElementById('roulette-history');
    const emptyMsg = document.getElementById('history-empty');
    if (emptyMsg) emptyMsg.remove();

    const diffColor = DIFFICULTY_COLORS[tower.difficulty] || '#808080';
    const pillClass = DIFFICULTY_PILL_CLASSES[tower.difficulty] || DIFFICULTY_PILL_CLASSES.nil;

    const item = document.createElement('div');
    item.className = "history-item-anim flex-shrink-0 w-48 bg-[#0F0F13] border border-white/5 rounded-lg p-3 flex flex-col justify-between hover:bg-white/5 transition-colors cursor-pointer group";
    item.style.borderLeft = `3px solid ${diffColor}`;

    item.innerHTML = `
        <div>
            <h5 class="text-sm font-bold text-white truncate mb-1 group-hover:text-white transition-colors">${tower.name}</h5>
            <p class="text-[10px] text-gray-500 uppercase tracking-wider">${tower.area}</p>
        </div>
        <div class="mt-2 flex justify-between items-center">
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded border ${pillClass}">
                ${tower.difficulty}
            </span>
        </div>
    `;
    item.addEventListener('click', () => openModalWithTower(tower.name));
    container.prepend(item);
    if (container.children.length > 20) container.lastElementChild.remove();
}

function createCard(tower) {
    const wrapper = document.createElement('div');
    wrapper.className = `flex-shrink-0 relative group`;
    wrapper.style.width = `${CARD_SIZE}px`;
    wrapper.style.height = `${CARD_SIZE}px`;

    const diffColor = DIFFICULTY_COLORS[tower.difficulty] || '#808080';
    const pillClass = DIFFICULTY_PILL_CLASSES[tower.difficulty] || DIFFICULTY_PILL_CLASSES.nil;

    let frontContent = '';
    if (filterState.showNames) {
        frontContent = `
            <div class="text-center p-4">
                <h4 class="text-lg font-black text-white leading-tight line-clamp-4">${tower.name}</h4>
            </div>
        `;
    } else {
        frontContent = `
            <div class="card-totem animate-totem" style="color: ${diffColor}">
                <div class="totem-bar"></div>
                <div class="totem-bar"></div>
                <div class="totem-bar"></div>
            </div>
        `;
    }

    const frontHtml = `
        <div class="roulette-card-front">
            <div class="card-texture"></div>
            ${frontContent}
            <div class="absolute bottom-0 left-0 right-0 h-1.5" style="background: ${diffColor}; box-shadow: 0 -5px 15px ${diffColor}60"></div>
        </div>
    `;

    const backStyle = `border-bottom: 4px solid ${diffColor};`;
    const backHtml = `
        <div class="roulette-card-back" style="${backStyle}">
            <p class="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-4">You got</p>
            <h4 class="text-xl font-black text-white leading-tight mb-4 line-clamp-3 h-[4.5rem] flex items-center justify-center">
                ${tower.name}
            </h4>
            <div class="mt-auto w-full">
                <div class="text-xs font-bold px-3 py-1.5 rounded border w-full truncate shadow-sm ${pillClass}">
                    ${tower.difficulty}
                </div>
            </div>
        </div>
    `;

    wrapper.innerHTML = `
        <div class="roulette-card-inner">
            ${frontHtml}
            ${backHtml}
        </div>
    `;
    return wrapper;
}

function showResult(tower) {
    const container = document.getElementById('roulette-result');
    const nameEl = document.getElementById('roulette-winner-name');
    const diffEl = document.getElementById('roulette-winner-diff');

    nameEl.textContent = tower.name;
    const diffClass = DIFFICULTY_PILL_CLASSES[tower.difficulty] || DIFFICULTY_PILL_CLASSES.nil;
    diffEl.className = `px-4 py-1.5 rounded-full text-sm font-bold border ${diffClass}`;
    const val = tower.number_difficulty ? tower.number_difficulty.toFixed(2) : "0.00";
    diffEl.textContent = `${tower.difficulty} [${val}]`;
    container.classList.remove('opacity-0', 'translate-y-4');
    container.classList.add('opacity-100', 'translate-y-0');
}