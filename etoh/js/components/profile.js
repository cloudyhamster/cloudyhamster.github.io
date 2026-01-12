import { store } from '../state.js';
import { NON_CANON_TOWERS, DIFFICULTY_COLORS } from '../config.js';

export function initProfile() {
    const updateStats = () => {
        const user = store.currentUser;
        const allTowers = store.allTowers;
        if (user && allTowers.length > 0) {
            calculateAndRenderStats(user.beaten_towers, allTowers);
        }
    };

    store.subscribe('userChanged', (userData) => {
        updateStats();
        const trigger = document.getElementById('profile-trigger-container');
        if (trigger) {
            trigger.classList.remove('hidden');
        }
    });

    store.subscribe('towersLoaded', () => {
        updateStats();
    });
}

function calculateAndRenderStats(beatenTowers, allTowers) {
    if (!beatenTowers || !allTowers) return;
    const masterNames = new Set(allTowers.map(t => t.name));

    const uniqueBeaten = Array.from(new Map(beatenTowers.map(t => [t.name, t])).values());
    
    const canonCompletions = uniqueBeaten.filter(tower => 
        !NON_CANON_TOWERS.has(tower.name) && masterNames.has(tower.name)
    );
    
    const totalCanonTowers = allTowers.filter(tower => !NON_CANON_TOWERS.has(tower.name));
    
    const totalBeaten = canonCompletions.length;
    const totalInGame = totalCanonTowers.length;
    
    let hardestTowerName = "N/A", hardestDifficultyStr = "N/A", hardestDifficultyColor = "#999";
    
    if (beatenTowers.length > 0) {
        const sortedByDifficulty = [...beatenTowers].sort((a, b) => (b.number_difficulty || 0) - (a.number_difficulty || 0));
        const hardestTower = sortedByDifficulty[0];
        
        if (hardestTower) {
            hardestTowerName = hardestTower.name || 'Unknown';
            hardestDifficultyStr = `${hardestTower.modifier || ''} ${hardestTower.difficulty || ''} [${(hardestTower.number_difficulty || 0).toFixed(2)}]`.trim();
            hardestDifficultyColor = DIFFICULTY_COLORS[hardestTower.difficulty] || '#999';
        }
    }
    
    const totalEl = document.getElementById('totalTowersStat');
    const hardestNameEl = document.getElementById('hardestTowerStat');
    const hardestDiffEl = document.getElementById('hardestDifficultyStat');
    const container = document.getElementById('statsContainer');

    if (totalEl) totalEl.textContent = `${totalBeaten}/${totalInGame}`;
    if (hardestNameEl) hardestNameEl.textContent = hardestTowerName;
    if (hardestDiffEl) {
        hardestDiffEl.textContent = hardestDifficultyStr;
        hardestDiffEl.style.color = '#ffffff'; 
    }
    if (container) container.style.display = 'grid';
}