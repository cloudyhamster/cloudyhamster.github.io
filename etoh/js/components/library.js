import { store } from '../state.js';
import { AREA_DISPLAY_NAMES, DIFFICULTY_COLORS, NON_CANON_TOWERS, AREA_PILL_CLASSES, DIFFICULTY_PILL_CLASSES, AREA_COLORS } from '../config.js';
import { getTowerType, hexToRgb } from '../utils.js';
import { openModalWithTower } from '../ui/modals.js';

let libFilterMode = 'range';
let libMinDiff = 1.0;
let libMaxDiff = 12.0;
let libSelectedDiffs = new Set();
let libSelectedAreas = new Set();
let libStatusValue = 'All';
let libSortOrder = 'desc';
let libSelectedTypes = new Set(['Tower', 'Citadel', 'Steeple']);
let libSelectedLengths = new Set();
let libMinFloors = null;
let libMaxFloors = null;
let libSelectedCreators = new Set();

const ACTIVE_STYLE = ['bg-[#BE00FF]/10', 'text-white', 'border-[#BE00FF]/30'];
const INACTIVE_STYLE = ['bg-white/5', 'text-gray-300', 'border-white/10', 'hover:bg-white/10'];
const DROPDOWN_ITEM_BASE = ['text-left', 'px-3', 'py-2', 'text-xs', 'font-bold', 'rounded', 'border', 'cursor-pointer', 'transition-colors', 'select-none'];

export function initLibrary() {
    if (store.allTowers.length > 0) {
        initLibraryComponents();
    }

    store.subscribe('towersLoaded', () => {
        initLibraryComponents();
        renderLibrary();
    });

    store.subscribe('userChanged', () => {
        renderLibrary();
    });

    const container = document.getElementById('library-container');
    if (container) {
        container.addEventListener('click', (e) => {
            const row = e.target.closest('.tower-row');
            if (row && row.dataset.towerName) {
                openModalWithTower(row.dataset.towerName);
            }
        });
    }

    const inputs = [
        document.getElementById('lib-search'),
        document.getElementById('diff-min-input'),
        document.getElementById('diff-max-input'),
        document.getElementById('floor-min-input'),
        document.getElementById('floor-max-input')
    ];
    inputs.forEach(input => input && input.addEventListener('input', () => renderLibrary()));
    
    const diffMin = document.getElementById('diff-min-input');
    const diffMax = document.getElementById('diff-max-input');
    const floorMin = document.getElementById('floor-min-input');
    const floorMax = document.getElementById('floor-max-input');

    if (diffMin) diffMin.addEventListener('change', (e) => { libMinDiff = parseFloat(e.target.value) || 0; renderLibrary(); });
    if (diffMax) diffMax.addEventListener('change', (e) => { libMaxDiff = parseFloat(e.target.value) || 12; renderLibrary(); });
    if (floorMin) floorMin.addEventListener('change', (e) => { libMinFloors = e.target.value ? parseInt(e.target.value) : null; renderLibrary(); });
    if (floorMax) floorMax.addEventListener('change', (e) => { libMaxFloors = e.target.value ? parseInt(e.target.value) : null; renderLibrary(); });

    const btnModeRange = document.getElementById('btn-mode-range');
    const btnModeSelect = document.getElementById('btn-mode-select');
    const diffUiRange = document.getElementById('diff-ui-range');
    const diffUiSelect = document.getElementById('diff-ui-select');

    if (btnModeRange && btnModeSelect) {
        const setActive = (el, isActive) => {
            if (isActive) {
                el.className = "px-2 py-1.5 text-[10px] lg:text-xs font-bold rounded transition-all bg-[#BE00FF] text-white";
            } else {
                el.className = "px-2 py-1.5 text-[10px] lg:text-xs font-bold rounded transition-all text-gray-400 hover:text-white";
            }
        };

        btnModeRange.addEventListener('click', () => {
            libFilterMode = 'range';
            setActive(btnModeRange, true);
            setActive(btnModeSelect, false);
            diffUiRange.classList.remove('hidden');
            diffUiSelect.classList.add('hidden');
            renderLibrary();
        });

        btnModeSelect.addEventListener('click', () => {
            libFilterMode = 'select';
            setActive(btnModeSelect, true);
            setActive(btnModeRange, false);
            diffUiSelect.classList.remove('hidden');
            diffUiRange.classList.add('hidden');
            renderLibrary();
        });
    }
}

