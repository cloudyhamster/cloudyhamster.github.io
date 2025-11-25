class StateManager {
    constructor() {
        this.state = {
            allTowers: [],
            currentUser: null,
            leaderboard: null,
            currentView: 'chart',
            sessionStats: {
                played: 0,
                wins: 0,
                totalGuesses: 0,
                bestGame: null
            }
        };
        this.listeners = [];
    }

    get allTowers() { return this.state.allTowers; }
    get currentUser() { return this.state.currentUser; }
    get beatenTowers() { return this.state.currentUser ? this.state.currentUser.beaten_towers : []; }
    get leaderboard() { return this.state.leaderboard; }
    get sessionStats() { return this.state.sessionStats; }
    
    setAllTowers(towers) {
        this.state.allTowers = towers;
        this.notify('towersLoaded', towers);
    }

    setCurrentUser(userData) {
        this.state.currentUser = userData;
        this.notify('userChanged', userData);
    }

    setLeaderboard(data) {
        this.state.leaderboard = data;
        this.notify('leaderboardUpdated', data);
    }

    updateSessionStats(stats) {
        this.state.sessionStats = { ...this.state.sessionStats, ...stats };
        this.notify('statsUpdated', this.state.sessionStats);
    }

    subscribe(event, callback) {
        this.listeners.push({ event, callback });
    }

    notify(event, data) {
        this.listeners
            .filter(l => l.event === event)
            .forEach(l => l.callback(data));
    }
}

export const store = new StateManager();