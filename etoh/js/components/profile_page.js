import { store } from '../state.js';
import { api } from '../api.js';
import { showNotification } from '../utils.js';
import { DIFFICULTY_COLORS, DIFFICULTY_PILL_CLASSES, NON_CANON_TOWERS, API_BASE_URL } from '../config.js';

const style = document.createElement('style');
style.innerHTML = `
    @keyframes profilePop {
        0% { opacity: 0; transform: scale(0.9) translateY(10px); }
        100% { opacity: 1; transform: scale(1) translateY(0); }
    }
    .profile-anim { animation: profilePop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
    
    .dragging-active .module-content { pointer-events: none !important; opacity: 0.5; }
    .dragging-active .drag-overlay button { pointer-events: none !important; }
    .dragging-active .drag-overlay .group\/handle { pointer-events: none !important; }
    .dragging-active .drag-overlay { pointer-events: auto !important; }
`;
document.head.appendChild(style);

const BANNER_STYLES = {
    'solid': 'Solid Color',
    'none': 'No Color (Dark)',
    'neon': 'Neon Grid',
    'gradient': 'Gradient',
    'pattern': 'Pattern',
    'wave': 'Wave',
    'dots': 'Dots',
    'lines': 'Lines'
};

const MODULE_REGISTRY = {
    'header': {
        name: 'Profile Banner',
        minW: 4, maxW: 4, minH: 1, maxH: 2,
        defaultW: 4, defaultH: 2,
        render: (data, user, stats, w, h) => renderHeaderModule(data, user, stats, w, h),
        editable: true, 
        cantDelete: true,
        fields: [
            { key: 'style', label: 'Banner Style', type: 'select', options: BANNER_STYLES },
            { key: 'color1', label: 'Primary Color', type: 'color' },
            { key: 'color2', label: 'Secondary Color', type: 'color' }
        ]
    },
    'bio': {
        name: 'About Me',
        minW: 1, maxW: 4, minH: 1, maxH: 3,
        defaultW: 2, defaultH: 1,
        render: (data, user, stats, w, h) => {
            const text = data.text || 'Write something...';
            if (w === 1 && h === 1) {
                return `
                    <div class="h-full flex flex-col justify-center text-center p-3">
                        <span class="material-symbols-outlined text-gray-500 mb-1">badge</span>
                        <p class="text-[10px] text-gray-400 line-clamp-3 leading-tight">${text}</p>
                    </div>
                `;
            }
            return `
                <div class="h-full flex flex-col p-5">
                    <div class="flex items-center gap-2 mb-2 text-gray-500 uppercase text-[10px] font-bold tracking-widest">
                        <span class="material-symbols-outlined text-sm text-gray-500">badge</span> Bio
                    </div>
                    <p class="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap break-words overflow-y-auto custom-scrollbar flex-1">${text}</p>
                </div>
            `;
        },
        fields: [{ key: 'text', label: 'Bio Text', type: 'textarea' }]
    },
    'stat_total': {
        name: 'Total Towers',
        minW: 1, maxW: 2, minH: 1, maxH: 1,
        defaultW: 1, defaultH: 1,
        render: (data, user, stats, w, h) => {
            const total = user.total_towers !== undefined ? user.total_towers : stats.total;
            return renderStatCard('Total Towers', total, 'location_city', false, w, h);
        },
        fields: []
    },
    'stat_diff': {
        name: 'Avg Difficulty',
        minW: 1, maxW: 2, minH: 1, maxH: 1,
        defaultW: 1, defaultH: 1,
        render: (data, user, stats, w, h) => renderStatCard('Avg Difficulty', stats.avgDiff, 'analytics', false, w, h),
        fields: []
    },
    'stat_rank': {
        name: 'Leaderboard Pos',
        minW: 1, maxW: 2, minH: 1, maxH: 1,
        defaultW: 1, defaultH: 1,
        render: (data, user, stats, w, h) => renderStatCard('Leaderboard Pos', stats.rankDisplay, 'trophy', true, w, h, stats.rankColor),
        fields: []
    },
    'stat_completion': {
        name: 'Completion %',
        minW: 1, maxW: 2, minH: 1, maxH: 1,
        defaultW: 1, defaultH: 1,
        render: (data, user, stats, w, h) => {
            const pct = stats.totalCanon > 0 ? ((stats.total / stats.totalCanon) * 100).toFixed(1) + '%' : "0%";
            return renderStatCard('Completion', pct, 'pie_chart', false, w, h);
        },
        fields: []
    },
    'fav_tower': {
        name: 'Favorite Tower',
        minW: 1, maxW: 2, minH: 1, maxH: 1,
        defaultW: 1, defaultH: 1,
        render: (data, user, stats, w, h) => {
            const val = data.value || 'None';
            if (w === 1 && h === 1) {
                return `
                    <div class="h-full flex flex-col justify-between p-4">
                        <span class="material-symbols-outlined text-2xl text-gray-500">star</span>
                        <div>
                            <span class="text-[9px] text-gray-500 font-bold uppercase block">Favorite</span>
                            <span class="text-sm font-bold text-white truncate block" title="${val}">${val}</span>
                        </div>
                    </div>
                `;
            }
            return `
                <div class="h-full flex flex-col justify-center p-5">
                    <span class="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Favorite Tower</span>
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10">
                            <span class="material-symbols-outlined text-xl text-yellow-500">star</span>
                        </div>
                        <span class="text-2xl font-bold text-white truncate" title="${val}">${val}</span>
                    </div>
                </div>
            `;
        },
        fields: [
            { key: 'value', label: 'Tower Name', type: 'tower_autosuggest' }
        ]
    },
    'grind': {
        name: 'Currently Grinding',
        minW: 1, maxW: 4, minH: 1, maxH: 1,
        defaultW: 2, defaultH: 1,
        render: (data, user, stats, w, h) => {
            const val = data.value || 'Nothing';
            const floors = parseInt(data.floors) || 100;
            const pb = parseInt(data.pb) || 0;
            const pct = Math.min(100, Math.max(0, (pb / floors) * 100));
            
            if (w === 1) {
                return `
                    <div class="h-full flex flex-col items-center justify-center p-2 text-center">
                        <div class="relative w-10 h-10 mb-1 flex items-center justify-center rounded-full border-2 border-white/10" style="background: conic-gradient(#BE00FF ${pct}%, transparent 0);">
                            <div class="absolute inset-1 bg-[#151515] rounded-full flex items-center justify-center">
                                <span class="text-[9px] font-bold text-white">${pct}%</span>
                            </div>
                        </div>
                        <span class="text-[9px] font-bold text-gray-400 truncate w-full">${val}</span>
                    </div>
                `;
            }

            return `
                <div class="h-full flex flex-col justify-center gap-1 p-5">
                    <div class="flex justify-between items-start">
                        <span class="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-2">
                            <span class="animate-spin material-symbols-outlined text-xs text-gray-500">sync</span> Currently Grinding
                        </span>
                        <span class="text-[10px] font-mono font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded">
                            <span class="text-white">${pb}</span> / ${floors}
                        </span>
                    </div>

                    <div class="flex flex-col gap-3">
                        <span class="text-2xl font-black text-white truncate">${val}</span>
                        <div class="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                            <div class="h-full bg-[#BE00FF] transition-all duration-1000" style="width: ${pct}%"></div>
                        </div>
                    </div>
                </div>
            `;
        },
        fields: [
            { key: 'value', label: 'Tower Name', type: 'tower_autosuggest' },
            { key: 'floors', label: 'Total Floors', type: 'number' },
            { key: 'pb', label: 'Personal Best (Floor)', type: 'number' }
        ]
    }
};

