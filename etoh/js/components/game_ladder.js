import { store } from '../state.js';
import { DIFFICULTY_COLORS, NON_CANON_TOWERS, DIFFICULTY_PILL_CLASSES } from '../config.js';
import { hexToRgb, showNotification } from '../utils.js';

let currentTowers = [];
let streak = 0;
let bestStreak = localStorage.getItem('etoh_ladder_highscore') || 0;
let gamesPlayed = 0;

let settings = {
    mode: 'easy', 
    count: 3
};
let dragSrcEl = null;

let touchDragItem = null;

const MODE_DESCRIPTIONS = {
    easy: "Random towers. Difficulty displayed.",
    medium: "Random towers. Difficulty HIDDEN.",
    hard: "Towers within 2.50 difficulty range. Hidden.",
    impossible: "Towers within 1.00 difficulty range. Hidden."
};

export function initLadder() {
    const style = document.createElement('style');
    style.innerHTML = `
        .ladder-item { 
            cursor: grab; 
            transition: transform 0.2s, box-shadow 0.2s, background-color 0.2s, border-color 0.2s; 
            user-select: none; 
            touch-action: none; 
        }
        .ladder-item.dragging { 
            opacity: 1; 
            cursor: grabbing; 
            transform: scale(1.02); 
            z-index: 100;
            background-color: #25252b; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.8);
            border-color: rgba(255, 255, 255, 0.4);
        }
        .ladder-item.over { }
        .ladder-correct { border-color: #4ade80 !important; background: rgba(74, 222, 128, 0.15) !important; }
        .ladder-wrong { border-color: #f87171 !important; background: rgba(248, 113, 113, 0.15) !important; }
        .reveal-anim { animation: flipIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        @keyframes flipIn { 0% { transform: perspective(400px) rotateX(90deg); opacity: 0; } 100% { transform: perspective(400px) rotateX(0deg); opacity: 1; } }
    `;
    document.head.appendChild(style);

    updateStreakUI();

    const btnSubmit = document.getElementById('btn-ladder-submit');
    const btnNext = document.getElementById('btn-ladder-next');
    const btnApply = document.getElementById('ladder-apply-settings');
    const countBtns = document.querySelectorAll('.ladder-count-btn');
    const modeBtns = document.querySelectorAll('.ladder-mode-btn');
    const modeDesc = document.getElementById('ladder-mode-desc');
    
    if (btnSubmit) btnSubmit.addEventListener('click', checkOrder);
    if (btnNext) btnNext.addEventListener('click', startRound);
    
    if (btnApply) btnApply.addEventListener('click', () => {
        streak = 0;
        updateStreakUI();
        startRound();
    });

    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modeBtns.forEach(b => {
                b.classList.remove('bg-[#BE00FF]', 'text-white', 'border-[#BE00FF]');
                b.classList.add('bg-white/5', 'text-gray-400', 'border-white/5');
            });
            btn.classList.remove('bg-white/5', 'text-gray-400', 'border-white/5');
            btn.classList.add('bg-[#BE00FF]', 'text-white', 'border-[#BE00FF]');
            
            settings.mode = btn.dataset.mode;
            if(modeDesc) modeDesc.textContent = MODE_DESCRIPTIONS[settings.mode];
        });
    });

    countBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            countBtns.forEach(b => {
                b.classList.remove('bg-[#BE00FF]', 'text-white', 'border-[#BE00FF]');
                b.classList.add('bg-white/5', 'text-gray-400', 'border-white/5');
            });
            btn.classList.remove('bg-white/5', 'text-gray-400', 'border-white/5');
            btn.classList.add('bg-[#BE00FF]', 'text-white', 'border-[#BE00FF]');
            settings.count = parseInt(btn.dataset.count);
        });
    });

    if (store.allTowers.length > 0) startRound();
    store.subscribe('towersLoaded', startRound);
}

export function startLadderGame() {
    if (store.allTowers.length === 0) return;
    if (currentTowers.length === 0) startRound();
}

