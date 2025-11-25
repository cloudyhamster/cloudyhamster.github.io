import { fetchAndRenderLeaderboard } from './leaderboard.js';
import { initGame } from './game.js';
import { renderLibrary, initLibrary } from './library.js';
import { store } from '../state.js';

let currentView = 'chart';

export function initNavigation() {
    const navLinksContainer = document.getElementById('nav-links');
    const gamesNavLinksContainer = document.getElementById('games-nav-links');
    const miscNavLinksContainer = document.getElementById('misc-nav-links');
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileFilterToggle = document.getElementById('mobile-filter-toggle');
    const mobileCloseFilters = document.getElementById('mobile-close-filters');
    const mobileBackdrop = document.getElementById('mobile-backdrop');
    
    const handleNavClick = (e) => {
        const l = e.target.closest('a');
        if (l && l.dataset.view) {
            e.preventDefault();
            switchView(l.dataset.view);
        }
    };
    
    navLinksContainer.addEventListener('click', handleNavClick);
    gamesNavLinksContainer.addEventListener('click', handleNavClick);
    miscNavLinksContainer.addEventListener('click', handleNavClick);

    mobileMenuToggle.addEventListener('click', () => toggleSidebar(document.getElementById('left-sidebar'), true));
    
    mobileFilterToggle.addEventListener('click', () => {
        const gameStats = document.getElementById('game-stats-sidebar');
        const libFilters = document.getElementById('library-filters-sidebar');
        const activeRightSidebar = !gameStats.classList.contains('hidden') ? gameStats : libFilters;
        if (!activeRightSidebar.classList.contains('hidden')) toggleSidebar(activeRightSidebar, true);
    });
    
    if (mobileCloseFilters) mobileCloseFilters.addEventListener('click', () => toggleSidebar(document.getElementById('library-filters-sidebar'), false));
    
    mobileBackdrop.addEventListener('click', () => {
        toggleSidebar(document.getElementById('left-sidebar'), false);
        toggleSidebar(document.getElementById('game-stats-sidebar'), false);
        toggleSidebar(document.getElementById('library-filters-sidebar'), false);
    });

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
        games: { title: '', element: document.getElementById('games-view') }
    };

    const mainContentTitle = document.getElementById('main-content-title');
    if (viewName === 'games') {
        mainContentTitle.classList.add('hidden');
    } else {
        mainContentTitle.textContent = views[viewName].title;
        mainContentTitle.classList.remove('hidden');
    }

    const gameStatsSidebar = document.getElementById('game-stats-sidebar');
    const libraryFiltersSidebar = document.getElementById('library-filters-sidebar');

    if (viewName === 'games') {
        gameStatsSidebar.classList.remove('hidden');
        gameStatsSidebar.classList.add('flex');
    } else {
        gameStatsSidebar.classList.add('hidden');
        gameStatsSidebar.classList.remove('flex');
    }

    if (viewName === 'library') {
        libraryFiltersSidebar.classList.remove('hidden');
        libraryFiltersSidebar.classList.add('flex');
    } else {
        libraryFiltersSidebar.classList.add('hidden');
        libraryFiltersSidebar.classList.remove('flex');
    }

    Object.values(views).forEach(view => view.element.classList.add('hidden'));
    if (views[viewName]) views[viewName].element.classList.remove('hidden');

    if (viewName === 'leaderboard' && !store.leaderboard) fetchAndRenderLeaderboard();
    if (viewName === 'games') initGame();
    if (viewName === 'library') renderLibrary();

    const mobileFilterToggle = document.getElementById('mobile-filter-toggle');
    if (viewName === 'games' || viewName === 'library') mobileFilterToggle.classList.remove('hidden');
    else mobileFilterToggle.classList.add('hidden');

    updateNavStyles(viewName);
}

function updateNavStyles(viewName) {
    const activeClasses = ['bg-[#BE00FF]/20', 'border', 'border-[#BE00FF]/50', 'text-[#BE00FF]'];
    const inactiveClasses = ['text-gray-300', 'transition-colors', 'hover:bg-white/5', 'hover:text-white'];
    
    const allLinks = [
        ...document.querySelectorAll('#nav-links a'), 
        ...document.querySelectorAll('#games-nav-links a'), 
        ...document.querySelectorAll('#misc-nav-links a')
    ];

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
    if (show) {
        sidebar.classList.remove('-translate-x-full', 'translate-x-full');
        sidebar.classList.add('translate-x-0');
        mobileBackdrop.classList.remove('hidden');
    } else {
        if (sidebar.id === 'left-sidebar') sidebar.classList.add('-translate-x-full');
        else sidebar.classList.add('translate-x-full');
        sidebar.classList.remove('translate-x-0');
        mobileBackdrop.classList.add('hidden');
    }
}