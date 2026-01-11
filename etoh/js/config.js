export const API_BASE_URL = 'https://etoh-thing-w1v8.onrender.com';
// export const API_BASE_URL = 'http://127.0.0.1:5000';

export const NON_CANON_TOWERS = new Set([
    "Tower Not Found", 
    "Not Even A Tower", 
    "This Is Probably A Tower",
    "Maybe A Tower", 
    "Totally A Tower", 
    "Will Be A Tower", 
    "Likely A Tower",
    "Fortunately Not A Tower", 
    "Far From A Surprising Tower", 
    "Somewhat A Tower",
    "Possibly A Tower", 
    "Not Even A Flower"
]);

export const DIFFICULTY_COLORS = {
    "Easy": "#76F447", "Medium": "#FFFF00", "Hard": "#FE7C00",
    "Difficult": "#FF3232", "Challenging": "#A00000", "Intense": "#19222D",
    "Remorseless": "#C900C8", "Insane": "#0000FF", "Extreme": "#0287FF",
    "Terrifying": "#00FFFF", "Catastrophic": "#FFFFFF",
};

export const DIFFICULTY_PILL_CLASSES = {
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
    "Catastrophic": "border-white/50 text-white bg-white/10"
};

export const AREA_COLORS = {
    'Ring 0': '#ef4444', 'Ring 1': '#dc2626', 'Forgotten Ridge': '#dc2626',
    'Ring 2': '#b91c1c', 'Garden Of Eesh%C3%B6L': '#b91c1c', 'Ring 3': '#991b1b',
    'Ring 4': '#881337', 'Silent Abyss': '#881337', 'Ring 5': '#881337',
    'Lost River': '#881337', 'Ring 6': '#7f1d1d', 'Ashen Towerworks': '#7f1d1d',
    'Ring 7': '#7f1d1d', 'Ring 8': '#831843', 'The Starlit Archives': '#831843',
    'Ring 9': '#831843', 'Zone 1': '#3b82f6', 'Zone 2': '#2563eb',
    'Arcane Area': '#2563eb', 'Zone 3': '#1d4ed8', 'Paradise Atoll': '#1d4ed8',
    'Zone 4': '#0ea5e9', 'Zone 5': '#0284c7', 'Zone 6': '#0369a1',
    'Zone 7': '#06b6d4', 'Zone 8': '#0891b2', 'Zone 9': '#0e7490',
    'Zone 10': '#14b8a6', 'Default': '#6b7280'
};

export const AREA_PILL_CLASSES = {
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

export const RANK_COLORS = {
    "gold": "255, 215, 0", "silver": "192, 192, 192",
    "bronze": "205, 127, 50", "top10": "190, 0, 255"
};

export const AREA_DISPLAY_NAMES = {
    'Garden Of Eesh%C3%B6L': 'Garden Of Eeshöl'
};

export const AREA_REQUIREMENTS = {
    "Ring 1": {"total_towers": 3, "from_areas": ["Ring 0"]},
    "Ring 2": {"total_towers": 6, "difficulties": {"Medium": 1}},
    "Ring 3": {"total_towers": 10, "difficulties": {"Hard": 1}},
    "Ring 4": {"total_towers": 15, "difficulties": {"Hard": 3, "Difficult": 1}},
    "Ring 5": {"total_towers": 22, "difficulties": {"Difficult": 3, "Challenging": 1}},
    "Ring 6": {"total_towers": 30, "difficulties": {"Difficult": 5, "Challenging": 2}},
    "Ring 7": {"total_towers": 39, "difficulties": {"Challenging": 4, "Intense": 1}},
    "Ring 8": {"total_towers": 49, "difficulties": {"Challenging": 6, "Intense": 2}},
    "Ring 9": {"total_towers": 60, "difficulties": {"Intense": 4, "Remorseless": 1}},
    "Zone 1": {"total_towers": 3, "from_areas": ["Ring 0"]},
    "Zone 2": {"total_towers": 7, "difficulties": {"Medium": 1}},
    "Zone 3": {"total_towers": 12, "difficulties": {"Hard": 1}},
    "Zone 4": {"total_towers": 18, "difficulties": {"Hard": 3, "Difficult": 1}},
    "Zone 5": {"total_towers": 25, "difficulties": {"Difficult": 3, "Challenging": 1}},
    "Zone 6": {"total_towers": 33, "difficulties": {"Difficult": 5, "Challenging": 3}},
    "Zone 7": {"total_towers": 45, "difficulties": {"Challenging": 5, "Intense": 1}},
    "Zone 8": {"total_towers": 59, "difficulties": {"Challenging": 7, "Intense": 3}},
    "Zone 9": {"total_towers": 75, "difficulties": {"Intense": 5, "Remorseless": 1}},
    "Zone 10": {"total_towers": 85, "difficulties": {"Intense": 7, "Remorseless": 2}},
};