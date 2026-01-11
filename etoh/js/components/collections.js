import { api } from '../api.js';
import { store } from '../state.js';
import { showNotification } from '../utils.js';
import { DIFFICULTY_COLORS, DIFFICULTY_PILL_CLASSES } from '../config.js';
import { openModalWithTower, showConfirmModal } from '../ui/modals.js';

let activeTab = 'browse'; 
let currentCollectionId = null;
let hasUnsavedChanges = false; 
let currentSort = 'newest';

window.viewTower = (name) => openModalWithTower(name);

function ensureCreateModalExists() {
    if (document.getElementById('create-collection-modal')) return;

    const modalHtml = `
        <div id="create-collection-modal" class="hidden fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div class="bg-[#181818] border border-white/10 w-full max-w-2xl rounded-xl shadow-2xl p-0 overflow-hidden relative animate-[popIn_0.2s_ease-out]">
                <button id="close-create-modal" class="absolute top-4 right-4 text-gray-400 hover:text-white z-10">
                    <span class="material-symbols-outlined">close</span>
                </button>

                <div class="flex flex-col md:flex-row h-full">
                    <div id="create-cover-preview" class="w-full md:w-64 min-h-[250px] md:min-h-full bg-gradient-to-br from-[#BE00FF] to-black flex items-center justify-center relative group flex-shrink-0">
                        <span id="create-icon-preview" class="material-symbols-outlined text-6xl text-white shadow-xl drop-shadow-lg">queue_music</span>
                        
                        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col justify-center items-center transition-opacity">
                            <span class="text-xs font-bold text-white uppercase tracking-wider mb-2">Theme</span>
                            <input type="color" id="create-color-picker" class="w-8 h-8 cursor-pointer rounded border-0 p-0" value="#BE00FF">
                            
                            <div class="relative mt-3">
                                <button id="icon-trigger" class="flex items-center gap-2 bg-black/60 border border-white/20 text-xs text-white rounded px-3 py-1.5 hover:bg-black/80 hover:border-white/40 transition-all">
                                    <span id="icon-label-text" class="flex items-center gap-2">
                                        <span class="material-symbols-outlined text-sm">queue_music</span> Music
                                    </span>
                                    <span class="material-symbols-outlined text-[10px]">expand_more</span>
                                </button>
                                
                                <div id="icon-menu" class="hidden absolute top-full left-1/2 -translate-x-1/2 mt-2 w-32 bg-[#1C1C22] border border-white/10 rounded-lg shadow-xl z-[60] p-1 h-40 overflow-y-auto custom-scrollbar">
                                    <div class="icon-option flex items-center gap-2 px-2 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded cursor-pointer transition-colors" data-value="queue_music"><span class="material-symbols-outlined text-sm">queue_music</span> Music</div>
                                    <div class="icon-option flex items-center gap-2 px-2 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded cursor-pointer transition-colors" data-value="star"><span class="material-symbols-outlined text-sm">star</span> Star</div>
                                    <div class="icon-option flex items-center gap-2 px-2 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded cursor-pointer transition-colors" data-value="bolt"><span class="material-symbols-outlined text-sm">bolt</span> Bolt</div>
                                    <div class="icon-option flex items-center gap-2 px-2 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded cursor-pointer transition-colors" data-value="timer"><span class="material-symbols-outlined text-sm">timer</span> Timer</div>
                                    <div class="icon-option flex items-center gap-2 px-2 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded cursor-pointer transition-colors" data-value="emoji_events"><span class="material-symbols-outlined text-sm">emoji_events</span> Trophy</div>
                                    <div class="icon-option flex items-center gap-2 px-2 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded cursor-pointer transition-colors" data-value="skull"><span class="material-symbols-outlined text-sm">skull</span> Skull</div>
                                    <div class="icon-option flex items-center gap-2 px-2 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded cursor-pointer transition-colors" data-value="landscape"><span class="material-symbols-outlined text-sm">landscape</span> Mountain</div>
                                    <div class="icon-option flex items-center gap-2 px-2 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded cursor-pointer transition-colors" data-value="favorite"><span class="material-symbols-outlined text-sm">favorite</span> Heart</div>
                                </div>
                            </div>
                            <input type="hidden" id="create-icon-value" value="queue_music">
                        </div>
                    </div>

                    <div class="p-8 flex flex-col justify-center flex-1 gap-4 bg-[#121212]">
                        <h2 class="text-2xl font-bold text-white mb-2" id="create-modal-title">Create Playlist</h2>
                        <input type="hidden" id="edit-collection-id" value="">
                        
                        <div>
                            <input id="create-name" type="text" maxlength="50" placeholder="My Playlist #1" class="w-full bg-[#2a2a2a] border-none rounded text-white text-xl font-bold placeholder:text-gray-600 focus:ring-0 px-3 py-2">
                            <p class="text-[10px] text-gray-500 text-right mt-1">Max 50 chars</p>
                        </div>
                        
                        <div>
                            <textarea id="create-desc" maxlength="200" placeholder="Add an optional description" class="w-full bg-[#2a2a2a] border-none rounded text-gray-300 text-sm focus:ring-0 px-3 py-3 h-24 resize-none"></textarea>
                            <p class="text-[10px] text-gray-500 text-right mt-1">Max 200 chars</p>
                        </div>

                        <div class="flex items-center justify-between pt-2">
                            <div class="flex items-center gap-2">
                                <input type="checkbox" id="create-public" class="rounded bg-[#2a2a2a] border-none text-[#BE00FF] focus:ring-0" checked>
                                <label for="create-public" class="text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer">Public</label>
                            </div>
                            <button id="submit-create-collection" class="px-8 py-2 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform text-sm uppercase tracking-wider">
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    bindCreateModalEvents();
}

function bindCreateModalEvents() {
    const modal = document.getElementById('create-collection-modal');
    if (!modal) return;

    const closeBtn = document.getElementById('close-create-modal');
    if(closeBtn) closeBtn.onclick = () => modal.classList.add('hidden');

    const picker = document.getElementById('create-color-picker');
    const preview = document.getElementById('create-cover-preview');
    const iconTrigger = document.getElementById('icon-trigger');
    const iconMenu = document.getElementById('icon-menu');
    const iconInput = document.getElementById('create-icon-value');
    const iconLabel = document.getElementById('icon-label-text');
    const iconPreview = document.getElementById('create-icon-preview');

    if(picker && preview) {
        picker.oninput = (e) => {
            preview.style.background = `linear-gradient(to bottom right, ${e.target.value}, #000000)`;
        };
    }

    if (iconTrigger && iconMenu) {
        iconTrigger.onclick = (e) => {
            e.stopPropagation();
            iconMenu.classList.toggle('hidden');
        };

        document.querySelectorAll('.icon-option').forEach(opt => {
            opt.onclick = (e) => {
                e.stopPropagation();
                const val = opt.dataset.value;
                if(iconInput) iconInput.value = val;
                if(iconLabel) iconLabel.innerHTML = opt.innerHTML; 
                if(iconPreview) iconPreview.textContent = val;
                iconMenu.classList.add('hidden');
            };
        });

        document.removeEventListener('click', window._closeColIconMenu);
        window._closeColIconMenu = (e) => {
            if (!iconTrigger.contains(e.target)) iconMenu.classList.add('hidden');
        };
        document.addEventListener('click', window._closeColIconMenu);
    }

    const submitBtn = document.getElementById('submit-create-collection');
    if(submitBtn) {
        submitBtn.onclick = async () => {
            const name = document.getElementById('create-name').value || "My Playlist";
            const desc = document.getElementById('create-desc').value;
            const color = document.getElementById('create-color-picker').value;
            const iconEl = document.getElementById('create-icon-value');
            const icon = iconEl ? iconEl.value : 'queue_music';
            const isPublic = document.getElementById('create-public').checked;
            const editId = document.getElementById('edit-collection-id').value;

            submitBtn.textContent = "Saving...";
            submitBtn.disabled = true;

            try {
                if (editId) {
                    await api.post('/api/collections/update', {
                        id: editId, name, description: desc, theme_color: color, icon, is_public: isPublic
                    });
                    showNotification("Playlist updated!", "success");
                } else {
                    await api.post('/api/collections/create', {
                        name, description: desc, theme_color: color, icon, is_public: isPublic
                    });
                    showNotification("Collection created!", "success");
                }
                
                modal.classList.add('hidden');
                
                if (editId && activeTab === 'detail') {
                    renderDetailView(document.getElementById('collections-view'), store.authUser);
                } else {
                    activeTab = 'my';
                    renderCollectionsPage();
                }
            } catch (e) {
                showNotification("Failed to save.", "error");
            } finally {
                submitBtn.textContent = "Save";
                submitBtn.disabled = false;
            }
        };
    }
}

