import { API_BASE_URL } from './config.js';

class ApiClient {
    async get(endpoint, params = {}) {
        const url = new URL(`${API_BASE_URL}${endpoint}`);
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
        
        const response = await fetch(url);
        if (response.status === 429) throw new Error('Rate limit exceeded. Please wait a moment.');
        
        const result = await response.json();
        if (!result.success && !endpoint.includes('health')) {
             throw new Error(result.error || 'API Request failed');
        }
        return result;
    }

    async getMasterTowers() {
        const res = await this.get('/api/get_master_towers');
        return res.towers;
    }

    async getPlayerData(username, forceRefresh = false) {
        return await this.get('/api/get_player_data', { 
            username, 
            force_refresh: forceRefresh 
        });
    }

    async getLeaderboard() {
        const res = await this.get('/api/get_leaderboard');
        return res.leaderboard;
    }

    async getBadgeStats(badgeId) {
        const url = `https://badges.roproxy.com/v1/badges/${badgeId}`;
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Roblox API Error: ${res.status}`);
            return await res.json();
        } catch (e) {
            console.error("Failed to fetch badge stats", e);
            return null;
        }
    }
}

export const api = new ApiClient();