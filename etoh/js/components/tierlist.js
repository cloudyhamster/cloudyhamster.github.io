import { api } from '../api.js';
import { store } from '../state.js';
import { showNotification } from '../utils.js';
import { openModalWithTower, showConfirmModal } from '../ui/modals.js';
import { DIFFICULTY_PILL_CLASSES, DIFFICULTY_COLORS } from '../config.js';

let activeTab = 'browse';
let currentTierlistId = null;
let currentSort = 'newest';
let localItems = [];
let localTiers = []; 
let hasUnsavedChanges = false;
let draggedItemData = null; 
let placeholderEl = null;   
let currentDropTarget = null;

const DEFAULT_TIERS = [
    { label: 'S', color: '#ff7f7f' },
    { label: 'A', color: '#ffbf7f' },
    { label: 'B', color: '#ffdf7f' },
    { label: 'C', color: '#ffff7f' },
    { label: 'D', color: '#bfff7f' },
    { label: 'F', color: '#7fffff' }
];

function getAcronym(name) {
    if (!name) return '';
    return name.split(' ').map(w => w[0]).join('');
}

export function initTierList() {
    const style = document.createElement('style');
    style.innerHTML = `
        .tier-placeholder {
            width: 6rem; 
            height: 6rem;
            background-color: rgba(255, 255, 255, 0.05);
            border: 2px dashed rgba(255, 255, 255, 0.2);
            border-radius: 0.5rem;
            flex-shrink: 0;
            pointer-events: none;
            margin: 0;
        }
        .tier-row-label {
            word-break: break-word; 
            line-height: 1.1;
        }
        .tier-item {
            will-change: transform;
            transform: translateZ(0);
        }
        .tier-drop-zone.dragging-active .tier-item {
            pointer-events: none;
        }
        .tier-settings-menu {
            padding-left: 0.5rem;
            left: 100%;
            top: 0;
        }
    `;
    document.head.appendChild(style);
    
    ensureCreateModalExists();
    renderTierListsPage();
}