export function renderLibrary() {
    const libraryContainer = document.getElementById('library-container');
    const allTowersData = store.allTowers;
    const beatenTowersData = store.beatenTowers;

    libraryContainer.innerHTML = '';
    if (!allTowersData || allTowersData.length === 0) {
        libraryContainer.innerHTML = '<div class="p-8 text-center text-gray-500 text-sm">No tower data loaded. Please wait...</div>';
        return;
    }

    const searchVal = document.getElementById('lib-search').value.toLowerCase();
    const beatenSet = new Set(beatenTowersData.map(t => t.name));
    const beatenMap = new Map(beatenTowersData.map(t => [t.name, t]));

    const filteredTowers = allTowersData.filter(t => {
        if (NON_CANON_TOWERS.has(t.name)) return false;
        if (searchVal && !t.name.toLowerCase().includes(searchVal)) return false;
        if (libFilterMode === 'range') {
            const num = t.number_difficulty || 0;
            if (num < libMinDiff || num > libMaxDiff) return false;
        } else {
            if (!libSelectedDiffs.has(t.difficulty)) return false;
        }
        if (!libSelectedAreas.has(t.area)) return false;
        if (libSelectedTypes.size > 0 && !libSelectedTypes.has(getTowerType(t.name))) return false;

        const rawLen = t.length || '<20 minutes';
        const cleanLen = rawLen.replace(' long', '').trim();
        if (!libSelectedLengths.has(cleanLen)) return false;

        const floors = t.floors ?? 10;
        if (libMinFloors !== null && floors < libMinFloors) return false;
        if (libMaxFloors !== null && floors > libMaxFloors) return false;

        const creators = Array.isArray(t.creators) ? t.creators.flatMap(c => c.split(',').map(x => x.trim())) : [];
        const hasSelectedCreator = creators.length === 0 ? libSelectedCreators.has("Unknown") : creators.some(c => libSelectedCreators.has(c));
        if (!hasSelectedCreator) return false;

        const isCompleted = beatenSet.has(t.name);
        if (libStatusValue === 'Completed' && !isCompleted) return false;
        if (libStatusValue === 'Incomplete' && isCompleted) return false;
        return true;
    });

    if (filteredTowers.length === 0) {
        libraryContainer.innerHTML = '<div class="p-8 text-center text-gray-500 text-sm">No towers match your filters.</div>';
        return;
    }

    filteredTowers.sort((a, b) => {
        const diffA = a.number_difficulty || 0;
        const diffB = b.number_difficulty || 0;
        return libSortOrder === 'desc' ? diffB - diffA : diffA - diffB;
    });

    let rowsHtml = '';
    
    filteredTowers.forEach((tower, index) => {
        const beatenVersion = beatenMap.get(tower.name);
        const isCompleted = !!beatenVersion;
        const completionRgb = isCompleted ? '67, 255, 129' : '255, 50, 50';
        
        const diffHex = DIFFICULTY_COLORS[tower.difficulty] || '#808080';
        const diffRgb = (hexToRgb(diffHex) || [128, 128, 128]).join(', ');
        
        const dateStr = isCompleted ? new Date(beatenVersion.awarded_unix * 1000).toLocaleDateString() : '--';
        const areaClass = AREA_PILL_CLASSES[tower.area] || AREA_PILL_CLASSES.Default;
        const diffClass = DIFFICULTY_PILL_CLASSES[tower.difficulty] || DIFFICULTY_PILL_CLASSES.nil;
        const diffContent = `${tower.modifier||''} ${tower.difficulty||''} [${(tower.number_difficulty||0).toFixed(2)}]`.trim();

        rowsHtml += `<tr class="tower-row ${isCompleted?'status-outline-completed':'status-outline-incomplete'}" style="--difficulty-rgb: ${completionRgb}; --area-rgb: ${diffRgb}; padding-left: 12px;" data-tower-name="${tower.name}"><td class="py-1 px-1 text-xs text-gray-600 font-mono w-6 text-center flex-shrink-0">${index + 1}</td><td class="py-1 px-3 text-left ${isCompleted?'text-gray-200':'text-gray-500'} flex-1 truncate">${tower.name}</td><td class="py-1 px-3 text-right flex-shrink-0"><div class="flex justify-end items-center gap-2 flex-wrap"><span class="inline-block py-0.5 px-2.5 rounded-full text-xs font-medium border border-gray-500/50 ${isCompleted?'text-gray-300 bg-gray-500/10':'text-gray-600 bg-gray-500/10'}">${dateStr}</span><span class="inline-block py-0.5 px-2.5 rounded-full text-xs font-medium border ${diffClass}">${diffContent}</span><span class="inline-block py-0.5 px-2.5 rounded-full text-xs font-medium border ${areaClass}">${AREA_DISPLAY_NAMES[tower.area]||tower.area}</span></div></td></tr>`;
    });
    libraryContainer.innerHTML = `<table class="w-full text-sm"><tbody>${rowsHtml}</tbody></table>`;
}

