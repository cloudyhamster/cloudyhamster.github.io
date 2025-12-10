import { fetchAndRenderLeaderboard } from './leaderboard.js';
import { renderLibrary } from './library.js';
import { startHiLoGame } from './game_hilo.js';
import { initRoulette } from './roulette.js';
import { startLadderGame } from './game_ladder.js';
import { store } from '../state.js';

let currentView = 'chart';

export function initNavigation() {
    const navLinksContainer = document.getElementById('nav-links');
    const gamesNavLinksContainer = document.getElementById('games-nav-links');
    const miscNavLinksContainer = document.getElementById('misc-nav-links');
    const limitedNavLinksContainer = document.getElementById('limited-nav-links');

    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileFilterToggle = document.getElementById('mobile-filter-toggle');
    
    const mobileCloseFilters = document.getElementById('mobile-close-filters');
    const mobileCloseChartFilters = document.getElementById('mobile-close-chart-filters');
    const mobileCloseRouletteFilters = document.getElementById('mobile-close-roulette-filters');
    const mobileCloseLadderSettings = document.getElementById('mobile-close-ladder-settings');
    const mobileBackdrop = document.getElementById('mobile-backdrop');
    
    const handleNavClick = (e) => {
        const l = e.target.closest('a');
        if (l && l.dataset.view) {
            e.preventDefault();
            switchView(l.dataset.view);
            toggleSidebar(document.getElementById('left-sidebar'), false);
        }
    };
    
    if (navLinksContainer) navLinksContainer.addEventListener('click', handleNavClick);
    if (gamesNavLinksContainer) gamesNavLinksContainer.addEventListener('click', handleNavClick);
    if (miscNavLinksContainer) miscNavLinksContainer.addEventListener('click', handleNavClick);
    if (limitedNavLinksContainer) limitedNavLinksContainer.addEventListener('click', handleNavClick);

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => toggleSidebar(document.getElementById('left-sidebar'), true));
    }
    
    if (mobileFilterToggle) {
        mobileFilterToggle.addEventListener('click', () => {
            const gameStats = document.getElementById('game-stats-sidebar');
            const libFilters = document.getElementById('library-filters-sidebar');
            const chartFilters = document.getElementById('chart-filters-sidebar');
            const rouletteFilters = document.getElementById('roulette-filters-sidebar');
            const ladderSettings = document.getElementById('ladder-settings-sidebar');
            
            let activeRightSidebar = null;

            if (currentView === 'games' && gameStats) activeRightSidebar = gameStats;
            else if (currentView === 'library' && libFilters) activeRightSidebar = libFilters;
            else if (currentView === 'chart' && chartFilters) activeRightSidebar = chartFilters;
            else if (currentView === 'roulette' && rouletteFilters) activeRightSidebar = rouletteFilters;
            else if (currentView === 'ladder' && ladderSettings) activeRightSidebar = ladderSettings;

            if (activeRightSidebar) toggleSidebar(activeRightSidebar, true);
        });
    }
    
    if (mobileCloseFilters) mobileCloseFilters.addEventListener('click', () => toggleSidebar(document.getElementById('library-filters-sidebar'), false));
    if (mobileCloseChartFilters) mobileCloseChartFilters.addEventListener('click', () => toggleSidebar(document.getElementById('chart-filters-sidebar'), false));
    if (mobileCloseRouletteFilters) mobileCloseRouletteFilters.addEventListener('click', () => toggleSidebar(document.getElementById('roulette-filters-sidebar'), false));
    if (mobileCloseLadderSettings) mobileCloseLadderSettings.addEventListener('click', () => toggleSidebar(document.getElementById('ladder-settings-sidebar'), false));
    
    if (mobileBackdrop) {
        mobileBackdrop.addEventListener('click', () => {
            toggleSidebar(document.getElementById('left-sidebar'), false);
            toggleSidebar(document.getElementById('game-stats-sidebar'), false);
            toggleSidebar(document.getElementById('library-filters-sidebar'), false);
            toggleSidebar(document.getElementById('chart-filters-sidebar'), false);
            toggleSidebar(document.getElementById('roulette-filters-sidebar'), false);
            toggleSidebar(document.getElementById('ladder-settings-sidebar'), false);
        });
    }

    switchView('chart');
}

