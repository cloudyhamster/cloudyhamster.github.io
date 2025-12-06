import { store } from '../state.js';
import { DIFFICULTY_COLORS, NON_CANON_TOWERS } from '../config.js';

let completionChart = null;

let chartState = {
    startDate: null,
    endDate: null,
    timeUnit: 'auto',
    yAxisStep: 'auto'
};

let fullChartData = {
    dates: [],
    datasets: []
};

const ACTIVE_STYLE = ['bg-[#BE00FF]/20', 'text-[#BE00FF]', 'border-[#BE00FF]/50'];
const INACTIVE_STYLE = ['bg-white/5', 'text-gray-300', 'border-white/10', 'hover:bg-white/10'];
const DROPDOWN_ITEM_BASE = ['text-left', 'px-3', 'py-2', 'text-xs', 'font-bold', 'rounded', 'border', 'cursor-pointer', 'transition-colors', 'select-none'];

export function initChart() {
    store.subscribe('userChanged', (userData) => {
        processData(userData.beaten_towers);
        updateChart();
    });

    const dateTrigger = document.getElementById('date-range-trigger');
    const dateDropdown = document.getElementById('date-range-dropdown');
    const dateLabel = document.getElementById('date-range-label');
    
    const timeUnitTrigger = document.getElementById('time-unit-trigger');
    const timeUnitDropdown = document.getElementById('time-unit-dropdown');
    const timeUnitLabel = document.getElementById('time-unit-label');

    const yAxisTrigger = document.getElementById('y-axis-trigger');
    const yAxisDropdown = document.getElementById('y-axis-dropdown');
    const yAxisLabel = document.getElementById('y-axis-label');

    const startInput = document.getElementById('sidebar-start-date');
    const endInput = document.getElementById('sidebar-end-date');
    const applyBtn = document.getElementById('apply-custom-date');
    const resetBtn = document.getElementById('sidebar-chart-reset');
    
    const presetBtns = document.querySelectorAll('.date-preset-btn');
    const timeUnitItems = document.querySelectorAll('.time-unit-item');
    const yAxisItems = document.querySelectorAll('.y-axis-item');

    const setElementActive = (el, isActive) => {
        if (isActive) {
            el.classList.remove(...INACTIVE_STYLE);
            el.classList.add(...ACTIVE_STYLE);
        } else {
            el.classList.remove(...ACTIVE_STYLE);
            el.classList.add(...INACTIVE_STYLE);
        }
    };

    const setupDropdown = (trigger, dropdown, otherDropdowns) => {
        if (trigger && dropdown) {
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                const wasHidden = dropdown.classList.contains('hidden');
                
                otherDropdowns.forEach(d => {
                    if (d) d.classList.add('hidden');
                });

                if (wasHidden) dropdown.classList.remove('hidden');
                else dropdown.classList.add('hidden');
            });
        }
    };

    setupDropdown(dateTrigger, dateDropdown, [timeUnitDropdown, yAxisDropdown]);
    setupDropdown(timeUnitTrigger, timeUnitDropdown, [dateDropdown, yAxisDropdown]);
    setupDropdown(yAxisTrigger, yAxisDropdown, [dateDropdown, timeUnitDropdown]);

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.relative')) {
            [dateDropdown, timeUnitDropdown, yAxisDropdown].forEach(d => {
                if (d) d.classList.add('hidden');
            });
        }
    });

    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const range = btn.dataset.range;
            const now = new Date();
            let start = null;
            let end = null;
            let label = "Custom";

            presetBtns.forEach(b => setElementActive(b, b === btn));

            if (range === 'all') {
                start = null;
                end = null;
                label = "All Time";
            } else if (range === 'this_year') {
                start = new Date(now.getFullYear(), 0, 1);
                end = new Date(); 
                label = "This Year";
            } else if (range === 'last_year') {
                start = new Date(now.getFullYear() - 1, 0, 1);
                end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
                label = "Last Year";
            } else if (range === 'last_30') {
                start = new Date();
                start.setDate(now.getDate() - 30);
                end = new Date();
                label = "Last 30 Days";
            }

            chartState.startDate = start ? start.getTime() : null;
            chartState.endDate = end ? end.getTime() : null;
            
            if (startInput) startInput.valueAsDate = start; 
            if (endInput) endInput.valueAsDate = end;

            dateLabel.textContent = label;
            updateChart();
        });
    });

    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            if (startInput.value) {
                chartState.startDate = new Date(startInput.value).getTime();
            } else {
                chartState.startDate = null;
            }

            if (endInput.value) {
                const d = new Date(endInput.value);
                d.setHours(23, 59, 59, 999);
                chartState.endDate = d.getTime();
            } else {
                chartState.endDate = null;
            }

            presetBtns.forEach(b => setElementActive(b, false));

            const sStr = startInput.value ? new Date(startInput.value).toLocaleDateString() : '...';
            const eStr = endInput.value ? new Date(endInput.value).toLocaleDateString() : '...';
            dateLabel.textContent = `${sStr} - ${eStr}`;
            
            dateDropdown.classList.add('hidden');
            updateChart();
        });
    }

    timeUnitItems.forEach(item => {
        item.className = ''; 
        item.classList.add(...DROPDOWN_ITEM_BASE);
        setElementActive(item, item.dataset.value === 'auto');

        item.addEventListener('click', () => {
            chartState.timeUnit = item.dataset.value;
            timeUnitLabel.textContent = item.textContent;

            timeUnitItems.forEach(i => setElementActive(i, i === item));
            
            updateChart();
        });
    });

    yAxisItems.forEach(item => {
        item.className = '';
        item.classList.add(...DROPDOWN_ITEM_BASE);
        setElementActive(item, item.dataset.value === 'auto');

        item.addEventListener('click', () => {
            chartState.yAxisStep = item.dataset.value === 'auto' ? 'auto' : parseInt(item.dataset.value);
            yAxisLabel.textContent = item.textContent;

            yAxisItems.forEach(i => setElementActive(i, i === item));

            updateChart();
        });
    });

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            chartState = { startDate: null, endDate: null, timeUnit: 'auto', yAxisStep: 'auto' };
            
            if(startInput) startInput.value = '';
            if(endInput) endInput.value = '';
            
            dateLabel.textContent = "All Time";
            timeUnitLabel.textContent = "Auto";
            yAxisLabel.textContent = "Auto";

            presetBtns.forEach(b => setElementActive(b, b.dataset.range === 'all'));
            timeUnitItems.forEach(i => setElementActive(i, i.dataset.value === 'auto'));
            yAxisItems.forEach(i => setElementActive(i, i.dataset.value === 'auto'));

            updateChart();
        });
    }
}

