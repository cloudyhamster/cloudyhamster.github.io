import { store } from '../state.js';
import { api } from '../api.js';
import { showNotification, getLengthValue, getTowerType, getAreaInfo } from '../utils.js';
import { NON_CANON_TOWERS, AREA_DISPLAY_NAMES } from '../config.js';

let targetTower = null;
let guesses = [];
const maxGuesses = 6;
let isGameActive = false;

export function initGameLogic() {
    const gameGuessInput = document.getElementById('game-guess-input');
    const newGameBtn = document.getElementById('new-game-btn');
    const gameAutocompleteList = document.getElementById('game-autocomplete-list');

    if (gameGuessInput) {
        gameGuessInput.addEventListener('input', (e) => {
            const val = e.target.value.toLowerCase(); 
            gameAutocompleteList.innerHTML = '';
            if (val.length < 2) { gameAutocompleteList.classList.add('hidden'); return; }
            const matches = store.allTowers.filter(t => t.name.toLowerCase().includes(val) && !NON_CANON_TOWERS.has(t.name)).slice(0, 10);
            if (matches.length > 0) {
                gameAutocompleteList.classList.remove('hidden');
                matches.forEach(t => {
                    const div = document.createElement('div'); div.className = 'autocomplete-item text-sm text-gray-300'; div.textContent = t.name;
                    div.addEventListener('click', () => { handleGuess(t.name); gameGuessInput.value = ''; gameAutocompleteList.classList.add('hidden'); });
                    gameAutocompleteList.appendChild(div);
                });
            } else { gameAutocompleteList.classList.add('hidden'); }
        });
        
        newGameBtn.addEventListener('click', initGame);

        document.addEventListener('click', (e) => { 
            if (!gameGuessInput.contains(e.target) && !gameAutocompleteList.contains(e.target)) 
                gameAutocompleteList.classList.add('hidden'); 
        });
    }

    store.subscribe('statsUpdated', updateStatsUI);
}

export async function ensureGameData() {
    if (store.allTowers.length > 0) return true;
    const input = document.getElementById('game-guess-input');
    input.placeholder = "Loading tower data...";
    input.disabled = true;
    try {
        const towers = await api.getMasterTowers();
        store.setAllTowers(towers);
        input.placeholder = "Start typing a tower name...";
        input.disabled = false;
        return true;
    } catch (e) {
        console.error(e);
        showNotification("Failed to load game data.", "error");
        return false;
    }
}

export async function initGame() {
    const hasData = await ensureGameData(); 
    if (!hasData) return;
    
    const canonTowers = store.allTowers.filter(t => !NON_CANON_TOWERS.has(t.name));
    targetTower = canonTowers[Math.floor(Math.random() * canonTowers.length)];
    guesses = []; 
    isGameActive = true; 
    
    const input = document.getElementById('game-guess-input');
    input.value = ''; 
    input.disabled = false; 
    input.placeholder = "Start typing a tower name...";
    
    document.getElementById('game-message').classList.add('hidden');
    renderGameGrid();
}

function handleGuess(towerName) {
    if (!isGameActive) return;
    const tower = store.allTowers.find(t => t.name === towerName);
    if (!tower) return;
    if (guesses.some(g => g.name === tower.name)) { showNotification("You already guessed that tower!", "error"); return; }
    
    guesses.push(tower); 
    renderGameGrid();
    
    if (tower.name === targetTower.name) endGame(true); 
    else if (guesses.length >= maxGuesses) endGame(false);
}

function endGame(won) {
    isGameActive = false; 
    const input = document.getElementById('game-guess-input');
    input.disabled = true; 
    input.value = '';
    input.placeholder = won ? "Victory!" : "Game Over"; 
    
    const stats = store.sessionStats;
    const newStats = {
        played: stats.played + 1,
        wins: won ? stats.wins + 1 : stats.wins,
        totalGuesses: won ? stats.totalGuesses + guesses.length : stats.totalGuesses,
        bestGame: won ? (stats.bestGame === null ? guesses.length : Math.min(stats.bestGame, guesses.length)) : stats.bestGame
    };
    store.updateSessionStats(newStats);

    const msg = document.getElementById('game-message');
    msg.classList.remove('hidden');
    const h4 = msg.querySelector('h4');
    const p = msg.querySelector('p');
    
    if (won) {
        h4.textContent = "Victory!";
        h4.className = "text-sm font-bold text-[#43FF81]"; 
        p.textContent = `Found ${targetTower.name} in ${guesses.length} guess(es).`;
    } else {
        h4.textContent = "Game Over";
        h4.className = "text-sm font-bold text-[#FF3232]"; 
        p.textContent = `The tower was: ${targetTower.name}`;
    }
}

