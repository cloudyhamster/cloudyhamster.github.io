import { store } from '../state.js';
import { DIFFICULTY_COLORS, NON_CANON_TOWERS } from '../config.js';

let completionChart = null;

export function initChart() {
    store.subscribe('userChanged', (userData) => {
        renderChart(userData.beaten_towers);
    });
}

function renderChart(beatenTowers) {
    const ctx = document.getElementById('completionChart').getContext('2d');
    if (!beatenTowers || beatenTowers.length === 0) {
        if (completionChart) {
            completionChart.destroy();
            completionChart = null;
        }
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        return;
    }

    const difficultyOrder = Object.keys(DIFFICULTY_COLORS);
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
        backgroundColor: DIFFICULTY_COLORS[name] || '#808080',
        borderColor: DIFFICULTY_COLORS[name] || '#808080',
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
                legend: { display: false },
                tooltip: { enabled: true }
            },
            scales: {
                x: {
                    type: 'time',
                    time: { unit: 'month' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: {
                        color: '#EAEAEA',
                        font: { family: "'Space Grotesk', sans-serif" }
                    },
                    max: Date.now()
                },
                y: {
                    stacked: true,
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: {
                        color: '#EAEAEA',
                        font: { family: "'Space Grotesk', sans-serif" }
                    }
                }
            }
        }
    });
}