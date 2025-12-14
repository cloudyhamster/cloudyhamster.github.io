import { api } from '../api.js';
import { store } from '../state.js';
import { showNotification } from '../utils.js';
import { RANK_COLORS, DIFFICULTY_PILL_CLASSES } from '../config.js';

export async function fetchAndRenderLeaderboard() {
    const container = document.getElementById('leaderboard-container');
    container.innerHTML = `<div class="flex items-center justify-center p-8 text-sm text-gray-500">Loading leaderboard...</div>`;

    try {
        const data = await api.getLeaderboard();
        store.setLeaderboard(data);
        renderLeaderboard(data);
    } catch (error) {
        container.innerHTML = `<div class="flex items-center justify-center p-8 text-red-400">Failed to load leaderboard.</div>`;
        showNotification(error.message, 'error');
    }
}

function renderLeaderboard(data) {
    const container = document.getElementById('leaderboard-container');
    let headerHtml = `<div class="leaderboard-header whitespace-nowrap"><div class="w-16 text-center">#</div><div class="w-64 text-left">Player</div><div class="flex-1 text-left">Hardest Tower</div><div class="w-56 text-left">Difficulty</div><div class="w-24 text-center pr-2">Towers</div></div>`;

    let rowsHtml = '';
    data.forEach((player, index) => {
        const rank = index + 1;
        let rankClass = '', rankRgb = '';
        if (rank === 1) { rankClass = 'rank-gold'; rankRgb = RANK_COLORS.gold; } 
        else if (rank === 2) { rankClass = 'rank-silver'; rankRgb = RANK_COLORS.silver; } 
        else if (rank === 3) { rankClass = 'rank-bronze'; rankRgb = RANK_COLORS.bronze; } 
        else if (rank <= 10) { rankClass = 'rank-top10'; rankRgb = RANK_COLORS.top10; }

        const difficultyText = `${player.hardest_tower_modifier || ''} ${player.hardest_tower_difficulty || ''}`.trim();
        const diffPillClass = DIFFICULTY_PILL_CLASSES[player.hardest_tower_difficulty] || DIFFICULTY_PILL_CLASSES.nil;
        const numericDifficulty = (player.number_difficulty || 0).toFixed(2);

        rowsHtml += `
        <div class="leaderboard-row ${rankClass}" style="--rank-rgb: ${rankRgb};">
            <div class="w-16 text-center text-lg font-bold text-gray-400">${rank}</div>
            <div class="w-64 cursor-pointer leaderboard-player-cell group" data-username="${player.user_name}">
                <div class="flex items-center gap-3 transition-transform group-hover:translate-x-1">
                    <img src="${player.avatar_url || 'icon.jpg'}" class="leaderboard-avatar group-hover:border-[#BE00FF]" alt="avatar">
                    <div class="flex flex-col">
                        <span class="font-bold text-white group-hover:text-[#BE00FF] transition-colors truncate">${player.display_name || player.user_name}</span>
                        <span class="text-xs text-gray-400">@${player.user_name || 'null'}</span>
                    </div>
                </div>
            </div>
            <div class="flex-1 text-gray-300 text-sm text-left truncate pr-4">${player.hardest_tower_name}</div>
            <div class="w-56 text-left"><span class="inline-block py-0.5 px-2.5 rounded-full text-xs font-medium border ${diffPillClass}">${difficultyText} [${numericDifficulty}]</span></div>
            <div class="w-24 text-center text-lg font-bold text-white pr-2">${player.total_towers}</div>
        </div>`;
    });

    container.innerHTML = `<div class="min-w-[900px]">${headerHtml + rowsHtml}</div>`;
}

export function initLeaderboard() {
    document.getElementById('leaderboard-container').addEventListener('click', async (e) => {
        const playerCell = e.target.closest('.leaderboard-player-cell');
        if (playerCell) {
            const username = playerCell.dataset.username;
            if (username) {
                const searchInput = document.getElementById('searchInput');
                if (searchInput) searchInput.value = username;

                if (window.performSearch) {
                    window.performSearch(username); 
                }
            }
        }
    });
}