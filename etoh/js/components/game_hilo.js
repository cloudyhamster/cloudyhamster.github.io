import { store } from '../state.js';
import { api } from '../api.js';
import { 
    DIFFICULTY_COLORS, 
    NON_CANON_TOWERS, 
    DIFFICULTY_PILL_CLASSES, 
    AREA_PILL_CLASSES,
    AREA_DISPLAY_NAMES 
} from '../config.js';
import { showNotification, hexToRgb } from '../utils.js';

let gamesPlayed = 0;
let currentStreak = 0;
let highStreak = localStorage.getItem('etoh_hilo_highscore') || 0;
let leftTower = null;
let rightTower = null;
let isAnimating = false;

export function initHiLo() {
    updateStatsUI();

    const btnHigher = document.getElementById('btn-higher');
    const btnLower = document.getElementById('btn-lower');
    const btnRestart = document.getElementById('hilo-restart-btn');

    if (btnHigher) btnHigher.addEventListener('click', () => handleGuess('higher'));
    if (btnLower) btnLower.addEventListener('click', () => handleGuess('lower'));
    if (btnRestart) btnRestart.addEventListener('click', startNewGame);
}

export async function startHiLoGame() {
    if (store.allTowers.length === 0) {
        const check = setInterval(() => {
            if (store.allTowers.length > 0) {
                clearInterval(check);
                startNewGame();
            }
        }, 500);
        return;
    }
    if (!leftTower) {
        startNewGame();
    }
}

async function startNewGame() {
    currentStreak = 0;
    gamesPlayed++;
    updateStatsUI();
    
    document.getElementById('hilo-game-over').classList.add('hidden');
    
    const resultEl = document.getElementById('hilo-result');
    const controlsEl = document.getElementById('hilo-controls');
    
    resultEl.classList.add('hidden');
    resultEl.style.display = '';
    controlsEl.classList.remove('hidden');

    toggleControls(false);
    
    try {
        leftTower = await fetchRandomTowerWithData();
        updateCard('left', leftTower);
        
        rightTower = await fetchRandomTowerWithData(leftTower.name);
        updateCard('right', rightTower, true);
        
        toggleControls(true);
    } catch (e) {
        console.error(e);
        showNotification("Failed to load towers.", "error");
    }
}

async function handleGuess(guess) {
    if (isAnimating) return;
    isAnimating = true;
    toggleControls(false);

    const leftCount = leftTower.victorCount;
    const rightCount = rightTower.victorCount;
    
    document.getElementById('hilo-controls').classList.add('hidden');
    
    const resultEl = document.getElementById('hilo-result');
    resultEl.classList.remove('hidden');
    resultEl.style.display = 'flex';

    const countEl = document.getElementById('hilo-count-right');
    animateValue(countEl, 0, rightCount, 1000);

    let isCorrect = false;
    if (guess === 'higher' && rightCount >= leftCount) isCorrect = true;
    else if (guess === 'lower' && rightCount <= leftCount) isCorrect = true;

    await new Promise(r => setTimeout(r, 1500));

    if (isCorrect) {
        currentStreak++;
        if (currentStreak > highStreak) {
            highStreak = currentStreak;
            localStorage.setItem('etoh_hilo_highscore', highStreak);
        }
        updateStatsUI();
        showNotification("Correct!", "success");
        await slideTransition();
    } else {
        gameOver();
    }
}

async function slideTransition() {
    leftTower = rightTower;
    
    let nextTower = null;
    try {
        nextTower = await fetchRandomTowerWithData(leftTower.name);
    } catch (e) {
        gameOver(); 
        return;
    }

    updateCard('left', leftTower); 
    
    rightTower = nextTower;
    updateCard('right', rightTower, true);
    
    const resultEl = document.getElementById('hilo-result');
    resultEl.classList.add('hidden');
    resultEl.style.display = '';
    
    document.getElementById('hilo-controls').classList.remove('hidden');
    
    isAnimating = false;
    toggleControls(true);
}

function gameOver() {
    const overlay = document.getElementById('hilo-game-over');
    document.getElementById('hilo-final-score').textContent = currentStreak;
    overlay.classList.remove('hidden');
    isAnimating = false;
}

async function fetchRandomTowerWithData(excludeName = null) {
    const validTowers = store.allTowers.filter(t => 
        (t.new_badge_id || t.old_badge_id) && 
        !NON_CANON_TOWERS.has(t.name) &&
        t.name !== excludeName
    );

    let attempts = 0;
    while (attempts < 5) {
        const randomTower = validTowers[Math.floor(Math.random() * validTowers.length)];
        const badgeId = randomTower.new_badge_id || randomTower.old_badge_id;
        
        const data = await api.getBadgeStats(badgeId);
        
        if (data && data.statistics && typeof data.statistics.awardedCount === 'number') {
            return {
                ...randomTower,
                victorCount: data.statistics.awardedCount
            };
        }
        attempts++;
    }
    throw new Error("Could not fetch valid tower data");
}

function updateCard(side, tower, hideCount = false) {
    const nameEl = document.getElementById(`hilo-name-${side}`);
    const areaEl = document.getElementById(`hilo-area-${side}`);
    const diffEl = document.getElementById(`hilo-diff-${side}`);
    const countEl = document.getElementById(`hilo-count-${side}`);
    const topBarEl = document.getElementById(`hilo-bg-${side}`);
    const glowEl = document.getElementById(`hilo-glow-${side}`);

    nameEl.textContent = tower.name;

    const areaName = AREA_DISPLAY_NAMES[tower.area] || tower.area;
    const areaClass = AREA_PILL_CLASSES[tower.area] || AREA_PILL_CLASSES.Default;
    areaEl.textContent = areaName;
    areaEl.className = `px-3 py-1 rounded-full text-xs font-bold border ${areaClass}`;

    const diffClass = DIFFICULTY_PILL_CLASSES[tower.difficulty] || DIFFICULTY_PILL_CLASSES.nil;
    const exactDiff = tower.number_difficulty ? ` [${tower.number_difficulty.toFixed(2)}]` : '';
    diffEl.textContent = `${tower.difficulty}${exactDiff}`;
    diffEl.className = `px-3 py-1 rounded-full text-xs font-bold border ${diffClass}`;

    const diffColor = DIFFICULTY_COLORS[tower.difficulty] || '#808080';
    if (topBarEl) topBarEl.style.backgroundColor = diffColor;
    if (glowEl) glowEl.style.backgroundColor = diffColor;

    if (!hideCount) {
        countEl.textContent = tower.victorCount.toLocaleString();
    }
}

function updateStatsUI() {
    const playedEl = document.getElementById('hilo-stat-played');
    const bestEl = document.getElementById('hilo-stat-best');
    const currentEl = document.getElementById('hilo-stat-current');

    if (playedEl) playedEl.textContent = gamesPlayed;
    if (bestEl) bestEl.textContent = highStreak;
    if (currentEl) currentEl.textContent = currentStreak;
}

function toggleControls(enable) {
    const container = document.getElementById('hilo-controls');
    const btns = container.querySelectorAll('button');
    btns.forEach(b => b.disabled = !enable);
    
    if (container) {
        if(enable) container.classList.remove('opacity-50', 'pointer-events-none');
        else container.classList.add('opacity-50', 'pointer-events-none');
    }
}

function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const ease = 1 - Math.pow(2, -10 * progress);
        
        if (obj) obj.innerHTML = Math.floor(ease * (end - start) + start).toLocaleString();
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}