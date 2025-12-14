import { API_BASE_URL } from './config.js';

class ApiClient {
    constructor() {
        this.token = localStorage.getItem('etoh_auth_token');
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('etoh_auth_token', token);
    }

    logout() {
        this.token = null;
        localStorage.removeItem('etoh_auth_token');
    }

    async get(endpoint, params = {}) {
        const url = new URL(`${API_BASE_URL}${endpoint}`);
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
        
        const headers = {};
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(url, { headers });
        if (response.status === 429) throw new Error('Rate limit exceeded.');
        
        const result = await response.json();
        if (!result.success && !endpoint.includes('health') && !endpoint.includes('auth/me')) {
             throw new Error(result.error || 'API Request failed');
        }
        return result;
    }

    async post(endpoint, body) {
        const url = `${API_BASE_URL}${endpoint}`;
        const headers = { 'Content-Type': 'application/json' };
        if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });

        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Request failed');
        return result;
    }

    async getMasterTowers() {
        const res = await this.get('/api/get_master_towers');
        return res.towers;
    }

    async getPlayerData(username, forceRefresh = false, profileOnly = false) {
        return await this.get('/api/get_player_data', { 
            username, 
            force_refresh: forceRefresh,
            profile_only: profileOnly 
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

    async getAuthUrl() {
        const res = await this.get('/auth/login');
        return res.url;
    }

    async getMe() {
        return await this.get('/auth/me');
    }
}

export const api = new ApiClient();