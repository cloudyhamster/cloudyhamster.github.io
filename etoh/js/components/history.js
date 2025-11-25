import { store } from '../state.js';
import { DIFFICULTY_COLORS, DIFFICULTY_PILL_CLASSES, AREA_COLORS, AREA_PILL_CLASSES, AREA_DISPLAY_NAMES } from '../config.js';
import { interpolateColor, hexToRgb } from '../utils.js';
import { openModalWithTower } from '../ui/modals.js';

export function initHistory() {
    store.subscribe('userChanged', (userData) => {
        renderFullHistoryList(userData.beaten_towers);
        renderAreaTable(store.allTowers, userData.beaten_towers, new Set(userData.unlocked_areas));
    });

    const tableView = document.getElementById('table-view');
    tableView.addEventListener('click', (e) => {
        const c = e.target.closest('.clickable-caption');
        if (c) {
            const tb = c.closest('table').querySelector('tbody');
            tb.classList.toggle('hidden');
            c.querySelector('.dropdown-arrow').style.transform = tb.classList.contains('hidden') ? 'rotate(-90deg)' : 'rotate(0deg)';
        } else {
            const r = e.target.closest('.tower-row');
            if (r && r.dataset.towerName) openModalWithTower(r.dataset.towerName);
        }
    });
}

function renderFullHistoryList(beatenTowers) {
    const container = document.getElementById('full-history-container');
    container.innerHTML = '';
    if (!beatenTowers || beatenTowers.length === 0) return;

    const completionDates = beatenTowers.map(t => t.awarded_unix).filter(Boolean);
    const minDate = Math.min(...completionDates);
    const maxDate = Math.max(...completionDates);
    const dateRange = maxDate - minDate;

    const sortedTowers = [...beatenTowers].sort((a, b) => b.awarded_unix - a.awarded_unix);
    let towerRowsHtml = '';

    sortedTowers.forEach(tower => {
        const factor = dateRange > 0 ? (tower.awarded_unix - minDate) / dateRange : 1;
        const dateColor = interpolateColor('#FFFFFF', '#FFD700', factor);
        const areaKey = tower.area || 'Unknown';
        const diffRgb = (hexToRgb(DIFFICULTY_COLORS[tower.difficulty] || '#808080') || [128, 128, 128]).join(', ');
        const areaRgb = (hexToRgb(AREA_COLORS[areaKey] || '#808080') || [128, 128, 128]).join(', ');

        towerRowsHtml += `<tr class="tower-row status-outline-completed" style="--difficulty-rgb: ${diffRgb}; --area-rgb: ${areaRgb};" data-tower-name="${tower.name}"><td class="py-0.8 px-3"><div class="flex items-center gap-2"><span class="text-gray-200">${tower.name}</span><span class="inline-block py-0.5 px-2.5 rounded-full text-xs font-medium border ${DIFFICULTY_PILL_CLASSES[tower.difficulty] || DIFFICULTY_PILL_CLASSES.nil}">${tower.modifier||''} ${tower.difficulty||''} [${(tower.number_difficulty||0).toFixed(2)}]</span></div></td><td class="py-0.8 px-3 text-right"><div class="flex justify-end items-center gap-2"><span class="inline-block py-0.5 px-2.5 rounded-full text-xs font-medium border" style="color: ${dateColor}; background-color: ${dateColor}20; border-color: ${dateColor}80;">${new Date(tower.awarded_unix*1000).toLocaleDateString()}</span><span class="inline-block py-0.5 px-2.5 rounded-full text-xs font-medium border ${AREA_PILL_CLASSES[areaKey] || AREA_PILL_CLASSES.Default}">${AREA_DISPLAY_NAMES[areaKey]||areaKey}</span></div></td></tr>`;
    });

    container.innerHTML = `<table class="w-full text-sm"><tbody>${towerRowsHtml}</tbody></table>`;
}