function processData(beatenTowers) {
    if (!beatenTowers || beatenTowers.length === 0) {
        fullChartData = { dates: [], datasets: [] };
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
        const d = new Date(tower.awarded_unix * 1000).getTime();
        stepDates.push(d);
        difficultyOrder.forEach((name, i) => stepData[i].push(difficultyCounts[name]));
        
        if (difficultyCounts.hasOwnProperty(tower.difficulty)) difficultyCounts[tower.difficulty]++;
        
        stepDates.push(d);
        difficultyOrder.forEach((name, i) => stepData[i].push(difficultyCounts[name]));
    });

    const now = Date.now();
    if (stepDates.length > 0 && stepDates[stepDates.length - 1] < now) {
        stepDates.push(now);
        difficultyOrder.forEach((name, i) => stepData[i].push(difficultyCounts[name]));
    }

    fullChartData = {
        dates: stepDates,
        datasets: difficultyOrder.map((name, i) => ({
            label: name,
            originalData: stepData[i],
            backgroundColor: DIFFICULTY_COLORS[name] || '#808080',
            borderColor: DIFFICULTY_COLORS[name] || '#808080',
            fill: true,
            stepped: true,
            pointRadius: 0,
            borderWidth: 1
        }))
    };
}

function updateChart() {
    const ctx = document.getElementById('completionChart').getContext('2d');
    
    if (fullChartData.dates.length === 0) {
        if (completionChart) {
            completionChart.destroy();
            completionChart = null;
        }
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        return;
    }

    let minTime = fullChartData.dates[0];
    let maxTime = Date.now();

    if (chartState.startDate) minTime = Math.max(minTime, chartState.startDate);
    if (chartState.endDate) maxTime = Math.min(Date.now(), chartState.endDate);

    const datasets = fullChartData.datasets.map(ds => ({ ...ds, data: ds.originalData }));
    const timeUnit = chartState.timeUnit === 'auto' ? undefined : chartState.timeUnit;
    const stepSize = chartState.yAxisStep === 'auto' ? undefined : chartState.yAxisStep;

    if (completionChart) {
        completionChart.data.labels = fullChartData.dates;
        completionChart.data.datasets = datasets;
        completionChart.options.scales.x.min = minTime;
        completionChart.options.scales.x.max = maxTime;
        completionChart.options.scales.x.time.unit = timeUnit;
        completionChart.options.scales.y.ticks.stepSize = stepSize;
        completionChart.update();
    } else {
        completionChart = new Chart(ctx, {
            type: 'line',
            data: { labels: fullChartData.dates, datasets: datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: { legend: { display: false }, tooltip: { enabled: true } },
                scales: {
                    x: {
                        type: 'time',
                        min: minTime,
                        max: maxTime,
                        time: { unit: timeUnit },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#EAEAEA', font: { family: "'Space Grotesk', sans-serif" } }
                    },
                    y: {
                        stacked: true,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { 
                            color: '#EAEAEA', 
                            font: { family: "'Space Grotesk', sans-serif" },
                            stepSize: stepSize
                        }
                    }
                }
            }
        });
    }
}