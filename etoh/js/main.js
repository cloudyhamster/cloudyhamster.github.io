document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'https://etoh-thing.onrender.com';
    let completionChart = null;
    let currentView = 'chart';

    const NON_CANON_TOWERS = new Set([
        "Tower Not Found", "Not Even A Tower", "This Is Probably A Tower",
        "Maybe A Tower", "Totally A Tower", "Will Be A Tower", "Likely A Tower",
        "Fortunately Not A Tower", "Far From A Surprising Tower", "Somewhat A Tower",
        "Possibly A Tower"
    ]);

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
    const mainContentTitle = document.getElementById('main-content-title');
    const chartView = document.getElementById('chart-view');
    const tableView = document.getElementById('table-view');
    const completionHistoryContainer = document.getElementById('completion-history-container');

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
        navLinksContainer.querySelectorAll('a').forEach(link => {
            if (link.dataset.view === viewName) {
                link.classList.remove(...inactiveClasses);
                link.classList.add(...activeClasses);
            } else {
                link.classList.remove(...activeClasses);
                link.classList.add(...inactiveClasses);
            }
        });
        if (viewName === 'chart') {
            mainContentTitle.textContent = 'Completion Chart';
            chartView.classList.remove('hidden');
            tableView.classList.add('hidden');
        } else {
            mainContentTitle.textContent = 'Completion History';
            chartView.classList.add('hidden');
            tableView.classList.remove('hidden');
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
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null;
    };

    const renderTable = (allTowers, beatenTowers) => {
        completionHistoryContainer.innerHTML = '';
        if (!allTowers || allTowers.length === 0) return;

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
            "nil": "border-gray-500/50 text-gray-300 bg-gray-500/10"
        };
        
        const ringAreas = [
            { key: 'Ring 0', name: 'Ring 0: Purgatorio' }, { key: 'Ring 1', name: 'Ring 1: Limbo' },
            { key: 'Forgotten Ridge', name: 'Forgotten Ridge' }, { key: 'Ring 2', name: 'Ring 2: Desire' },
            { key: 'Garden Of Eesh%C3%B6L', name: 'Garden of Eeshöl' }, { key: 'Ring 3', name: 'Ring 3: Gluttony' },
            { key: 'Ring 4', name: 'Ring 4: Greed' }, { key: 'Silent Abyss', name: 'Silent Abyss' },
            { key: 'Ring 5', name: 'Ring 5: Wrath' }, { key: 'Lost River', name: 'Lost River' },
            { key: 'Ring 6', name: 'Ring 6: Heresy' }, { key: 'Ashen Towerworks', name: 'Ashen Towerworks' },
            { key: 'Ring 7', name: 'Ring 7: Violence' }, { key: 'Ring 8', name: 'Ring 8: Fraud' },
            { key: 'The Starlit Archives', name: 'The Starlit Archives' }, { key: 'Ring 9', name: 'Ring 9: Treachery' },
        ];
        const zoneAreas = [
            { key: 'Zone 1', name: 'Zone 1: Sea' }, { key: 'Zone 2', name: 'Zone 2: Surface' },
            { key: 'Arcane Area', name: 'Arcane Area' }, { key: 'Zone 3', name: 'Zone 3: Sky' },
            { key: 'Paradise Atoll', name: 'Paradise Atoll' }, { key: 'Zone 4', name: 'Zone 4: Exosphere' },
            { key: 'Zone 5', name: 'Zone 5: The Moon' }, { key: 'Zone 6', name: 'Zone 6: Mars' },
            { key: 'Zone 7', name: 'Zone 7: Asteroid Belt' }, { key: 'Zone 8', name: 'Zone 8: Pluto' },
            { key: 'Zone 9', name: 'Zone 9: Singularity' }, { key: 'Zone 10', name: 'Zone 10: Interstellar Shore' },
        ];

        const beatenTowerMap = new Map(beatenTowers.map(tower => [tower.name, tower]));

        const generateColumnHtml = (areaList) => {
            let columnHtml = '';
            for (const area of areaList) {
                const towersInArea = allTowers.filter(t => t.area === area.key);
                
                if (towersInArea.length > 0) {
                    let towerRowsHtml = '';
                    towersInArea.sort((a,b) => a.number_difficulty - b.number_difficulty).forEach(tower => {
                        const beatenVersion = beatenTowerMap.get(tower.name);
                        const isCompleted = !!beatenVersion;
                        
                        let datePillHtml = `<span class="inline-block py-0.5 px-2.5 rounded-full text-xs font-medium border border-gray-500/50 text-gray-400 bg-gray-500/10">--</span>`;
                        if (isCompleted) {
                            const date = new Date(beatenVersion.awarded_unix * 1000).toLocaleDateString();
                            datePillHtml = `<span class="inline-block py-0.5 px-2.5 rounded-full text-xs font-medium border border-gray-500/50 text-gray-300 bg-gray-500/10">${date}</span>`;
                        }

                        const difficultyText = `${tower.modifier || ''} ${tower.difficulty || ''}`.trim();
                        const pillClasses = difficultyPillClasses[tower.difficulty] || difficultyPillClasses.nil;
                        const numericDifficulty = (tower.number_difficulty || 0).toFixed(2);
                        const pillContent = `${difficultyText} [${numericDifficulty}]`;
                        
                        const accentColorHex = difficultyColors[tower.difficulty] || defaultColor;
                        const accentColorRgb = hexToRgb(accentColorHex);
                        const rowStyle = accentColorRgb ? `style="--difficulty-rgb: ${accentColorRgb};"` : '';
                        
                        const outlineClass = isCompleted ? 'status-outline-completed' : 'status-outline-incomplete';
                        const textColorClass = isCompleted ? 'text-gray-200' : 'text-gray-500';

                        towerRowsHtml += `
                            <tr class="tower-row ${outlineClass}" ${rowStyle}>
                                <td class="py-0.8 px-3 ${textColorClass}">${tower.name}</td>
                                <td class="py-0.8 px-3 text-right">
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
                                <caption class="clickable-caption py-2.5 px-4 text-left font-bold text-base text-gray-200 bg-black/10">
                                    <span>${area.name}</span>
                                    <span class="material-symbols-outlined dropdown-arrow">expand_less</span>
                                </caption>
                                <tbody>${towerRowsHtml}</tbody>
                            </table>
                        </div>
                    `;
                }
            }
            return `<div class="flex flex-col gap-4">${columnHtml}</div>`;
        };
        
        const ringsHtml = generateColumnHtml(ringAreas);
        const zonesHtml = generateColumnHtml(zoneAreas);

        completionHistoryContainer.innerHTML = ringsHtml + zonesHtml;
    };

    const renderProfile = (data) => {
        const { all_towers, beaten_towers } = data;
        calculateAndRenderStats(beaten_towers, all_towers);
        renderChart(beaten_towers);
        renderTable(all_towers, beaten_towers);
        switchView(currentView);
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
                        ticks: { color: '#EAEAEA', font: { family: "'Space Grotesk', sans-serif" } }
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

    const handleSearch = async () => {
        const username = searchInput.value.trim();
        const forceRefresh = forceRefreshCheckbox.checked;
        if (!username) {
            showNotification('Please enter a Roblox Username.', 'error');
            return;
        }
        const cacheKey = `etoh_profile_${username.toLowerCase()}`;
        if (!forceRefresh) {
            const cachedData = localStorage.getItem(cacheKey);
            if (cachedData) {
                const parsedData = JSON.parse(cachedData);
                showNotification(`Loading cached data for ${username}.`, 'success');
                calculateAndRenderStats(parsedData.beaten_towers, parsedData.all_towers);
                renderChart(parsedData.beaten_towers);
                renderTable(parsedData.all_towers, parsedData.beaten_towers);
                switchView(currentView);
                return;
            }
        }
        loadingIndicator.style.display = 'flex';
        statsContainer.style.display = 'none';
        try {
            const apiUrl = `${API_BASE_URL}/api/get_player_data?username=${username}&force_refresh=${forceRefresh}`;
            const response = await fetch(apiUrl);
            if (response.status === 429) {
                throw new Error('Rate limit exceeded. Please wait a moment.');
            }
            const result = await response.json();
            if (result.success) {
                localStorage.setItem(cacheKey, JSON.stringify(result));
                calculateAndRenderStats(result.beaten_towers, result.all_towers);
                renderChart(result.beaten_towers);
                renderTable(result.all_towers, result.beaten_towers);
                switchView(currentView);
                showNotification(`Successfully loaded stats for ${username}.`, 'success');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            showNotification(error.message, 'error');
        } finally {
            loadingIndicator.style.display = 'none';
        }
    };
    
    searchButton.addEventListener('click', handleSearch);
    searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            handleSearch();
        }
    });

    navLinksContainer.addEventListener('click', (event) => {
        const link = event.target.closest('a');
        if (link && link.dataset.view) {
            event.preventDefault();
            switchView(link.dataset.view);
        }
    });
    
    completionHistoryContainer.addEventListener('click', (event) => {
        const caption = event.target.closest('.clickable-caption');
        if (!caption) return;
        
        const table = caption.parentElement;
        const tbody = table.querySelector('tbody');
        const arrow = caption.querySelector('.dropdown-arrow');
        
        if (tbody) {
            tbody.classList.toggle('hidden');
            if (tbody.classList.contains('hidden')) {
                arrow.style.transform = 'rotate(-90deg)';
            } else {
                arrow.style.transform = 'rotate(0deg)';
            }
        }
    });

    switchView('chart');
});