function renderGameGrid() {
    const gameGrid = document.getElementById('game-grid');
    gameGrid.innerHTML = '';
    guesses.forEach(guess => {
        const row = document.createElement('div');
        row.className = 'game-row';

        const nameHtml = `<div class="${guess.name === targetTower.name ? 'status-correct font-bold' : 'text-white'}">${guess.name}</div>`;

        let diffClass = 'status-wrong', diffIcon = '';
        if (guess.difficulty === targetTower.difficulty) diffClass = 'status-correct';
        if (Math.abs(guess.number_difficulty - targetTower.number_difficulty) < 0.01) {
            diffIcon = 'check';
            diffClass = 'status-correct';
        } else if (guess.number_difficulty < targetTower.number_difficulty) diffIcon = 'arrow_upward';
        else diffIcon = 'arrow_downward';
        const diffPill = `<span class="inline-flex items-center gap-1 ${diffClass}">${guess.difficulty} <span class="material-symbols-outlined feedback-icon">${diffIcon}</span></span>`;

        const safeGuessLen = guess.length || '<20 minutes';
        const safeTargetLen = targetTower.length || '<20 minutes';
        const guessLenVal = getLengthValue(safeGuessLen);
        const targetLenVal = getLengthValue(safeTargetLen);
        let lenClass = 'status-wrong', lenIcon = '';
        if (guessLenVal === targetLenVal) {
            lenClass = 'status-correct';
            lenIcon = 'check';
        } else lenIcon = guessLenVal < targetLenVal ? 'arrow_upward' : 'arrow_downward';
        const lenHtml = `<span class="inline-flex items-center gap-1 ${lenClass}">${safeGuessLen.replace(' long', '')} <span class="material-symbols-outlined feedback-icon">${lenIcon}</span></span>`;

        const typeClass = getTowerType(guess.name) === getTowerType(targetTower.name) ? 'status-correct' : 'status-wrong';
        const typeHtml = `<span class="${typeClass}">${getTowerType(guess.name)}</span>`;

        const guessArea = getAreaInfo(guess.area);
        const targetArea = getAreaInfo(targetTower.area);
        let areaClass = 'status-wrong', areaIcon = '';

        if (guessArea.r !== targetArea.r) {
            areaClass = 'status-wrong';
        } else {
            if (guessArea.i === targetArea.i) {
                if (guessArea.isSub === targetArea.isSub) {
                    areaClass = 'status-correct';
                    areaIcon = 'check';
                } else {
                    areaClass = 'status-partial';
                    areaIcon = 'location_searching';
                }
            } else {
                areaClass = 'status-wrong';
                areaIcon = guessArea.i < targetArea.i ? 'arrow_upward' : 'arrow_downward';
            }
        }
        const areaHtml = `<span class="inline-flex items-center gap-1 ${areaClass}">${AREA_DISPLAY_NAMES[guess.area]||guess.area} <span class="material-symbols-outlined feedback-icon">${areaIcon}</span></span>`;

        const guessCreators = new Set((Array.isArray(guess.creators) ? guess.creators : []).flatMap(c => c.split(',').map(x => x.trim())));
        const targetCreators = new Set((Array.isArray(targetTower.creators) ? targetTower.creators : []).flatMap(c => c.split(',').map(x => x.trim())));
        const areSetsEqual = (a, b) => a.size === b.size && [...a].every(v => b.has(v));
        const isSubset = [...guessCreators].every(c => targetCreators.has(c));
        let creatorClass = 'status-wrong';
        if (areSetsEqual(guessCreators, targetCreators)) creatorClass = 'status-correct';
        else if (isSubset && guessCreators.size > 0) creatorClass = 'status-partial';
        const creatorHtml = `<div class="truncate ${creatorClass}" title="${[...guessCreators].join(', ')}">${[...guessCreators].join(', ')||'Unknown'}</div>`;

        row.innerHTML = nameHtml + diffPill + lenHtml + typeHtml + areaHtml + creatorHtml;
        gameGrid.appendChild(row);
    });

    for (let i = guesses.length; i < maxGuesses; i++) {
        const row = document.createElement('div');
        row.className = 'game-row opacity-30';
        row.innerHTML = `<div class="h-2 bg-white/10 rounded w-24"></div><div class="h-2 bg-white/10 rounded w-16"></div><div class="h-2 bg-white/10 rounded w-12"></div><div class="h-2 bg-white/10 rounded w-12"></div><div class="h-2 bg-white/10 rounded w-20"></div><div class="h-2 bg-white/10 rounded w-32"></div>`;
        gameGrid.appendChild(row);
    }
}

function updateStatsUI(stats) {
    document.getElementById('stat-games-played').textContent = stats.played;
    const winRate = stats.played === 0 ? 0 : Math.round((stats.wins / stats.played) * 100);
    document.getElementById('stat-win-rate').textContent = `${winRate}%`;
    document.getElementById('stat-best-game').textContent = stats.bestGame === null ? '-' : stats.bestGame;
    document.getElementById('stat-avg-guesses').textContent = stats.wins === 0 ? '-' : (stats.totalGuesses / stats.wins).toFixed(1);
}