const DEFAULT_LAYOUT = [
    { id: 'header', type: 'header', w: 4, h: 2, data: { style: 'neon', color1: '#000000', color2: '#000000' } },
    { id: 'bio', type: 'bio', w: 2, h: 1, data: { text: "Welcome to my profile." } },
    { id: 's1', type: 'stat_total', w: 1, h: 1, data: {} },
    { id: 's2', type: 'fav_tower', w: 1, h: 1, data: { value: 'None' } }
];

let isEditing = false;
let currentLayout = [];
let dragTargetId = null; 
let dragStartX = 0, dragStartY = 0, dragStartW = 0, dragStartH = 0;
let draggedItemId = null;
let extraRows = 0;

function setupAutosuggest(input) {
    const wrapper = input.parentElement;
    const allTowers = store.allTowers.map(t => t.name);

    let suggestions = document.createElement('div');
    suggestions.className = 'absolute left-0 right-0 top-full mt-1 bg-[#25252b] border border-white/10 rounded-lg shadow-xl max-h-40 overflow-y-auto hidden z-50 custom-scrollbar';
    wrapper.appendChild(suggestions);

    input.addEventListener('input', () => {
        const val = input.value.toLowerCase();
        suggestions.innerHTML = '';
        
        if (val.length < 2) {
            suggestions.classList.add('hidden');
            return;
        }

        const matches = allTowers.filter(t => t.toLowerCase().includes(val)).slice(0, 10);
        
        if (matches.length > 0) {
            matches.forEach(match => {
                const div = document.createElement('div');
                div.className = 'px-3 py-2 text-xs text-gray-300 hover:bg-white/10 cursor-pointer';
                div.textContent = match;
                div.onclick = () => {
                    input.value = match;
                    suggestions.classList.add('hidden');
                };
                suggestions.appendChild(div);
            });
            suggestions.classList.remove('hidden');
        } else {
            suggestions.classList.add('hidden');
        }
    });

    document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) {
            suggestions.classList.add('hidden');
        }
    });
}