export async function renderCollectionsPage() {
    const container = document.getElementById('collections-view');
    const user = store.authUser;

    ensureCreateModalExists();

    if (activeTab === 'detail' && hasUnsavedChanges) {
        await saveCurrentOrder();
    }

    if (activeTab === 'detail') {
        renderDetailView(container, user);
        return;
    }

    container.innerHTML = `
        <div class="w-full max-w-7xl mx-auto pb-20 px-4">
            <div class="flex flex-col md:flex-row items-center justify-between mb-8 pt-4 gap-4">
                <div class="flex items-center gap-1 bg-black/20 p-1 rounded-lg border border-white/5">
                    <button id="tab-browse" class="px-6 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'browse' ? 'bg-[#BE00FF] text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}">
                        Browse
                    </button>
                    <button id="tab-my" class="px-6 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'my' ? 'bg-[#BE00FF] text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}">
                        My Library
                    </button>
                </div>

                <div class="flex items-center gap-3">
                    ${activeTab === 'browse' ? `
                        <div class="relative" id="sort-dropdown-container">
                            <button id="sort-trigger" class="flex items-center gap-2 bg-black/20 border border-white/10 text-xs font-bold text-gray-300 rounded-lg px-4 py-2.5 hover:border-[#BE00FF] hover:text-white transition-all min-w-[140px] justify-between">
                                <span id="sort-label">Newest</span>
                                <span class="material-symbols-outlined text-sm text-gray-500">expand_more</span>
                            </button>
                            
                            <div id="sort-menu" class="hidden absolute right-0 top-full mt-2 w-40 bg-[#1C1C22] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden p-1">
                                <div class="sort-option px-3 py-2 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 rounded cursor-pointer transition-colors" data-value="newest">Newest</div>
                                <div class="sort-option px-3 py-2 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 rounded cursor-pointer transition-colors" data-value="popular">Most Liked</div>
                                <div class="sort-option px-3 py-2 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 rounded cursor-pointer transition-colors" data-value="largest">Most Towers</div>
                                <div class="sort-option px-3 py-2 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 rounded cursor-pointer transition-colors" data-value="oldest">Oldest</div>
                            </div>
                        </div>
                    ` : ''}
                    
                    ${user ? `
                        <button id="btn-create-collection" class="flex items-center gap-2 px-5 py-2.5 bg-white text-black hover:bg-gray-200 rounded-full text-xs font-bold uppercase tracking-widest shadow-xl transition-transform active:scale-95">
                            <span class="material-symbols-outlined text-lg">add</span>
                            Create
                        </button>
                    ` : ''}
                </div>
            </div>

            <div id="collections-grid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                <div class="col-span-full h-64 flex items-center justify-center">
                    <span class="material-symbols-outlined animate-spin text-4xl text-gray-600">sync</span>
                </div>
            </div>
        </div>
    `;

    setupGridListeners();
    loadGridContent();
}

