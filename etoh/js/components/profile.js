import { store } from '../state.js';
import { NON_CANON_TOWERS } from '../config.js';

export function initProfile() {
    store.subscribe('userChanged', (userData) => {
        calculateAndRenderStats(userData.beaten_towers, store.allTowers);
        document.getElementById('profile-trigger-container').classList.remove('hidden');
    });
}

function calculateAndRenderStats(beatenTowers, allTowers) {
    const canonCompletions = beatenTowers.filter(tower => !NON_CANON_TOWERS.has(tower.name));
    const totalCanonTowers = allTowers.filter(tower => !NON_CANON_TOWERS.has(tower.name));
    const totalBeaten = canonCompletions.length;
    const totalInGame = totalCanonTowers.length;
    
    let hardestTowerName = "N/A", hardestDifficultyStr = "N/A";
    if (beatenTowers.length > 0) {
        const sortedByDifficulty = [...beatenTowers].sort((a, b) => b.number_difficulty - a.number_difficulty);
        const hardestTower = sortedByDifficulty[0];
        hardestTowerName = hardestTower.name || 'Unknown';
        hardestDifficultyStr = `${hardestTower.modifier || ''} ${hardestTower.difficulty || ''} [${(hardestTower.number_difficulty || 0).toFixed(2)}]`.trim();
    }
    
    document.getElementById('totalTowersStat').textContent = `${totalBeaten}/${totalInGame}`;
    document.getElementById('hardestTowerStat').textContent = hardestTowerName;
    document.getElementById('hardestDifficultyStat').textContent = hardestDifficultyStr;
    document.getElementById('statsContainer').style.display = 'grid';
}