function initLibraryComponents() {
    const allTowersData = store.allTowers;
    if (allTowersData.length === 0) return;

    const areaListContainer = document.getElementById('area-list-container');
    if (areaListContainer.children.length > 0) return; 

    const createDropdownItem = (text, value, isSelected, onClick, colorHex = null) => {
        const div = document.createElement('div');
        div.textContent = text;
        div.className = DROPDOWN_ITEM_BASE.join(' ');
        
        const updateStyle = () => {
            const selected = isSelected(value);
            
            div.classList.remove(...ACTIVE_STYLE, ...INACTIVE_STYLE);
            div.style.background = '';
            div.style.borderLeft = '';
            div.style.borderTop = '';
            div.style.borderRight = '';
            div.style.borderBottom = '';
            div.classList.remove('text-white', 'text-gray-400', 'font-medium');

            if (colorHex) {
                const rgb = hexToRgb(colorHex) || [128, 128, 128];
                const opacity = selected ? 0.15 : 0.04;
                
                div.style.background = `linear-gradient(90deg, rgba(${rgb[0]},${rgb[1]},${rgb[2]},${opacity}) 0%, rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.01) 100%)`;
                div.style.borderLeft = `3px solid ${colorHex}`;
                div.style.borderTop = '1px solid transparent';
                div.style.borderRight = '1px solid transparent';
                div.style.borderBottom = '1px solid transparent';

                if (selected) {
                    div.classList.add('text-white');
                } else {
                    div.classList.add('text-gray-400');
                }
            } else {
                if (selected) {
                    div.classList.add(...ACTIVE_STYLE);
                } else {
                    div.classList.add(...INACTIVE_STYLE);
                }
            }
        };
        
        updateStyle(); 

        div.addEventListener('click', (e) => {
            e.stopPropagation();
            onClick(value);
            updateStyle();
        });
        
        return div;
    };

    const areaMenu = document.getElementById('area-dropdown-menu');
    const diffMenu = document.getElementById('diff-dropdown-menu');
    const lengthMenu = document.getElementById('length-dropdown-menu');
    const creatorMenu = document.getElementById('creator-dropdown-menu');
    const menus = [areaMenu, diffMenu, lengthMenu, creatorMenu];

    const toggleDropdown = (targetMenu) => {
        const isHidden = targetMenu.classList.contains('hidden');
        menus.forEach(m => m.classList.add('hidden'));
        if (isHidden) targetMenu.classList.remove('hidden');
    };

    const statusBtns = document.querySelectorAll('.status-filter-btn');
    statusBtns.forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        if (newBtn.dataset.value === libStatusValue) {
            newBtn.classList.remove(...INACTIVE_STYLE, 'text-gray-400', 'hover:text-white');
            newBtn.classList.add(...ACTIVE_STYLE);
        } else {
            newBtn.classList.remove(...ACTIVE_STYLE, 'bg-[#BE00FF]', 'text-white');
            newBtn.classList.add(...INACTIVE_STYLE);
        }

        newBtn.addEventListener('click', () => {
            libStatusValue = newBtn.dataset.value;
            statusBtns.forEach(b => {
                const fresh = document.querySelector(`.status-filter-btn[data-value="${b.dataset.value}"]`);
                if(fresh) {
                    fresh.classList.remove(...ACTIVE_STYLE);
                    fresh.classList.add(...INACTIVE_STYLE);
                }
            });
            newBtn.classList.remove(...INACTIVE_STYLE);
            newBtn.classList.add(...ACTIVE_STYLE);
            renderLibrary();
        });
    });

    const typeBtns = document.querySelectorAll('.type-filter-btn');
    typeBtns.forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        const val = newBtn.dataset.value;
        if (libSelectedTypes.has(val)) {
            newBtn.classList.remove(...INACTIVE_STYLE);
            newBtn.classList.add(...ACTIVE_STYLE);
        } else {
            newBtn.classList.remove(...ACTIVE_STYLE);
            newBtn.classList.add(...INACTIVE_STYLE);
        }

        newBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (libSelectedTypes.has(val)) {
                libSelectedTypes.delete(val);
                newBtn.classList.remove(...ACTIVE_STYLE);
                newBtn.classList.add(...INACTIVE_STYLE);
            } else {
                libSelectedTypes.add(val);
                newBtn.classList.remove(...INACTIVE_STYLE);
                newBtn.classList.add(...ACTIVE_STYLE);
            }
            renderLibrary();
        });
    });

    const areas = Array.from(new Set(allTowersData.map(t => t.area).filter(Boolean)));
    libSelectedAreas = new Set(areas);
    
    const hierarchyMap = {
        "Ring 1": ["Forgotten Ridge"], "Ring 2": ["Garden Of Eesh%C3%B6L"], "Ring 4": ["Silent Abyss"],
        "Ring 5": ["Lost River"], "Ring 6": ["Ashen Towerworks"], "Ring 8": ["The Starlit Archives"],
        "Zone 2": ["Arcane Area"], "Zone 3": ["Paradise Atoll"]
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

    areaListContainer.innerHTML = '';
    sortedAreaList.forEach(item => {
        const display = AREA_DISPLAY_NAMES[item.name] || item.name;
        const text = display;
        
        const el = createDropdownItem(
            text, 
            item.name, 
            (val) => libSelectedAreas.has(val),
            (val) => {
                if (libSelectedAreas.has(val)) libSelectedAreas.delete(val);
                else libSelectedAreas.add(val);
                updateAreaButtonText(areas.length);
                renderLibrary();
            },
            AREA_COLORS[item.name]
        );
        if (item.isSub) el.classList.add('ml-4');
        areaListContainer.appendChild(el);
    });

    const difficulties = Object.keys(DIFFICULTY_COLORS);
    libSelectedDiffs = new Set(difficulties);
    const diffListContainer = document.getElementById('diff-list-container');
    diffListContainer.innerHTML = '';
    difficulties.forEach(diff => {
        const el = createDropdownItem(
            diff,
            diff,
            (val) => libSelectedDiffs.has(val),
            (val) => {
                if (libSelectedDiffs.has(val)) libSelectedDiffs.delete(val);
                else libSelectedDiffs.add(val);
                updateDiffButtonText(difficulties.length);
                renderLibrary();
            },
            DIFFICULTY_COLORS[diff]
        );
        diffListContainer.appendChild(el);
    });

    const lengths = ['<20 minutes', '20+ minutes', '30+ minutes', '45+ minutes', '60+ minutes', '90+ minutes'];
    libSelectedLengths = new Set(lengths);
    const lengthListContainer = document.getElementById('length-list-container');
    lengthListContainer.innerHTML = '';
    lengths.forEach(len => {
        const el = createDropdownItem(
            len,
            len,
            (val) => libSelectedLengths.has(val),
            (val) => {
                if (libSelectedLengths.has(val)) libSelectedLengths.delete(val);
                else libSelectedLengths.add(val);
                updateLengthButtonText(lengths.length);
                renderLibrary();
            }
        );
        lengthListContainer.appendChild(el);
    });

    const creators = Array.from(new Set(allTowersData.flatMap(t => Array.isArray(t.creators) ? t.creators.flatMap(c => c.split(',')) : []).map(c => c.trim()).filter(Boolean))).sort();
    libSelectedCreators = new Set(creators);
    const creatorListContainer = document.getElementById('creator-list-container');
    const creatorSearchInput = document.getElementById('creator-search-input');
    
    const renderCreatorList = (filter = "") => {
        creatorListContainer.innerHTML = '';
        const filtered = creators.filter(c => c.toLowerCase().includes(filter.toLowerCase()));
        filtered.forEach(c => {
            const el = createDropdownItem(
                c,
                c,
                (val) => libSelectedCreators.has(val),
                (val) => {
                    if (libSelectedCreators.has(val)) libSelectedCreators.delete(val);
                    else libSelectedCreators.add(val);
                    updateCreatorButtonText(creators.length);
                    renderLibrary();
                }
            );
            creatorListContainer.appendChild(el);
        });
    };
    renderCreatorList();
    
    const newCreatorSearch = creatorSearchInput.cloneNode(true);
    creatorSearchInput.parentNode.replaceChild(newCreatorSearch, creatorSearchInput);
    newCreatorSearch.addEventListener('input', (e) => renderCreatorList(e.target.value));

    const btnSelectAll = document.getElementById('btn-select-all-creators');
    const newBtnSelectAll = btnSelectAll.cloneNode(true);
    btnSelectAll.parentNode.replaceChild(newBtnSelectAll, btnSelectAll);
    newBtnSelectAll.addEventListener('click', (e) => {
        e.stopPropagation();
        libSelectedCreators = new Set(creators);
        renderCreatorList(newCreatorSearch.value);
        updateCreatorButtonText(creators.length);
        renderLibrary();
    });

    const btnDeselectAll = document.getElementById('btn-deselect-all-creators');
    const newBtnDeselectAll = btnDeselectAll.cloneNode(true);
    btnDeselectAll.parentNode.replaceChild(newBtnDeselectAll, btnDeselectAll);
    newBtnDeselectAll.addEventListener('click', (e) => {
        e.stopPropagation();
        libSelectedCreators.clear();
        renderCreatorList(newCreatorSearch.value);
        updateCreatorButtonText(creators.length);
        renderLibrary();
    });

    const sortBtn = document.getElementById('lib-sort-btn');
    const newSortBtn = sortBtn.cloneNode(true);
    sortBtn.parentNode.replaceChild(newSortBtn, sortBtn);
    
    const libSortText = document.getElementById('lib-sort-text');
    const libSortIcon = document.getElementById('lib-sort-icon');

    newSortBtn.addEventListener('click', () => {
        if (libSortOrder === 'desc') {
            libSortOrder = 'asc';
            libSortText.textContent = 'Easiest First (Ascending)';
            libSortIcon.textContent = 'arrow_upward';
        } else {
            libSortOrder = 'desc';
            libSortText.textContent = 'Hardest First (Descending)';
            libSortIcon.textContent = 'arrow_downward';
        }
        renderLibrary();
    });

    const setupDropdownTrigger = (id, menu) => {
        const el = document.getElementById(id);
        const newEl = el.cloneNode(true);
        el.parentNode.replaceChild(newEl, el);
        newEl.addEventListener('click', (e) => { e.stopPropagation(); toggleDropdown(menu); });
    };

    setupDropdownTrigger('area-dropdown-btn', areaMenu);
    setupDropdownTrigger('diff-dropdown-btn', diffMenu);
    setupDropdownTrigger('length-dropdown-btn', lengthMenu);
    setupDropdownTrigger('creator-dropdown-btn', creatorMenu);

    document.addEventListener('click', (e) => { if (!e.target.closest('.relative')) menus.forEach(m => m.classList.add('hidden')); });
    
    updateAreaButtonText(areas.length);
    updateDiffButtonText(difficulties.length);
    updateLengthButtonText(lengths.length);
    updateCreatorButtonText(creators.length);
}