function setupGridListeners() {
    const tabBrowse = document.getElementById('tab-browse');
    const tabMy = document.getElementById('tab-my');
    const btnCreate = document.getElementById('btn-create-collection');
    
    const sortTrigger = document.getElementById('sort-trigger');
    const sortMenu = document.getElementById('sort-menu');
    const sortLabel = document.getElementById('sort-label');

    if(tabBrowse) tabBrowse.onclick = () => { activeTab = 'browse'; renderCollectionsPage(); };
    if(tabMy) tabMy.onclick = () => { 
        if (!store.authUser) return showNotification("Login required.", "error");
        activeTab = 'my'; 
        renderCollectionsPage(); 
    };

    if (sortTrigger && sortMenu) {
        const map = { 'newest': 'Newest', 'popular': 'Most Liked', 'largest': 'Most Towers', 'oldest': 'Oldest' };
        sortLabel.textContent = map[currentSort] || 'Newest';

        sortTrigger.onclick = (e) => {
            e.stopPropagation();
            sortMenu.classList.toggle('hidden');
        };

        document.querySelectorAll('.sort-option').forEach(opt => {
            opt.onclick = (e) => {
                currentSort = e.target.dataset.value;
                sortLabel.textContent = e.target.textContent;
                sortMenu.classList.add('hidden');
                loadGridContent();
            };
        });

        document.addEventListener('click', (e) => {
            if (!sortTrigger.contains(e.target)) sortMenu.classList.add('hidden');
        });
    }

    if (btnCreate) {
        btnCreate.onclick = () => {
            document.getElementById('create-modal-title').textContent = "Create Playlist";
            document.getElementById('edit-collection-id').value = '';
            document.getElementById('create-name').value = '';
            document.getElementById('create-desc').value = '';
            document.getElementById('create-color-picker').value = '#BE00FF';
            document.getElementById('create-cover-preview').style.background = 'linear-gradient(to bottom right, #BE00FF, #000000)';
            
            const iconPreview = document.getElementById('create-icon-preview');
            const iconInput = document.getElementById('create-icon-value');
            const iconLabel = document.getElementById('icon-label-text');
            if(iconPreview) iconPreview.textContent = 'queue_music';
            if(iconInput) iconInput.value = 'queue_music';
            if(iconLabel) iconLabel.innerHTML = '<span class="material-symbols-outlined text-sm">queue_music</span> Music';

            document.getElementById('create-collection-modal').classList.remove('hidden');
        };
    }
}

