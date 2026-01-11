import { api } from './api.js';
import { store } from './state.js';
import { showNotification } from './utils.js';
import { initChart } from './components/chart.js';
import { initHistory } from './components/history.js';
import { initLibrary } from './components/library.js';
import { initHiLo } from './components/game_hilo.js';
import { initLeaderboard } from './components/leaderboard.js';
import { initProfile } from './components/profile.js';
import { initNavigation, switchView } from './components/navigation.js';
import { initModals } from './ui/modals.js';
import { initRoulette } from './components/roulette.js';
import { initLadder } from './components/game_ladder.js';
import { initAuth } from './components/auth.js';
import { renderProfilePage } from './components/profile_page.js';

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const targetUser = urlParams.get('user');

    if (token) {
        api.setToken(token);
        const newUrl = targetUser ? `?user=${targetUser}` : window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        showNotification('Successfully logged in via Roblox!', 'success');
    }

    initNavigation();
    initChart();
    initHistory();
    initLibrary();
    initHiLo();
    initLeaderboard();
    initProfile();
    initModals();
    initRoulette();
    initLadder();
    initAuth();

    try {
        const towers = await api.getMasterTowers();
        store.setAllTowers(towers);
    } catch (e) {
        console.error(e);
    }

    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const searchIcon = document.getElementById('searchIcon');
    const loadingIndicator = document.getElementById('searchLoadingIndicator');
    const forceRefreshCheckbox = document.getElementById('forceRefreshCheckbox');
    const profileOnlyCheckbox = document.getElementById('profileOnlyCheckbox');
    const statsContainer = document.getElementById('statsContainer');

    window.performSearch = async (username, options = {}) => {
        if (!username) {
            showNotification('Please enter a Roblox Username.', 'error');
            return false;
        }

        const useForceRefresh = options.forceRefresh !== undefined ? options.forceRefresh : forceRefreshCheckbox.checked;
        const useProfileOnly = options.profileOnly !== undefined ? options.profileOnly : profileOnlyCheckbox.checked;

        searchIcon.classList.add('hidden');
        loadingIndicator.classList.remove('hidden');
        if (statsContainer) statsContainer.style.display = 'none';
        
        try {
            const result = await api.getPlayerData(
                username, 
                useForceRefresh,
                useProfileOnly
            );
            store.setCurrentUser(result);
            
            const newUrl = `${window.location.pathname}?user=${username}`;
            window.history.pushState({ path: newUrl }, '', newUrl);
            
            if (useProfileOnly) {
                showNotification(`Loaded profile layout for ${result.display_name}.`, 'success');
            } else {
                showNotification(`Loaded stats for ${result.display_name}.`, 'success');
            }
            
            switchView('profile');
            renderProfilePage();
            
            return true;
        } catch (error) {
            showNotification(error.message, 'error');
            return false;
        } finally {
            searchIcon.classList.remove('hidden');
            loadingIndicator.classList.add('hidden');
        }
    };

    searchButton.addEventListener('click', () => window.performSearch(searchInput.value.trim()));
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') window.performSearch(searchInput.value.trim());
    });

    if (targetUser) {
        searchInput.value = targetUser;
        setTimeout(() => window.performSearch(targetUser), 100);
    }
});