function renderAreaTable(allTowers, beatenTowers, unlockedAreas) {
    const container = document.getElementById('area-history-container');
    container.innerHTML = '';
    if (!allTowers || allTowers.length === 0) return;

    const ringAreas = [
        { key: 'Ring 0', name: 'Ring 0: Purgatorio' },
        { key: 'Ring 1', name: 'Ring 1: Limbo' },
        { key: 'Forgotten Ridge', name: 'Forgotten Ridge' },
        { key: 'Ring 2', name: 'Ring 2: Desire' },
        { key: 'Garden Of Eesh%C3%B6L', name: 'Garden Of Eeshöl' },
        { key: 'Ring 3', name: 'Ring 3: Gluttony' },
        { key: 'Ring 4', name: 'Ring 4: Greed' },
        { key: 'Silent Abyss', name: 'Silent Abyss' },
        { key: 'Ring 5', name: 'Ring 5: Wrath' },
        { key: 'Lost River', name: 'Lost River' },
        { key: 'Ring 6', name: 'Ring 6: Heresy' },
        { key: 'Ashen Towerworks', name: 'Ashen Towerworks' },
        { key: 'Ring 7', name: 'Ring 7: Violence' },
        { key: 'Ring 8', name: 'Ring 8: Fraud' },
        { key: 'The Starlit Archives', name: 'The Starlit Archives' },
        { key: 'Ring 9', name: 'Ring 9: Treachery' },
    ];
    const zoneAreas = [
        { key: 'Zone 1', name: 'Zone 1: Sea' },
        { key: 'Zone 2', name: 'Zone 2: Surface' },
        { key: 'Arcane Area', name: 'Arcane Area' },
        { key: 'Zone 3', name: 'Zone 3: Sky' },
        { key: 'Paradise Atoll', name: 'Paradise Atoll' },
        { key: 'Zone 4', name: 'Zone 4: Exosphere' },
        { key: 'Zone 5', name: 'Zone 5: The Moon' },
        { key: 'Zone 6', name: 'Zone 6: Mars' },
        { key: 'Zone 7', name: 'Zone 7: Asteroid Belt' },
        { key: 'Zone 8', name: 'Zone 8: Pluto' },
        { key: 'Zone 9', name: 'Zone 9: Singularity' },
        { key: 'Zone 10', name: 'Zone 10: Interstellar Shore' },
    ];

    const beatenTowerMap = new Map(beatenTowers.map(tower => [tower.name, tower]));

    const generateColumnHtml = (areaList) => {
        let columnHtml = '';
        for (const area of areaList) {
            const towersInArea = allTowers.filter(t => t.area === area.key);
            if (towersInArea.length === 0) continue;

            const isUnlocked = unlockedAreas.has(area.key);
            const captionClasses = ['clickable-caption', !isUnlocked ? 'locked-caption' : ''].join(' ');
            const captionIcon = !isUnlocked ? 'expand_more' : 'expand_less';
            const tbodyClass = !isUnlocked ? 'hidden' : '';

            const totalCount = towersInArea.length;
            const completedCount = towersInArea.filter(t => beatenTowerMap.has(t.name)).length;
            const percent = (completedCount / totalCount) * 100;
            
            let fillColor = 'rgba(255, 255, 255, 0.15)', textColorClass = 'text-gray-400', borderClass = 'border-white/10';
            if (percent === 100) {
                fillColor = 'rgba(255, 215, 0, 0.15)';
                textColorClass = 'text-yellow-300 font-bold';
                borderClass = 'border-yellow-500/50';
            } else if (percent > 0) textColorClass = 'text-gray-200';
            
            const progressStyle = `background: linear-gradient(to right, ${fillColor} 0%, ${fillColor} ${percent}%, transparent ${percent}%, transparent 100%);`;
            const countPill = `<span class="inline-block py-0.5 px-5 rounded-full text-xs font-mono border ${borderClass} ${textColorClass}" style="${progressStyle}">${completedCount}/${totalCount}</span>`;

            let towerRowsHtml = '';
            towersInArea.sort((a, b) => a.number_difficulty - b.number_difficulty).forEach(tower => {
                const beatenVersion = beatenTowerMap.get(tower.name);
                const isCompleted = !!beatenVersion;
                const completionRgb = isCompleted ? '67, 255, 129' : '255, 50, 50';
                const diffRgb = (hexToRgb(DIFFICULTY_COLORS[tower.difficulty] || '#808080') || [128, 128, 128]).join(', ');

                towerRowsHtml += `<tr class="tower-row ${isCompleted?'status-outline-completed':'status-outline-incomplete'}" style="--difficulty-rgb: ${completionRgb}; --area-rgb: ${diffRgb};" data-tower-name="${tower.name}"><td class="py-1 px-3 ${isCompleted?'text-gray-200':'text-gray-500'}">${tower.name}</td><td class="py-1 px-3 text-right"><div class="flex justify-end items-center gap-2"><span class="inline-block py-0.5 px-2.5 rounded-full text-xs font-medium border border-gray-500/50 ${isCompleted?'text-gray-300 bg-gray-500/10':'text-gray-600 bg-gray-500/10'}">${isCompleted?new Date(beatenVersion.awarded_unix*1000).toLocaleDateString():'--'}</span><span class="inline-block py-0.5 px-2.5 rounded-full text-xs font-medium border ${DIFFICULTY_PILL_CLASSES[tower.difficulty]||DIFFICULTY_PILL_CLASSES.nil}">${tower.modifier||''} ${tower.difficulty||''} [${(tower.number_difficulty||0).toFixed(2)}]</span></div></td></tr>`;
            });

            columnHtml += `<div class="bg-black/20 rounded-md overflow-hidden"><table class="w-full text-sm"><caption class="py-2.5 px-4 text-left font-bold text-base bg-black/10"><div class="${captionClasses} select-none flex justify-between items-center"><span class="caption-text">${area.name}</span><div class="flex items-center gap-3">${countPill}<span class="material-symbols-outlined caption-icon dropdown-arrow">${captionIcon}</span></div></div></caption><tbody class="${tbodyClass}">${towerRowsHtml}</tbody></table></div>`;
        }
        return `<div class="flex flex-col gap-4">${columnHtml}</div>`;
    };

    container.innerHTML = generateColumnHtml(ringAreas) + generateColumnHtml(zoneAreas);
}