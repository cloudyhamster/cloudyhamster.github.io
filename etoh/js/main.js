document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'https://etoh-thing-w1v8.onrender.com';

    let completionChart = null;
    let currentView = 'chart';
    let allTowersData = [];
    let beatenTowersData = [];
    let leaderboardData = null;

    let targetTower = null;
    let guesses = [];
    const maxGuesses = 6;
    let isGameActive = false;
    let sessionStats = {
        played: 0,
        wins: 0,
        totalGuesses: 0,
        bestGame: null
    };

    let libFilterMode = 'range';
    let libMinDiff = 1.0;
    let libMaxDiff = 12.0;
    let libSelectedDiffs = new Set();
    let libSelectedAreas = new Set();
    let libStatusValue = 'All';
    let libSortOrder = 'desc';

    let libSelectedTypes = new Set(['Tower', 'Citadel', 'Steeple']);

    let libSelectedLengths = new Set();
    let libMinFloors = null;
    let libMaxFloors = null;
    let libSelectedCreators = new Set();
    let libSelectedWarnings = new Set();

    const NON_CANON_TOWERS = new Set([
        "Tower Not Found", "Not Even A Tower", "This Is Probably A Tower",
        "Maybe A Tower", "Totally A Tower", "Will Be A Tower", "Likely A Tower",
        "Fortunately Not A Tower", "Far From A Surprising Tower", "Somewhat A Tower",
        "Possibly A Tower", "Not Even A Flower"
    ]);

    const difficultyColors = {
        "Easy": "#76F447",
        "Medium": "#FFFF00",
        "Hard": "#FE7C00",
        "Difficult": "#FF3232",
        "Challenging": "#A00000",
        "Intense": "#19222D",
        "Remorseless": "#C900C8",
        "Insane": "#0000FF",
        "Extreme": "#0287FF",
        "Terrifying": "#00FFFF",
        "Catastrophic": "#FFFFFF",
    };

    const areaColors = {
        'Ring 0': '#ef4444',
        'Ring 1': '#dc2626',
        'Forgotten Ridge': '#dc2626',
        'Ring 2': '#b91c1c',
        'Garden Of Eesh%C3%B6L': '#b91c1c',
        'Ring 3': '#991b1b',
        'Ring 4': '#881337',
        'Silent Abyss': '#881337',
        'Ring 5': '#881337',
        'Lost River': '#881337',
        'Ring 6': '#7f1d1d',
        'Ashen Towerworks': '#7f1d1d',
        'Ring 7': '#7f1d1d',
        'Ring 8': '#831843',
        'The Starlit Archives': '#831843',
        'Ring 9': '#831843',
        'Zone 1': '#3b82f6',
        'Zone 2': '#2563eb',
        'Arcane Area': '#2563eb',
        'Zone 3': '#1d4ed8',
        'Paradise Atoll': '#1d4ed8',
        'Zone 4': '#0ea5e9',
        'Zone 5': '#0284c7',
        'Zone 6': '#0369a1',
        'Zone 7': '#06b6d4',
        'Zone 8': '#0891b2',
        'Zone 9': '#0e7490',
        'Zone 10': '#14b8a6',
        'Default': '#6b7280'
    };

    const areaDisplayNames = {
        'Garden Of Eesh%C3%B6L': 'Garden Of Eeshöl'
    };

    const difficultyPillClasses = {
        "Easy": "border-green-500/50 text-green-300 bg-green-500/10",
        "Medium": "border-yellow-500/50 text-yellow-300 bg-yellow-500/10",
        "Hard": "border-orange-500/50 text-orange-300 bg-orange-500/10",
        "Difficult": "border-red-500/50 text-red-300 bg-red-500/10",
        "Challenging": "border-red-700/50 text-red-400 bg-red-700/10",
        "Intense": "border-gray-500/50 text-gray-300 bg-gray-500/10",
        "Remorseless": "border-fuchsia-500/50 text-fuchsia-300 bg-fuchsia-500/10",
        "Insane": "border-blue-500/50 text-blue-300 bg-blue-500/10",
        "Extreme": "border-sky-500/50 text-sky-300 bg-sky-500/10",
        "Terrifying": "border-cyan-500/50 text-cyan-300 bg-cyan-500/10",
        "Catastrophic": "border-white/50 text-white bg-white/10",
    };

    const areaPillClasses = {
        'Ring 0': 'border-red-400/50 text-red-300 bg-red-400/10',
        'Ring 1': 'border-red-500/50 text-red-400 bg-red-500/10',
        'Forgotten Ridge': 'border-red-500/50 text-red-400 bg-red-500/10',
        'Ring 2': 'border-red-600/50 text-red-500 bg-red-600/10',
        'Garden Of Eesh%C3%B6L': 'border-red-600/50 text-red-500 bg-red-600/10',
        'Ring 3': 'border-red-700/50 text-red-600 bg-red-700/10',
        'Ring 4': 'border-rose-400/50 text-rose-300 bg-rose-400/10',
        'Silent Abyss': 'border-rose-400/50 text-rose-300 bg-rose-400/10',
        'Ring 5': 'border-rose-500/50 text-rose-400 bg-rose-500/10',
        'Lost River': 'border-rose-500/50 text-rose-400 bg-rose-500/10',
        'Ring 6': 'border-rose-600/50 text-rose-500 bg-rose-600/10',
        'Ashen Towerworks': 'border-rose-600/50 text-rose-500 bg-rose-600/10',
        'Ring 7': 'border-rose-700/50 text-rose-600 bg-rose-700/10',
        'Ring 8': 'border-pink-400/50 text-pink-300 bg-pink-400/10',
        'The Starlit Archives': 'border-pink-400/50 text-pink-300 bg-pink-400/10',
        'Ring 9': 'border-pink-500/50 text-pink-400 bg-pink-500/10',
        'Zone 1': 'border-blue-400/50 text-blue-300 bg-blue-400/10',
        'Zone 2': 'border-blue-500/50 text-blue-400 bg-blue-500/10',
        'Arcane Area': 'border-blue-500/50 text-blue-400 bg-blue-500/10',
        'Zone 3': 'border-blue-600/50 text-blue-500 bg-blue-600/10',
        'Paradise Atoll': 'border-blue-600/50 text-blue-500 bg-blue-600/10',
        'Zone 4': 'border-sky-400/50 text-sky-300 bg-sky-400/10',
        'Zone 5': 'border-sky-500/50 text-sky-400 bg-sky-500/10',
        'Zone 6': 'border-sky-600/50 text-sky-500 bg-sky-600/10',
        'Zone 7': 'border-cyan-400/50 text-cyan-300 bg-cyan-400/10',
        'Zone 8': 'border-cyan-500/50 text-cyan-400 bg-cyan-500/10',
        'Zone 9': 'border-cyan-600/50 text-cyan-500 bg-cyan-600/10',
        'Zone 10': 'border-teal-400/50 text-teal-300 bg-teal-400/10',
        'Default': 'border-gray-500/50 text-gray-300 bg-gray-500/10',
    };

    const rankColors = {
        "gold": "255, 215, 0",
        "silver": "192, 192, 192",
        "bronze": "205, 127, 50",
        "top10": "190, 0, 255"
    };

    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const statsContainer = document.getElementById('statsContainer');
    const forceRefreshCheckbox = document.getElementById('forceRefreshCheckbox');
    const totalTowersStat = document.getElementById('totalTowersStat');
    const hardestTowerStat = document.getElementById('hardestTowerStat');
    const hardestDifficultyStat = document.getElementById('hardestDifficultyStat');
    const notificationContainer = document.getElementById('notification-container');

    const navLinksContainer = document.getElementById('nav-links');
    const gamesNavLinksContainer = document.getElementById('games-nav-links');
    const miscNavLinksContainer = document.getElementById('misc-nav-links');
    const mainContentTitle = document.getElementById('main-content-title');

    const chartView = document.getElementById('chart-view');
    const tableView = document.getElementById('table-view');
    const listView = document.getElementById('list-view');
    const leaderboardView = document.getElementById('leaderboard-view');
    const gamesView = document.getElementById('games-view');
    const libraryView = document.getElementById('library-view');

    const areaHistoryContainer = document.getElementById('area-history-container');
    const fullHistoryContainer = document.getElementById('full-history-container');
    const leaderboardContainer = document.getElementById('leaderboard-container');
    const libraryContainer = document.getElementById('library-container');

    const gameGuessInput = document.getElementById('game-guess-input');
    const gameAutocompleteList = document.getElementById('game-autocomplete-list');
    const gameGrid = document.getElementById('game-grid');
    const gameMessage = document.getElementById('game-message');
    const newGameBtn = document.getElementById('new-game-btn');
    const gameStatsSidebar = document.getElementById('game-stats-sidebar');
    const statGamesPlayed = document.getElementById('stat-games-played');
    const statWinRate = document.getElementById('stat-win-rate');
    const statBestGame = document.getElementById('stat-best-game');
    const statAvgGuesses = document.getElementById('stat-avg-guesses');

    const modalBackdrop = document.getElementById('tower-modal-backdrop');
    const modalPanel = document.getElementById('tower-modal-panel');
    const modalCloseButton = document.getElementById('modal-close-button');
    const modalTowerName = document.getElementById('modal-tower-name');
    const modalDifficulty = document.getElementById('modal-difficulty');
    const modalLength = document.getElementById('modal-length');
    const modalFloors = document.getElementById('modal-floors');
    const modalCreator = document.getElementById('modal-creator');
    const modalWarnings = document.getElementById('modal-warnings');
    const modalArea = document.getElementById('modal-area');
    const modalDate = document.getElementById('modal-date');

    const libSearch = document.getElementById('lib-search');
    const libSortBtn = document.getElementById('lib-sort-btn');
    const libSortText = document.getElementById('lib-sort-text');
    const libSortIcon = document.getElementById('lib-sort-icon');

    const btnModeRange = document.getElementById('btn-mode-range');
    const btnModeSelect = document.getElementById('btn-mode-select');
    const diffUiRange = document.getElementById('diff-ui-range');
    const diffUiSelect = document.getElementById('diff-ui-select');

    const diffMinInput = document.getElementById('diff-min-input');
    const diffMaxInput = document.getElementById('diff-max-input');
    const floorMinInput = document.getElementById('floor-min-input');
    const floorMaxInput = document.getElementById('floor-max-input');

    const diffDropdownBtn = document.getElementById('diff-dropdown-btn');
    const diffDropdownMenu = document.getElementById('diff-dropdown-menu');
    const diffListContainer = document.getElementById('diff-list-container');

    const areaDropdownBtn = document.getElementById('area-dropdown-btn');
    const areaDropdownMenu = document.getElementById('area-dropdown-menu');
    const areaListContainer = document.getElementById('area-list-container');

    const statusDropdownBtn = document.getElementById('status-dropdown-btn');
    const statusDropdownMenu = document.getElementById('status-dropdown-menu');

    const lengthDropdownBtn = document.getElementById('length-dropdown-btn');
    const lengthDropdownMenu = document.getElementById('length-dropdown-menu');
    const lengthListContainer = document.getElementById('length-list-container');

    const creatorDropdownBtn = document.getElementById('creator-dropdown-btn');
    const creatorDropdownMenu = document.getElementById('creator-dropdown-menu');
    const creatorListContainer = document.getElementById('creator-list-container');
    const creatorSearchInput = document.getElementById('creator-search-input');

    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileFilterToggle = document.getElementById('mobile-filter-toggle');
    const mobileBackdrop = document.getElementById('mobile-backdrop');
    const leftSidebar = document.getElementById('left-sidebar');
    const mobileCloseFilters = document.getElementById('mobile-close-filters');
    const libraryFiltersSidebar = document.getElementById('library-filters-sidebar');

    const titleCase = (str) => str ? str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : '';
    const showNotification = (message, type = 'success') => {
        if (notificationContainer.children.length >= 8) notificationContainer.firstChild.remove();
        const notification = document.createElement('div');
        notification.className = `notification glass-panel ${type}`;
        notification.innerHTML = `<span class="material-symbols-outlined">${type === 'success' ? 'check_circle' : 'error'}</span><p class="text-sm font-medium">${message}</p>`;
        notificationContainer.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 50);
        setTimeout(() => {
            notification.classList.remove('show');
            notification.addEventListener('transitionend', () => notification.remove());
        }, 5000);
    };
    const hexToRgb = (hex) => {
        const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return r ? [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)] : null;
    };
    const rgbToHex = (r, g, b) => '#' + [r, g, b].map(x => {
        const h = Math.round(x).toString(16);
        return h.length === 1 ? '0' + h : h;
    }).join('');
    const interpolateColor = (c1, c2, f) => {
        const r1 = hexToRgb(c1),
            r2 = hexToRgb(c2),
            r = r1.slice();
        for (let i = 0; i < 3; i++) r[i] = r1[i] + f * (r2[i] - r1[i]);
        return rgbToHex(r[0], r[1], r[2]);
    };

    const switchView = (viewName) => {
        currentView = viewName;
        const activeClasses = ['bg-[#BE00FF]/20', 'border', 'border-[#BE00FF]/50', 'text-[#BE00FF]'];
        const inactiveClasses = ['text-gray-300', 'transition-colors', 'hover:bg-white/5', 'hover:text-white'];
        const views = {
            chart: {
                title: 'Completion Chart',
                element: chartView
            },
            list: {
                title: 'Completion History',
                element: listView
            },
            table: {
                title: 'Area Completion',
                element: tableView
            },
            library: {
                title: 'Tower Library',
                element: libraryView
            },
            leaderboard: {
                title: 'Leaderboard',
                element: leaderboardView
            },
            games: {
                title: '',
                element: gamesView
            }
        };

        if (viewName === 'games') {
            mainContentTitle.classList.add('hidden');
        } else {
            mainContentTitle.textContent = views[viewName].title;
            mainContentTitle.classList.remove('hidden');
        }

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
        if (viewName === 'leaderboard' && !leaderboardData) fetchAndRenderLeaderboard();
        if (viewName === 'games' && !targetTower) initGame();
        if (viewName === 'library') {
            if (areaListContainer.children.length === 0) initLibraryComponents();
            renderLibrary();
        }
        if (viewName === 'games' || viewName === 'library') mobileFilterToggle.classList.remove('hidden');
        else mobileFilterToggle.classList.add('hidden');

        [...navLinksContainer.querySelectorAll('a'), ...gamesNavLinksContainer.querySelectorAll('a'), ...miscNavLinksContainer.querySelectorAll('a')].forEach(link => {
            if (link.dataset.view === viewName) {
                link.classList.remove(...inactiveClasses);
                link.classList.add(...activeClasses);
            } else {
                link.classList.remove(...activeClasses);
                link.classList.add(...inactiveClasses);
            }
        });
    };

    const toggleSidebar = (sidebar, show) => {
        if (show) {
            sidebar.classList.remove('-translate-x-full', 'translate-x-full');
            sidebar.classList.add('translate-x-0');
            mobileBackdrop.classList.remove('hidden');
        } else {
            if (sidebar === leftSidebar) sidebar.classList.add('-translate-x-full');
            else sidebar.classList.add('translate-x-full');
            sidebar.classList.remove('translate-x-0');
            mobileBackdrop.classList.add('hidden');
        }
    };

    mobileMenuToggle.addEventListener('click', () => toggleSidebar(leftSidebar, !leftSidebar.classList.contains('translate-x-0')));
    mobileFilterToggle.addEventListener('click', () => {
        const activeRightSidebar = !gameStatsSidebar.classList.contains('hidden') ? gameStatsSidebar : libraryFiltersSidebar;
        if (!activeRightSidebar.classList.contains('hidden')) toggleSidebar(activeRightSidebar, !activeRightSidebar.classList.contains('translate-x-0'));
    });
    if (mobileCloseFilters) mobileCloseFilters.addEventListener('click', () => toggleSidebar(libraryFiltersSidebar, false));
    mobileBackdrop.addEventListener('click', () => {
        toggleSidebar(leftSidebar, false);
        toggleSidebar(gameStatsSidebar, false);
        toggleSidebar(libraryFiltersSidebar, false);
    });

    const initLibraryComponents = () => {
        const areaMenu = document.getElementById('area-dropdown-menu');
        const diffMenu = document.getElementById('diff-dropdown-menu');
        const lengthMenu = document.getElementById('length-dropdown-menu');
        const creatorMenu = document.getElementById('creator-dropdown-menu');
        const menus = [areaMenu, diffMenu, lengthMenu, creatorMenu];

        const toggleDropdown = (targetMenu) => {
            const isHidden = targetMenu.classList.contains('hidden');
            menus.forEach(m => m.classList.add('hidden'));
            if (isHidden) targetMenu.classList.remove('hidden');
        };

        const statusBtns = document.querySelectorAll('.status-filter-btn');
        statusBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                libStatusValue = btn.dataset.value;
                statusBtns.forEach(b => {
                    b.classList.remove('bg-[#BE00FF]', 'text-white');
                    b.classList.add('text-gray-400', 'hover:text-white');
                });
                btn.classList.remove('text-gray-400', 'hover:text-white');
                btn.classList.add('bg-[#BE00FF]', 'text-white');
                renderLibrary();
            });
        });

        const typeBtns = document.querySelectorAll('.type-filter-btn');
        typeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const val = btn.dataset.value;
                if (libSelectedTypes.has(val)) {
                    libSelectedTypes.delete(val);
                    btn.classList.remove('bg-[#BE00FF]', 'text-white');
                    btn.classList.add('text-gray-400', 'hover:text-white');
                } else {
                    libSelectedTypes.add(val);
                    btn.classList.remove('text-gray-400', 'hover:text-white');
                    btn.classList.add('bg-[#BE00FF]', 'text-white');
                }
                renderLibrary();
            });
        });

        const areas = Array.from(new Set(allTowersData.map(t => t.area).filter(Boolean)));
        libSelectedAreas = new Set(areas);
        const hierarchyMap = {
            "Ring 1": ["Forgotten Ridge"],
            "Ring 2": ["Garden Of Eesh%C3%B6L"],
            "Ring 4": ["Silent Abyss"],
            "Ring 5": ["Lost River"],
            "Ring 6": ["Ashen Towerworks"],
            "Ring 8": ["The Starlit Archives"],
            "Zone 2": ["Arcane Area"],
            "Zone 3": ["Paradise Atoll"]
        };

        let sortedAreaList = [];
        for (let i = 0; i <= 9; i++) {
            const ring = `Ring ${i}`;
            if (areas.includes(ring)) sortedAreaList.push({
                name: ring,
                isSub: false
            });
            if (hierarchyMap[ring]) hierarchyMap[ring].forEach(sub => {
                if (areas.includes(sub)) sortedAreaList.push({
                    name: sub,
                    isSub: true
                });
            });
        }
        for (let i = 1; i <= 10; i++) {
            const zone = `Zone ${i}`;
            if (areas.includes(zone)) sortedAreaList.push({
                name: zone,
                isSub: false
            });
            if (hierarchyMap[zone]) hierarchyMap[zone].forEach(sub => {
                if (areas.includes(sub)) sortedAreaList.push({
                    name: sub,
                    isSub: true
                });
            });
        }
        const caughtSet = new Set(sortedAreaList.map(x => x.name));
        areas.forEach(a => {
            if (!caughtSet.has(a)) sortedAreaList.push({
                name: a,
                isSub: false
            });
        });

        const renderAreaList = () => {
            areaListContainer.innerHTML = '';
            sortedAreaList.forEach(item => {
                const hex = areaColors[item.name] || '#808080';
                const rgb = hexToRgb(hex) || [128, 128, 128];
                const bgStyle = `background: linear-gradient(90deg, rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.04) 0%, rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.01) 100%); border-left: 3px solid ${hex};`;

                const label = document.createElement('label');
                const containerClass = item.isSub ? 'subrealm-item dropdown-check-item' : 'dropdown-check-item';
                label.className = `${containerClass} text-xs text-gray-300`;
                label.style = bgStyle;
                label.style.color = hex;
                const isChecked = libSelectedAreas.has(item.name) ? 'checked' : '';
                label.innerHTML = `<input type="checkbox" value="${item.name}" ${isChecked}><span class="text-gray-200 font-medium">${areaDisplayNames[item.name]||item.name}</span>`;
                label.querySelector('input').addEventListener('change', (e) => {
                    if (e.target.checked) libSelectedAreas.add(item.name);
                    else libSelectedAreas.delete(item.name);
                    updateAreaButtonText(areas.length);
                    renderLibrary();
                });
                areaListContainer.appendChild(label);
            });
        };
        renderAreaList();

        const difficulties = Object.keys(difficultyColors);
        libSelectedDiffs = new Set(difficulties);
        diffListContainer.innerHTML = '';
        difficulties.forEach(diff => {
            const hex = difficultyColors[diff];
            const rgb = hexToRgb(hex);
            const bgStyle = `background: linear-gradient(90deg, rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.04) 0%, rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.01) 100%); border-left: 3px solid ${hex};`;
            const label = document.createElement('label');
            label.className = 'dropdown-check-item text-xs text-gray-200';
            label.style = bgStyle;
            label.style.color = hex;
            label.innerHTML = `<input type="checkbox" value="${diff}" checked><span class="text-gray-200 font-medium">${diff}</span>`;
            label.querySelector('input').addEventListener('change', (e) => {
                if (e.target.checked) libSelectedDiffs.add(diff);
                else libSelectedDiffs.delete(diff);
                updateDiffButtonText(difficulties.length);
                renderLibrary();
            });
            diffListContainer.appendChild(label);
        });

        const lengths = ['<20 minutes', '20+ minutes', '30+ minutes', '45+ minutes', '60+ minutes', '90+ minutes'];
        libSelectedLengths = new Set(lengths);
        lengthListContainer.innerHTML = '';
        lengths.forEach(len => {
            const label = document.createElement('label');
            label.className = 'dropdown-check-item text-xs text-gray-200';
            label.style.color = '#FFA500';
            label.innerHTML = `<input type="checkbox" value="${len}" checked><span class="text-gray-200 font-medium">${len}</span>`;
            label.querySelector('input').addEventListener('change', (e) => {
                if (e.target.checked) libSelectedLengths.add(len);
                else libSelectedLengths.delete(len);
                updateLengthButtonText(lengths.length);
                renderLibrary();
            });
            lengthListContainer.appendChild(label);
        });

        const creators = Array.from(new Set(allTowersData.flatMap(t => Array.isArray(t.creators) ? t.creators.flatMap(c => c.split(',')) : []).map(c => c.trim()).filter(Boolean))).sort();
        libSelectedCreators = new Set(creators);
        const renderCreatorList = (filter = "") => {
            creatorListContainer.innerHTML = '';
            const filtered = creators.filter(c => c.toLowerCase().includes(filter.toLowerCase()));
            filtered.forEach(c => {
                const label = document.createElement('label');
                label.className = 'dropdown-check-item text-xs text-gray-200';
                label.style.color = '#EAEAEA';
                const isChecked = libSelectedCreators.has(c) ? 'checked' : '';
                label.innerHTML = `<input type="checkbox" value="${c}" ${isChecked}><span class="text-gray-200 font-medium truncate">${c}</span>`;
                label.querySelector('input').addEventListener('change', (e) => {
                    if (e.target.checked) libSelectedCreators.add(c);
                    else libSelectedCreators.delete(c);
                    updateCreatorButtonText(creators.length);
                    renderLibrary();
                });
                creatorListContainer.appendChild(label);
            });
        };
        renderCreatorList();
        creatorSearchInput.addEventListener('input', (e) => renderCreatorList(e.target.value));

        document.getElementById('btn-select-all-creators').addEventListener('click', (e) => {
            e.stopPropagation();
            libSelectedCreators = new Set(creators);
            renderCreatorList(creatorSearchInput.value);
            updateCreatorButtonText(creators.length);
            renderLibrary();
        });
        document.getElementById('btn-deselect-all-creators').addEventListener('click', (e) => {
            e.stopPropagation();
            libSelectedCreators.clear();
            renderCreatorList(creatorSearchInput.value);
            updateCreatorButtonText(creators.length);
            renderLibrary();
        });

        libSortBtn.addEventListener('click', () => {
            if (libSortOrder === 'desc') {
                libSortOrder = 'asc';
                libSortText.textContent = 'Easiest First (Ascending)';
                libSortIcon.textContent = 'arrow_upward';
            } else {
                libSortOrder = 'desc';
                libSortText.textContent = 'Hardest First (Descending)';
                libSortIcon.textContent = 'arrow_downward';
            }
            renderLibrary();
        });

        areaDropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDropdown(areaMenu);
        });
        diffDropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDropdown(diffMenu);
        });
        lengthDropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDropdown(lengthMenu);
        });
        creatorDropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDropdown(creatorMenu);
        });
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.relative')) menus.forEach(m => m.classList.add('hidden'));
        });
    };

    const updateAreaButtonText = (total) => {
        const btn = areaDropdownBtn.querySelector('span');
        if (libSelectedAreas.size === 0) btn.textContent = "None Selected";
        else if (libSelectedAreas.size === total) btn.textContent = "All Areas";
        else btn.textContent = `${libSelectedAreas.size} Areas Selected`;
    };
    const updateDiffButtonText = (total) => {
        const btn = diffDropdownBtn.querySelector('span');
        if (libSelectedDiffs.size === 0) btn.textContent = "None Selected";
        else if (libSelectedDiffs.size === total) btn.textContent = "All Difficulties";
        else btn.textContent = `${libSelectedDiffs.size} Difficulties Selected`;
    };
    const updateLengthButtonText = (total) => {
        const btn = lengthDropdownBtn.querySelector('span');
        if (libSelectedLengths.size === 0) btn.textContent = "None Selected";
        else if (libSelectedLengths.size === total) btn.textContent = "All Lengths";
        else btn.textContent = `${libSelectedLengths.size} Lengths Selected`;
    };
    const updateCreatorButtonText = (total) => {
        const btn = creatorDropdownBtn.querySelector('span');
        if (libSelectedCreators.size === 0) btn.textContent = "None Selected";
        else if (libSelectedCreators.size === total) btn.textContent = "All Creators";
        else btn.textContent = `${libSelectedCreators.size} Creators Selected`;
    };

    const renderLibrary = () => {
        libraryContainer.innerHTML = '';
        if (!allTowersData || allTowersData.length === 0) {
            libraryContainer.innerHTML = '<div class="p-8 text-center text-gray-500 text-sm">No tower data loaded. Please search a user first.</div>';
            return;
        }

        const searchVal = libSearch.value.toLowerCase();
        const beatenSet = new Set(beatenTowersData.map(t => t.name));
        const beatenMap = new Map(beatenTowersData.map(t => [t.name, t]));

        const filteredTowers = allTowersData.filter(t => {
            if (NON_CANON_TOWERS.has(t.name)) return false;
            if (searchVal && !t.name.toLowerCase().includes(searchVal)) return false;
            if (libFilterMode === 'range') {
                const num = t.number_difficulty || 0;
                if (num < libMinDiff || num > libMaxDiff) return false;
            } else {
                if (!libSelectedDiffs.has(t.difficulty)) return false;
            }
            if (!libSelectedAreas.has(t.area)) return false;
            if (libSelectedTypes.size > 0 && !libSelectedTypes.has(getTowerType(t.name))) return false;

            const rawLen = t.length || '<20 minutes';
            const cleanLen = rawLen.replace(' long', '').trim();
            if (!libSelectedLengths.has(cleanLen)) return false;

            const floors = t.floors ?? 10;
            if (libMinFloors !== null && floors < libMinFloors) return false;
            if (libMaxFloors !== null && floors > libMaxFloors) return false;

            const creators = Array.isArray(t.creators) ? t.creators.flatMap(c => c.split(',').map(x => x.trim())) : [];
            const hasSelectedCreator = creators.length === 0 ? libSelectedCreators.has("Unknown") : creators.some(c => libSelectedCreators.has(c));
            if (!hasSelectedCreator) return false;

            const isCompleted = beatenSet.has(t.name);
            if (libStatusValue === 'Completed' && !isCompleted) return false;
            if (libStatusValue === 'Incomplete' && isCompleted) return false;
            return true;
        });

        if (filteredTowers.length === 0) {
            libraryContainer.innerHTML = '<div class="p-8 text-center text-gray-500 text-sm">No towers match your filters.</div>';
            return;
        }

        filteredTowers.sort((a, b) => {
            const diffA = a.number_difficulty || 0;
            const diffB = b.number_difficulty || 0;
            return libSortOrder === 'desc' ? diffB - diffA : diffA - diffB;
        });

        let rowsHtml = '';
        filteredTowers.forEach((tower, index) => {
            const beatenVersion = beatenMap.get(tower.name);
            const isCompleted = !!beatenVersion;
            const completionRgb = isCompleted ? '67, 255, 129' : '255, 50, 50';
            const diffRgb = (hexToRgb(difficultyColors[tower.difficulty] || '#808080') || [128, 128, 128]).join(', ');
            const dateStr = isCompleted ? new Date(beatenVersion.awarded_unix * 1000).toLocaleDateString() : '--';
            const areaClass = areaPillClasses[tower.area] || areaPillClasses.Default;
            const diffClass = difficultyPillClasses[tower.difficulty] || difficultyPillClasses.nil;
            const diffContent = `${tower.modifier||''} ${tower.difficulty||''} [${(tower.number_difficulty||0).toFixed(2)}]`.trim();

            rowsHtml += `<tr class="tower-row ${isCompleted?'status-outline-completed':'status-outline-incomplete'}" style="--difficulty-rgb: ${completionRgb}; --area-rgb: ${diffRgb}; padding-left: 12px;" data-tower-name="${tower.name}"><td class="py-1 px-1 text-xs text-gray-600 font-mono w-6 text-center flex-shrink-0">${index + 1}</td><td class="py-1 px-3 text-left ${isCompleted?'text-gray-200':'text-gray-500'} flex-1 truncate">${tower.name}</td><td class="py-1 px-3 text-right flex-shrink-0"><div class="flex justify-end items-center gap-2 flex-wrap"><span class="inline-block py-0.5 px-2.5 rounded-full text-xs font-medium border border-gray-500/50 ${isCompleted?'text-gray-300 bg-gray-500/10':'text-gray-600 bg-gray-500/10'}">${dateStr}</span><span class="inline-block py-0.5 px-2.5 rounded-full text-xs font-medium border ${diffClass}">${diffContent}</span><span class="inline-block py-0.5 px-2.5 rounded-full text-xs font-medium border ${areaClass}">${areaDisplayNames[tower.area]||tower.area}</span></div></td></tr>`;
        });
        libraryContainer.innerHTML = `<table class="w-full text-sm"><tbody>${rowsHtml}</tbody></table>`;
    };

    libraryContainer.addEventListener('click', (e) => {
        const r = e.target.closest('.tower-row');
        if (r && r.dataset.towerName) openModalWithTower(r.dataset.towerName);
    });
    libSearch.addEventListener('input', renderLibrary);
    diffMinInput.addEventListener('input', (e) => {
        libMinDiff = parseFloat(e.target.value) || 0;
        renderLibrary();
    });
    diffMaxInput.addEventListener('input', (e) => {
        libMaxDiff = parseFloat(e.target.value) || 12;
        renderLibrary();
    });
    floorMinInput.addEventListener('input', (e) => {
        libMinFloors = e.target.value ? parseInt(e.target.value) : null;
        renderLibrary();
    });
    floorMaxInput.addEventListener('input', (e) => {
        libMaxFloors = e.target.value ? parseInt(e.target.value) : null;
        renderLibrary();
    });

    btnModeRange.addEventListener('click', () => {
        libFilterMode = 'range';
        btnModeRange.classList.replace('text-gray-400', 'text-white');
        btnModeRange.classList.add('bg-[#BE00FF]');
        btnModeRange.classList.remove('hover:text-white');
        btnModeSelect.classList.replace('text-white', 'text-gray-400');
        btnModeSelect.classList.remove('bg-[#BE00FF]');
        btnModeSelect.classList.add('hover:text-white');
        diffUiRange.classList.remove('hidden');
        diffUiSelect.classList.add('hidden');
        renderLibrary();
    });
    btnModeSelect.addEventListener('click', () => {
        libFilterMode = 'select';
        btnModeSelect.classList.replace('text-gray-400', 'text-white');
        btnModeSelect.classList.add('bg-[#BE00FF]');
        btnModeSelect.classList.remove('hover:text-white');
        btnModeRange.classList.replace('text-white', 'text-gray-400');
        btnModeRange.classList.remove('bg-[#BE00FF]');
        btnModeRange.classList.add('hover:text-white');
        diffUiRange.classList.add('hidden');
        diffUiSelect.classList.remove('hidden');
        renderLibrary();
    });

    const getTowerType = (name) => name.includes("Citadel") ? "Citadel" : name.includes("Steeple") ? "Steeple" : "Tower";
    const getAreaInfo = (areaName) => {
        const subrealms = {
            "Forgotten Ridge": {
                r: 0,
                i: 1,
                isSub: true
            },
            "Garden Of Eesh%C3%B6L": {
                r: 0,
                i: 2,
                isSub: true
            },
            "Silent Abyss": {
                r: 0,
                i: 4,
                isSub: true
            },
            "Lost River": {
                r: 0,
                i: 5,
                isSub: true
            },
            "Ashen Towerworks": {
                r: 0,
                i: 6,
                isSub: true
            },
            "The Starlit Archives": {
                r: 0,
                i: 8,
                isSub: true
            },
            "Arcane Area": {
                r: 1,
                i: 2,
                isSub: true
            },
            "Paradise Atoll": {
                r: 1,
                i: 3,
                isSub: true
            },
        };
        if (subrealms[areaName]) return subrealms[areaName];
        if (areaName.startsWith("Ring")) return {
            r: 0,
            i: parseInt(areaName.split(' ')[1]),
            isSub: false
        };
        if (areaName.startsWith("Zone")) return {
            r: 1,
            i: parseInt(areaName.split(' ')[1]),
            isSub: false
        };
        return {
            r: -1,
            i: -1,
            isSub: false
        };
    };
    const getLengthValue = (str) => {
        const m = {
            '<20 minutes': 1,
            '20+ minutes': 2,
            '30+ minutes': 3,
            '45+ minutes': 4,
            '60+ minutes': 5,
            '90+ minutes': 6
        };
        return m[str.replace(' long', '')] || 0;
    };

    const ensureGameData = async () => {
        if (allTowersData.length > 0) return true;
        gameGuessInput.placeholder = "Loading tower data...";
        gameGuessInput.disabled = true;
        try {
            const response = await fetch(`${API_BASE_URL}/api/get_master_towers`);
            const result = await response.json();
            if (result.success) {
                allTowersData = result.towers;
                gameGuessInput.placeholder = "Start typing a tower name...";
                gameGuessInput.disabled = false;
                return true;
            }
        } catch (e) {
            console.error(e);
            showNotification("Failed to load game data.", "error");
        }
        return false;
    };

    const initGame = async () => {
        const hasData = await ensureGameData();
        if (!hasData) return;
        const canonTowers = allTowersData.filter(t => !NON_CANON_TOWERS.has(t.name));
        targetTower = canonTowers[Math.floor(Math.random() * canonTowers.length)];
        guesses = [];
        isGameActive = true;
        gameGuessInput.value = '';
        gameGuessInput.disabled = false;
        gameMessage.classList.add('hidden');
        renderGameGrid();
    };

    const renderGameGrid = () => {
        gameGrid.innerHTML = '';
        guesses.forEach(guess => {
            const row = document.createElement('div');
            row.className = 'game-row';

            const nameHtml = `<div class="${guess.name === targetTower.name ? 'status-correct font-bold' : 'text-white'}">${guess.name}</div>`;

            let diffClass = 'status-wrong',
                diffIcon = '';
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
            let lenClass = 'status-wrong',
                lenIcon = '';
            if (guessLenVal === targetLenVal) {
                lenClass = 'status-correct';
                lenIcon = 'check';
            } else lenIcon = guessLenVal < targetLenVal ? 'arrow_upward' : 'arrow_downward';
            const lenHtml = `<span class="inline-flex items-center gap-1 ${lenClass}">${safeGuessLen.replace(' long', '')} <span class="material-symbols-outlined feedback-icon">${lenIcon}</span></span>`;

            const typeClass = getTowerType(guess.name) === getTowerType(targetTower.name) ? 'status-correct' : 'status-wrong';
            const typeHtml = `<span class="${typeClass}">${getTowerType(guess.name)}</span>`;

            const guessArea = getAreaInfo(guess.area);
            const targetArea = getAreaInfo(targetTower.area);
            let areaClass = 'status-wrong',
                areaIcon = '';
            if (guessArea.r !== targetArea.r) areaClass = 'status-wrong';
            else {
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
            const areaHtml = `<span class="inline-flex items-center gap-1 ${areaClass}">${areaDisplayNames[guess.area]||guess.area} <span class="material-symbols-outlined feedback-icon">${areaIcon}</span></span>`;

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
    };

    const handleGuess = (towerName) => {
        if (!isGameActive) return;
        const tower = allTowersData.find(t => t.name === towerName);
        if (!tower) return;
        if (guesses.some(g => g.name === tower.name)) {
            showNotification("You already guessed that tower!", "error");
            return;
        }
        guesses.push(tower);
        renderGameGrid();
        if (tower.name === targetTower.name) endGame(true);
        else if (guesses.length >= maxGuesses) endGame(false);
    };

    const endGame = (won) => {
        isGameActive = false;
        gameGuessInput.disabled = true;
        gameGuessInput.value = '';
        sessionStats.played++;
        if (won) {
            sessionStats.wins++;
            sessionStats.totalGuesses += guesses.length;
            if (sessionStats.bestGame === null || guesses.length < sessionStats.bestGame) sessionStats.bestGame = guesses.length;
        }
        updateStatsUI();
        gameMessage.classList.remove('hidden');
        const h4 = gameMessage.querySelector('h4');
        const p = gameMessage.querySelector('p');
        if (won) {
            h4.textContent = "Victory!";
            h4.className = "text-xl font-bold mb-2 text-green-400";
            p.textContent = `You found ${targetTower.name} in ${guesses.length} guesses.`;
        } else {
            h4.textContent = "Game Over";
            h4.className = "text-xl font-bold mb-2 text-red-400";
            p.textContent = `The tower was: ${targetTower.name}`;
        }
    };

    const updateStatsUI = () => {
        statGamesPlayed.textContent = sessionStats.played;
        const winRate = sessionStats.played === 0 ? 0 : Math.round((sessionStats.wins / sessionStats.played) * 100);
        statWinRate.textContent = `${winRate}%`;
        statBestGame.textContent = sessionStats.bestGame === null ? '-' : sessionStats.bestGame;
        statAvgGuesses.textContent = sessionStats.wins === 0 ? '-' : (sessionStats.totalGuesses / sessionStats.wins).toFixed(1);
    };

    gameGuessInput.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        gameAutocompleteList.innerHTML = '';
        if (val.length < 2) {
            gameAutocompleteList.classList.add('hidden');
            return;
        }
        const matches = allTowersData.filter(t => t.name.toLowerCase().includes(val) && !NON_CANON_TOWERS.has(t.name)).slice(0, 10);
        if (matches.length > 0) {
            gameAutocompleteList.classList.remove('hidden');
            matches.forEach(t => {
                const div = document.createElement('div');
                div.className = 'autocomplete-item text-sm text-gray-300';
                div.textContent = t.name;
                div.addEventListener('click', () => {
                    handleGuess(t.name);
                    gameGuessInput.value = '';
                    gameAutocompleteList.classList.add('hidden');
                });
                gameAutocompleteList.appendChild(div);
            });
        } else {
            gameAutocompleteList.classList.add('hidden');
        }
    });

    document.addEventListener('click', (e) => {
        if (!gameGuessInput.contains(e.target) && !gameAutocompleteList.contains(e.target)) gameAutocompleteList.classList.add('hidden');
    });
    newGameBtn.addEventListener('click', initGame);

    const fetchAndRenderLeaderboard = async () => {
        leaderboardContainer.innerHTML = `<div class="flex items-center justify-center p-8 text-gray-400">Loading leaderboard...</div>`;
        try {
            const response = await fetch(`${API_BASE_URL}/api/get_leaderboard`);
            const result = await response.json();
            if (!result.success) throw new Error(result.error);
            leaderboardData = result.leaderboard;

            let headerHtml = `<div class="leaderboard-header whitespace-nowrap"><div class="w-16 text-center">#</div><div class="w-64 text-left">Player</div><div class="flex-1 text-left">Hardest Tower</div><div class="w-56 text-left">Difficulty</div><div class="w-24 text-center pr-2">Towers</div></div>`;

            let rowsHtml = '';
            leaderboardData.forEach((player, index) => {
                const rank = index + 1;
                let rankClass = '',
                    rankRgb = '';
                if (rank === 1) {
                    rankClass = 'rank-gold';
                    rankRgb = rankColors.gold;
                } else if (rank === 2) {
                    rankClass = 'rank-silver';
                    rankRgb = rankColors.silver;
                } else if (rank === 3) {
                    rankClass = 'rank-bronze';
                    rankRgb = rankColors.bronze;
                } else if (rank <= 10) {
                    rankClass = 'rank-top10';
                    rankRgb = rankColors.top10;
                }

                const difficultyText = `${player.hardest_tower_modifier || ''} ${player.hardest_tower_difficulty || ''}`.trim();
                const diffPillClass = difficultyPillClasses[player.hardest_tower_difficulty] || difficultyPillClasses.nil;
                const numericDifficulty = (player.number_difficulty || 0).toFixed(2);

                rowsHtml += `<div class="leaderboard-row ${rankClass}" style="--rank-rgb: ${rankRgb};"><div class="w-16 text-center text-lg font-bold text-gray-400">${rank}</div><div class="w-64"><div class="flex items-center gap-3"><img src="${player.avatar_url || 'icon.jpg'}" class="leaderboard-avatar" alt="avatar"><div class="flex flex-col"><span class="font-bold text-white truncate">${player.display_name || player.user_name}</span><span class="text-xs text-gray-400">@${player.user_name || 'null'}</span></div></div></div><div class="flex-1 text-gray-300 text-sm text-left truncate pr-4">${player.hardest_tower_name}</div><div class="w-56 text-left"><span class="inline-block py-0.5 px-2.5 rounded-full text-xs font-medium border ${diffPillClass}">${difficultyText} [${numericDifficulty}]</span></div><div class="w-24 text-center text-lg font-bold text-white pr-2">${player.total_towers}</div></div>`;
            });

            leaderboardContainer.innerHTML = `<div class="min-w-[900px]">${headerHtml + rowsHtml}</div>`;

        } catch (error) {
            leaderboardContainer.innerHTML = `<div class="flex items-center justify-center p-8 text-red-400">Failed to load leaderboard.</div>`;
            showNotification(error.message, 'error');
        }
    };

    const handleSearch = async () => {
        const username = searchInput.value.trim();
        const forceRefresh = forceRefreshCheckbox.checked;
        if (!username) {
            showNotification('Please enter a Roblox Username.', 'error');
            return;
        }
        const searchIcon = document.getElementById('searchIcon');
        const searchLoadingIndicator = document.getElementById('searchLoadingIndicator');
        searchIcon.classList.add('hidden');
        searchLoadingIndicator.classList.remove('hidden');
        statsContainer.style.display = 'none';
        try {
            const cacheKey = `etoh_profile_${username.toLowerCase()}`;
            let apiUrl = `${API_BASE_URL}/api/get_player_data?username=${username}`;
            if (forceRefresh) apiUrl += '&force_refresh=true';
            const response = await fetch(apiUrl);
            if (response.status === 429) throw new Error('Rate limit exceeded. Please wait a moment.');
            const result = await response.json();
            if (result.success) {
                sessionStorage.setItem(cacheKey, JSON.stringify(result));
                renderProfile(result);
                showNotification(`Successfully loaded stats for ${username}.`, 'success');
                if (currentView === 'games') initGame();
            } else throw new Error(result.error);
        } catch (error) {
            showNotification(error.message, 'error');
        } finally {
            searchIcon.classList.remove('hidden');
            searchLoadingIndicator.classList.add('hidden');
        }
    };

    const calculateAndRenderStats = (beatenTowers, allTowers) => {
        const canonCompletions = beatenTowers.filter(tower => !NON_CANON_TOWERS.has(tower.name));
        const totalCanonTowers = allTowers.filter(tower => !NON_CANON_TOWERS.has(tower.name));
        const totalBeaten = canonCompletions.length;
        const totalInGame = totalCanonTowers.length;
        let hardestTowerName = "N/A",
            hardestDifficultyStr = "N/A";
        if (beatenTowers.length > 0) {
            const sortedByDifficulty = [...beatenTowers].sort((a, b) => b.number_difficulty - a.number_difficulty);
            const hardestTower = sortedByDifficulty[0];
            hardestTowerName = hardestTower.name || 'Unknown';
            hardestDifficultyStr = `${hardestTower.modifier || ''} ${hardestTower.difficulty || ''} [${(hardestTower.number_difficulty || 0).toFixed(2)}]`.trim();
        }
        totalTowersStat.textContent = `${totalBeaten}/${totalInGame}`;
        hardestTowerStat.textContent = hardestTowerName;
        hardestDifficultyStat.textContent = hardestDifficultyStr;
        statsContainer.style.display = 'grid';
    };

    const renderFullHistoryList = (beatenTowers) => {
        fullHistoryContainer.innerHTML = '';
        if (!beatenTowers || beatenTowers.length === 0) return;
        const completionDates = beatenTowers.map(t => t.awarded_unix).filter(Boolean);
        const minDate = Math.min(...completionDates),
            maxDate = Math.max(...completionDates),
            dateRange = maxDate - minDate;
        const sortedTowers = [...beatenTowers].sort((a, b) => b.awarded_unix - a.awarded_unix);
        let towerRowsHtml = '';
        sortedTowers.forEach(tower => {
            const factor = dateRange > 0 ? (tower.awarded_unix - minDate) / dateRange : 1;
            const dateColor = interpolateColor('#FFFFFF', '#FFD700', factor);
            const areaKey = tower.area || 'Unknown';
            const diffRgb = (hexToRgb(difficultyColors[tower.difficulty] || '#808080') || [128, 128, 128]).join(', ');
            const areaRgb = (hexToRgb(areaColors[areaKey] || '#808080') || [128, 128, 128]).join(', ');
            towerRowsHtml += `<tr class="tower-row status-outline-completed" style="--difficulty-rgb: ${diffRgb}; --area-rgb: ${areaRgb};"><td class="py-0.8 px-3"><div class="flex items-center gap-2"><span class="text-gray-200">${tower.name}</span><span class="inline-block py-0.5 px-2.5 rounded-full text-xs font-medium border ${difficultyPillClasses[tower.difficulty] || difficultyPillClasses.nil}">${tower.modifier||''} ${tower.difficulty||''} [${(tower.number_difficulty||0).toFixed(2)}]</span></div></td><td class="py-0.8 px-3 text-right"><div class="flex justify-end items-center gap-2"><span class="inline-block py-0.5 px-2.5 rounded-full text-xs font-medium border" style="color: ${dateColor}; background-color: ${dateColor}20; border-color: ${dateColor}80;">${new Date(tower.awarded_unix*1000).toLocaleDateString()}</span><span class="inline-block py-0.5 px-2.5 rounded-full text-xs font-medium border ${areaPillClasses[areaKey] || areaPillClasses.Default}">${areaDisplayNames[areaKey]||areaKey}</span></div></td></tr>`;
        });
        fullHistoryContainer.innerHTML = `<table class="w-full text-sm"><tbody>${towerRowsHtml}</tbody></table>`;
    };

    const renderProfile = (data) => {
        allTowersData = data.all_towers;
        beatenTowersData = data.beaten_towers;
        const unlockedAreas = new Set(data.unlocked_areas || []);
        calculateAndRenderStats(beatenTowersData, allTowersData);
        renderChart(beatenTowersData);
        renderAreaTable(allTowersData, beatenTowersData, unlockedAreas);
        renderFullHistoryList(beatenTowersData);
        switchView(currentView);
    };

    const renderAreaTable = (allTowers, beatenTowers, unlockedAreas) => {
        areaHistoryContainer.innerHTML = '';
        if (!allTowers || allTowers.length === 0) return;
        const ringAreas = [{
            key: 'Ring 0',
            name: 'Ring 0: Purgatorio'
        }, {
            key: 'Ring 1',
            name: 'Ring 1: Limbo'
        }, {
            key: 'Forgotten Ridge',
            name: 'Forgotten Ridge'
        }, {
            key: 'Ring 2',
            name: 'Ring 2: Desire'
        }, {
            key: 'Garden Of Eesh%C3%B6L',
            name: 'Garden Of Eeshöl'
        }, {
            key: 'Ring 3',
            name: 'Ring 3: Gluttony'
        }, {
            key: 'Ring 4',
            name: 'Ring 4: Greed'
        }, {
            key: 'Silent Abyss',
            name: 'Silent Abyss'
        }, {
            key: 'Ring 5',
            name: 'Ring 5: Wrath'
        }, {
            key: 'Lost River',
            name: 'Lost River'
        }, {
            key: 'Ring 6',
            name: 'Ring 6: Heresy'
        }, {
            key: 'Ashen Towerworks',
            name: 'Ashen Towerworks'
        }, {
            key: 'Ring 7',
            name: 'Ring 7: Violence'
        }, {
            key: 'Ring 8',
            name: 'Ring 8: Fraud'
        }, {
            key: 'The Starlit Archives',
            name: 'The Starlit Archives'
        }, {
            key: 'Ring 9',
            name: 'Ring 9: Treachery'
        }, ];
        const zoneAreas = [{
            key: 'Zone 1',
            name: 'Zone 1: Sea'
        }, {
            key: 'Zone 2',
            name: 'Zone 2: Surface'
        }, {
            key: 'Arcane Area',
            name: 'Arcane Area'
        }, {
            key: 'Zone 3',
            name: 'Zone 3: Sky'
        }, {
            key: 'Paradise Atoll',
            name: 'Paradise Atoll'
        }, {
            key: 'Zone 4',
            name: 'Zone 4: Exosphere'
        }, {
            key: 'Zone 5',
            name: 'Zone 5: The Moon'
        }, {
            key: 'Zone 6',
            name: 'Zone 6: Mars'
        }, {
            key: 'Zone 7',
            name: 'Zone 7: Asteroid Belt'
        }, {
            key: 'Zone 8',
            name: 'Zone 8: Pluto'
        }, {
            key: 'Zone 9',
            name: 'Zone 9: Singularity'
        }, {
            key: 'Zone 10',
            name: 'Zone 10: Interstellar Shore'
        }, ];
        const beatenTowerMap = new Map(beatenTowers.map(tower => [tower.name, tower]));
        const generateColumnHtml = (areaList) => {
            let columnHtml = '';
            for (const area of areaList) {
                const towersInArea = allTowers.filter(t => t.area === area.key);
                if (towersInArea.length === 0) continue;
                const isUnlocked = unlockedAreas.has(area.key);
                const captionClasses = ['clickable-caption', !isUnlocked ? 'locked-caption' : ''].join(' ');
                const captionIcon = !isUnlocked ? 'expand_more' : 'expand_less';
                const tbodyClass = !isUnlocked ? 'hidden' : '';
                const areaRgb = (hexToRgb(areaColors[area.key] || '#808080') || [128, 128, 128]).join(', ');

                const totalCount = towersInArea.length;
                const completedCount = towersInArea.filter(t => beatenTowerMap.has(t.name)).length;
                const percent = (completedCount / totalCount) * 100;
                let fillColor = 'rgba(255, 255, 255, 0.15)',
                    textColorClass = 'text-gray-400',
                    borderClass = 'border-white/10';
                if (percent === 100) {
                    fillColor = 'rgba(255, 215, 0, 0.15)';
                    textColorClass = 'text-yellow-300 font-bold';
                    borderClass = 'border-yellow-500/50';
                } else if (percent > 0) textColorClass = 'text-gray-200';
                const progressStyle = `background: linear-gradient(to right, ${fillColor} 0%, ${fillColor} ${percent}%, transparent ${percent}%, transparent 100%);`;
                const countPill = `<span class="inline-block py-0.5 px-5 rounded-full text-xs font-mono border ${borderClass} ${textColorClass}" style="${progressStyle}">${completedCount}/${totalCount}</span>`;

                let towerRowsHtml = '';
                towersInArea.sort((a, b) => a.number_difficulty - b.number_difficulty).forEach(tower => {
                    const beatenVersion = beatenTowerMap.get(tower.name);
                    const isCompleted = !!beatenVersion;
                    const completionRgb = isCompleted ? '67, 255, 129' : '255, 50, 50';
                    const diffRgb = (hexToRgb(difficultyColors[tower.difficulty] || '#808080') || [128, 128, 128]).join(', ');

                    towerRowsHtml += `<tr class="tower-row ${isCompleted?'status-outline-completed':'status-outline-incomplete'}" style="--difficulty-rgb: ${completionRgb}; --area-rgb: ${diffRgb};" data-tower-name="${tower.name}"><td class="py-1 px-3 ${isCompleted?'text-gray-200':'text-gray-500'}">${tower.name}</td><td class="py-1 px-3 text-right"><div class="flex justify-end items-center gap-2"><span class="inline-block py-0.5 px-2.5 rounded-full text-xs font-medium border border-gray-500/50 ${isCompleted?'text-gray-300 bg-gray-500/10':'text-gray-600 bg-gray-500/10'}">${isCompleted?new Date(beatenVersion.awarded_unix*1000).toLocaleDateString():'--'}</span><span class="inline-block py-0.5 px-2.5 rounded-full text-xs font-medium border ${difficultyPillClasses[tower.difficulty]||difficultyPillClasses.nil}">${tower.modifier||''} ${tower.difficulty||''} [${(tower.number_difficulty||0).toFixed(2)}]</span></div></td></tr>`;
                });
                columnHtml += `<div class="bg-black/20 rounded-md overflow-hidden"><table class="w-full text-sm"><caption class="py-2.5 px-4 text-left font-bold text-base bg-black/10"><div class="${captionClasses} select-none flex justify-between items-center"><span class="caption-text">${area.name}</span><div class="flex items-center gap-3">${countPill}<span class="material-symbols-outlined caption-icon dropdown-arrow">${captionIcon}</span></div></div></caption><tbody class="${tbodyClass}">${towerRowsHtml}</tbody></table></div>`;
            }
            return `<div class="flex flex-col gap-4">${columnHtml}</div>`;
        };
        areaHistoryContainer.innerHTML = generateColumnHtml(ringAreas) + generateColumnHtml(zoneAreas);
    };

    const renderChart = (beatenTowers) => {
        const ctx = document.getElementById('completionChart').getContext('2d');
        if (!beatenTowers || beatenTowers.length === 0) {
            if (completionChart) {
                completionChart.destroy();
                completionChart = null;
            }
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            return;
        }
        const difficultyOrder = Object.keys(difficultyColors);
        const canonCompletions = beatenTowers.filter(tower => !NON_CANON_TOWERS.has(tower.name));
        canonCompletions.sort((a, b) => a.awarded_unix - b.awarded_unix);
        const stepDates = [];
        const stepData = difficultyOrder.map(() => []);
        const difficultyCounts = Object.fromEntries(difficultyOrder.map(d => [d, 0]));
        if (canonCompletions.length > 0) {
            stepDates.push(new Date(canonCompletions[0].awarded_unix * 1000).getTime() - 86400000);
            difficultyOrder.forEach((_, i) => stepData[i].push(0));
        }
        canonCompletions.forEach(tower => {
            const d = new Date(tower.awarded_unix * 1000);
            stepDates.push(d);
            difficultyOrder.forEach((name, i) => stepData[i].push(difficultyCounts[name]));
            if (difficultyCounts.hasOwnProperty(tower.difficulty)) difficultyCounts[tower.difficulty]++;
            stepDates.push(d);
            difficultyOrder.forEach((name, i) => stepData[i].push(difficultyCounts[name]));
        });
        if (canonCompletions.length > 0) {
            const now = Date.now();
            if (stepDates[stepDates.length - 1] < now) {
                stepDates.push(now);
                difficultyOrder.forEach((name, i) => stepData[i].push(difficultyCounts[name]));
            }
        }
        const datasets = difficultyOrder.map((name, i) => ({
            label: name,
            data: stepData[i],
            backgroundColor: difficultyColors[name] || '#808080',
            borderColor: difficultyColors[name] || '#808080',
            fill: true,
            stepped: true,
            pointRadius: 0,
            borderWidth: 1
        }));
        if (completionChart) completionChart.destroy();
        completionChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: stepDates,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: true
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'month'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#EAEAEA',
                            font: {
                                family: "'Space Grotesk', sans-serif"
                            }
                        },
                        max: Date.now()
                    },
                    y: {
                        stacked: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#EAEAEA',
                            font: {
                                family: "'Space Grotesk', sans-serif"
                            }
                        }
                    }
                }
            }
        });
    };

    const openModalWithTower = (towerName) => {
        const tower = allTowersData.find(t => t.name === towerName);
        if (!tower) return;
        const beatenVersion = beatenTowersData.find(t => t.name === towerName);
        modalTowerName.textContent = tower.name;
        modalDifficulty.className = `inline-block py-0.5 px-2.5 rounded-full text-xs font-medium border ${difficultyPillClasses[tower.difficulty]||difficultyPillClasses.nil}`;
        modalDifficulty.textContent = `${tower.modifier||''} ${tower.difficulty||''} [${(tower.number_difficulty||0).toFixed(2)}]`;
        modalArea.className = `inline-block py-0.5 px-2.5 rounded-full text-xs font-medium border ${areaPillClasses[tower.area]||areaPillClasses.Default}`;
        modalArea.textContent = areaDisplayNames[tower.area] || tower.area;

        const lengthText = tower.length || '<20 minutes';
        modalLength.textContent = lengthText.replace(' long', '');
        modalLength.className = 'inline-block py-0.5 px-2.5 rounded-full text-xs font-medium border border-orange-400/50 text-orange-300 bg-orange-400/10';

        modalFloors.innerHTML = `<span class="inline-block py-0.5 px-2.5 rounded-full text-xs font-medium border border-gray-500/50 text-gray-300 bg-gray-500/10">${tower.floors??10}</span>`;
        modalCreator.innerHTML = '';
        (Array.isArray(tower.creators) ? tower.creators : ["Unknown"]).flatMap(c => c.split(',').map(x => x.trim())).filter(Boolean).forEach(c => {
            const p = document.createElement('span');
            p.className = 'inline-block py-0.5 px-2.5 rounded-full text-xs font-medium border border-gray-500/50 text-gray-300 bg-gray-500/10 mr-1';
            p.textContent = c;
            modalCreator.appendChild(p);
        });
        modalWarnings.innerHTML = '';
        const w = Array.isArray(tower.warnings) ? tower.warnings : [];
        if (w.length > 0) w.forEach(x => {
            const p = document.createElement('span');
            p.className = 'inline-block py-0.5 px-2.5 rounded-full text-xs font-medium border border-gray-500/50 text-gray-300 bg-gray-500/10 mr-1';
            p.textContent = titleCase(x);
            modalWarnings.appendChild(p);
        });
        else modalWarnings.innerHTML = '<span class="text-gray-400">None</span>';
        if (beatenVersion) {
            modalDate.className = 'inline-block py-0.5 px-2.5 rounded-full text-xs font-medium border border-gray-500/50 text-gray-300 bg-gray-500/10';
            modalDate.textContent = new Date(beatenVersion.awarded_unix * 1000).toLocaleString();
        } else {
            modalDate.className = 'inline-block py-0.5 px-2.5 rounded-full text-xs font-medium border border-gray-600/50 text-gray-400 bg-gray-600/10';
            modalDate.textContent = "Not Completed";
        }
        modalPanel.style.setProperty('--difficulty-color', difficultyColors[tower.difficulty] || '#808080');
        modalBackdrop.classList.remove('hidden');
    };
    const closeModal = () => modalBackdrop.classList.add('hidden');

    searchButton.addEventListener('click', handleSearch);
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
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
    tableView.addEventListener('click', (e) => {
        const c = e.target.closest('.clickable-caption');
        if (c) {
            const tb = c.closest('table').querySelector('tbody');
            tb.classList.toggle('hidden');
            c.querySelector('.dropdown-arrow').style.transform = tb.classList.contains('hidden') ? 'rotate(-90deg)' : 'rotate(0deg)';
        } else {
            const r = e.target.closest('.tower-row');
            if (r && r.dataset.towerName) openModalWithTower(r.dataset.towerName);
        }
    });
    modalCloseButton.addEventListener('click', closeModal);
    modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) closeModal();
    });
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modalBackdrop.classList.contains('hidden')) closeModal();
    });

    switchView('chart');
});