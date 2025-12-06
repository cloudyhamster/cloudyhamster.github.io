import { store } from '../state.js';
import { api } from '../api.js';
import { DIFFICULTY_COLORS, AREA_DISPLAY_NAMES } from '../config.js';
import { getTowerType, showNotification, hexToRgb } from '../utils.js';

let currentYear = new Date().getFullYear();
let currentSlideIndex = 0;
let wrappedStats = null;
let activityChart = null;

const SLIDES = [
    'intro',
    'count',
    'height',
    'skill',
    'creators',
    'realms',
    'hourly',
    'archetype',
    'summary'
];

const THEMES = {
    intro: '#BE00FF',
    count: '#3b82f6',
    height: '#8b5cf6',
    skill: '#f43f5e',
    creators: '#d946ef',
    realms: '#10b981',
    hourly: '#06b6d4',
    archetype: '#f59e0b',
    summary: null
};

export function initWrapped() {
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes wrapped-fade-in-up {
            0% { opacity: 0; transform: translateY(30px); }
            100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes wrapped-scale-in {
            0% { opacity: 0; transform: scale(0.95); }
            100% { opacity: 1; transform: scale(1); }
        }
        @keyframes border-flow {
            0% { background-position: 0% 50%, 0% 50%; }
            100% { background-position: 200% 50%, 200% 50%; }
        }
        
        .wrapped-anim-up { animation: wrapped-fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .wrapped-anim-scale { animation: wrapped-scale-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .wrapped-delay-1 { animation-delay: 0.1s; }
        .wrapped-delay-2 { animation-delay: 0.2s; }
        .wrapped-delay-3 { animation-delay: 0.3s; }
        
        .btn-wrapped-trigger {
            position: relative;
            width: 100%;
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 12px;
            border-radius: 6px;
            border: 1.5px solid transparent; /* The border width */
            
            /* Layer 1: Inner background (Dark) - Clips to padding */
            /* Layer 2: Outer background (Gradient) - Clips to border */
            background-image: 
                linear-gradient(#15151c, #15151c), 
                linear-gradient(90deg, #BE00FF, #3b82f6, #BE00FF); 
            
            background-origin: border-box;
            background-clip: padding-box, border-box;
            background-size: 100% 100%, 200% 100%;
            
            animation: border-flow 3s linear infinite;
            transition: transform 0.2s ease;
            cursor: pointer;
            margin-bottom: 4px;
        }
        
        .btn-wrapped-trigger:hover {
            transform: scale(1.02);
            /* Slightly lighter inner bg on hover */
            background-image: 
                linear-gradient(#1e1e24, #1e1e24), 
                linear-gradient(90deg, #BE00FF, #3b82f6, #BE00FF);
        }

        .btn-wrapped-trigger span,
        .btn-wrapped-trigger p {
            background: linear-gradient(90deg, #BE00FF, #3b82f6, #BE00FF);
            background-size: 200% auto;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            color: transparent;
            animation: border-flow 3s linear infinite;
            font-weight: 700;
        }
        
        .bento-scroll::-webkit-scrollbar { display: none; }
        .bento-scroll { -ms-overflow-style: none; scrollbar-width: none; }
    `;
    document.head.appendChild(style);

    const btn = document.getElementById('open-wrapped-btn');
    if (btn) {
        btn.className = "btn-wrapped-trigger group";
        
        btn.innerHTML = `
            <span class="material-symbols-outlined text-xl">auto_awesome</span>
            <p class="text-xs font-bold leading-normal">2025 Wrapped</p>
        `;

        btn.addEventListener('click', async () => {
            if (!store.currentUser) {
                showNotification("Please search for a user first!", "error");
                return;
            }
            const originalContent = btn.innerHTML;
            btn.innerHTML = `<p class="text-xs font-bold leading-normal w-full text-center" style="background: linear-gradient(90deg, #BE00FF, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Loading...</p>`;
            btn.disabled = true;
            
            try {
                await generateStats();
                openWrappedModal();
            } catch (e) {
                console.error(e);
                showNotification("Not enough data for Wrapped yet.", "error");
            } finally {
                btn.innerHTML = originalContent;
                btn.disabled = false;
            }
        });
    }
}

async function generateStats() {
    const user = store.currentUser;
    const beaten = user.beaten_towers;
    
    const yearTowers = beaten.filter(t => {
        const d = new Date(t.awarded_unix * 1000);
        return d.getFullYear() === currentYear;
    });

    const prevTowers = beaten.filter(t => {
        const d = new Date(t.awarded_unix * 1000);
        return d.getFullYear() < currentYear;
    });

    if (yearTowers.length === 0) {
        throw new Error("No towers beaten this year");
    }

    const totalBeaten = yearTowers.length;
    const totalFloors = yearTowers.reduce((acc, t) => acc + (t.floors || 10), 0);
    const totalDiff = yearTowers.reduce((acc, t) => acc + (t.number_difficulty || 0), 0);
    
    yearTowers.sort((a, b) => b.number_difficulty - a.number_difficulty);
    const hardestCurrent = yearTowers[0];
    const top5Towers = yearTowers.slice(0, 5);

    prevTowers.sort((a, b) => b.number_difficulty - a.number_difficulty);
    const hardestPrev = prevTowers.length > 0 ? prevTowers[0] : null;
    
    const diffIncrease = hardestPrev 
        ? (hardestCurrent.number_difficulty - hardestPrev.number_difficulty).toFixed(2) 
        : hardestCurrent.number_difficulty.toFixed(2);

    const areaCounts = {};
    const creatorCounts = {};
    
    yearTowers.forEach(t => {
        const area = t.area || "Unknown";
        areaCounts[area] = (areaCounts[area] || 0) + 1;

        const creators = (Array.isArray(t.creators) ? t.creators : ["Unknown"])
            .flatMap(c => c.split(',').map(x => x.trim()));
        
        creators.forEach(c => {
            if (!c) return;
            if (!creatorCounts[c]) creatorCounts[c] = { count: 0, towers: [] };
            creatorCounts[c].count++;
            creatorCounts[c].towers.push(t.name);
        });
    });

    const favRealmEntry = Object.entries(areaCounts).sort((a, b) => b[1] - a[1])[0];
    const favRealm = { name: favRealmEntry ? favRealmEntry[0] : 'N/A', count: favRealmEntry ? favRealmEntry[1] : 0 };
    
    const topCreators = Object.entries(creatorCounts)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5)
        .map(([name, data]) => ({
            name, 
            count: data.count,
            towers: [...new Set(data.towers)].slice(0, 3) 
        }));

    const hours = new Array(24).fill(0);
    yearTowers.forEach(t => {
        const d = new Date(t.awarded_unix * 1000);
        const h = d.getHours();
        hours[h]++;
    });

    let maxHourVal = 0;
    let maxHourIdx = 0;
    hours.forEach((val, idx) => {
        if (val > maxHourVal) {
            maxHourVal = val;
            maxHourIdx = idx;
        }
    });
    
    const date = new Date();
    date.setHours(maxHourIdx, 0, 0);
    const busiestTime = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    let archetype = "The Tourist";
    const avgDiff = totalDiff / totalBeaten;
    
    if (hardestCurrent.number_difficulty >= 10) archetype = "The God Gamer";
    else if (totalBeaten > 150) archetype = "The Machine";
    else if (avgDiff > 6.5) archetype = "The Masochist";
    else if (hardestCurrent.number_difficulty >= 8) archetype = "The Elite";
    else if (yearTowers.filter(t => t.name.includes('Citadel')).length > 8) archetype = "The Endurance Runner";
    else if (totalBeaten > 60) archetype = "The Grinder";

    let topPercent = "Top 50%"; 
    try {
        const JOIN_BADGE_ID = 2125419210; 
        const hardestBadgeId = hardestCurrent.new_badge_id || hardestCurrent.old_badge_id;

        if (hardestBadgeId) {
            const [joinStats, hardStats] = await Promise.all([
                api.getBadgeStats(JOIN_BADGE_ID),
                api.getBadgeStats(hardestBadgeId)
            ]);

            if (joinStats?.statistics?.awardedCount && hardStats?.statistics?.awardedCount) {
                const totalPlayers = joinStats.statistics.awardedCount;
                const hardCount = hardStats.statistics.awardedCount;
                
                if (totalPlayers > 0) {
                    const pct = (hardCount / totalPlayers) * 100;
                    if (pct < 0.01) topPercent = "Top <0.01%";
                    else if (pct < 1) topPercent = `Top ${pct.toFixed(2)}%`;
                    else topPercent = `Top ${Math.round(pct)}%`;
                }
            }
        }
    } catch (e) {
        console.warn("Failed to fetch percentiles", e);
    }

    wrappedStats = {
        totalBeaten,
        totalFloors,
        totalDifficulty: totalDiff.toFixed(1),
        avgDifficulty: avgDiff.toFixed(2),
        hardestCurrent,
        hardestPrev,
        diffIncrease,
        favRealm,
        topCreators,
        top5Towers,
        hours,
        busiestTime,
        busiestCount: maxHourVal,
        archetype,
        topPercent,
        year: currentYear
    };
}

function openWrappedModal() {
    let modal = document.getElementById('wrapped-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'wrapped-modal';
        modal.className = "fixed inset-0 z-[100] bg-black text-white flex flex-col hidden overflow-hidden";
        modal.innerHTML = `
            <div class="absolute top-6 right-6 z-30">
                <button id="close-wrapped" class="w-12 h-12 flex items-center justify-center rounded-full bg-black/50 hover:bg-white/20 backdrop-blur-md transition-all border border-white/10 hover:border-white/30 group">
                    <span class="material-symbols-outlined text-3xl group-hover:scale-110 transition-transform">close</span>
                </button>
            </div>
            
            <div id="wrapped-content" class="flex-1 flex items-center justify-center relative w-full h-full p-4">
            </div>

            <div class="absolute bottom-10 left-0 right-0 flex justify-center gap-3 z-20" id="wrapped-indicators">
            </div>

            <div class="absolute inset-y-0 left-0 w-1/4 z-10 cursor-pointer hover:bg-gradient-to-r from-black/40 to-transparent transition-colors" id="prev-slide-trigger"></div>
            <div class="absolute inset-y-0 right-0 w-1/4 z-10 cursor-pointer hover:bg-gradient-to-l from-black/40 to-transparent transition-colors" id="next-slide-trigger"></div>
        `;
        document.body.appendChild(modal);

        document.getElementById('close-wrapped').addEventListener('click', closeWrappedModal);
        document.getElementById('prev-slide-trigger').addEventListener('click', () => changeSlide(-1));
        document.getElementById('next-slide-trigger').addEventListener('click', () => changeSlide(1));
        
        window.addEventListener('keydown', (e) => {
            if (document.getElementById('wrapped-modal').classList.contains('hidden')) return;
            if (e.key === 'ArrowRight' || e.key === ' ') changeSlide(1);
            if (e.key === 'ArrowLeft') changeSlide(-1);
            if (e.key === 'Escape') closeWrappedModal();
        });
    }

    currentSlideIndex = 0;
    modal.classList.remove('hidden');
    renderSlide(currentSlideIndex);
}

function closeWrappedModal() {
    const modal = document.getElementById('wrapped-modal');
    if (modal) modal.classList.add('hidden');
}

function changeSlide(dir) {
    const nextIndex = currentSlideIndex + dir;
    if (nextIndex >= 0 && nextIndex < SLIDES.length) {
        currentSlideIndex = nextIndex;
        renderSlide(currentSlideIndex);
    }
}

function renderSlide(index) {
    const container = document.getElementById('wrapped-content');
    const indicators = document.getElementById('wrapped-indicators');
    const type = SLIDES[index];
    const s = wrappedStats;

    indicators.innerHTML = SLIDES.map((_, i) => 
        `<div class="w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === index ? 'bg-white w-6' : 'bg-white/30'}"></div>`
    ).join('');

    let themeHex = THEMES[type];
    
    if (!themeHex) {
        themeHex = DIFFICULTY_COLORS[s.hardestCurrent.difficulty] || '#BE00FF';
    }

    const themeRgb = hexToRgb(themeHex) || [190, 0, 255]; 
    const themeString = `${themeRgb[0]}, ${themeRgb[1]}, ${themeRgb[2]}`;

    const bgStyle = `background: radial-gradient(circle at center, rgba(${themeString}, 0.2) 0%, #000000 80%);`;

    container.className = `flex-1 flex items-center justify-center relative w-full h-full transition-all duration-700 bg-black`;
    container.setAttribute('style', bgStyle);

    let html = '';

    switch (type) {
        case 'intro':
            html = `
                <div class="text-center p-8 wrapped-anim-scale relative z-10">
                    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20 blur-[120px] -z-10" style="background: ${themeHex}"></div>
                    <div class="inline-block mb-8">
                        <span class="material-symbols-outlined text-8xl text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" style="color: ${themeHex}">history_edu</span>
                    </div>
                    <div class="text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-500 text-8xl font-black mb-4 tracking-tighter">${s.year}</div>
                    <h1 class="text-6xl font-bold text-white mb-4">Wrapped</h1>
                    <div class="h-1 w-24 bg-white mx-auto rounded-full mb-4" style="background-color: ${themeHex}"></div>
                    <p class="text-2xl text-gray-400 font-light tracking-wide">Your ascent through the hierarchy.</p>
                </div>
            `;
            break;

        case 'count':
            html = `
                <div class="text-center p-8 wrapped-anim-up relative z-10">
                    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] rounded-full opacity-10 blur-[100px] -z-10" style="background: ${themeHex}"></div>
                    <p class="text-3xl font-light mb-12" style="color: ${themeHex}">You kept busy this year.</p>
                    <div class="relative inline-block">
                        <h2 class="text-[12rem] leading-none font-black text-white drop-shadow-2xl" style="text-shadow: 0 0 50px ${themeHex}50">${s.totalBeaten}</h2>
                    </div>
                    <p class="text-2xl text-white uppercase tracking-[0.5em] mt-8 font-bold opacity-80">Towers Conquered</p>
                </div>
            `;
            break;

        case 'height':
            const isUS = navigator.language === 'en-US';
            const unit = isUS ? 'Miles' : 'Kilometers';
            const heightVal = isUS 
                ? ((s.totalFloors * 28) * 0.000621371).toFixed(2)
                : ((s.totalFloors * 28) / 1000).toFixed(2);

            html = `
                <div class="text-center p-8 wrapped-anim-up max-w-4xl w-full">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div class="text-right border-r border-white/20 pr-12 py-8 wrapped-delay-1 wrapped-anim-up">
                            <span class="block text-9xl font-black text-white mb-2" style="text-shadow: 0 0 40px ${themeHex}60">${s.totalFloors}</span>
                            <span class="text-xl text-gray-400 uppercase tracking-widest font-bold">Total Floors</span>
                        </div>
                        <div class="text-left pl-4 wrapped-delay-2 wrapped-anim-up">
                            <p class="text-2xl text-gray-400 mb-2">That's a vertical distance of</p>
                            <span class="block text-8xl font-bold mb-2" style="color: ${themeHex}">${heightVal}</span>
                            <span class="text-xl text-white uppercase tracking-widest font-bold">${unit}</span>
                        </div>
                    </div>
                </div>
            `;
            break;

        case 'skill':
            html = `
                <div class="text-center p-8 w-full max-w-5xl relative">
                    <p class="text-2xl mb-12 font-light uppercase tracking-widest wrapped-anim-up" style="color: ${themeHex}">The Summit</p>
                    <div class="flex flex-col md:flex-row gap-8 justify-center items-stretch wrapped-anim-scale wrapped-delay-1">
                        <div class="flex-1 bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col justify-center opacity-50 scale-95">
                            <p class="text-sm text-gray-500 uppercase tracking-widest mb-4">Last Year's Best</p>
                            <h3 class="text-3xl font-bold text-gray-300 truncate">${s.hardestPrev ? s.hardestPrev.name : 'None'}</h3>
                            <p class="text-gray-500 font-mono mt-2">${s.hardestPrev ? s.hardestPrev.number_difficulty.toFixed(2) : '0.00'}</p>
                        </div>
                        <div class="flex items-center justify-center">
                            <div class="w-12 h-12 rounded-full bg-white text-black font-black flex items-center justify-center text-xl z-10" style="box-shadow: 0 0 20px ${themeHex}">VS</div>
                        </div>
                        <div class="flex-[1.5] bg-black border rounded-2xl p-10 flex flex-col justify-center relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] group" style="border-color: ${themeHex}50">
                            <div class="absolute inset-0 opacity-20 transition-opacity duration-700 group-hover:opacity-40" style="background: linear-gradient(to bottom right, ${themeHex}, transparent)"></div>
                            <div class="absolute top-0 left-0 w-full h-1" style="background:${themeHex}"></div>
                            <p class="text-sm text-white uppercase tracking-widest mb-6 relative z-10 font-bold opacity-80">2025 Hardest Completion</p>
                            <h2 class="text-4xl md:text-5xl font-black text-white leading-tight mb-4 relative z-10 drop-shadow-lg">${s.hardestCurrent.name}</h2>
                            <div class="flex items-center gap-4 relative z-10 mt-auto">
                                <span class="px-4 py-1.5 rounded bg-white text-black font-bold text-sm tracking-wider uppercase">${s.hardestCurrent.difficulty}</span>
                                <span class="text-2xl font-mono text-white font-bold tracking-tighter">${s.hardestCurrent.number_difficulty.toFixed(2)}</span>
                                <span class="ml-auto font-bold flex items-center gap-1 bg-white/10 text-white px-3 py-1 rounded-full border" style="border-color: ${themeHex}"><span class="material-symbols-outlined text-sm">arrow_upward</span>${s.diffIncrease}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            break;

        case 'creators':
            html = `
                <div class="w-full max-w-4xl p-8 h-full flex flex-col justify-center">
                    <div class="flex items-baseline justify-between mb-8 border-b border-white/10 pb-4 wrapped-anim-up">
                        <h2 class="text-4xl font-bold text-white">Top Builders</h2>
                        <p style="color: ${themeHex}">Architects of your suffering</p>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        ${s.topCreators.map((c, i) => `
                            <div class="bg-white/5 border border-white/5 rounded-xl p-5 hover:bg-white/10 transition-colors wrapped-anim-right group" style="animation-delay: ${i * 0.1}s; border-left: 2px solid ${themeHex}00; hover:border-left: 2px solid ${themeHex}">
                                <div class="flex justify-between items-center mb-3">
                                    <div class="flex items-center gap-3">
                                        <span class="text-2xl font-black transition-colors" style="color: ${themeHex}80">0${i+1}</span>
                                        <h3 class="text-xl font-bold text-white truncate">${c.name}</h3>
                                    </div>
                                    <span class="px-2 py-1 rounded bg-white/10 text-xs font-mono text-gray-300">${c.count}</span>
                                </div>
                                <div class="pl-9 flex flex-col gap-1">
                                    ${c.towers.map(t => `<p class="text-xs text-gray-500 truncate hover:text-gray-300 transition-colors">• ${t}</p>`).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            break;

        case 'realms':
            const areaName = AREA_DISPLAY_NAMES[s.favRealm.name] || s.favRealm.name;
            html = `
                <div class="text-center p-8 wrapped-anim-scale relative">
                    <div class="absolute inset-0 bg-white/5 blur-[150px] -z-10" style="background-color: ${themeHex}20"></div>
                    <span class="material-symbols-outlined text-6xl mb-6" style="color: ${themeHex}">public</span>
                    <p class="text-2xl text-gray-300 mb-6 font-light">You spent your days in</p>
                    <h2 class="text-7xl md:text-9xl font-black text-white mb-8 tracking-tighter drop-shadow-2xl">${areaName}</h2>
                    <div class="inline-block px-8 py-3 rounded-full border border-white/30 bg-black/50 backdrop-blur-md" style="border-color: ${themeHex}50">
                        <span class="text-3xl font-bold text-white mr-2">${s.favRealm.count}</span>
                        <span class="text-sm text-gray-400 uppercase tracking-widest">Completions</span>
                    </div>
                </div>
            `;
            break;

        case 'hourly':
            html = `
                <div class="flex flex-col md:flex-row items-center justify-center w-full h-full max-w-6xl gap-12 p-8 wrapped-anim-up">
                    <div class="flex flex-col gap-8 text-right md:text-right w-full md:w-auto">
                        <div>
                            <p class="text-gray-500 text-sm uppercase tracking-widest mb-2 font-bold">Peak Performance</p>
                            <h2 class="text-6xl font-black text-white">${s.busiestTime}</h2>
                        </div>
                        <div>
                            <p class="text-gray-500 text-sm uppercase tracking-widest mb-2 font-bold">Towers Beaten</p>
                            <h2 class="text-6xl font-black" style="color: ${themeHex}">${s.busiestCount}</h2>
                        </div>
                    </div>

                    <div class="relative w-full md:w-3/5 h-[400px] bg-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-sm shadow-xl" style="border-color: ${themeHex}20">
                        <canvas id="wrapped-hourly-chart"></canvas>
                    </div>
                </div>
            `;
            break;

        case 'archetype':
            html = `
                <div class="text-center p-8 wrapped-anim-up relative">
                    <p class="text-xl text-gray-400 mb-8 font-light uppercase tracking-widest">Player Archetype</p>
                    <div class="relative inline-block mb-10 wrapped-anim-scale wrapped-delay-2">
                        <div class="absolute inset-0 blur-[80px] opacity-60" style="background: ${themeHex}"></div>
                        <div class="relative bg-black p-12 rounded-[2rem] border shadow-2xl" style="border-color: ${themeHex}50">
                            <span class="material-symbols-outlined text-9xl text-white mb-6 block" style="color: ${themeHex}">psychology</span>
                            <h2 class="text-5xl md:text-7xl font-black text-white tracking-tight">${s.archetype}</h2>
                        </div>
                    </div>
                    <p class="text-2xl text-white font-serif italic max-w-2xl mx-auto leading-relaxed wrapped-delay-3 wrapped-anim-up opacity-90">
                        "${getArchetypeDescription(s.archetype)}"
                    </p>
                </div>
            `;
            break;

        case 'summary':
            html = `
                <div class="flex flex-col items-center justify-center w-full h-full p-4 md:p-8 overflow-y-auto">
                    <div class="w-full max-w-6xl bg-[#080808] border border-white/5 rounded-[2rem] p-8 shadow-2xl relative wrapped-anim-scale overflow-hidden" 
                         id="share-card" 
                         style="background-image: linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(0,0,0,0) 100%); border-color: ${themeHex}30; box-shadow: 0 0 80px ${themeHex}10;">
                        
                        <div class="absolute top-[-200px] right-[-200px] w-[500px] h-[500px] rounded-full blur-[180px] opacity-20 pointer-events-none" style="background: ${themeHex}"></div>

                        <div class="flex justify-between items-center mb-6 relative z-10">
                            <div class="flex items-center gap-4">
                                <img src="${store.currentUser.avatar_url}" class="w-14 h-14 rounded-full border-2" style="border-color: ${themeHex}">
                                <div>
                                    <h2 class="text-2xl font-bold text-white leading-none">${store.currentUser.display_name}</h2>
                                    <span class="text-xs font-mono text-gray-500 tracking-widest uppercase">Wrapped 2025</span>
                                </div>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6 relative z-10">
                            
                            <div class="lg:col-span-2 h-48 rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden group transition-colors"
                                 style="background: linear-gradient(to bottom right, ${themeHex}15, rgba(255,255,255,0.03)); border: 1px solid ${themeHex}30;">
                                <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <span class="material-symbols-outlined text-9xl">psychology</span>
                                </div>
                                <div>
                                    <p class="text-xs text-gray-500 uppercase tracking-widest mb-1 font-bold">Archetype</p>
                                    <h3 class="text-4xl font-black text-white mb-1 tracking-tight">${s.archetype}</h3>
                                </div>
                                <p class="text-sm text-gray-400 font-serif italic relative z-10">"${getArchetypeDescription(s.archetype)}"</p>
                            </div>

                            <div class="lg:col-span-2 h-48 rounded-2xl p-8 relative overflow-hidden flex flex-col justify-center transition-colors"
                                 style="background: linear-gradient(to bottom left, ${themeHex}15, rgba(255,255,255,0.03)); border: 1px solid ${themeHex}30;">
                                <div class="absolute left-0 top-0 bottom-0 w-2" style="background:${themeHex}"></div>
                                <p class="text-xs text-gray-500 uppercase tracking-widest mb-2 font-bold">Hardest Completion</p>
                                <h3 class="text-3xl font-black text-white truncate mb-2 leading-tight">${s.hardestCurrent.name}</h3>
                                <div class="flex items-center gap-3">
                                    <span class="px-3 py-1 rounded text-xs font-bold text-white border border-white/10" style="background: ${themeHex}40">${s.hardestCurrent.difficulty}</span>
                                    <span class="text-sm text-gray-300 font-mono font-bold">[${s.hardestCurrent.number_difficulty.toFixed(2)}]</span>
                                </div>
                            </div>

                            <div class="lg:col-span-2 min-h-[320px] bg-white/5 rounded-2xl p-6 border border-white/5 flex flex-col hover:border-white/10 transition-colors">
                                <p class="text-xs text-gray-500 uppercase tracking-widest mb-4 pb-2 border-b border-white/5 font-bold">Top 5 Completions</p>
                                <div class="flex flex-col gap-2 flex-1 overflow-y-auto bento-scroll">
                                    ${s.top5Towers.map((t, i) => `
                                        <div class="flex justify-between items-center group py-2 hover:bg-white/5 rounded px-2 transition-colors">
                                            <div class="flex items-center gap-4 overflow-hidden">
                                                <span class="text-xs text-gray-500 font-black">0${i+1}</span>
                                                <span class="text-sm text-gray-300 font-bold truncate group-hover:text-white transition-colors">${t.name}</span>
                                            </div>
                                            <span class="text-[10px] text-gray-400 font-mono font-bold bg-black/40 px-2 py-1 rounded border border-white/5">${t.number_difficulty.toFixed(2)}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>

                            <div class="lg:col-span-2 min-h-[320px] bg-white/5 rounded-2xl p-6 border border-white/5 flex flex-col hover:border-white/10 transition-colors">
                                <p class="text-xs text-gray-500 uppercase tracking-widest mb-4 pb-2 border-b border-white/5 font-bold">Top 5 Builders</p>
                                <div class="flex flex-col gap-2 flex-1 overflow-y-auto bento-scroll">
                                    ${s.topCreators.map((c, i) => `
                                        <div class="flex justify-between items-center group py-2 hover:bg-white/5 rounded px-2 transition-colors">
                                            <div class="flex items-center gap-4 overflow-hidden">
                                                <span class="text-xs text-gray-500 font-black">0${i+1}</span>
                                                <span class="text-sm text-gray-300 font-bold truncate group-hover:text-white transition-colors">${c.name}</span>
                                            </div>
                                            <span class="text-gray-400 text-xs font-mono font-bold">${c.count}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>

                        </div>

                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2 relative z-10">
                            <div class="bg-white/5 rounded-xl p-4 border border-white/5 text-center hover:bg-white/10 transition-colors">
                                <p class="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Total Towers</p>
                                <p class="text-3xl font-black text-white">${s.totalBeaten}</p>
                            </div>
                            <div class="bg-white/5 rounded-xl p-4 border border-white/5 text-center hover:bg-white/10 transition-colors">
                                <p class="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Total Diff</p>
                                <p class="text-3xl font-black text-gray-200">${s.totalDifficulty}</p>
                            </div>
                            <div class="bg-white/5 rounded-xl p-4 border border-white/5 text-center hover:bg-white/10 transition-colors">
                                <p class="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Total Floors</p>
                                <p class="text-3xl font-black text-white">${s.totalFloors}</p>
                            </div>
                            <div class="bg-white/5 rounded-xl p-4 border border-white/5 text-center hover:bg-white/10 transition-colors">
                                <p class="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Global Rank</p>
                                <p class="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">${s.topPercent}</p>
                            </div>
                        </div>
                        
                    </div>
                    <p class="text-gray-600 text-[10px] mt-4 uppercase tracking-widest animate-pulse">Screenshot this card to share</p>
                </div>
            `;
            break;
    }

    container.innerHTML = html;

    if (type === 'hourly') {
        renderHourlyChart(s.hours, themeHex);
    }
}

function renderHourlyChart(hoursData, colorHex) {
    const ctx = document.getElementById('wrapped-hourly-chart');
    if (!ctx) return;

    const rgb = hexToRgb(colorHex) || [190, 0, 255]; 
    const chartCtx = ctx.getContext('2d');
    
    const gradient = chartCtx.createLinearGradient(0, 400, 0, 0);
    gradient.addColorStop(0, '#120E1C'); 
    gradient.addColorStop(1, colorHex); 

    if (activityChart) activityChart.destroy();

    activityChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Array.from({length: 24}, (_, i) => i.toString().padStart(2, '0')),
            datasets: [{
                data: hoursData,
                backgroundColor: gradient,
                borderRadius: 4,
                borderWidth: 0,
                hoverBackgroundColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#000',
                    borderWidth: 1,
                    borderColor: '#333',
                    titleFont: { family: "'Space Grotesk', sans-serif" },
                    bodyFont: { family: "'Space Grotesk', sans-serif" },
                    displayColors: false,
                    callbacks: {
                        title: (items) => {
                            const h = parseInt(items[0].label);
                            const suffix = h >= 12 ? 'PM' : 'AM';
                            const hour12 = h % 12 || 12;
                            return `${hour12}:00 ${suffix}`;
                        },
                        label: (item) => `${item.raw} Completions`
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        color: '#666',
                        font: { size: 10, family: 'monospace' },
                        maxRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 12
                    }
                },
                y: {
                    display: false,
                    grid: { display: false }
                }
            }
        }
    });
}

function getArchetypeDescription(name) {
    const map = {
        "The Tourist": "You came, you saw, you beat Ring 1. It seems you have a life.",
        "The Grinder": "Consistent. Reliable. No life.",
        "The Machine": "Do you shower? Your completion count is terrifying.",
        "The Masochist": "You seek pain. Kinky.",
        "The Elite": "You're playing in the big leagues now. That's impressive.",
        "The God Gamer": "You have ascended beyond mere mortals. Say hello to Lucifer for me.",
        "The Endurance Runner": "You love spending hours in single towers. Why.",
    };
    return map[name] || "A generic tower climber.";
}