function positionModal(modalContent, targetEl) {
    if (!targetEl || !modalContent) return;

    const wrapper = document.getElementById('profile-main-wrapper');
    if (!wrapper) return;

    const targetRect = targetEl.getBoundingClientRect();
    const wrapperRect = wrapper.getBoundingClientRect();
    
    const modalHeight = modalContent.offsetHeight || 400; 
    const modalWidth = modalContent.offsetWidth || 448;

    const buttonVerticalCenter = targetRect.top - wrapperRect.top + targetRect.height / 2;
    let topPos = buttonVerticalCenter - modalHeight / 2;

    const viewportTop = targetRect.top + (targetRect.height / 2) - (modalHeight / 2);
    const viewportBottom = viewportTop + modalHeight;
    const screenH = window.innerHeight;

    if (viewportTop < 20) {
        topPos += (20 - viewportTop);
    } else if (viewportBottom > screenH - 20) {
        topPos -= (viewportBottom - (screenH - 20));
    }

    const buttonHorizontalCenter = targetRect.left - wrapperRect.left + targetRect.width / 2;
    const halfWidth = modalWidth / 2;

    let leftPos = buttonHorizontalCenter - halfWidth;
    let useLeft = true;

    if (leftPos < 10) {
        leftPos = 10;
    } else if (leftPos + modalWidth > wrapperRect.width - 10) {
        leftPos = wrapperRect.width - modalWidth - 10;
    }

    modalContent.style.position = 'absolute';
    modalContent.style.top = `${topPos}px`;
    modalContent.style.left = `${leftPos}px`;
    modalContent.style.right = 'auto';
    modalContent.style.transform = 'none';
    modalContent.style.margin = '0';
}

window.deleteModule = (id) => {
    currentLayout = currentLayout.filter(m => m.id !== id);
    renderProfilePage(true); 
};

window.addExtraRows = () => {
    extraRows += 1;
    renderProfilePage(true);
};

window.showAddModal = (e) => {
    const modal = document.getElementById('add-module-modal');
    const modalContent = document.getElementById('add-modal-content');
    const grid = document.getElementById('module-selector-grid');
    
    grid.innerHTML = '';
    
    Object.entries(MODULE_REGISTRY).forEach(([key, def]) => {
        if (key === 'header') return; 
        const btn = document.createElement('button');
        btn.className = "p-4 bg-white/5 hover:bg-[#BE00FF]/20 border border-white/10 hover:border-[#BE00FF] rounded-xl text-left transition-all group";
        btn.innerHTML = `
            <span class="block text-sm font-bold text-white group-hover:text-[#BE00FF]">${def.name}</span>
            <span class="text-xs text-gray-500">Default: ${def.defaultW}x${def.defaultH}</span>
        `;
        btn.onclick = () => {
            addModule(key, def);
            modal.classList.add('hidden');
        };
        grid.appendChild(btn);
    });

    modal.classList.remove('hidden');
    positionModal(modalContent, e.currentTarget);
};