function startRound() {
    const list = document.getElementById('ladder-list');
    const btnSubmit = document.getElementById('btn-ladder-submit');
    const btnNext = document.getElementById('btn-ladder-next');
    
    list.innerHTML = '';
    btnSubmit.classList.remove('hidden');
    btnNext.classList.add('hidden');
    
    let pool = store.allTowers.filter(t => !NON_CANON_TOWERS.has(t.name) && t.number_difficulty > 0);

    if (settings.mode === 'hard' || settings.mode === 'impossible') {
        const range = settings.mode === 'hard' ? 2.5 : 1.0;
        let attempts = 0;
        let validSubset = [];
        
        while (attempts < 10 && validSubset.length < settings.count) {
            const seed = pool[Math.floor(Math.random() * pool.length)];
            const min = seed.number_difficulty - (range / 2);
            const max = seed.number_difficulty + (range / 2);
            
            validSubset = pool.filter(t => 
                t.number_difficulty >= min && 
                t.number_difficulty <= max
            );
            attempts++;
        }
        pool = validSubset.length >= settings.count ? validSubset : pool;
    }

    if (pool.length < settings.count) {
        list.innerHTML = '<div class="text-red-400 text-center">Not enough towers found for this difficulty mode!</div>';
        return;
    }

    currentTowers = [];
    const usedIndices = new Set();
    while (currentTowers.length < settings.count) {
        const idx = Math.floor(Math.random() * pool.length);
        if (!usedIndices.has(idx)) {
            usedIndices.add(idx);
            currentTowers.push(pool[idx]);
        }
    }

    currentTowers.forEach(t => {
        const item = createDraggableItem(t);
        list.appendChild(item);
    });

    addDragEvents();
}

function createDraggableItem(tower) {
    const el = document.createElement('div');
    el.className = "ladder-item bg-[#0F0F13] border border-white/10 p-3 rounded-lg flex items-center justify-between group h-20";
    el.draggable = true;
    el.dataset.diff = tower.number_difficulty;
    el.dataset.name = tower.name;
    el.dataset.rawColor = DIFFICULTY_COLORS[tower.difficulty] || '#808080';

    const diffColor = DIFFICULTY_COLORS[tower.difficulty] || '#808080';
    
    let displayHtml = '';
    let borderColor = diffColor;

    if (settings.mode === 'easy') {
        const pillClass = DIFFICULTY_PILL_CLASSES[tower.difficulty] || 'border-gray-500 text-gray-500';
        displayHtml = `
            <span class="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${pillClass}">
                ${tower.difficulty}
            </span>
        `;
    } else {
        borderColor = 'rgba(255,255,255,0.1)'; 
        displayHtml = `
            <span class="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-white/10 text-gray-500 bg-white/5">
                ???
            </span>
        `;
    }

    el.style.borderLeft = `4px solid ${borderColor}`;

    const revealClass = DIFFICULTY_PILL_CLASSES[tower.difficulty] || 'border-gray-500 text-gray-500 bg-gray-500/10';

    el.innerHTML = `
        <div class="flex items-center gap-4 flex-1 min-w-0 pointer-events-none">
            <span class="material-symbols-outlined text-gray-600 cursor-grab shrink-0">drag_indicator</span>
            <div class="flex-1 min-w-0">
                <h4 class="font-bold text-white text-sm md:text-base truncate pr-2">${tower.name}</h4>
                <div class="mt-1">${displayHtml}</div>
            </div>
        </div>
        
        <div class="ladder-reveal hidden pl-4 border-l border-white/10 ml-4 flex-shrink-0">
            <div class="flex flex-col items-center justify-center rounded px-3 py-1 border ${revealClass}">
                <span class="font-mono font-bold text-xl leading-none">
                    ${tower.number_difficulty.toFixed(2)}
                </span>
                <span class="text-[8px] uppercase tracking-widest font-bold mt-0.5 opacity-80">Difficulty</span>
            </div>
        </div>
    `;

    return el;
}