async function loadGridContent() {
    const grid = document.getElementById('collections-grid');
    let data = [];

    try {
        const endpoint = activeTab === 'browse' ? `/api/collections/public?sort=${currentSort}` : '/api/collections/my';
        const res = await api.get(endpoint);
        data = res.collections;
    } catch (e) {
        grid.innerHTML = `<div class="col-span-full text-center text-gray-500">Failed to load collections.</div>`;
        return;
    }

    if (data.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center text-gray-500 py-10">No collections found.</div>`;
        return;
    }

    grid.innerHTML = data.map(c => `
        <div onclick="window.openCollection(${c.id})" class="glass-panel p-4 rounded-xl hover:bg-white/5 transition-all cursor-pointer group flex flex-col gap-4 border border-white/5 hover:border-white/10">
            <div class="w-full aspect-square rounded-lg shadow-lg relative overflow-hidden" 
                 style="background: linear-gradient(to bottom right, ${c.theme_color}, #000);">
                <div class="absolute inset-0 flex items-center justify-center">
                    <span class="material-symbols-outlined text-5xl text-white shadow-lg drop-shadow-md">${c.icon || 'queue_music'}</span>
                </div>
            </div>
            <div>
                <h3 class="font-bold text-white truncate text-base transition-colors">${c.name}</h3>
                <p class="text-xs text-gray-400 line-clamp-2 mt-1 min-h-[2.5em]">${c.description || 'No description.'}</p>
                <div class="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    <div class="flex items-center gap-2">
                        ${c.creator_avatar ? `<img src="${c.creator_avatar}" class="w-5 h-5 rounded-full bg-black">` : ''}
                        <span>${activeTab === 'browse' ? (c.creator_name || 'Unknown') : (c.item_count + ' Towers')}</span>
                    </div>
                    ${activeTab === 'browse' && c.like_count !== undefined ? `
                        <div class="flex items-center gap-1">
                            <span class="material-symbols-outlined text-xs text-pink-500">favorite</span> ${c.like_count}
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');

    window.openCollection = (id) => {
        currentCollectionId = id;
        activeTab = 'detail';
        renderCollectionsPage();
    };
}

async function renderDetailView(container, user) {
    ensureCreateModalExists();
    container.innerHTML = `<div class="w-full h-full flex items-center justify-center"><span class="material-symbols-outlined animate-spin text-4xl text-gray-600">sync</span></div>`;

    try {
        const res = await api.get(`/api/collections/${currentCollectionId}`);
        const c = res.collection;
        const items = res.items;

        const isOwner = user && String(user.sub) === String(c.owner_id);
        const beatenSet = new Set(store.beatenTowers.map(t => t.name));
        let beatenCount = 0;
        items.forEach(i => { if (beatenSet.has(i.tower_name)) beatenCount++; });
        const progressPct = items.length > 0 ? ((beatenCount / items.length) * 100).toFixed(0) : 0;
        
        let itemsHtml = '';
        if (items.length === 0) {
            itemsHtml = `<div class="py-12 text-center text-gray-500 italic border-t border-white/5">No towers in this collection yet.</div>`;
        } else {
            items.forEach((item, idx) => {
                const isBeaten = beatenSet.has(item.tower_name);
                const tData = store.allTowers.find(t => t.name === item.tower_name);
                const diffName = tData ? tData.difficulty : 'N/A';
                const diffVal = tData ? tData.number_difficulty.toFixed(2) : '0.00';
                const creators = tData ? (Array.isArray(tData.creators) ? tData.creators.join(', ') : tData.creators) : '';
                const diffPillClass = DIFFICULTY_PILL_CLASSES[diffName] || 'border-gray-500/50 text-gray-400 bg-gray-500/10';
                const statusIcon = isBeaten ? 'check_circle' : 'radio_button_unchecked';
                const statusColor = isBeaten ? 'text-emerald-400' : 'text-gray-600';
                const opacityClass = isBeaten ? 'opacity-75 hover:opacity-100' : '';
                const dragHandle = isOwner ? `
                    <div class="w-6 flex justify-center text-gray-500 cursor-grab hover:text-white" title="Drag to reorder">
                        <span class="material-symbols-outlined text-xl">drag_indicator</span>
                    </div>
                ` : `<div class="w-6 text-center text-gray-500 font-mono text-xs">${idx + 1}</div>`;

                itemsHtml += `
                    <div class="collection-item flex items-center gap-4 py-3 px-4 border-b border-white/5 hover:bg-white/5 transition-colors group ${opacityClass}" 
                         data-id="${item.id}" draggable="${isOwner}">
                        ${dragHandle}
                        <span class="material-symbols-outlined text-lg ${statusColor} flex-shrink-0">${statusIcon}</span>
                        <div class="flex-1 cursor-pointer min-w-0 flex flex-col justify-center gap-1" onclick="window.viewTower('${item.tower_name}')">
                            <div class="flex items-baseline gap-2">
                                <h4 class="text-white font-bold text-sm tracking-wide truncate transition-colors">${item.tower_name}</h4>
                                <span class="text-xs text-gray-400 truncate hidden sm:inline-block transition-colors">by ${creators}</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="text-[10px] px-2 py-0.5 rounded border font-bold uppercase tracking-wider ${diffPillClass}">
                                    ${diffName}
                                </span>
                                <span class="text-[10px] font-mono text-gray-300 transition-colors">
                                    [${diffVal}]
                                </span>
                            </div>
                        </div>
                        ${isOwner ? `
                            <button onclick="window.deleteCollectionItem(event, ${item.id})" class="w-8 h-8 rounded-full flex items-center justify-center text-gray-600 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100">
                                <span class="material-symbols-outlined text-lg">delete</span>
                            </button>
                        ` : ''}
                    </div>
                `;
            });
        }

        container.innerHTML = `
            <div class="w-full max-w-7xl mx-auto pb-20 px-4 pt-8">
                <button id="back-to-browse" class="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors group">
                    <span class="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span> 
                    <span class="text-xs font-bold uppercase tracking-widest">Back to Library</span>
                </button>

                <div class="flex flex-col md:flex-row gap-10 mb-10 items-end">
                    <div class="w-56 h-56 rounded-xl shadow-2xl flex-shrink-0 flex items-center justify-center relative group overflow-hidden" 
                         style="background: linear-gradient(to bottom right, ${c.theme_color}, #050505);">
                        <span class="material-symbols-outlined text-7xl text-white drop-shadow-2xl opacity-90">${c.icon}</span>
                        ${isOwner ? `<button id="btn-edit-collection" class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold tracking-widest transition-opacity uppercase">Edit Details</button>` : ''}
                    </div>
                    
                    <div class="flex-1 mb-1 w-full">
                        <div class="flex justify-between items-start">
                            <div>
                                <span class="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2 block bg-white/5 inline-block px-2 py-1 rounded">${c.is_public ? 'Public Playlist' : 'Private Playlist'}</span>
                                <h1 class="text-5xl md:text-7xl font-black text-white mb-4 tracking-tight leading-none">${c.name}</h1>
                                <p class="text-gray-300 text-sm max-w-2xl leading-relaxed whitespace-pre-wrap font-medium">${c.description || ''}</p>
                            </div>
                            
                            <div class="flex flex-col gap-3 items-end pl-4">
                                <button id="btn-like-collection" class="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all group ${c.is_liked ? 'text-pink-500 border-pink-500/50 bg-pink-500/10' : 'text-gray-400'}">
                                    <span class="material-symbols-outlined ${c.is_liked ? 'fill' : ''} group-hover:scale-110 transition-transform">favorite</span>
                                    <span class="text-xs font-bold" id="like-count-display">${c.like_count}</span>
                                </button>

                                <button id="btn-save-order" class="hidden px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-full text-xs uppercase tracking-wider shadow-lg transition-transform animate-pulse">
                                    Save Order
                                </button>
                                
                                ${isOwner ? `
                                    <button id="btn-delete-collection" class="w-10 h-10 flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-full transition-colors border border-red-500/20" title="Delete Playlist">
                                        <span class="material-symbols-outlined text-lg">delete</span>
                                    </button>
                                ` : `
                                    ${user ? `<button id="btn-fork-collection" class="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-bold uppercase tracking-wider transition-colors border border-white/10">Fork Playlist</button>` : ''}
                                `}
                            </div>
                        </div>

                        <div class="flex items-center gap-3 mt-6 text-sm font-bold text-white border-t border-white/10 pt-4">
                            <div class="flex items-center gap-2 pr-4 border-r border-white/10">
                                <img src="${c.owner_avatar || 'icon.jpg'}" class="w-6 h-6 rounded-full bg-black border border-white/20">
                                <span class="text-gray-200 text-xs">${c.owner_name}</span>
                            </div>
                            <span class="text-gray-400 text-xs">${items.length} Towers</span>
                            <span class="text-gray-600 text-xs">ò</span>
                            <span class="text-xs text-gray-300">${progressPct}% Complete</span>
                        </div>

                        <div class="mt-3 w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div class="bg-emerald-500 h-full transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.5)]" style="width: ${progressPct}%"></div>
                        </div>
                    </div>
                </div>

                <div class="flex items-center justify-between border-b border-white/10 pb-4 mb-0">
                    <div class="flex items-center gap-4">
                        <button id="btn-roulette-collection" class="flex items-center gap-2 px-5 py-2.5 bg-[#BE00FF] hover:bg-[#a000d6] rounded-full shadow-lg transition-transform active:scale-95 text-white font-bold text-xs uppercase tracking-wider">
                            <span class="material-symbols-outlined text-lg">shuffle</span>
                            Spin Random
                        </button>
                    </div>
                    ${isOwner ? `
                        <div class="relative w-80 group">
                            <span class="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-500 text-lg group-focus-within:text-[#BE00FF] transition-colors">search</span>
                            <input id="add-tower-input" type="text" placeholder="Add tower..." class="w-full bg-[#181818] border border-white/10 rounded-full pl-12 pr-5 py-3 text-sm text-white focus:border-[#BE00FF] focus:outline-none transition-all focus:bg-[#1a1a1e] focus:shadow-[0_0_20px_rgba(190,0,255,0.1)]">
                            <div id="add-tower-suggestions" class="absolute top-full left-0 right-0 mt-2 bg-[#1C1C22] border border-white/10 rounded-xl shadow-2xl hidden z-50 max-h-60 overflow-y-auto custom-scrollbar p-1"></div>
                        </div>
                    ` : ''}
                </div>

                <div id="collection-items-list" class="flex flex-col">
                    ${itemsHtml}
                </div>
            </div>
        `;

        setupDetailListeners(c, items, isOwner);

        if (isOwner) {
            document.getElementById('btn-edit-collection').onclick = () => {
                const modal = document.getElementById('create-collection-modal');
                document.getElementById('create-modal-title').textContent = "Edit Playlist";
                document.getElementById('create-name').value = c.name;
                document.getElementById('create-desc').value = c.description || '';
                document.getElementById('create-color-picker').value = c.theme_color;
                
                const iconEl = document.getElementById('create-icon-value');
                const iconLabel = document.getElementById('icon-label-text');
                if(iconEl) iconEl.value = c.icon;
                if(iconLabel) {
                    const map = {
                        'queue_music': 'Music', 'star': 'Star', 'bolt': 'Bolt', 'timer': 'Timer',
                        'emoji_events': 'Trophy', 'skull': 'Skull', 'landscape': 'Mountain', 'favorite': 'Heart'
                    };
                    const label = map[c.icon] || 'Icon';
                    iconLabel.innerHTML = `<span class="material-symbols-outlined text-sm">${c.icon}</span> ${label}`;
                }
                
                document.getElementById('create-public').checked = c.is_public;
                document.getElementById('edit-collection-id').value = c.id;
                document.getElementById('create-cover-preview').style.background = `linear-gradient(to bottom right, ${c.theme_color}, #000)`;
                
                modal.classList.remove('hidden');
            };
        }

    } catch (e) {
        console.error(e);
        container.innerHTML = `<div class="p-10 text-center text-red-400">Failed to load collection.</div>`;
    }
}

