import { api } from './api.js';
import { store } from './state.js';
import { showNotification } from './utils.js';
import { initChart } from './components/chart.js';
import { initHistory } from './components/history.js';
import { initLibrary } from './components/library.js';
import { initHiLo } from './components/game_hilo.js';
import { initLeaderboard } from './components/leaderboard.js';
import { initProfile } from './components/profile.js';
import { initNavigation } from './components/navigation.js';
import { initModals, openProfileModal } from './ui/modals.js';
import { initWrapped } from './components/wrapped.js';
import { initRoulette } from './components/roulette.js';
import { initLadder } from './components/game_ladder.js';

document.addEventListener('DOMContentLoaded', async () => {
    initNavigation();
    initChart();
    initHistory();
    initLibrary();
    initHiLo();
    initLeaderboard();
    initProfile();
    initModals();
    initWrapped();
    initRoulette();
    initLadder();

    try {
        const towers = await api.getMasterTowers();
        store.setAllTowers(towers);
    } catch (e) {
        console.error("Failed to load master tower data:", e);
    }

    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const searchIcon = document.getElementById('searchIcon');
    const loadingIndicator = document.getElementById('searchLoadingIndicator');
    const forceRefreshCheckbox = document.getElementById('forceRefreshCheckbox');
    const statsContainer = document.getElementById('statsContainer');

    const performSearch = async (username) => {
        if (!username) {
            showNotification('Please enter a Roblox Username.', 'error');
            return false;
        }
        searchIcon.classList.add('hidden');
        loadingIndicator.classList.remove('hidden');
        statsContainer.style.display = 'none';
        
        try {
            const result = await api.getPlayerData(username, forceRefreshCheckbox.checked);
            store.setCurrentUser(result);
            showNotification(`Successfully loaded stats for ${username}.`, 'success');
            
            const gamesView = document.getElementById('games-view');
            if (!gamesView.classList.contains('hidden')) {
                initGame();
            }
            return true;
        } catch (error) {
            showNotification(error.message, 'error');
            return false;
        } finally {
            searchIcon.classList.remove('hidden');
            loadingIndicator.classList.add('hidden');
        }
    };

    searchButton.addEventListener('click', () => performSearch(searchInput.value.trim()));
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') performSearch(searchInput.value.trim());
    });
});