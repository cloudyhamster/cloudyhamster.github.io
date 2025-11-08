document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'https://etoh-thing.onrender.com';
    const MAX_NOTIFICATIONS = 8;
    let completionChart = null;

    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const statsContainer = document.getElementById('statsContainer');
    const forceRefreshCheckbox = document.getElementById('forceRefreshCheckbox');
    const notificationContainer = document.getElementById('notification-container');

    const totalTowersStat = document.getElementById('totalTowersStat');
    const hardestTowerStat = document.getElementById('hardestTowerStat');
    const hardestDifficultyStat = document.getElementById('hardestDifficultyStat');

    const showNotification = (message, type = 'success') => {
        if (notificationContainer.children.length >= MAX_NOTIFICATIONS) {
            notificationContainer.firstChild.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification glass-panel ${type}`;
        
        const iconName = type === 'success' ? 'check_circle' : 'error';
        notification.innerHTML = `
            <span class="material-symbols-outlined">${iconName}</span>
            <p class="text-sm font-medium">${message}</p>
        `;

        notificationContainer.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 50);

        setTimeout(() => {
            notification.classList.remove('show');
            notification.addEventListener('transitionend', () => {
                notification.remove();
            });
        }, 5000);
    };

    const renderProfile = (data) => {
        const { stats, progression } = data;
        totalTowersStat.textContent = `${stats.totalTowersBeaten}/${stats.totalTowersInGame}`;
        hardestTowerStat.textContent = stats.hardestTowerName;
        hardestDifficultyStat.textContent = stats.hardestDifficulty;
        statsContainer.style.display = 'grid';
        renderChart(progression);
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
        const difficultyOrder = Object.keys(difficultyColors);

        beatenTowers.sort((a, b) => a.awarded_unix - b.awarded_unix);

        const stepDates = [];
        const stepData = difficultyOrder.map(() => []);
        const difficultyCounts = Object.fromEntries(difficultyOrder.map(d => [d, 0]));

        if (beatenTowers.length > 0) {
            const firstDate = new Date(beatenTowers[0].awarded_unix * 1000);
            stepDates.push(firstDate.getTime() - 86400000);
            difficultyOrder.forEach((_, i) => stepData[i].push(0));
        }

        beatenTowers.forEach(tower => {
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
            backgroundColor: difficultyColors[name],
            borderColor: difficultyColors[name],
            fill: true,
            stepped: true,
            pointRadius: 0,
            borderWidth: 1,
        }));

        const config = {
            type: 'line',
            data: {
                labels: stepDates,
                datasets: datasets,
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        enabled: true,
                    }
                },
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
                showNotification(`Loading cached data for ${username}.`, 'success');
                renderProfile(JSON.parse(cachedData));
                return;
            }
        }

        loadingIndicator.style.display = 'flex';
        statsContainer.style.display = 'none';

        try {
            const apiUrl = `${API_BASE_URL}/api/get_player_stats?username=${username}&force_refresh=${forceRefresh}`;
            const response = await fetch(apiUrl);
            
            if (response.status === 429) {
                throw new Error('Rate limit exceeded. Please wait a moment.');
            }
            
            const result = await response.json();

            if (result.success) {
                localStorage.setItem(cacheKey, JSON.stringify(result.data));
                renderProfile(result.data);
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
});