import { store } from '../state.js';
import { DIFFICULTY_PILL_CLASSES, AREA_PILL_CLASSES, AREA_DISPLAY_NAMES, DIFFICULTY_COLORS, NON_CANON_TOWERS } from '../config.js';
import { titleCase } from '../utils.js';
import { switchView } from '../components/navigation.js';

export function initModals() {
    const modalBackdrop = document.getElementById('tower-modal-backdrop');
    const modalCloseButton = document.getElementById('modal-close-button');
    const viewProfileBtn = document.getElementById('view-profile-btn');

    if (!document.getElementById('custom-confirm-modal')) {
        const confirmHtml = `
            <div id="custom-confirm-modal" class="hidden fixed inset-0 z-[200] flex items-center justify-center p-4">
                <div class="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" id="confirm-backdrop"></div>
                <div class="bg-[#1C1C22] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative transform scale-100 transition-all">
                    <h3 id="confirm-title" class="text-xl font-bold text-white mb-2">Are you sure?</h3>
                    <p id="confirm-message" class="text-sm text-gray-400 mb-6 leading-relaxed">This action cannot be undone.</p>
                    <div class="flex gap-3">
                        <button id="confirm-cancel" class="flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white hover:bg-white/5 transition-colors">Cancel</button>
                        <button id="confirm-ok" class="flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-red-500 hover:bg-red-600 text-white shadow-lg transition-colors">Delete</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', confirmHtml);
    }

    if (modalCloseButton) {
        modalCloseButton.addEventListener('click', closeModal);
    }
    
    if (modalBackdrop) {
        modalBackdrop.addEventListener('click', (e) => {
            if (e.target === modalBackdrop) closeModal();
        });
    }

    if (viewProfileBtn) {
        viewProfileBtn.addEventListener('click', () => {
            switchView('profile');
        });
    }

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (modalBackdrop && !modalBackdrop.classList.contains('hidden')) closeModal();
            const confirmModal = document.getElementById('custom-confirm-modal');
            if (confirmModal && !confirmModal.classList.contains('hidden')) {
                confirmModal.classList.add('hidden');
            }
        }
    });
}

export function showConfirmModal(title, message, confirmText = "Delete", confirmColor = "bg-red-500") {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-confirm-modal');
        const titleEl = document.getElementById('confirm-title');
        const msgEl = document.getElementById('confirm-message');
        const okBtn = document.getElementById('confirm-ok');
        const cancelBtn = document.getElementById('confirm-cancel');
        const backdrop = document.getElementById('confirm-backdrop');

        titleEl.textContent = title;
        msgEl.textContent = message;
        okBtn.textContent = confirmText;
        
        okBtn.className = `flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-colors ${confirmColor} hover:brightness-110`;

        const close = (result) => {
            modal.classList.add('hidden');
            okBtn.onclick = null;
            cancelBtn.onclick = null;
            backdrop.onclick = null;
            resolve(result);
        };

        okBtn.onclick = () => close(true);
        cancelBtn.onclick = () => close(false);
        backdrop.onclick = () => close(false);

        modal.classList.remove('hidden');
    });
}

export function openModalWithTower(towerName) {
    const allTowers = store.allTowers;
    const beatenTowers = store.beatenTowers;
    const tower = allTowers.find(t => t.name === towerName);
    if (!tower) return;

    const modalBackdrop = document.getElementById('tower-modal-backdrop');
    const modalPanel = document.getElementById('tower-modal-panel');
    const modalTowerName = document.getElementById('modal-tower-name');
    const modalDifficulty = document.getElementById('modal-difficulty');
    const modalLength = document.getElementById('modal-length');
    const modalFloors = document.getElementById('modal-floors');
    const modalCreator = document.getElementById('modal-creator');
    const modalWarnings = document.getElementById('modal-warnings');
    const modalArea = document.getElementById('modal-area');
    const modalDate = document.getElementById('modal-date');

    const beatenVersion = beatenTowers.find(t => t.name === towerName);
    
    modalTowerName.textContent = tower.name;
    modalDifficulty.className = `inline-block py-0.5 px-2.5 rounded-full text-xs font-medium border ${DIFFICULTY_PILL_CLASSES[tower.difficulty] || DIFFICULTY_PILL_CLASSES.nil}`;
    modalDifficulty.textContent = `${tower.modifier||''} ${tower.difficulty||''} [${(tower.number_difficulty||0).toFixed(2)}]`;
    modalArea.className = `inline-block py-0.5 px-2.5 rounded-full text-xs font-medium border ${AREA_PILL_CLASSES[tower.area] || AREA_PILL_CLASSES.Default}`;
    modalArea.textContent = AREA_DISPLAY_NAMES[tower.area] || tower.area;

    const lengthText = tower.length || '<20 minutes';
    modalLength.textContent = lengthText.replace(' long', '');
    modalLength.className = 'inline-block py-0.5 px-2.5 rounded-full text-xs font-medium border border-orange-400/50 text-orange-300 bg-orange-400/10';

    modalFloors.innerHTML = `<span class="inline-block py-0.5 px-2.5 rounded-full text-xs font-medium border border-gray-500/50 text-gray-300 bg-gray-500/10">${tower.floors??10}</span>`;
    modalCreator.innerHTML = '';
    (Array.isArray(tower.creators) ? tower.creators : ["Unknown"]).flatMap(c => c.split(',').map(x => x.trim())).filter(Boolean).forEach(c => {
        const p = document.createElement('span');
        p.className = 'inline-block py-0.5 px-2.5 rounded-full text-xs font-medium border border-gray-500/50 text-gray-300 bg-gray-500/10 mr-1';
        p.textContent = c;
        modalCreator.appendChild(p);
    });
    
    modalWarnings.innerHTML = '';
    const w = Array.isArray(tower.warnings) ? tower.warnings : [];
    if (w.length > 0) w.forEach(x => {
        const p = document.createElement('span');
        p.className = 'inline-block py-0.5 px-2.5 rounded-full text-xs font-medium border border-gray-500/50 text-gray-300 bg-gray-500/10 mr-1';
        p.textContent = titleCase(x);
        modalWarnings.appendChild(p);
    });
    else modalWarnings.innerHTML = '<span class="text-gray-400">None</span>';

    if (beatenVersion) {
        modalDate.className = 'inline-block py-0.5 px-2.5 rounded-full text-xs font-medium border border-gray-500/50 text-gray-300 bg-gray-500/10';
        modalDate.textContent = new Date(beatenVersion.awarded_unix * 1000).toLocaleString();
    } else {
        modalDate.className = 'inline-block py-0.5 px-2.5 rounded-full text-xs font-medium border border-gray-600/50 text-gray-400 bg-gray-600/10';
        modalDate.textContent = "Not Completed";
    }
    
    modalPanel.style.setProperty('--difficulty-color', DIFFICULTY_COLORS[tower.difficulty] || '#808080');
    modalBackdrop.classList.remove('hidden');
}

export function closeModal() {
    const backdrop = document.getElementById('tower-modal-backdrop');
    if (backdrop) backdrop.classList.add('hidden');
}