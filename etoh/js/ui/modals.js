import { store } from '../state.js';
import { DIFFICULTY_PILL_CLASSES, AREA_PILL_CLASSES, AREA_DISPLAY_NAMES, DIFFICULTY_COLORS, NON_CANON_TOWERS } from '../config.js';
import { titleCase, getTowerType } from '../utils.js';

export function initModals() {
    const modalBackdrop = document.getElementById('tower-modal-backdrop');
    const modalCloseButton = document.getElementById('modal-close-button');
    const profileBackdrop = document.getElementById('profile-modal-backdrop');
    const profileCloseBtn = document.getElementById('profile-close-button');
    const viewProfileBtn = document.getElementById('view-profile-btn');

    modalCloseButton.addEventListener('click', closeModal);
    modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) closeModal();
    });

    profileCloseBtn.addEventListener('click', () => profileBackdrop.classList.add('hidden'));
    profileBackdrop.addEventListener('click', (e) => {
        if (e.target === profileBackdrop) profileBackdrop.classList.add('hidden');
    });

    viewProfileBtn.addEventListener('click', openProfileModal);

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (!modalBackdrop.classList.contains('hidden')) closeModal();
            if (!profileBackdrop.classList.contains('hidden')) profileBackdrop.classList.add('hidden');
        }
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
    document.getElementById('tower-modal-backdrop').classList.add('hidden');
}

export function openProfileModal() {
    const user = store.currentUser;
    if (!user) return;

    const profileBackdrop = document.getElementById('profile-modal-backdrop');
    const profileDisplayName = document.getElementById('profile-display-name');
    const profileUsername = document.getElementById('profile-username');
    const profileAvatarFull = document.getElementById('profile-avatar-full');
    const profileAvatarLoader = document.getElementById('profile-avatar-loader');
    const profileTotalCount = document.getElementById('profile-total-count');
    const profileCompletionPct = document.getElementById('profile-completion-pct');
    const profileHardestName = document.getElementById('profile-hardest-name');
    const profileHardestDiff = document.getElementById('profile-hardest-diff');
    const profileTotalDiff = document.getElementById('profile-total-diff');
    const profileAvgDiff = document.getElementById('profile-avg-diff');
    const profileCountTowers = document.getElementById('profile-count-towers');
    const profileCountCitadels = document.getElementById('profile-count-citadels');
    const profileCountSteeples = document.getElementById('profile-count-steeples');
    const profileRankBadge = document.getElementById('profile-rank-badge');

    profileDisplayName.textContent = user.display_name;
    profileUsername.textContent = `@${user.user_name}`;

    profileAvatarFull.classList.add('hidden');
    profileAvatarLoader.classList.remove('hidden');
    profileAvatarFull.src = user.avatar_full_url || user.avatar_url;
    profileAvatarFull.onload = () => {
        profileAvatarLoader.classList.add('hidden');
        profileAvatarFull.classList.remove('hidden');
    };

    const canonBeaten = user.beaten_towers.filter(t => !NON_CANON_TOWERS.has(t.name));
    const canonTotal = store.allTowers.filter(t => !NON_CANON_TOWERS.has(t.name)).length;
    const totalCount = canonBeaten.length;
    const percentage = canonTotal > 0 ? ((totalCount / canonTotal) * 100).toFixed(1) : "0.0";

    canonBeaten.sort((a, b) => b.number_difficulty - a.number_difficulty);
    const hardest = canonBeaten.length > 0 ? canonBeaten[0] : null;

    let sumDiff = 0, towers = 0, citadels = 0, steeples = 0;

    canonBeaten.forEach(t => {
        sumDiff += (t.number_difficulty || 0);
        const type = getTowerType(t.name);
        if (type === 'Tower') towers++;
        else if (type === 'Citadel') citadels++;
        else if (type === 'Steeple') steeples++;
    });

    const avgDiff = totalCount > 0 ? (sumDiff / totalCount).toFixed(2) : "0.00";

    profileTotalCount.textContent = `${totalCount} / ${canonTotal}`;
    profileCompletionPct.textContent = `${percentage}%`;

    if (hardest) {
        profileHardestName.textContent = hardest.name;
        profileHardestDiff.textContent = `${hardest.difficulty} [${hardest.number_difficulty.toFixed(2)}]`;
        const hex = DIFFICULTY_COLORS[hardest.difficulty] || '#808080';
        profileRankBadge.textContent = hardest.difficulty.toUpperCase();
        profileRankBadge.style.borderColor = hex;
        profileRankBadge.style.color = hex;
        profileRankBadge.style.backgroundColor = `${hex}20`;
        profileHardestName.style.color = hex;
    } else {
        profileHardestName.textContent = "N/A";
        profileHardestName.style.color = "#9CA3AF";
        profileHardestDiff.textContent = "-";
        profileRankBadge.textContent = "NOOB";
        profileRankBadge.style.borderColor = "#808080";
        profileRankBadge.style.color = "#808080";
        profileRankBadge.style.backgroundColor = "transparent";
    }

    profileTotalDiff.textContent = sumDiff.toFixed(2);
    profileAvgDiff.textContent = avgDiff;
    profileCountTowers.textContent = towers;
    profileCountCitadels.textContent = citadels;
    profileCountSteeples.textContent = steeples;

    profileBackdrop.classList.remove('hidden');
}