window.openConfig = (id) => {
    const item = currentLayout.find(m => m.id === id);
    const def = MODULE_REGISTRY[item.type];
    if (!item || !def) return;

    const moduleEl = document.getElementById(`module-${id}`);
    const modal = document.getElementById('config-module-modal');
    const modalContent = document.getElementById('config-modal-content');
    const container = document.getElementById('config-fields');
    const saveBtn = document.getElementById('save-config-modal');
    const closeBtn = document.getElementById('close-config-modal');

    container.innerHTML = '';
    
    const closeAllDropdowns = (e) => {
        const dropdowns = container.querySelectorAll('.custom-select-options');
        dropdowns.forEach(d => {
            if (!d.parentElement.contains(e.target)) {
                d.classList.add('hidden');
                d.parentElement.querySelector('.select-arrow').textContent = 'expand_more';
            }
        });
    };
    
    document.removeEventListener('click', closeAllDropdowns);

        def.fields.forEach(field => {
        const wrapper = document.createElement('div');
        wrapper.className = "relative mb-4";
        let inputHtml = ''
        const safeVal = item.data[field.key] || (field.type === 'color' ? '#000000' : '');

        if (field.type === 'textarea') {
            inputHtml = `<textarea data-key="${field.key}" class="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-[#BE00FF] focus:outline-none transition-colors h-24 resize-none">${safeVal}</textarea>`;
        } else if (field.type === 'select') {
            const displayVal = field.options[safeVal] || 'Select option';
            const optionsHtml = Object.entries(field.options).map(([k, v]) => `
                <div class="custom-option px-3 py-2.5 text-sm text-gray-300 hover:bg-white/10 hover:text-white cursor-pointer transition-colors ${k === safeVal ? 'bg-white/5 text-white font-bold' : ''}" data-value="${k}">
                    ${v}
                </div>
            `).join('');

            inputHtml = `
                <div class="custom-select relative w-full" data-key="${field.key}" data-value="${safeVal}">
                    <button type="button" class="select-trigger w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-[#BE00FF] focus:outline-none transition-colors flex justify-between items-center text-left">
                        <span class="select-label truncate">${displayVal}</span>
                        <span class="material-symbols-outlined select-arrow text-gray-400 text-lg">expand_more</span>
                    </button>
                    <div class="custom-select-options hidden absolute left-0 right-0 top-full mt-1 bg-[#1C1C22] border border-white/10 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto custom-scrollbar p-1">
                        ${optionsHtml}
                    </div>
                </div>
            `;
        } else if (field.type === 'tower_autosuggest') {
            inputHtml = `<input data-key="${field.key}" type="text" class="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-[#BE00FF] focus:outline-none transition-colors" value="${safeVal}" autocomplete="off">`;
        } else {
            inputHtml = `<input data-key="${field.key}" type="${field.type}" class="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-[#BE00FF] focus:outline-none transition-colors" value="${safeVal}">`;
        }

        wrapper.innerHTML = `<label class="text-xs text-gray-400 uppercase font-bold mb-2 block tracking-wider">${field.label}</label>${inputHtml}`;
        container.appendChild(wrapper);

        if (field.type === 'select') {
            const dropdown = wrapper.querySelector('.custom-select');
            const trigger = dropdown.querySelector('.select-trigger');
            const optionsMenu = dropdown.querySelector('.custom-select-options');
            const labelSpan = dropdown.querySelector('.select-label');
            const arrowSpan = dropdown.querySelector('.select-arrow');

            trigger.onclick = (e) => {
                e.stopPropagation();
                container.querySelectorAll('.custom-select-options').forEach(el => {
                    if (el !== optionsMenu) {
                        el.classList.add('hidden');
                        el.parentElement.querySelector('.select-arrow').textContent = 'expand_more';
                    }
                });
                
                const isClosed = optionsMenu.classList.contains('hidden');
                if (isClosed) {
                    optionsMenu.classList.remove('hidden');
                    arrowSpan.textContent = 'expand_less';
                } else {
                    optionsMenu.classList.add('hidden');
                    arrowSpan.textContent = 'expand_more';
                }
            };

            dropdown.querySelectorAll('.custom-option').forEach(opt => {
                opt.onclick = (e) => {
                    e.stopPropagation();
                    const val = opt.dataset.value;
                    const text = opt.innerText;
                    dropdown.dataset.value = val;
                    labelSpan.textContent = text;
                    dropdown.querySelectorAll('.custom-option').forEach(o => {
                        o.classList.remove('bg-white/5', 'text-white', 'font-bold');
                        o.classList.add('text-gray-300');
                    });
                    opt.classList.remove('text-gray-300');
                    opt.classList.add('bg-white/5', 'text-white', 'font-bold');
                    optionsMenu.classList.add('hidden');
                    arrowSpan.textContent = 'expand_more';
                };
            });
        }

        if (field.type === 'tower_autosuggest') {
            setupAutosuggest(wrapper.querySelector('input'));
        }
    });

    modal.classList.remove('hidden');
    
    if (moduleEl) {
        const settingsBtn = moduleEl.querySelector('button[onclick*="openConfig"]');
        positionModal(modalContent, settingsBtn || moduleEl);
    }
    setTimeout(() => document.addEventListener('click', closeAllDropdowns), 0);

    const newSave = saveBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(newSave, saveBtn);
    const newClose = closeBtn.cloneNode(true);
    closeBtn.parentNode.replaceChild(newClose, closeBtn);

    const closeModal = () => {
        modal.classList.add('hidden');
        document.removeEventListener('click', closeAllDropdowns);
    };

    newClose.onclick = closeModal;
    newSave.onclick = async () => {
        const inputs = container.querySelectorAll('input, textarea');
        const selects = container.querySelectorAll('.custom-select');

        inputs.forEach(inp => {
            item.data[inp.dataset.key] = inp.value;
        });
        selects.forEach(sel => {
            item.data[sel.dataset.key] = sel.dataset.value;
        });

        const profileData = {};
        currentLayout.forEach(layoutItem => {
            if (layoutItem.data && Object.keys(layoutItem.data).length > 0) {
                profileData[layoutItem.id] = layoutItem.data;
            }
        });
        
        try {
            await fetch(`${API_BASE_URL}/api/update_profile`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${api.token}` 
                },
                body: JSON.stringify({ profile_data: JSON.stringify(profileData) })
            });
            
            const updatedUser = { ...store.currentUser };
            updatedUser.profile_data = JSON.stringify(profileData);
            store.setCurrentUser(updatedUser);
        } catch (e) {
            console.error('Failed to save profile data:', e);
            showNotification("Failed to save changes.", "error");
        }

        closeModal();
        renderProfilePage(true); 
    };
};

window.copyProfileLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        showNotification("Profile link copied!", "success");
    });
};

window.handleDragStart = (e, id) => {
    if (!isEditing) { e.preventDefault(); return; }
    draggedItemId = id;
    e.dataTransfer.effectAllowed = 'move';
    const panel = e.target.closest('.glass-panel');
    if (panel) panel.classList.add('opacity-50');

    document.getElementById('profile-grid')?.classList.add('dragging-active');
};

window.handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };

window.handleDragEnter = (e) => { 
    const panel = e.target.closest('.glass-panel');
    if (panel) panel.classList.add('ring-2', 'ring-[#BE00FF]'); 
};

window.handleDragLeave = (e) => { 
    const panel = e.target.closest('.glass-panel');
    if (panel) panel.classList.remove('ring-2', 'ring-[#BE00FF]'); 
};

window.handleDrop = (e, targetId) => {
    e.preventDefault();
    e.stopPropagation();
    
    const panel = e.target.closest('.glass-panel');
    if (panel) panel.classList.remove('ring-2', 'ring-[#BE00FF]');
    
    document.getElementById('profile-grid')?.classList.remove('dragging-active');

    if (draggedItemId && targetId && draggedItemId !== targetId) {
        const fromIndex = currentLayout.findIndex(i => i.id === draggedItemId);
        const toIndex = currentLayout.findIndex(i => i.id === targetId);
        
        if (fromIndex > -1 && toIndex > -1) {
            const temp = currentLayout[fromIndex];
            currentLayout.splice(fromIndex, 1);
            currentLayout.splice(toIndex, 0, temp);
            renderProfilePage(true); 
        }
    }
    draggedItemId = null;
};

window.handleDragEnd = (e) => { 
    const panel = e.target.closest('.glass-panel');
    if (panel) panel.classList.remove('opacity-50'); 
    
    document.getElementById('profile-grid')?.classList.remove('dragging-active');
};

window.startResize = (e, id) => {
    e.stopPropagation();
    e.preventDefault();
    const item = currentLayout.find(m => m.id === id);
    if(!item) return;

    dragTargetId = id;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragStartW = item.w;
    dragStartH = item.h;

    document.addEventListener('mousemove', onResizeMove);
    document.addEventListener('mouseup', onResizeEnd);
};

function onResizeMove(e) {
    if (!dragTargetId) return;
    const item = currentLayout.find(m => m.id === dragTargetId);
    const def = MODULE_REGISTRY[item.type];
    if (!item || !def) return;

    const CELL_WIDTH = 250; 
    const CELL_HEIGHT = 160; 
    
    const deltaX = e.clientX - dragStartX;
    const deltaY = e.clientY - dragStartY;

    const addedCols = Math.round(deltaX / CELL_WIDTH);
    const addedRows = Math.round(deltaY / CELL_HEIGHT);

    let newW = Math.max(def.minW, Math.min(def.maxW, dragStartW + addedCols));
    let newH = Math.max(def.minH, Math.min(def.maxH, dragStartH + addedRows));

    if (newW !== item.w || newH !== item.h) {
        item.w = newW;
        item.h = newH;
        renderProfilePage(true);
    }
}

function onResizeEnd() {
    dragTargetId = null;
    document.removeEventListener('mousemove', onResizeMove);
    document.removeEventListener('mouseup', onResizeEnd);
}

export function renderProfilePage(preserveLocalState = false) {
    const container = document.getElementById('profile-view');
    const user = store.currentUser;
    const authUser = store.authUser;
    
    if (!user) return;

    const isOwner = authUser && String(authUser.sub) === String(user.user_id);
    
    if (!preserveLocalState) {
        let layoutData = [];
        let moduleData = {};
        
        try {
            if (user.profile_layout && user.profile_layout !== "[]") {
                layoutData = typeof user.profile_layout === 'string' ? JSON.parse(user.profile_layout) : user.profile_layout;
            }
            if (user.profile_data && user.profile_data !== "{}") {
                moduleData = typeof user.profile_data === 'string' ? JSON.parse(user.profile_data) : user.profile_data;
            }
            
            if (layoutData.length > 0) {
                currentLayout = layoutData.map(item => {
                    const mergedItem = {
                        id: item.id,
                        type: item.type,
                        w: item.w || 1,
                        h: item.h || 1,
                        data: moduleData[item.id] || {}
                    };
                    return mergedItem;
                });
            } else {
                currentLayout = DEFAULT_LAYOUT.map(item => ({
                    ...item,
                    data: moduleData[item.id] || item.data || {}
                }));
            }
        } catch (e) {
            console.error("Error loading profile layout/data:", e);
            currentLayout = DEFAULT_LAYOUT;
        }
    }

    const canonBeaten = user.beaten_towers.filter(t => !NON_CANON_TOWERS.has(t.name));

    const sortedBeaten = canonBeaten.sort((a, b) => (b.number_difficulty || 0) - (a.number_difficulty || 0));
    
    const hardest = sortedBeaten[0];
    const top5 = sortedBeaten.slice(0, 5);
    
    let totalDiff = 0;
    canonBeaten.forEach(t => totalDiff += (t.number_difficulty || 0));
    const avgDiff = canonBeaten.length ? (totalDiff / canonBeaten.length).toFixed(2) : "0.00";
    const allCanonCount = store.allTowers.filter(t => !NON_CANON_TOWERS.has(t.name)).length;

    let rankDisplay = "N/A";
    let rankColor = "#fff";
    if (store.leaderboard) {
        const rankIndex = store.leaderboard.findIndex(p => String(p.user_id) === String(user.user_id));
        if (rankIndex !== -1) {
            rankDisplay = `#${rankIndex + 1}`;
            if (rankIndex === 0) rankColor = "#FFD700";
            else if (rankIndex === 1) rankColor = "#C0C0C0";
            else if (rankIndex === 2) rankColor = "#CD7F32";
            else rankColor = "#BE00FF";
        } else {
            rankDisplay = "UR";
            rankColor = "#666";
        }
    } else {
        if(!preserveLocalState) api.getLeaderboard().then(d => { store.setLeaderboard(d); renderProfilePage(); });
    }

    const totalTowers = user.total_towers !== undefined ? user.total_towers : canonBeaten.length;

    const statsObj = { 
        total: totalTowers, 
        totalCanon: allCanonCount,
        avgDiff, 
        rankDisplay, 
        rankColor, 
        hardest, 
        top5 
    };

    let ghostSlots = '';
    if (isEditing) {
        const totalGhostSlots = 16 + (extraRows * 4); 
        for(let i=0; i<totalGhostSlots; i++) {
            ghostSlots += `
                <button onclick="window.showAddModal(event)" class="col-span-1 row-span-1 border-2 border-dashed border-white/5 hover:border-white/20 rounded-3xl flex flex-col items-center justify-center text-white/10 hover:text-white/50 hover:bg-white/5 transition-all">
                    <span class="material-symbols-outlined text-2xl">add</span>
                </button>
            `;
        }
    }

    container.innerHTML = `
        <div id="profile-main-wrapper" class="w-full max-w-7xl mx-auto pb-20 px-4 relative">
            ${isOwner ? renderToolbar(isEditing) : ''}
            
            <div id="profile-grid" class="grid grid-cols-4 gap-4 auto-rows-[160px] select-none" style="grid-auto-flow: dense;">
                ${currentLayout.map(item => renderModuleItem(item, user, statsObj, isEditing)).join('')}
                ${ghostSlots}
            </div>

            ${isEditing ? `
                <div class="mt-8 flex justify-center">
                    <button onclick="window.addExtraRows()" class="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-colors border border-white/10">
                        Show More Rows
                    </button>
                </div>
            ` : ''}
            
            <div class="h-20"></div>

            <div id="add-module-modal" class="hidden absolute z-[50] w-full h-full top-0 left-0 pointer-events-none">
                <div class="fixed inset-0 bg-black/60 pointer-events-auto backdrop-blur-sm" onclick="document.getElementById('close-add-modal').click()"></div>
                <div id="add-modal-content" class="absolute bg-[#1C1C22] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl pointer-events-auto profile-anim origin-top">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-xl font-bold text-white">Add Module</h3>
                        <button id="close-add-modal" onclick="document.getElementById('add-module-modal').classList.add('hidden')" class="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors border border-white/10">
                            <span class="material-symbols-outlined text-lg">close</span>
                        </button>
                    </div>
                    <div class="grid grid-cols-2 gap-3" id="module-selector-grid"></div>
                </div>
            </div>

            <div id="config-module-modal" class="hidden absolute z-[50] w-full h-full top-0 left-0 pointer-events-none">
                <div id="config-backdrop" class="fixed inset-0 bg-black/60 pointer-events-auto backdrop-blur-sm" onclick="document.getElementById('close-config-modal').click()"></div>
                <div id="config-modal-content" class="absolute bg-[#1C1C22] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl pointer-events-auto profile-anim origin-top">
                    <h3 class="text-xl font-bold text-white mb-4">Configure Module</h3>
                    <div id="config-fields" class="space-y-4"></div>
                    <div class="flex gap-3 mt-6">
                        <button id="close-config-modal" class="flex-1 py-3 text-gray-400 font-bold hover:text-white">Cancel</button>
                        <button id="save-config-modal" class="flex-1 py-3 bg-[#BE00FF] hover:bg-[#a000d6] text-white font-bold rounded-lg">Save</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    if (isOwner) setupEditListeners(user);
}

function renderToolbar(editing) {
    return `
        <div class="flex justify-end mb-6 sticky top-4 z-40">
            <button id="toggle-edit-mode" class="px-5 py-2 rounded-full font-bold text-xs uppercase tracking-wider shadow-xl backdrop-blur-md border transition-all ${editing ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-black/60 text-gray-400 border-white/10 hover:text-white hover:border-white/30'}">
                ${editing ? 'Done Editing' : 'Edit Layout'}
            </button>
        </div>
    `;
}

function renderModuleItem(item, user, stats, editing) {
    const def = MODULE_REGISTRY[item.type];
    if (!def) return '';

    const cantDelete = def.cantDelete || false;
    const hasConfig = def.fields && def.fields.length > 0;
    const gridClass = `col-span-${item.w} row-span-${item.h}`;

    let controls = '';
    if (editing) {
        const dragAttrs = `draggable="true" ondragstart="window.handleDragStart(event, '${item.id}')" ondragover="window.handleDragOver(event)" ondrop="window.handleDrop(event, '${item.id}')" ondragenter="window.handleDragEnter(event)" ondragleave="window.handleDragLeave(event)" ondragend="window.handleDragEnd(event)"`;

        controls = `
            <div class="drag-overlay absolute inset-0 bg-black/40 z-40 border-2 border-white/20 rounded-3xl cursor-move transition-colors hover:bg-black/20" ${dragAttrs}>
                ${hasConfig ? `
                    <button onclick="window.openConfig('${item.id}')" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-10 h-10 bg-[#BE00FF] rounded-full text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform pointer-events-auto cursor-pointer">
                        <span class="material-symbols-outlined text-lg">settings</span>
                    </button>
                ` : ''}

                ${!cantDelete ? `
                    <button onclick="window.deleteModule('${item.id}')" class="absolute top-2 right-2 z-50 w-8 h-8 bg-red-500/80 hover:bg-red-500 text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform cursor-pointer pointer-events-auto">
                        <span class="material-symbols-outlined text-sm font-bold">close</span>
                    </button>
                ` : ''}

                <div class="absolute bottom-2 right-2 z-50 w-8 h-8 cursor-nwse-resize pointer-events-auto group/handle"
                     onmousedown="window.startResize(event, '${item.id}')">
                    <div class="w-full h-full rounded-full bg-white/10 hover:bg-white/30 backdrop-blur-md border border-white/20 shadow-lg flex items-center justify-center transition-colors transform rotate-45">
                        <div class="w-4 h-1 bg-white/50 rounded-full"></div>
                    </div>
                </div>
            </div>
        `;
    }

    return `
        <div id="module-${item.id}" class="relative ${gridClass} glass-panel rounded-3xl border border-white/5 overflow-hidden group transition-all duration-200">
            ${controls}
            <div class="w-full h-full relative module-content">
                ${def.render(item.data, user, stats, item.w, item.h)}
            </div>
        </div>
    `;
}

function renderHeaderModule(data, user, stats, w, h) {
    const style = data.style || 'solid';
    const c1 = data.color1 || '#000000';
    const c2 = data.color2 || '#000000';
    let bgHtml = '';

    if (style === 'neon') {
        bgHtml = `
            <div class="absolute inset-0 bg-[#050505] -z-10"></div>
            <div class="absolute inset-0 -z-10 opacity-30" style="background-image: linear-gradient(${c1} 1px, transparent 1px), linear-gradient(90deg, ${c1} 1px, transparent 1px); background-size: 40px 40px; transform: perspective(500px) rotateX(60deg) translateY(-100px) scale(2);"></div>
            <div class="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent -z-10"></div>
        `;
    }
    else if (style === 'solid') {
        bgHtml = `<div class="absolute inset-0 -z-10" style="background: ${c1};"></div><div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent -z-10"></div>`;
    }
    else if (style === 'gradient') {
        bgHtml = `
            <div class="absolute inset-0 -z-10" style="background: linear-gradient(135deg, ${c1} 0%, ${c2} 100%);"></div>
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent -z-10"></div>
        `;
    }
    else if (style === 'pattern') {
        bgHtml = `
            <div class="absolute inset-0 bg-[#050505] -z-10"></div>
            <div class="absolute inset-0 -z-10 opacity-20" style="background-image: repeating-linear-gradient(45deg, ${c1} 0px, ${c1} 10px, transparent 10px, transparent 20px, ${c2} 20px, ${c2} 30px, transparent 30px, transparent 40px);"></div>
            <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent -z-10"></div>
        `;
    }
    else if (style === 'wave') {
        bgHtml = `
            <div class="absolute inset-0 -z-10" style="background: ${c1};"></div>
            <div class="absolute inset-0 -z-10 opacity-30" style="background-image: radial-gradient(ellipse at top, ${c2} 0%, transparent 50%), radial-gradient(ellipse at bottom, ${c2} 0%, transparent 50%); background-size: 100% 50%; background-position: top, bottom; background-repeat: no-repeat;"></div>
            <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent -z-10"></div>
        `;
    }
    else if (style === 'dots') {
        bgHtml = `
            <div class="absolute inset-0 bg-[#050505] -z-10"></div>
            <div class="absolute inset-0 -z-10 opacity-25" style="background-image: radial-gradient(circle, ${c1} 1px, transparent 1px); background-size: 30px 30px;"></div>
            <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent -z-10"></div>
        `;
    }
    else if (style === 'lines') {
        bgHtml = `
            <div class="absolute inset-0 bg-[#050505] -z-10"></div>
            <div class="absolute inset-0 -z-10 opacity-20" style="background-image: repeating-linear-gradient(0deg, ${c1} 0px, ${c1} 2px, transparent 2px, transparent 20px, ${c2} 20px, ${c2} 22px, transparent 22px, transparent 40px);"></div>
            <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent -z-10"></div>
        `;
    }
    else {
        bgHtml = `<div class="absolute inset-0 bg-[#0a0a0f] -z-10"></div>`;
    }

    const avatarSize = h < 2 ? 'w-12 h-12' : 'w-24 h-24';
    const nameSize = h < 2 ? 'text-xl' : 'text-4xl md:text-5xl';
    
    return `
        ${bgHtml}
        
        <button onclick="window.copyProfileLink()" class="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-black/30 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors border border-white/5 backdrop-blur-md z-30" title="Copy Link">
            <span class="material-symbols-outlined text-lg">share</span>
        </button>

        <div class="h-full flex flex-col justify-end p-6 relative z-10">
            <div class="flex items-end gap-4">
                <img src="${user.avatar_full_url}" class="${avatarSize} rounded-2xl shadow-2xl border-2 border-white/10 bg-black/20 backdrop-blur-md object-cover">
                <div class="mb-0.5">
                    <h1 class="${nameSize} font-black text-white leading-none drop-shadow-lg line-clamp-1">${user.display_name}</h1>
                    <div class="flex items-center gap-3 mt-2">
                        <p class="text-gray-300 font-mono text-xs bg-black/30 px-2 py-0.5 rounded backdrop-blur-sm">@${user.user_name}</p>
                        ${stats.hardest && w > 2 ? `
                            <span class="inline-block py-0.5 px-2.5 rounded-full text-xs font-bold border ${DIFFICULTY_PILL_CLASSES[stats.hardest.difficulty] || DIFFICULTY_PILL_CLASSES.nil}">${stats.hardest.name} [${stats.hardest.number_difficulty.toFixed(2)}]</span>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderStatCard(label, value, icon, isColored, w, h, rankColor = null) {
    const colorStyle = isColored && rankColor ? `color: ${rankColor}` : 'color: white';
    
    if (w === 1 && h === 1) {
        return `
            <div class="h-full flex flex-col justify-between p-4">
                <span class="material-symbols-outlined text-2xl text-gray-500">${icon}</span>
                <div>
                    <span class="text-[9px] text-gray-500 font-bold uppercase block">${label}</span>
                    <span class="text-xl font-black truncate" style="${colorStyle}">${value}</span>
                </div>
            </div>
        `;
    }

    return `
        <div class="h-full flex flex-col justify-between p-5">
            <div class="flex justify-between items-start">
                <span class="text-[10px] text-gray-500 font-bold uppercase tracking-wider">${label}</span>
                <span class="material-symbols-outlined text-xl text-gray-500">${icon}</span>
            </div>
            <span class="text-4xl font-black truncate" style="${colorStyle}">${value}</span>
        </div>
    `;
}

function setupEditListeners(user) {
    const btnToggle = document.getElementById('toggle-edit-mode');
    const newBtn = btnToggle.cloneNode(true);
    btnToggle.parentNode.replaceChild(newBtn, btnToggle);

    newBtn.onclick = async () => {
        if (isEditing) {
            newBtn.textContent = "Saving...";
            
            const layoutOnly = currentLayout.map(item => ({
                id: item.id,
                type: item.type,
                w: item.w || 1,
                h: item.h || 1
            }));
            
            const profileData = {};
            currentLayout.forEach(item => {
                if (item.data && Object.keys(item.data).length > 0) {
                    profileData[item.id] = item.data;
                }
            });
            
            const payload = {
                layout: JSON.stringify(layoutOnly),
                profile_data: JSON.stringify(profileData)
            };
            
            try {
                await fetch(`${API_BASE_URL}/api/update_profile`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${api.token}` },
                    body: JSON.stringify(payload)
                });
                
                const updatedUser = { ...store.currentUser };
                updatedUser.profile_layout = JSON.stringify(layoutOnly);
                updatedUser.profile_data = JSON.stringify(profileData);
                store.setCurrentUser(updatedUser);

                isEditing = false;
                extraRows = 0; 
                renderProfilePage();
                showNotification("Layout saved!", "success");
            } catch (e) {
                console.error(e);
                showNotification("Failed to save layout.", "error");
            }
        } else {
            isEditing = true;
            renderProfilePage(true);
        }
    };

    const addBtn = document.getElementById('btn-add-module');
    if (addBtn) {
        addBtn.onclick = () => {
            window.showAddModal();
        };
    }
}

function addModule(type, def) {
    const newId = Math.random().toString(36).substr(2, 9);
    currentLayout.push({
        id: newId,
        type: type,
        w: def.defaultW,
        h: def.defaultH,
        data: {}
    });
    renderProfilePage(true);
}