async function saveCurrentOrder() {
    const list = document.getElementById('collection-items-list');
    if (!list) return;

    const newOrder = Array.from(list.children).map((el, index) => ({
        id: el.dataset.id,
        order: index
    }));
    
    try {
        await api.post('/api/collections/reorder', { collection_id: currentCollectionId, items: newOrder });
        hasUnsavedChanges = false;
        showNotification("Order saved.", "success");
    } catch(e) { 
        showNotification("Failed to save order.", "error"); 
    }
}

function setupDetailListeners(collection, items, isOwner) {
    document.getElementById('back-to-browse').onclick = async () => { 
        if (hasUnsavedChanges) await saveCurrentOrder();
        activeTab = 'browse'; 
        renderCollectionsPage(); 
    };
    
    document.getElementById('btn-roulette-collection').onclick = () => {
        if(items.length === 0) return showNotification("Playlist is empty!", "error");
        const winner = items[Math.floor(Math.random() * items.length)];
        openModalWithTower(winner.tower_name); 
        showNotification(`Rolled: ${winner.tower_name}`, "success");
    };

    const btnLike = document.getElementById('btn-like-collection');
    if(btnLike) {
        btnLike.onclick = async () => {
            if(!store.authUser) return showNotification("Login required.", "error");
            try {
                const res = await api.post('/api/collections/toggle_like', { collection_id: collection.id });
                if(res.success) {
                    const icon = btnLike.querySelector('span');
                    const count = document.getElementById('like-count-display');
                    
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

    const btnFork = document.getElementById('btn-fork-collection');
    if (btnFork) {
        btnFork.onclick = async () => {
            const confirmed = await showConfirmModal("Fork Playlist", "Create a copy of this playlist in your library?", "Fork", "bg-blue-500");
            if(!confirmed) return;
            try {
                const res = await api.post('/api/collections/fork', { collection_id: collection.id });
                showNotification("Playlist forked!", "success");
                activeTab = 'detail';
                currentCollectionId = res.new_id;
                renderCollectionsPage();
            } catch(e) {
                showNotification("Failed to fork.", "error");
            }
        };
    }

    const btnSaveOrder = document.getElementById('btn-save-order');
    if (btnSaveOrder) {
        btnSaveOrder.onclick = async () => {
            await saveCurrentOrder();
            btnSaveOrder.classList.add('hidden');
        };
    }

    if (!isOwner) return;

    document.getElementById('btn-delete-collection').onclick = async () => {
        const confirmed = await showConfirmModal("Delete Playlist", "Are you sure? This cannot be undone.", "Delete", "bg-red-500");
        if(!confirmed) return;
        
        try {
            await api.post('/api/collections/delete', { collection_id: collection.id });
            showNotification("Playlist deleted.", "success");
            activeTab = 'my';
            renderCollectionsPage();
        } catch(e) { showNotification("Delete failed.", "error"); }
    };

    document.getElementById('btn-edit-collection').onclick = () => {
        const modal = document.getElementById('create-collection-modal');
        document.getElementById('create-modal-title').textContent = "Edit Playlist";
        document.getElementById('create-name').value = collection.name;
        document.getElementById('create-desc').value = collection.description || '';
        document.getElementById('create-color-picker').value = collection.theme_color;
    
        const iconEl = document.getElementById('create-icon-value');
        if(iconEl) iconEl.value = collection.icon;
        
        document.getElementById('create-public').checked = collection.is_public;
        document.getElementById('edit-collection-id').value = collection.id;
        document.getElementById('create-cover-preview').style.background = `linear-gradient(to bottom right, ${collection.theme_color}, #000)`;
        
        modal.classList.remove('hidden');
    };

    const input = document.getElementById('add-tower-input');
    const suggestions = document.getElementById('add-tower-suggestions');
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
                div.onclick = async () => {
                    input.value = '';
                    suggestions.classList.add('hidden');
                    if (hasUnsavedChanges) await saveCurrentOrder();
                    try {
                        await api.post('/api/collections/add_item', { collection_id: collection.id, tower_name: name });
                        showNotification("Tower added!", "success");
                        renderCollectionsPage(); 
                    } catch (e) {
                        showNotification("Failed to add tower.", "error");
                    }
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

    window.deleteCollectionItem = async (e, itemId) => {
        e.stopPropagation();
        const confirmed = await showConfirmModal("Remove Tower", "Remove this tower from the playlist?", "Remove", "bg-red-500");
        if(!confirmed) return;
        
        if (hasUnsavedChanges) await saveCurrentOrder();
        try {
            await api.post('/api/collections/delete_item', { item_id: itemId });
            renderCollectionsPage();
        } catch(e) { showNotification("Failed to delete.", "error"); }
    };

    setupDragDrop();
}

function setupDragDrop() {
    const list = document.getElementById('collection-items-list');
    let draggedItem = null;
    let ticking = false;

    list.addEventListener('dragstart', (e) => {
        draggedItem = e.target.closest('.collection-item');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', '');
        setTimeout(() => draggedItem.classList.add('opacity-50', 'bg-white/10'), 0);
    });

    list.addEventListener('dragend', () => {
        if (draggedItem) {
            draggedItem.classList.remove('opacity-50', 'bg-white/10');
            draggedItem = null;
        }
    });

    list.addEventListener('dragover', (e) => {
        e.preventDefault();
        const target = e.target.closest('.collection-item');

        if (target && target !== draggedItem) {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const children = Array.from(list.children);
                    const srcIndex = children.indexOf(draggedItem);
                    const tgtIndex = children.indexOf(target);

                    if (srcIndex < tgtIndex) {
                        list.insertBefore(draggedItem, target.nextSibling);
                    } else {
                        list.insertBefore(draggedItem, target);
                    }
                    ticking = false;
                });
                ticking = true;
            }

            if (!hasUnsavedChanges) {
                hasUnsavedChanges = true;
                const btn = document.getElementById('btn-save-order');
                if(btn) btn.classList.remove('hidden');
            }
        }
    });
}