function renderCreateModal() {
    return `
        <div id="create-tierlist-modal" class="hidden fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div class="bg-[#181818] border border-white/10 w-full max-w-2xl rounded-xl shadow-2xl p-0 overflow-hidden relative animate-[popIn_0.2s_ease-out]">
                <button id="close-create-tl-modal" class="absolute top-4 right-4 text-gray-400 hover:text-white z-10">
                    <span class="material-symbols-outlined">close</span>
                </button>

                <div class="flex flex-col md:flex-row h-full">
                    <div id="create-tl-cover-preview" class="w-full md:w-64 min-h-[250px] md:min-h-full bg-gradient-to-br from-[#BE00FF] to-black flex items-center justify-center relative group flex-shrink-0">
                        <span id="create-tl-icon-preview" class="material-symbols-outlined text-6xl text-white shadow-xl drop-shadow-lg">view_list</span>
                        
                        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col justify-center items-center transition-opacity">
                            <span class="text-xs font-bold text-white uppercase tracking-wider mb-2">Theme</span>
                            <input type="color" id="create-tl-color-picker" class="w-8 h-8 cursor-pointer rounded border-0 p-0" value="#BE00FF">
                            
                            <div class="relative mt-3">
                                <button id="tl-icon-trigger" class="flex items-center gap-2 bg-black/60 border border-white/20 text-xs text-white rounded px-3 py-1.5 hover:bg-black/80 hover:border-white/40 transition-all">
                                    <span id="tl-icon-label-text" class="flex items-center gap-2">
                                        <span class="material-symbols-outlined text-sm">view_list</span> List
                                    </span>
                                    <span class="material-symbols-outlined text-[10px]">expand_more</span>
                                </button>
                                
                                <div id="tl-icon-menu" class="hidden absolute top-full left-1/2 -translate-x-1/2 mt-2 w-32 bg-[#1C1C22] border border-white/10 rounded-lg shadow-xl z-[60] p-1 h-40 overflow-y-auto custom-scrollbar">
                                    <div class="tl-icon-option flex items-center gap-2 px-2 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded cursor-pointer transition-colors" data-value="view_list"><span class="material-symbols-outlined text-sm">view_list</span> List</div>
                                    <div class="tl-icon-option flex items-center gap-2 px-2 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded cursor-pointer transition-colors" data-value="star"><span class="material-symbols-outlined text-sm">star</span> Star</div>
                                    <div class="tl-icon-option flex items-center gap-2 px-2 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded cursor-pointer transition-colors" data-value="trophy"><span class="material-symbols-outlined text-sm">trophy</span> Trophy</div>
                                    <div class="tl-icon-option flex items-center gap-2 px-2 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded cursor-pointer transition-colors" data-value="sports_esports"><span class="material-symbols-outlined text-sm">sports_esports</span> Game</div>
                                </div>
                            </div>
                            <input type="hidden" id="create-tl-icon-value" value="view_list">
                        </div>
                    </div>

                    <div class="p-8 flex flex-col justify-center flex-1 gap-4 bg-[#121212]">
                        <h2 class="text-2xl font-bold text-white mb-2" id="create-tl-modal-title">Create Tier List</h2>
                        <input type="hidden" id="edit-tierlist-id" value="">
                        
                        <div>
                            <input id="create-tl-name" type="text" maxlength="50" placeholder="My Awesome Tier List" class="w-full bg-[#2a2a2a] border-none rounded text-white text-xl font-bold placeholder:text-gray-600 focus:ring-0 px-3 py-2">
                            <p class="text-[10px] text-gray-500 text-right mt-1">Max 50 chars</p>
                        </div>
                        
                        <div>
                            <textarea id="create-tl-desc" maxlength="200" placeholder="Add an optional description" class="w-full bg-[#2a2a2a] border-none rounded text-gray-300 text-sm focus:ring-0 px-3 py-3 h-24 resize-none"></textarea>
                            <p class="text-[10px] text-gray-500 text-right mt-1">Max 200 chars</p>
                        </div>

                        <div class="flex items-center justify-between pt-2">
                            <div class="flex items-center gap-2">
                                <input type="checkbox" id="create-tl-public" class="rounded bg-[#2a2a2a] border-none text-[#BE00FF] focus:ring-0" checked>
                                <label for="create-tl-public" class="text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer">Public</label>
                            </div>
                            <button id="submit-create-tierlist" class="px-8 py-2 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform text-sm uppercase tracking-wider">
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function bindCreateModalEvents() {
    const modal = document.getElementById('create-tierlist-modal');
    if (!modal) return;

    const closeBtn = document.getElementById('close-create-tl-modal');
    const picker = document.getElementById('create-tl-color-picker');
    const preview = document.getElementById('create-tl-cover-preview');
    const iconTrigger = document.getElementById('tl-icon-trigger');
    const iconMenu = document.getElementById('tl-icon-menu');
    const iconInput = document.getElementById('create-tl-icon-value');
    const iconLabel = document.getElementById('tl-icon-label-text');
    const iconPreview = document.getElementById('create-tl-icon-preview');
    const submitBtn = document.getElementById('submit-create-tierlist');

    const newClose = closeBtn.cloneNode(true);
    closeBtn.parentNode.replaceChild(newClose, closeBtn);
    newClose.onclick = () => modal.classList.add('hidden');

    const newPicker = picker.cloneNode(true);
    picker.parentNode.replaceChild(newPicker, picker);
    newPicker.oninput = (e) => {
        if(preview) preview.style.background = `linear-gradient(to bottom right, ${e.target.value}, #000000)`;
    };
    if (iconTrigger && iconMenu) {
        const newTrigger = iconTrigger.cloneNode(true);
        iconTrigger.parentNode.replaceChild(newTrigger, iconTrigger);
        newTrigger.onclick = (e) => {
            e.stopPropagation();
            iconMenu.classList.toggle('hidden');
        };

        const options = iconMenu.querySelectorAll('.tl-icon-option');
        options.forEach(opt => {
            const newOpt = opt.cloneNode(true);
            opt.parentNode.replaceChild(newOpt, opt);
            newOpt.onclick = (e) => {
                e.stopPropagation();
                const val = newOpt.dataset.value;
                if(iconInput) iconInput.value = val;
                if(iconLabel) iconLabel.innerHTML = newOpt.innerHTML;
                if(iconPreview) iconPreview.textContent = val;
                iconMenu.classList.add('hidden');
            };
        });

        window.removeEventListener('click', window._tlMenuCloseHandler);
        window._tlMenuCloseHandler = (e) => {
            if (!newTrigger.contains(e.target) && !iconMenu.contains(e.target)) {
                iconMenu.classList.add('hidden');
            }
        };
        window.addEventListener('click', window._tlMenuCloseHandler);
    }

    if(submitBtn) {
        const newSubmit = submitBtn.cloneNode(true);
        submitBtn.parentNode.replaceChild(newSubmit, submitBtn);
        
        newSubmit.onclick = async () => {
            const name = document.getElementById('create-tl-name').value || "My Tier List";
            const desc = document.getElementById('create-tl-desc').value;
            const color = document.getElementById('create-tl-color-picker').value;
            const icon = document.getElementById('create-tl-icon-value').value;
            const isPublic = document.getElementById('create-tl-public').checked;
            const editId = document.getElementById('edit-tierlist-id').value;

            newSubmit.textContent = "Saving...";
            newSubmit.disabled = true;

            try {
                if (editId) {
                    await api.post('/api/tierlists/update', {
                        id: editId, name, description: desc, theme_color: color, icon, is_public: isPublic
                    });
                    showNotification("Tier list updated!", "success");
                } else {
                    await api.post('/api/tierlists/create', {
                        name, description: desc, theme_color: color, icon, is_public: isPublic
                    });
                    showNotification("Tier list created!", "success");
                }
                
                modal.classList.add('hidden');
                
                if (editId && activeTab === 'detail') {
                    const header = document.querySelector('#tierlist-view h1');
                    if(header) header.textContent = name;
                    
                    const res = await api.get(`/api/tierlists/${currentTierlistId}`);
                    window.currentTlMeta = res.tierlist;
                    renderDetailView(document.getElementById('tierlist-view'), store.authUser, res.tierlist);
                } else {
                    activeTab = 'my';
                    renderTierListsPage();
                }
            } catch (e) {
                showNotification("Failed to save.", "error");
            } finally {
                newSubmit.textContent = "Save";
                newSubmit.disabled = false;
            }
        };
    }
}

