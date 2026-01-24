export const titleCase = (str) => str ? str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : '';

export const hexToRgb = (hex) => {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r ? [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)] : null;
};

export const rgbToHex = (r, g, b) => '#' + [r, g, b].map(x => {
    const h = Math.round(x).toString(16);
    return h.length === 1 ? '0' + h : h;
}).join('');

export const interpolateColor = (c1, c2, f) => {
    const r1 = hexToRgb(c1), r2 = hexToRgb(c2), r = r1.slice();
    for (let i = 0; i < 3; i++) r[i] = r1[i] + f * (r2[i] - r1[i]);
    return rgbToHex(r[0], r[1], r[2]);
};

export const showNotification = (message, type = 'success') => {
    const container = document.getElementById('notification-container');
    if (container.children.length >= 8) container.firstChild.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification glass-panel ${type}`;
    notification.innerHTML = `<span class="material-symbols-outlined">${type === 'success' ? 'check_circle' : 'error'}</span><p class="text-sm font-medium">${message}</p>`;
    
    container.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 50);
    setTimeout(() => {
        notification.classList.remove('show');
        notification.addEventListener('transitionend', () => notification.remove());
    }, 5000);
};

export const getTowerType = (name) => name.includes("Citadel") ? "Citadel" : name.includes("Steeple") ? "Steeple" : "Tower";

export const getLengthValue = (str) => {
    const m = { '<20 minutes': 1, '20+ minutes': 2, '30+ minutes': 3, '45+ minutes': 4, '60+ minutes': 5, '90+ minutes': 6 };
    return m[str ? str.replace(' long', '') : ''] || 0;
};

export const getAreaInfo = (areaName) => {
    const subrealms = {
        "Forgotten Ridge": { r: 0, i: 1, isSub: true },
        "Garden Of Eesh%C3%B6L": { r: 0, i: 2, isSub: true },
        "Silent Abyss": { r: 0, i: 4, isSub: true },
        "Lost River": { r: 0, i: 5, isSub: true },
        "Ashen Towerworks": { r: 0, i: 6, isSub: true },
        "The Starlit Archives": { r: 0, i: 8, isSub: true },
        "Arcane Area": { r: 1, i: 2, isSub: true },
        "Paradise Atoll": { r: 1, i: 3, isSub: true },
        "Steelspire Horizon": { r: 2, i: 1, isSub: true }
    };
    if (subrealms[areaName]) return subrealms[areaName];
    if (areaName.startsWith("Ring")) return { r: 0, i: parseInt(areaName.split(' ')[1]), isSub: false };
    if (areaName.startsWith("Zone")) return { r: 1, i: parseInt(areaName.split(' ')[1]), isSub: false };
    return { r: -1, i: -1, isSub: false };
};