function checkOrder() {
    const list = document.getElementById('ladder-list');
    const items = [...list.children];
    let isCorrect = true;
    
    const numericValues = items.map(i => parseFloat(i.dataset.diff));
    const correctSorted = [...numericValues].sort((a,b) => a-b);
    
    items.forEach((item, index) => {
        const diff = parseFloat(item.dataset.diff);
        const reveal = item.querySelector('.ladder-reveal');
        
        const trueColor = item.dataset.rawColor;
        item.style.borderLeftColor = trueColor;

        reveal.classList.remove('hidden');
        reveal.parentElement.classList.add('reveal-anim');
        
        item.draggable = false;
        item.classList.remove('cursor-grab');
        item.querySelector('.material-symbols-outlined').classList.add('opacity-0');

        if (diff === correctSorted[index]) {
            item.classList.add('ladder-correct');
        } else {
            item.classList.add('ladder-wrong');
            isCorrect = false;
        }
    });

    const btnSubmit = document.getElementById('btn-ladder-submit');
    const btnNext = document.getElementById('btn-ladder-next');
    
    btnSubmit.classList.add('hidden');
    btnNext.classList.remove('hidden');

    gamesPlayed++;

    if (isCorrect) {
        streak++;
        if (streak > bestStreak) {
            bestStreak = streak;
            localStorage.setItem('etoh_ladder_highscore', bestStreak);
        }
        showNotification("Correct Order!", "success");
    } else {
        streak = 0;
        showNotification("Incorrect order.", "error");
    }
    updateStreakUI();
}

function updateStreakUI() {
    const playedEl = document.getElementById('ladder-stat-played');
    const bestEl = document.getElementById('ladder-stat-best');
    const currentEl = document.getElementById('ladder-stat-current');

    if (playedEl) playedEl.textContent = gamesPlayed;
    if (bestEl) bestEl.textContent = bestStreak;
    if (currentEl) currentEl.textContent = streak;

    const el = document.getElementById('ladder-streak');
    if (el) el.textContent = streak;
}

function addDragEvents() {
    const items = document.querySelectorAll('.ladder-item');
    items.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragenter', handleDragEnter);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('dragleave', handleDragLeave);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragend', handleDragEnd);
        item.addEventListener('touchstart', handleTouchStart, {passive: false});
        item.addEventListener('touchmove', handleTouchMove, {passive: false});
        item.addEventListener('touchend', handleTouchEnd);
    });
}
function handleDragStart(e) {
    dragSrcEl = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
    this.classList.add('dragging');
}
function handleDragOver(e) { 
    if (e.preventDefault) e.preventDefault(); 
    e.dataTransfer.dropEffect = 'move'; 
    return false; 
}
function handleDragEnter(e) { 
    this.classList.add('over');
}
function handleDragLeave(e) { 
    this.classList.remove('over'); 
}
function handleDrop(e) {
    if (e.stopPropagation) e.stopPropagation();
    if (dragSrcEl !== this) swapItems(dragSrcEl, this);
    return false;
}
function handleDragEnd(e) {
    this.classList.remove('dragging');
    document.querySelectorAll('.ladder-item').forEach(item => item.classList.remove('over'));
}
function handleTouchStart(e) {
    if (e.target.closest('button')) return; 
    e.preventDefault(); 
    touchDragItem = this;
    touchDragItem.classList.add('dragging');
}
function handleTouchMove(e) {
    if (!touchDragItem) return;
    e.preventDefault();
    const touch = e.touches[0];
    const elementUnder = document.elementFromPoint(touch.clientX, touch.clientY);
    const targetItem = elementUnder ? elementUnder.closest('.ladder-item') : null;
    if (targetItem && targetItem !== touchDragItem && targetItem.parentNode === touchDragItem.parentNode) {
        swapItems(touchDragItem, targetItem);
    }
}
function handleTouchEnd(e) {
    if (touchDragItem) {
        touchDragItem.classList.remove('dragging');
        touchDragItem = null;
    }
}
function swapItems(src, target) {
    const list = src.parentNode;
    const all = [...list.children];
    const srcIdx = all.indexOf(src);
    const targetIdx = all.indexOf(target);
    if (srcIdx < targetIdx) list.insertBefore(src, target.nextSibling);
    else list.insertBefore(src, target);
}