function ensureCreateModalExists() {
    if (document.getElementById('create-tierlist-modal')) return;
    document.body.insertAdjacentHTML('beforeend', renderCreateModal());
    bindCreateModalEvents();
}

export async function renderTierListsPage() {
    const container = document.getElementById('tierlist-view');
    const user = store.authUser;

    if (activeTab === 'detail') {
        const titleEl = document.getElementById('main-content-title');
        if(titleEl) titleEl.classList.add('hidden');
        renderDetailView(container, user);
        return;
    }

    const pageTitle = activeTab === 'browse' ? 'Community Tierlists' : 'My Tierlists';
    const titleEl = document.getElementById('main-content-title');
    if(titleEl) {
        titleEl.textContent = pageTitle;
        titleEl.classList.remove('hidden');
    }

    container.innerHTML = `
        <div class="w-full max-w-7xl mx-auto pb-20 px-4">
            <div class="flex flex-col md:flex-row items-center justify-between mb-8 gap-4 pt-4">
                <div class="flex items-center gap-1 bg-black/20 p-1 rounded-lg border border-white/5">
                    <button id="tl-tab-browse" class="px-6 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'browse' ? 'bg-[#BE00FF] text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}">
                        Browse
                    </button>
                    <button id="tl-tab-my" class="px-6 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'my' ? 'bg-[#BE00FF] text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}">
                        My Library
                    </button>
                </div>
                <div class="flex items-center gap-3">
                    ${activeTab === 'browse' ? `
                        <div class="relative" id="tl-sort-dropdown-container">
                            <button id="tl-sort-trigger" class="flex items-center gap-2 bg-black/20 border border-white/10 text-xs font-bold text-gray-300 rounded-lg px-4 py-2.5 hover:border-[#BE00FF] hover:text-white transition-all min-w-[140px] justify-between">
                                <span id="tl-sort-label">Newest</span>
                                <span class="material-symbols-outlined text-sm text-gray-500">expand_more</span>
                            </button>
                            <div id="tl-sort-menu" class="hidden absolute right-0 top-full mt-2 w-40 bg-[#1C1C22] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden p-1">
                                <div class="tl-sort-option px-3 py-2 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 rounded cursor-pointer transition-colors" data-value="newest">Newest</div>
                                <div class="tl-sort-option px-3 py-2 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 rounded cursor-pointer transition-colors" data-value="popular">Most Liked</div>
                                <div class="tl-sort-option px-3 py-2 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 rounded cursor-pointer transition-colors" data-value="largest">Largest</div>
                                <div class="tl-sort-option px-3 py-2 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 rounded cursor-pointer transition-colors" data-value="oldest">Oldest</div>
                            </div>
                        </div>
                    ` : ''}
                    ${user ? `<button id="btn-create-tierlist" class="flex items-center gap-2 px-5 py-2.5 bg-white text-black hover:bg-gray-200 rounded-full text-xs font-bold uppercase tracking-widest shadow-xl transition-transform active:scale-95"><span class="material-symbols-outlined text-lg">add</span> Create</button>` : ''}
                </div>
            </div>
            <div id="tierlists-grid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                <div class="col-span-full h-64 flex items-center justify-center"><span class="material-symbols-outlined animate-spin text-4xl text-gray-600">sync</span></div>
            </div>
        </div>
    `;

    ensureCreateModalExists();
    setupGridListeners();
    loadGridContent();
}

function setupGridListeners() {
    const tabBrowse = document.getElementById('tl-tab-browse');
    const tabMy = document.getElementById('tl-tab-my');
    const btnCreate = document.getElementById('btn-create-tierlist');
    const sortTrigger = document.getElementById('tl-sort-trigger');
    const sortMenu = document.getElementById('tl-sort-menu');
    const sortLabel = document.getElementById('tl-sort-label');

    if(tabBrowse) tabBrowse.onclick = () => { activeTab = 'browse'; renderTierListsPage(); };
    if(tabMy) tabMy.onclick = () => { 
        if (!store.authUser) return showNotification("Login required.", "error");
        activeTab = 'my'; 
        renderTierListsPage(); 
    };

    if (sortTrigger && sortMenu) {
        const map = { 'newest': 'Newest', 'popular': 'Most Liked', 'largest': 'Largest', 'oldest': 'Oldest' };
        sortLabel.textContent = map[currentSort] || 'Newest';
        sortTrigger.onclick = (e) => { e.stopPropagation(); sortMenu.classList.toggle('hidden'); };
        document.querySelectorAll('.tl-sort-option').forEach(opt => {
            opt.onclick = (e) => {
                currentSort = e.target.dataset.value;
                sortLabel.textContent = e.target.textContent;
                sortMenu.classList.add('hidden');
                loadGridContent();
            };
        });
        document.addEventListener('click', (e) => { if (!sortTrigger.contains(e.target)) sortMenu.classList.add('hidden'); });
    }

    if (btnCreate) {
        btnCreate.onclick = () => {
            bindCreateModalEvents();
            
            document.getElementById('create-tl-modal-title').textContent = "Create Tier List";
            document.getElementById('edit-tierlist-id').value = '';
            document.getElementById('create-tl-name').value = '';
            document.getElementById('create-tl-desc').value = '';
            document.getElementById('create-tl-color-picker').value = '#BE00FF';
            document.getElementById('create-tl-cover-preview').style.background = 'linear-gradient(to bottom right, #BE00FF, #000000)';
            document.getElementById('create-tl-icon-value').value = 'view_list';
            document.getElementById('tl-icon-label-text').innerHTML = '<span class="material-symbols-outlined text-sm">view_list</span> List';
            document.getElementById('create-tierlist-modal').classList.remove('hidden');
        };
    }
}