function updateAreaButtonText(total) {
    const btn = document.getElementById('area-dropdown-btn').querySelector('span');
    if (libSelectedAreas.size === 0) btn.textContent = "None Selected";
    else if (libSelectedAreas.size === total) btn.textContent = "All Areas";
    else btn.textContent = `${libSelectedAreas.size} Areas Selected`;
}
function updateDiffButtonText(total) {
    const btn = document.getElementById('diff-dropdown-btn').querySelector('span');
    if (libSelectedDiffs.size === 0) btn.textContent = "None Selected";
    else if (libSelectedDiffs.size === total) btn.textContent = "All Difficulties";
    else btn.textContent = `${libSelectedDiffs.size} Difficulties Selected`;
}
function updateLengthButtonText(total) {
    const btn = document.getElementById('length-dropdown-btn').querySelector('span');
    if (libSelectedLengths.size === 0) btn.textContent = "None Selected";
    else if (libSelectedLengths.size === total) btn.textContent = "All Lengths";
    else btn.textContent = `${libSelectedLengths.size} Lengths Selected`;
}
function updateCreatorButtonText(total) {
    const btn = document.getElementById('creator-dropdown-btn').querySelector('span');
    if (libSelectedCreators.size === 0) btn.textContent = "None Selected";
    else if (libSelectedCreators.size === total) btn.textContent = "All Creators";
    else btn.textContent = `${libSelectedCreators.size} Creators Selected`;
}