export function switchView(viewName) {
    currentView = viewName;
    
    const views = {
        chart: { title: 'Completion Chart', element: document.getElementById('chart-view') },
        list: { title: 'Completion History', element: document.getElementById('list-view') },
        table: { title: 'Area Completion', element: document.getElementById('table-view') },
        library: { title: 'Tower Library', element: document.getElementById('library-view') },
        leaderboard: { title: 'Leaderboard', element: document.getElementById('leaderboard-view') },
        games: { title: '', element: document.getElementById('games-view') },
        roulette: { title: 'Tower Roulette', element: document.getElementById('roulette-view') },
        ladder: { title: 'The Difficulty Ladder', element: document.getElementById('ladder-view') }
    };

    const mainContentTitle = document.getElementById('main-content-title');
    if (mainContentTitle) {
        if (viewName === 'games' || viewName === 'roulette' || viewName === 'ladder') {
            mainContentTitle.classList.add('hidden');
        } else {
            if (views[viewName]) {
                mainContentTitle.textContent = views[viewName].title;
                mainContentTitle.classList.remove('hidden');
            }
        }
    }

    const gameStatsSidebar = document.getElementById('game-stats-sidebar');
    const libraryFiltersSidebar = document.getElementById('library-filters-sidebar');
    const chartFiltersSidebar = document.getElementById('chart-filters-sidebar');
    const rouletteFiltersSidebar = document.getElementById('roulette-filters-sidebar');
    const ladderSettingsSidebar = document.getElementById('ladder-settings-sidebar');

    const hideSidebar = (sidebar) => {
        if (!sidebar) return;
        sidebar.classList.add('hidden');
        sidebar.classList.remove('flex');
        if (sidebar.classList.contains('translate-x-0')) toggleSidebar(sidebar, false);
    };

    const showSidebar = (sidebar) => {
        if (!sidebar) return;
        sidebar.classList.remove('hidden');
        sidebar.classList.add('flex');
    };

    hideSidebar(gameStatsSidebar);
    hideSidebar(libraryFiltersSidebar);
    hideSidebar(chartFiltersSidebar);
    hideSidebar(rouletteFiltersSidebar);
    hideSidebar(ladderSettingsSidebar);

    if (viewName === 'games') showSidebar(gameStatsSidebar);
    else if (viewName === 'library') showSidebar(libraryFiltersSidebar);
    else if (viewName === 'chart') showSidebar(chartFiltersSidebar);
    else if (viewName === 'roulette') showSidebar(rouletteFiltersSidebar);
    else if (viewName === 'ladder') showSidebar(ladderSettingsSidebar);

    Object.values(views).forEach(view => {
        if (view.element) view.element.classList.add('hidden');
    });
    
    if (views[viewName] && views[viewName].element) {
        views[viewName].element.classList.remove('hidden');
    }

    if (viewName === 'leaderboard' && !store.leaderboard) fetchAndRenderLeaderboard();
    if (viewName === 'library') renderLibrary();
    if (viewName === 'games') startHiLoGame();
    if (viewName === 'roulette') initRoulette();
    if (viewName === 'ladder') startLadderGame();

    const mobileFilterToggle = document.getElementById('mobile-filter-toggle');
    if (mobileFilterToggle) {
        if (viewName === 'games' || viewName === 'library' || viewName === 'chart' || viewName === 'roulette' || viewName === 'ladder') {
            mobileFilterToggle.classList.remove('hidden');
        } else {
            mobileFilterToggle.classList.add('hidden');
        }
    }

    updateNavStyles(viewName);
}

function updateNavStyles(viewName) {
    const activeClasses = ['bg-[#BE00FF]/20', 'border', 'border-[#BE00FF]/50', 'text-[#BE00FF]'];
    const inactiveClasses = ['text-gray-300', 'transition-colors', 'hover:bg-white/5', 'hover:text-white'];
    
    const allLinks = document.querySelectorAll('a[data-view]');

    allLinks.forEach(link => {
        if (link.dataset.view === viewName) {
            link.classList.remove(...inactiveClasses);
            link.classList.add(...activeClasses);
        } else {
            link.classList.remove(...activeClasses);
            link.classList.add(...inactiveClasses);
        }
    });
}

function toggleSidebar(sidebar, show) {
    const mobileBackdrop = document.getElementById('mobile-backdrop');
    if (!sidebar) return;

    if (show) {
        sidebar.classList.remove('-translate-x-full', 'translate-x-full');
        sidebar.classList.add('translate-x-0');
        if (mobileBackdrop) mobileBackdrop.classList.remove('hidden');
    } else {
        if (sidebar.id === 'left-sidebar') sidebar.classList.add('-translate-x-full');
        else sidebar.classList.add('translate-x-full');
        sidebar.classList.remove('translate-x-0');
        if (mobileBackdrop) mobileBackdrop.classList.add('hidden');
    }
}