async function loadGridContent() {
    const grid = document.getElementById('tierlists-grid');
    try {
        const endpoint = activeTab === 'browse' ? `/api/tierlists/public?sort=${currentSort}` : '/api/tierlists/my';
        const res = await api.get(endpoint);
        const data = res.tierlists;

        if (data.length === 0) {
            grid.innerHTML = `<div class="col-span-full text-center text-gray-500 py-10">No tier lists found.</div>`;
            return;
        }

        grid.innerHTML = data.map(t => `
            <div onclick="window.openTierlist(${t.id})" class="glass-panel p-4 rounded-xl hover:bg-white/5 transition-all cursor-pointer group flex flex-col gap-4 border border-white/5 hover:border-white/10">
                <div class="w-full aspect-square rounded-lg shadow-lg relative overflow-hidden" style="background: linear-gradient(to bottom right, ${t.theme_color}, #000);">
                    <div class="absolute inset-0 flex items-center justify-center">
                        <span class="material-symbols-outlined text-5xl text-white shadow-lg drop-shadow-md">${t.icon || 'view_list'}</span>
                    </div>
                </div>
                <div>
                    <h3 class="font-bold text-white truncate text-base transition-colors">${t.name}</h3>
                    <p class="text-xs text-gray-400 line-clamp-2 mt-1 min-h-[2.5em]">${t.description || 'No description.'}</p>
                    <div class="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        <div class="flex items-center gap-2">
                            ${t.creator_avatar ? `<img src="${t.creator_avatar}" class="w-5 h-5 rounded-full bg-black">` : ''}
                            <span>${activeTab === 'browse' ? (t.creator_name || 'Unknown') : (t.item_count + ' Items')}</span>
                        </div>
                        ${activeTab === 'browse' && t.like_count !== undefined ? `
                            <div class="flex items-center gap-1"><span class="material-symbols-outlined text-xs text-pink-500">favorite</span> ${t.like_count}</div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');

        window.openTierlist = (id) => {
            currentTierlistId = id;
            activeTab = 'detail';
            renderTierListsPage();
        };
    } catch (e) {
        grid.innerHTML = `<div class="col-span-full text-center text-gray-500">Failed to load tier lists.</div>`;
    }
}

async function renderDetailView(container, user, preloadedMeta = null) {
    if(!preloadedMeta) container.innerHTML = `<div class="w-full h-full flex items-center justify-center"><span class="material-symbols-outlined animate-spin text-4xl text-gray-600">sync</span></div>`;
    ensureCreateModalExists();

    try {
        let tl;
        if (preloadedMeta) {
            tl = preloadedMeta;
        } else {
            const res = await api.get(`/api/tierlists/${currentTierlistId}`);
            tl = res.tierlist;
            
            if (!hasUnsavedChanges) {
                if (tl.tiers_config) {
                    localTiers = typeof tl.tiers_config === 'string' ? JSON.parse(tl.tiers_config) : tl.tiers_config;
                } else {
                    localTiers = JSON.parse(JSON.stringify(DEFAULT_TIERS));
                }
                
                localTiers.forEach(t => { if (!t._id) t._id = `tier-${Date.now()}-${Math.random()}`; });

                localItems = res.items.map(i => {
                    if (i.tier_label === 'Unranked') return { ...i, _tierId: 'unranked' };
                    const matchingTier = localTiers.find(t => t.label === i.tier_label);
                    return { ...i, _tierId: matchingTier ? matchingTier._id : 'unranked' };
                });
            }
        }

        const isOwner = user && String(user.sub) === String(tl.owner_id);

        const renderItems = (itemsList) => itemsList.map((item, index) => {
            const towerData = store.allTowers.find(t => t.name === item.tower_name);
            const imgUrl = `https://tr.rbxcdn.com/${towerData?.icon_url?.split('/')[3] || ''}/150/150/Image/Png/noFilter`;
            const itemId = item.id || `temp-${index}-${Date.now()}`;
            
            const acronym = getAcronym(item.tower_name);
            
            const pillClass = (towerData && DIFFICULTY_PILL_CLASSES[towerData.difficulty]) ? DIFFICULTY_PILL_CLASSES[towerData.difficulty] : 'border-gray-500/50 text-gray-400 bg-gray-500/10';

            return `
                <div class="relative w-24 h-24 group/item cursor-grab active:cursor-grabbing hover:z-20 transition-transform hover:scale-105 flex-shrink-0 bg-[#202020] rounded-lg border border-white/10 overflow-hidden tier-item" id="item-${itemId}" draggable="true" ondragstart="window.handleTlDragStart(event, '${itemId}', '${item.tower_name}')" ondragend="window.handleTlDragEnd(event)" onclick="if(!window.isDragging) window.viewTower('${item.tower_name}')" title="${item.tower_name}">
                    <img src="${imgUrl}" class="w-full h-full object-cover pointer-events-none" onerror="this.src='icon.jpg'">
                    
                    <div class="absolute bottom-0 left-0 right-0 h-8 flex items-center justify-center pointer-events-none border-t border-b-0 border-x-0 backdrop-blur-md ${pillClass} rounded-none">
                        <span class="text-sm font-black font-mono tracking-wide truncate px-1 drop-shadow-md">
                            ${acronym}
                        </span>
                    </div>
                    
                    ${isOwner ? `
                        <button onclick="window.deleteTierItem(event, '${itemId}')" class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity hover:scale-110 z-30 cursor-pointer">
                            <span class="material-symbols-outlined text-[10px] font-bold">close</span>
                        </button>
                    ` : ''}
                </div>
            `;
        }).join('');

        let boardHtml = '';
        localTiers.forEach((tier, tIdx) => {
            const tierItems = localItems.filter(i => i._tierId === tier._id);
            
            const controls = isOwner ? `
                <div class="flex flex-col gap-1 items-center justify-center border-l border-black/20 w-8 bg-black/10 hover:bg-black/20 transition-colors">
                    <button onclick="window.moveTierRow(${tIdx}, -1)" class="text-black/50 hover:text-black transform hover:-translate-y-0.5 transition-transform">▲</button>
                    <div class="relative group/settings">
                        <button class="text-black/50 hover:text-black">
                            <span class="material-symbols-outlined text-base">settings</span>
                        </button>
                        <div class="absolute hidden group-hover/settings:block tier-settings-menu z-50 w-40">
                            <div class="bg-[#1C1C22] border border-white/10 p-3 rounded shadow-xl flex flex-col gap-2">
                                <label class="text-[10px] text-gray-400 font-bold uppercase">Color</label>
                                <input type="color" value="${tier.color}" class="w-full h-8 cursor-pointer rounded" onchange="window.updateTierColor(${tIdx}, this.value)">
                                <div class="h-px bg-white/10 my-1"></div>
                                <button onclick="window.deleteTierRow(${tIdx})" class="text-xs text-red-400 hover:text-red-300 font-bold uppercase flex items-center gap-2">
                                    <span class="material-symbols-outlined text-sm">delete</span> Delete Row
                                </button>
                            </div>
                        </div>
                    </div>
                    <button onclick="window.moveTierRow(${tIdx}, 1)" class="text-black/50 hover:text-black transform hover:translate-y-0.5 transition-transform">▼</button>
                </div>
            ` : '';

            const labelContent = isOwner ? 
                `<textarea class="bg-transparent text-center w-full font-black text-2xl text-black outline-none border-b border-transparent focus:border-black/20 resize-none overflow-hidden" rows="1" onchange="window.updateTierLabel(${tIdx}, this.value)" style="min-height: 2rem;">${tier.label}</textarea>` : 
                `<span class="text-2xl tier-row-label">${tier.label}</span>`;

            boardHtml += `
                <div class="flex border-b border-white/10 min-h-[105px] group/row">
                    <div class="w-auto min-w-[6rem] max-w-[12rem] flex flex-shrink-0" style="background-color: ${tier.color};">
                        <div class="flex-1 flex items-center justify-center p-2 font-black text-black select-none text-center">
                            ${labelContent}
                        </div>
                        ${controls}
                    </div>
                    
                    <div class="flex-1 bg-[#121212] p-2 flex flex-wrap gap-2 content-start transition-colors tier-drop-zone"
                         data-tier-id="${tier._id}"
                         ondragenter="window.handleTlDragEnter(event, this)"
                         ondragover="event.preventDefault()"
                         ondrop="window.handleTlDrop(event, '${tier._id}')">
                        ${renderItems(tierItems)}
                    </div>
                </div>
            `;
        });

        const unrankedItems = localItems.filter(i => i._tierId === 'unranked');
        
        container.innerHTML = `
            <div class="w-full max-w-7xl mx-auto pb-20 px-4 pt-8">
                <button id="tl-back-to-browse" class="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors group">
                    <span class="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span> 
                    <span class="text-xs font-bold uppercase tracking-widest">Back to Library</span>
                </button>

                <div class="flex flex-col md:flex-row gap-10 mb-10 items-end">
                    <div class="w-40 h-40 rounded-xl shadow-2xl flex-shrink-0 flex items-center justify-center relative group overflow-hidden" 
                         style="background: linear-gradient(to bottom right, ${tl.theme_color}, #050505);">
                        <span class="material-symbols-outlined text-6xl text-white drop-shadow-2xl opacity-90">${tl.icon}</span>
                        ${isOwner ? `<button id="btn-edit-tierlist" class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold tracking-widest transition-opacity uppercase">Edit Details</button>` : ''}
                    </div>
                    
                    <div class="flex-1 mb-1 w-full">
                        <div class="flex justify-between items-start">
                            <div>
                                <span class="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2 block bg-white/5 inline-block px-2 py-1 rounded">${tl.is_public ? 'Public List' : 'Private List'}</span>
                                <h1 class="text-4xl md:text-6xl font-black text-white mb-2 tracking-tight leading-none">${tl.name}</h1>
                                <p class="text-gray-300 text-sm max-w-2xl leading-relaxed whitespace-pre-wrap font-medium">${tl.description || ''}</p>
                            </div>
                            
                            <div class="flex flex-row items-center gap-3 pl-4">
                                ${isOwner ? `
                                    <button id="tl-save-btn" class="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-full text-xs uppercase tracking-widest shadow-lg transition-all ${hasUnsavedChanges ? 'opacity-100 animate-pulse' : 'hidden'}">
                                        <span class="material-symbols-outlined text-sm">save</span> Save Changes
                                    </button>
                                ` : ''}

                                <button id="btn-like-tierlist" class="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all group ${tl.is_liked ? 'text-pink-500 border-pink-500/50 bg-pink-500/10' : 'text-gray-400'}">
                                    <span class="material-symbols-outlined ${tl.is_liked ? 'fill' : ''} group-hover:scale-110 transition-transform">favorite</span>
                                    <span class="text-xs font-bold" id="tl-like-count-display">${tl.like_count || 0}</span>
                                </button>
                                
                                ${isOwner ? `
                                    <button id="btn-delete-tierlist" class="w-10 h-10 flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-full transition-colors border border-red-500/20" title="Delete Tier List">
                                        <span class="material-symbols-outlined text-lg">delete</span>
                                    </button>
                                ` : ''}
                            </div>
                        </div>

                        <div class="flex items-center gap-3 mt-4 text-sm font-bold text-white border-t border-white/10 pt-4">
                            <div class="flex items-center gap-2 pr-4 border-r border-white/10">
                                <img src="${tl.owner_avatar || 'icon.jpg'}" class="w-6 h-6 rounded-full bg-black border border-white/20">
                                <span class="text-gray-200 text-xs">${tl.owner_name}</span>
                            </div>
                            <span class="text-gray-400 text-xs">${localItems.length} Items</span>
                        </div>
                    </div>
                </div>

                <div class="bg-black border border-white/10 rounded-xl overflow-hidden shadow-2xl mb-6 relative">
                    ${boardHtml}
                    ${isOwner ? `
                        <div class="bg-[#121212] p-2 border-t border-white/10 text-center">
                            <button onclick="window.addTierRow()" class="text-xs font-bold text-gray-500 hover:text-white uppercase tracking-wider py-3 w-full border-2 border-dashed border-white/5 hover:border-white/20 rounded-lg transition-colors">+ Add Row</button>
                        </div>
                    ` : ''}
                </div>

                ${isOwner ? `
                    <div class="flex flex-col gap-3">
                        <div class="flex justify-between items-center px-1">
                            <span class="text-sm font-bold text-gray-400 uppercase tracking-wider">Unranked Pool</span>
                            
                            <div class="relative w-64 group">
                                <span class="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-500 text-sm group-focus-within:text-[#BE00FF] transition-colors">search</span>
                                <input id="add-tl-tower-input" type="text" placeholder="Add to pool..." class="w-full bg-[#181818] border border-white/10 rounded-full pl-10 pr-4 py-2 text-xs text-white focus:border-[#BE00FF] focus:outline-none transition-all">
                                <div id="add-tl-suggestions" class="absolute bottom-full left-0 right-0 mb-2 bg-[#1C1C22] border border-white/10 rounded-xl shadow-2xl hidden z-50 max-h-60 overflow-y-auto custom-scrollbar p-1"></div>
                            </div>
                        </div>
                        <div class="min-h-[140px] bg-[#121212] border border-white/10 rounded-xl p-4 flex flex-wrap gap-2 transition-colors tier-drop-zone"
                             data-tier-id="unranked"
                             ondragenter="window.handleTlDragEnter(event, this)"
                             ondragover="event.preventDefault()"
                             ondrop="window.handleTlDrop(event, 'unranked')">
                            ${renderItems(unrankedItems)}
                            ${unrankedItems.length === 0 ? '<div class="w-full h-full flex items-center justify-center text-gray-600 text-xs italic pointer-events-none p-4">Drag items here to unrank them</div>' : ''}
                        </div>
                    </div>
                ` : ''}
            </div>
            ${renderCreateModal()}
        `;

        setupDetailListeners(tl, localItems, isOwner);
        if(!window.createModalBound) {
            if(!document.getElementById('create-tierlist-modal')) {
               container.insertAdjacentHTML('beforeend', renderCreateModal());
            }
            bindCreateModalEvents();
            window.createModalBound = true;
        }
        
        if(isOwner) {
            document.getElementById('btn-edit-tierlist').onclick = () => {
                bindCreateModalEvents();
                
                const modal = document.getElementById('create-tierlist-modal');
                document.getElementById('create-tl-modal-title').textContent = "Edit Tier List";
                document.getElementById('create-tl-name').value = tl.name;
                document.getElementById('create-tl-desc').value = tl.description || '';
                document.getElementById('create-tl-color-picker').value = tl.theme_color;
                
                const iconEl = document.getElementById('create-tl-icon-value');
                const iconLabel = document.getElementById('tl-icon-label-text');
                if(iconEl) iconEl.value = tl.icon;
                if(iconLabel) {
                    const map = {
                        'view_list': 'List', 'star': 'Star', 'trophy': 'Trophy', 'sports_esports': 'Game'
                    };
                    const label = map[tl.icon] || 'List';
                    iconLabel.innerHTML = `<span class="material-symbols-outlined text-sm">${tl.icon}</span> ${label}`;
                }
                
                document.getElementById('create-tl-public').checked = tl.is_public;
                document.getElementById('edit-tierlist-id').value = tl.id;
                document.getElementById('create-tl-cover-preview').style.background = `linear-gradient(to bottom right, ${tl.theme_color}, #000)`;
                modal.classList.remove('hidden');
            };
        }

    } catch (e) {
        console.error(e);
        container.innerHTML = `<div class="p-10 text-center text-red-400">Failed to load tier list.</div>`;
    }
}

