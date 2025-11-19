document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'https://etoh-thing.onrender.com';
    let completionChart = null;
    let currentView = 'chart';
    let allTowersData = [];
    let beatenTowersData = [];
    let leaderboardData = null;

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
    const defaultColor = "#808080";

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
    const areaDisplayNames = {
        'Garden Of Eesh%C3%B6L': 'Garden Of Eeshöl'
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
    const miscNavLinksContainer = document.getElementById('misc-nav-links');
    const mainContentTitle = document.getElementById('main-content-title');
    const chartView = document.getElementById('chart-view');
    const tableView = document.getElementById('table-view');
    const listView = document.getElementById('list-view');
    const leaderboardView = document.getElementById('leaderboard-view');
    const areaHistoryContainer = document.getElementById('area-history-container');
    const fullHistoryContainer = document.getElementById('full-history-container');
    const leaderboardContainer = document.getElementById('leaderboard-container');
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

    const titleCase = (str) => {
        if (!str) return '';
        return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const showNotification = (message, type = 'success') => {
        if (notificationContainer.children.length >= 8) {
            notificationContainer.firstChild.remove();
        }
        const notification = document.createElement('div');
        notification.className = `notification glass-panel ${type}`;
        const iconName = type === 'success' ? 'check_circle' : 'error';
        notification.innerHTML = `<span class="material-symbols-outlined">${iconName}</span><p class="text-sm font-medium">${message}</p>`;
        notificationContainer.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 50);
        setTimeout(() => {
            notification.classList.remove('show');
            notification.addEventListener('transitionend', () => notification.remove());
        }, 5000);
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
            leaderboard: {
                title: 'Leaderboard',
                element: leaderboardView
            }
        };

        mainContentTitle.textContent = views[viewName].title;
        Object.values(views).forEach(view => view.element.classList.add('hidden'));
        if (views[viewName]) {
            views[viewName].element.classList.remove('hidden');
        }

        if (viewName === 'leaderboard' && !leaderboardData) {
            fetchAndRenderLeaderboard();
        }

        const allNavLinks = [...navLinksContainer.querySelectorAll('a'), ...miscNavLinksContainer.querySelectorAll('a')];
        allNavLinks.forEach(link => {
            if (link.dataset.view === viewName) {
                link.classList.remove(...inactiveClasses);
                link.classList.add(...activeClasses);
            } else {
                link.classList.remove(...activeClasses);
                link.classList.add(...inactiveClasses);
            }
        });
    };

    const openModalWithTower = (towerName) => {
        const tower = allTowersData.find(t => t.name === towerName);
        if (!tower) return;
        const beatenVersion = beatenTowersData.find(t => t.name === towerName);
        modalTowerName.textContent = tower.name;
        const difficultyText = `${tower.modifier || ''} ${tower.difficulty || ''}`.trim();
        const numericDifficulty = (tower.number_difficulty || 0).toFixed(2);
        const diffPillContent = `${difficultyText} [${numericDifficulty}]`;
        modalDifficulty.className = `inline-block py-0.5 px-2.5 rounded-full text-xs font-medium border ${difficultyPillClasses[tower.difficulty] || difficultyPillClasses.nil}`;
        modalDifficulty.textContent = diffPillContent;
        const areaKey = tower.area || 'Unknown';
        const areaDisplayName = areaDisplayNames[areaKey] || areaKey;
        modalArea.className = `inline-block py-0.5 px-2.5 rounded-full text-xs font-medium border ${areaPillClasses[areaKey] || areaPillClasses.Default}`;
        modalArea.textContent = areaDisplayName;
        const lengthCategory = tower.length || '<20 minutes';
        const lengthColorClasses = {
            '<20 minutes': 'border-orange-300/50 text-orange-200 bg-orange-300/10',
            '20+ minutes': 'border-orange-400/50 text-orange-300 bg-orange-400/10',
            '30+ minutes': 'border-orange-500/50 text-orange-400 bg-orange-500/10',
            '45+ minutes': 'border-orange-600/50 text-orange-500 bg-orange-600/10',
            '60+ minutes': 'border-orange-700/50 text-orange-600 bg-orange-700/10',
            '90+ minutes': 'border-orange-800/50 text-orange-700 bg-orange-800/10'
        };
        const cleanedLength = lengthCategory.replace(' long', '');
        modalLength.className = `inline-block py-0.5 px-2.5 rounded-full text-xs font-medium border ${lengthColorClasses[cleanedLength] || 'border-gray-500/50 text-gray-300 bg-gray-500/10'}`;
        modalLength.textContent = cleanedLength;
        if (beatenVersion) {
            modalDate.className = 'inline-block py-0.5 px-2.5 rounded-full text-xs font-medium border border-gray-500/50 text-gray-300 bg-gray-500/10';
            modalDate.textContent = new Date(beatenVersion.awarded_unix * 1000).toLocaleString();
        } else {
            modalDate.className = 'inline-block py-0.5 px-2.5 rounded-full text-xs font-medium border border-gray-600/50 text-gray-400 bg-gray-600/10';
            modalDate.textContent = "Not Completed";
        }
        const neutralPillClass = 'inline-block py-0.5 px-2.5 rounded-full text-xs font-medium border border-gray-500/50 text-gray-300 bg-gray-500/10';
        modalFloors.innerHTML = '';
        const floorsPill = document.createElement('span');
        floorsPill.className = neutralPillClass;
        floorsPill.textContent = tower.floors ?? 10;
        modalFloors.appendChild(floorsPill);
        modalCreator.innerHTML = '';
        const creatorsSource = Array.isArray(tower.creators) ? tower.creators : ["Unknown"];
        const allCreators = creatorsSource.flatMap(c => c.split(',').map(name => name.trim())).filter(Boolean);
        allCreators.forEach(creator => {
            const pill = document.createElement('span');
            pill.className = neutralPillClass;
            pill.textContent = creator;
            modalCreator.appendChild(pill);
        });
        modalWarnings.innerHTML = '';
        const warnings = Array.isArray(tower.warnings) && tower.warnings.length > 0 ? tower.warnings : [];
        if (warnings.length > 0) {
            warnings.forEach(warning => {
                const pill = document.createElement('span');
                pill.className = neutralPillClass;
                pill.textContent = titleCase(warning);
                modalWarnings.appendChild(pill);
            });
        } else {
            const pill = document.createElement('span');
            pill.className = 'inline-block py-0.5 px-2.5 rounded-full text-xs font-medium border border-gray-600/50 text-gray-400 bg-gray-600/10';
            pill.textContent = "None";
            modalWarnings.appendChild(pill);
        }
        const accentColor = difficultyColors[tower.difficulty] || defaultColor;
        modalPanel.style.setProperty('--difficulty-color', accentColor);
        modalBackdrop.classList.remove('hidden');
    };

    const closeModal = () => modalBackdrop.classList.add('hidden');

    const fetchAndRenderLeaderboard = async () => {
        leaderboardContainer.innerHTML = `<div class="flex items-center justify-center p-8">Loading leaderboard...</div>`;
        try {
            const response = await fetch(`${API_BASE_URL}/api/get_leaderboard`);
            const result = await response.json();
            if (!result.success) throw new Error(result.error);

            leaderboardData = result.leaderboard;

            let headerHtml = `
                <div class="leaderboard-header">
                    <div class="w-16 text-center">#</div>
                    <div class="w-64 text-left">Player</div>
                    <div class="flex-1 text-left">Hardest Tower</div>
                    <div class="w-56 text-left">Difficulty</div>
                    <div class="w-24 text-center">Towers</div>
                </div>
            `;

            let rowsHtml = '';
            leaderboardData.forEach((player, index) => {
                const rank = index + 1;
                let rankClass = '';
                let rankRgb = '';
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

                rowsHtml += `
                    <div class="leaderboard-row ${rankClass}" style="--rank-rgb: ${rankRgb};">
                        <div class="w-16 text-center text-lg font-bold text-gray-400">${rank}</div>
                        <div class="w-64">
                            <div class="flex items-center gap-3">
                                <img src="${player.avatar_url || 'icon.jpg'}" class="leaderboard-avatar" alt="${player.display_name || player.user_name}'s avatar">
                                <div class="flex flex-col">
                                    <span class="font-bold text-white truncate">${player.display_name || player.user_name}</span>
                                    <span class="text-xs text-gray-400">@${player.user_name || 'null'}</span>
                                </div>
                            </div>
                        </div>
                        <div class="flex-1 text-gray-300 text-sm text-left truncate pr-4">
                            ${player.hardest_tower_name}
                        </div>
                        <div class="w-56 text-left">
                            <span class="inline-block py-0.5 px-2.5 rounded-full text-xs font-medium border ${diffPillClass}">
                                ${difficultyText} [${numericDifficulty}]
                            </span>
                        </div>
                        <div class="w-24 text-center text-lg font-bold">${player.total_towers}</div>
                    </div>
                `;
            });

            leaderboardContainer.innerHTML = headerHtml + rowsHtml;

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
            const cachedData = sessionStorage.getItem(cacheKey);
            let apiUrl = `${API_BASE_URL}/api/get_player_data?username=${username}`;
            if (forceRefresh) {
                apiUrl += '&force_refresh=true';
            }
            const response = await fetch(apiUrl);
            if (response.status === 429) {
                throw new Error('Rate limit exceeded. Please wait a moment.');
            }
            const result = await response.json();
            if (result.success) {
                sessionStorage.setItem(cacheKey, JSON.stringify(result));
                renderProfile(result);
                showNotification(`Successfully loaded stats for ${username}.`, 'success');
            } else {
                throw new Error(result.error);
            }
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
        let hardestTowerName = "N/A";
        let hardestDifficultyStr = "N/A";
        if (beatenTowers.length > 0) {
            const sortedByDifficulty = [...beatenTowers].sort((a, b) => b.number_difficulty - a.number_difficulty);
            const hardestTower = sortedByDifficulty[0];
            hardestTowerName = hardestTower.name || 'Unknown';
            const modifier = hardestTower.modifier || '';
            const difficulty = hardestTower.difficulty || '';
            const numeric = hardestTower.number_difficulty || 0;
            const fullDiffText = `${modifier} ${difficulty}`.trim();
            hardestDifficultyStr = `${fullDiffText} [${numeric.toFixed(2)}]`;
        }
        totalTowersStat.textContent = `${totalBeaten}/${totalInGame}`;
        hardestTowerStat.textContent = hardestTowerName;
        hardestDifficultyStat.textContent = hardestDifficultyStr;
        statsContainer.style.display = 'grid';
    };

    const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : null;
    };

    const rgbToHex = (r, g, b) => '#' + [r, g, b].map(x => {
        const hex = Math.round(x).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');

    const interpolateColor = (color1, color2, factor) => {
        const rgb1 = hexToRgb(color1);
        const rgb2 = hexToRgb(color2);
        const result = rgb1.slice();
        for (let i = 0; i < 3; i++) {
            result[i] = rgb1[i] + factor * (rgb2[i] - rgb1[i]);
        }
        return rgbToHex(result[0], result[1], result[2]);
    };

    const renderFullHistoryList = (beatenTowers) => {
        fullHistoryContainer.innerHTML = '';
        if (!beatenTowers || beatenTowers.length === 0) return;
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
        const completionDates = beatenTowers.map(t => t.awarded_unix).filter(Boolean);
        const minDate = Math.min(...completionDates);
        const maxDate = Math.max(...completionDates);
        const dateRange = maxDate - minDate;
        const oldColor = '#FFFFFF';
        const newColor = '#FFD700';
        const sortedTowers = [...beatenTowers].sort((a, b) => b.awarded_unix - a.awarded_unix);
        let towerRowsHtml = '';
        sortedTowers.forEach(tower => {
            const date = new Date(tower.awarded_unix * 1000).toLocaleDateString();
            const factor = dateRange > 0 ? (tower.awarded_unix - minDate) / dateRange : 1;
            const dateColor = interpolateColor(oldColor, newColor, factor);
            const datePillStyle = `color: ${dateColor}; background-color: ${dateColor}20; border-color: ${dateColor}80;`;
            const datePillHtml = `<span class="inline-block py-0.5 px-2.5 rounded-full text-xs font-medium border" style="${datePillStyle}">${date}</span>`;
            const areaKey = tower.area || 'Unknown';
            const areaDisplayName = areaDisplayNames[areaKey] || areaKey;
            const areaPillClass = areaPillClasses[areaKey] || areaPillClasses.Default;
            const areaPillHtml = `<span class="inline-block py-0.5 px-2.5 rounded-full text-xs font-medium border ${areaPillClass}">${areaDisplayName}</span>`;
            const difficultyText = `${tower.modifier || ''} ${tower.difficulty || ''}`.trim();
            const diffPillClasses = difficultyPillClasses[tower.difficulty] || difficultyPillClasses.nil;
            const numericDifficulty = (tower.number_difficulty || 0).toFixed(2);
            const diffPillContent = `${difficultyText} [${numericDifficulty}]`;
            const difficultyPillHtml = `<span class="inline-block py-0.5 px-2.5 rounded-full text-xs font-medium border ${diffPillClasses}">${diffPillContent}</span>`;
            const diffColorHex = difficultyColors[tower.difficulty] || defaultColor;
            const diffRgb = hexToRgb(diffColorHex);
            const diffRgbStr = diffRgb ? diffRgb.join(', ') : '128, 128, 128';
            const areaColorHex = areaColors[areaKey] || areaColors.Default;
            const areaRgb = hexToRgb(areaColorHex);
            const areaRgbStr = areaRgb ? areaRgb.join(', ') : '128, 128, 128';
            const rowStyle = `style="--difficulty-rgb: ${diffRgbStr}; --area-rgb: ${areaRgbStr};"`;
            towerRowsHtml += `<tr class="tower-row status-outline-completed" ${rowStyle}><td class="py-0.8 px-3"><div class="flex items-center gap-2"><span class="text-gray-200">${tower.name}</span>${difficultyPillHtml}</div></td><td class="py-0.8 px-3 text-right"><div class="flex justify-end items-center gap-2">${datePillHtml}${areaPillHtml}</div></td></tr>`;
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
        
        const ringAreas = [ { key: 'Ring 0', name: 'Ring 0: Purgatorio' }, { key: 'Ring 1', name: 'Ring 1: Limbo' }, { key: 'Forgotten Ridge', name: 'Forgotten Ridge' }, { key: 'Ring 2', name: 'Ring 2: Desire' }, { key: 'Garden Of Eesh%C3%B6L', name: 'Garden Of Eeshöl' }, { key: 'Ring 3', name: 'Ring 3: Gluttony' }, { key: 'Ring 4', name: 'Ring 4: Greed' }, { key: 'Silent Abyss', name: 'Silent Abyss' }, { key: 'Ring 5', name: 'Ring 5: Wrath' }, { key: 'Lost River', name: 'Lost River' }, { key: 'Ring 6', name: 'Ring 6: Heresy' }, { key: 'Ashen Towerworks', name: 'Ashen Towerworks' }, { key: 'Ring 7', name: 'Ring 7: Violence' }, { key: 'Ring 8', name: 'Ring 8: Fraud' }, { key: 'The Starlit Archives', name: 'The Starlit Archives' }, { key: 'Ring 9', name: 'Ring 9: Treachery' }, ];
        const zoneAreas = [ { key: 'Zone 1', name: 'Zone 1: Sea' }, { key: 'Zone 2', name: 'Zone 2: Surface' }, { key: 'Arcane Area', name: 'Arcane Area' }, { key: 'Zone 3', name: 'Zone 3: Sky' }, { key: 'Paradise Atoll', name: 'Paradise Atoll' }, { key: 'Zone 4', name: 'Zone 4: Exosphere' }, { key: 'Zone 5', name: 'Zone 5: The Moon' }, { key: 'Zone 6', name: 'Zone 6: Mars' }, { key: 'Zone 7', name: 'Zone 7: Asteroid Belt' }, { key: 'Zone 8', name: 'Zone 8: Pluto' }, { key: 'Zone 9', name: 'Zone 9: Singularity' }, { key: 'Zone 10', name: 'Zone 10: Interstellar Shore' }, ];

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

                let towerRowsHtml = '';
                towersInArea.sort((a,b) => a.number_difficulty - b.number_difficulty).forEach(tower => {
                    const beatenVersion = beatenTowerMap.get(tower.name);
                    const isCompleted = !!beatenVersion;
                    const date = isCompleted ? new Date(beatenVersion.awarded_unix * 1000).toLocaleDateString() : '--';
                    const datePillHtml = `<span class="inline-block py-0.5 px-2.5 rounded-full text-xs font-medium border border-gray-500/50 ${isCompleted ? 'text-gray-300 bg-gray-500/10' : 'text-gray-600 bg-gray-500/10'}">${date}</span>`;
                    const difficultyText = `${tower.modifier || ''} ${tower.difficulty || ''}`.trim();
                    const pillClasses = difficultyPillClasses[tower.difficulty] || difficultyPillClasses.nil;
                    const numericDifficulty = (tower.number_difficulty || 0).toFixed(2);
                    const pillContent = `${difficultyText} [${numericDifficulty}]`;
                    const accentColorHex = difficultyColors[tower.difficulty] || defaultColor;
                    const rgb = hexToRgb(accentColorHex);
                    const accentColorRgbStr = rgb ? rgb.join(', ') : '128, 128, 128';
                    const completionRgbStr = isCompleted ? '67, 255, 129' : '255, 50, 50';
                    const rowStyle = `style="--difficulty-rgb: ${completionRgbStr}; --area-rgb: ${accentColorRgbStr};"`;
                    const outlineClass = isCompleted ? 'status-outline-completed' : 'status-outline-incomplete';
                    const textColorClass = isCompleted ? 'text-gray-200' : 'text-gray-500';

                    towerRowsHtml += `
                        <tr class="tower-row ${outlineClass}" ${rowStyle} data-tower-name="${tower.name}">
                            <td class="py-1 px-3 ${textColorClass}">${tower.name}</td>
                            <td class="py-1 px-3 text-right">
                                <div class="flex justify-end items-center gap-2">
                                    ${datePillHtml}
                                    <span class="inline-block py-0.5 px-2.5 rounded-full text-xs font-medium border ${pillClasses}">${pillContent}</span>
                                </div>
                            </td>
                        </tr>
                    `;
                });

                columnHtml += `
                    <div class="bg-black/20 rounded-md overflow-hidden">
                        <table class="w-full text-sm">
                            <caption class="py-2.5 px-4 text-left font-bold text-base bg-black/10">
                                <div class="${captionClasses} select-none flex justify-between items-center">
                                    <span class="caption-text">${area.name}</span>
                                    <span class="material-symbols-outlined caption-icon dropdown-arrow">${captionIcon}</span>
                                </div>
                            </caption>
                            <tbody class="${tbodyClass}">${towerRowsHtml}</tbody>
                        </table>
                    </div>
                `;
            }
            return `<div class="flex flex-col gap-4">${columnHtml}</div>`;
        };
        
        const ringsHtml = generateColumnHtml(ringAreas);
        const zonesHtml = generateColumnHtml(zoneAreas);

        areaHistoryContainer.innerHTML = ringsHtml + zonesHtml;
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
            const firstDate = new Date(canonCompletions[0].awarded_unix * 1000);
            stepDates.push(firstDate.getTime() - 86400000);
            difficultyOrder.forEach((_, i) => stepData[i].push(0));
        }

        canonCompletions.forEach(tower => {
            const awardDate = new Date(tower.awarded_unix * 1000);
            stepDates.push(awardDate);
            difficultyOrder.forEach((name, i) => stepData[i].push(difficultyCounts[name]));
            const difficultyName = tower.difficulty || 'nil';
            if (difficultyCounts.hasOwnProperty(difficultyName)) {
                difficultyCounts[difficultyName]++;
            }
            stepDates.push(awardDate);
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
            backgroundColor: difficultyColors[name] || defaultColor,
            borderColor: difficultyColors[name] || defaultColor,
            fill: true,
            stepped: true,
            pointRadius: 0,
            borderWidth: 1,
        }));

        const config = {
            type: 'line',
            data: { labels: stepDates, datasets: datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: { legend: { display: false }, tooltip: { enabled: true } },
                scales: {
                    x: {
                        type: 'time',
                        time: { unit: 'month' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#EAEAEA', font: { family: "'Space Grotesk', sans-serif" } },
                        max: Date.now()
                    },
                    y: {
                        stacked: true,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#EAEAEA', font: { family: "'Space Grotesk', sans-serif" } }
                    }
                }
            }
        };
        if (completionChart) {
            completionChart.destroy();
        }
        completionChart = new Chart(ctx, config);
    };

    searchButton.addEventListener('click', handleSearch);
    searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') handleSearch();
    });
    const handleNavClick = (event) => {
        const link = event.target.closest('a');
        if (link && link.dataset.view) {
            event.preventDefault();
            switchView(link.dataset.view);
        }
    };
    navLinksContainer.addEventListener('click', handleNavClick);
    miscNavLinksContainer.addEventListener('click', handleNavClick);
    tableView.addEventListener('click', (event) => {
        const caption = event.target.closest('.clickable-caption');
        if (caption) {
            const table = caption.closest('table');
            const tbody = table.querySelector('tbody');
            const arrow = caption.querySelector('.dropdown-arrow');
            if (tbody) {
                tbody.classList.toggle('hidden');
                arrow.style.transform = tbody.classList.contains('hidden') ? 'rotate(-90deg)' : 'rotate(0deg)';
            }
        } else {
            const row = event.target.closest('.tower-row');
            if (row && row.dataset.towerName) openModalWithTower(row.dataset.towerName);
        }
    });
    modalCloseButton.addEventListener('click', closeModal);
    modalBackdrop.addEventListener('click', (event) => {
        if (event.target === modalBackdrop) closeModal();
    });
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !modalBackdrop.classList.contains('hidden')) closeModal();
    });

    switchView('chart');
});