function updateLocalState(isDirty = true) {
    hasUnsavedChanges = isDirty;
    const saveBtn = document.getElementById('tl-save-btn');
    if (saveBtn) {
        if (isDirty) {
            saveBtn.classList.remove('hidden');
            saveBtn.classList.add('opacity-100', 'animate-pulse');
        } else {
            saveBtn.classList.add('hidden');
            saveBtn.classList.remove('opacity-100', 'animate-pulse');
        }
    }
}

function refreshBoard(markDirty = true) {
    const container = document.getElementById('tierlist-view');
    if (window.currentTlMeta) {
        renderDetailView(container, store.authUser, window.currentTlMeta);
        updateLocalState(markDirty);
    }
}

function setupDetailListeners(tierlist, items, isOwner) {
    window.currentTlMeta = tierlist;

    document.getElementById('tl-back-to-browse').onclick = async () => { 
        if (hasUnsavedChanges) {
            const confirm = await showConfirmModal("Unsaved Changes", "You have unsaved changes. Leave anyway?", "Leave", "bg-red-500");
            if (!confirm) return;
        }
        activeTab = 'browse'; 
        hasUnsavedChanges = false;
        renderTierListsPage(); 
    };

    const btnLike = document.getElementById('btn-like-tierlist');
    if(btnLike) {
        btnLike.onclick = async () => {
            if(!store.authUser) return showNotification("Login required.", "error");
            try {
                const res = await api.post('/api/tierlists/toggle_like', { tierlist_id: tierlist.id });
                if(res.success) {
                    const icon = btnLike.querySelector('span');
                    const count = document.getElementById('tl-like-count-display');
                    if(res.action === 'liked') {
                        icon.classList.add('fill');
                        btnLike.classList.add('text-pink-500', 'border-pink-500/50', 'bg-pink-500/10');
                        btnLike.classList.remove('text-gray-400');
                    } else {
                        icon.classList.remove('fill');
                        btnLike.classList.remove('text-pink-500', 'border-pink-500/50', 'bg-pink-500/10');
                        btnLike.classList.add('text-gray-400');
                    }
                    count.textContent = res.new_count;
                }
            } catch(e) { console.error(e); }
        };
    }

    if (!isOwner) return;

    const saveBtn = document.getElementById('tl-save-btn');
    if (saveBtn) {
        saveBtn.onclick = async () => {
            saveBtn.textContent = "Saving...";
            saveBtn.disabled = true;
            try {
                const itemsToSave = localItems.map(i => {
                    if (i._tierId === 'unranked') return { ...i, tier_label: 'Unranked' };
                    const tier = localTiers.find(t => t._id === i._tierId);
                    return {
                        ...i,
                        tier_label: tier ? tier.label : 'Unranked'
                    };
                });
                
                await api.post('/api/tierlists/save_items', {
                    tierlist_id: tierlist.id,
                    items: itemsToSave,
                    tiers_config: localTiers
                });
                showNotification("Changes saved successfully!", "success");
                
                localItems = itemsToSave.map(i => ({ ...i, _tierId: 'unranked' }));
                
                hasUnsavedChanges = false;
                saveBtn.classList.add('hidden');
                saveBtn.textContent = "Save Changes";
                saveBtn.disabled = false;
                
                refreshBoard(false);
            } catch (e) {
                showNotification("Save failed.", "error");
                saveBtn.textContent = "Save Changes";
                saveBtn.disabled = false;
            }
        };
    }

    document.getElementById('btn-delete-tierlist').onclick = async () => {
        const confirmed = await showConfirmModal("Delete Tier List", "Are you sure?", "Delete", "bg-red-500");
        if(!confirmed) return;
        try {
            await api.post('/api/tierlists/delete', { tierlist_id: tierlist.id });
            showNotification("Tier list deleted.", "success");
            activeTab = 'my';
            renderTierListsPage();
        } catch(e) { showNotification("Delete failed.", "error"); }
    };

    const input = document.getElementById('add-tl-tower-input');
    const suggestions = document.getElementById('add-tl-suggestions');
    const allNames = store.allTowers.map(t => t.name);

    input.addEventListener('input', () => {
        const val = input.value.toLowerCase();
        suggestions.innerHTML = '';
        if (val.length < 2) { suggestions.classList.add('hidden'); return; }

        const matches = allNames.filter(t => t.toLowerCase().includes(val)).slice(0, 10);
        if (matches.length > 0) {
            matches.forEach(name => {
                const div = document.createElement('div');
                div.className = "px-4 py-2 text-sm text-gray-300 hover:bg-white/10 cursor-pointer";
                div.textContent = name;
                div.onclick = () => {
                    input.value = '';
                    suggestions.classList.add('hidden');
                    
                    if (localItems.some(i => i.tower_name === name)) {
                        return showNotification("Tower already in list!", "error");
                    }

                    localItems.push({
                        id: `temp-${Date.now()}`,
                        tower_name: name,
                        _tierId: 'unranked',
                        tier_label: 'Unranked'
                    });
                    showNotification("Added to Unranked Pool", "success");
                    refreshBoard();
                };
                suggestions.appendChild(div);
            });
            suggestions.classList.remove('hidden');
        } else { suggestions.classList.add('hidden'); }
    });

    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !suggestions.contains(e.target)) {
            suggestions.classList.add('hidden');
        }
    });

    window.addTierRow = () => {
        const colors = ['#ff7f7f', '#ffbf7f', '#ffdf7f', '#ffff7f', '#bfff7f', '#7fffff', '#ff7fff'];
        localTiers.push({ 
            _id: 'new-' + Date.now(),
            label: 'NEW', 
            color: colors[localTiers.length % colors.length] 
        });
        refreshBoard();
    };

    window.deleteTierRow = (index) => {
        const tier = localTiers[index];
        localItems.forEach(item => {
            if (item._tierId === tier._id) item._tierId = 'unranked';
        });
        localTiers.splice(index, 1);
        refreshBoard();
    };

    window.moveTierRow = (index, dir) => {
        if (index + dir < 0 || index + dir >= localTiers.length) return;
        const temp = localTiers[index];
        localTiers[index] = localTiers[index + dir];
        localTiers[index + dir] = temp;
        refreshBoard();
    };

    window.updateTierLabel = (index, newVal) => {
        localTiers[index].label = newVal;
        updateLocalState();
    };

    window.updateTierColor = (index, newColor) => {
        localTiers[index].color = newColor;
        refreshBoard();
    };

    window.deleteTierItem = (e, itemId) => {
        e.stopPropagation();
        localItems = localItems.filter(i => String(i.id) !== String(itemId));
        refreshBoard();
    };

    window.handleTlDragStart = (e, id, name) => {
        window.isDragging = true;
        draggedItemData = { id, name };
        e.dataTransfer.setData('text/plain', id);
        e.dataTransfer.effectAllowed = 'move';
        
        setTimeout(() => {
            const el = document.getElementById(`item-${id}`);
            if (el) el.classList.add('opacity-0');
        }, 0);
    };
    
    window.handleTlDragEnd = (e) => {
        window.isDragging = false;
        if (draggedItemData && draggedItemData.id) {
            const el = document.getElementById(`item-${draggedItemData.id}`);
            if (el) el.classList.remove('opacity-0');
        }
        
        if (placeholderEl && placeholderEl.parentNode) {
            placeholderEl.parentNode.removeChild(placeholderEl);
        }
        placeholderEl = null;
        currentDropTarget = null;
        draggedItemData = null;
    };

    window.handleTlDragEnter = (e, dropZone) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (currentDropTarget === dropZone) return;
        currentDropTarget = dropZone;

        if (!placeholderEl) {
            placeholderEl = document.createElement('div');
            placeholderEl.className = 'tier-placeholder';
        }

        dropZone.appendChild(placeholderEl);
    };

    window.handleTlDrop = (e, targetTierId) => {
        e.preventDefault();
        e.stopPropagation();
        
        window.handleTlDragEnd(e);

        const itemId = e.dataTransfer.getData('text/plain');
        const oldIndex = localItems.findIndex(i => String(i.id) === String(itemId));
        if (oldIndex === -1) return;

        const item = localItems[oldIndex];
        
        if (item._tierId !== targetTierId) {
            item._tierId = targetTierId; 
            localItems.splice(oldIndex, 1);
            localItems.push(item);
            refreshBoard();
        }
    };
}