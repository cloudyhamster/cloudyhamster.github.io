import { api } from '../api.js';
import { store } from '../state.js';
import { showNotification } from '../utils.js';

export async function initAuth() {
    const authContainer = document.getElementById('auth-container');
    
    if (api.token) {
        try {
            const res = await api.getMe();
            if (res.success && res.user) {
                store.setAuthUser(res.user);
            } else {
                api.logout();
            }
        } catch (e) {
            api.logout();
        }
    }

    renderAuthUI();
    store.subscribe('authChanged', renderAuthUI);
}

function renderAuthUI() {
    const container = document.getElementById('auth-container');
    if (!container) return;
    
    const user = store.authUser;

    if (user) {
        container.innerHTML = `
            <div class="relative group">
                <button class="flex items-center gap-2 pl-2.5 pr-1 py-1.5 bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 rounded-lg transition-all duration-200 group-hover:shadow-lg relative z-20">
                    <img src="${user.avatar}" class="w-6 h-6 rounded-md object-cover bg-black/50 shadow-sm">
                    <span class="text-xs font-bold text-gray-200 hidden md:block tracking-wide group-hover:text-white transition-colors">
                        ${user.display}
                    </span>
                    <svg class="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"></path>
                    </svg>
                </button>
                
                <div class="absolute right-0 top-full pt-2 w-48 hidden group-hover:block z-50">
                    <div class="bg-[#1C1C22] border border-white/10 rounded-xl shadow-2xl overflow-hidden ring-1 ring-white/5">
                        <div class="p-3 border-b border-white/5 bg-white/[0.02]">
                            <p class="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-0.5">Signed in as</p>
                            <p class="text-xs text-white font-mono truncate">@${user.name}</p>
                        </div>
                        <div class="p-1">
                            <button id="nav-claim-profile" class="w-full text-left px-3 py-2 text-xs font-medium text-gray-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors flex items-center gap-2.5">
                                <span class="material-symbols-outlined text-sm">person</span> My Profile
                            </button>
                            <button id="btn-logout" class="w-full text-left px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors flex items-center gap-2.5">
                                <span class="material-symbols-outlined text-sm">logout</span> Log Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('btn-logout').addEventListener('click', () => {
            api.logout();
            store.setAuthUser(null);
            showNotification('Logged out successfully.', 'success');
        });

        document.getElementById('nav-claim-profile').addEventListener('click', () => {
            const searchInput = document.getElementById('searchInput');
            if (searchInput) searchInput.value = user.name;

            if (window.performSearch) {
                window.performSearch(user.name, { profileOnly: true });
            }
        });

    } else {
        container.innerHTML = `
            <button id="login-btn" class="flex items-center gap-3 pl-3 pr-4 py-1.5 bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 rounded-lg transition-all duration-200 active:scale-95 group">
                <span class="material-symbols-outlined text-[18px] text-gray-400 group-hover:text-white transition-colors">login</span>

                <div class="w-px h-3.5 bg-white/10 group-hover:bg-white/20 transition-colors"></div>

                <span id="login-text" class="text-xs font-bold text-gray-400 group-hover:text-white uppercase tracking-wider transition-colors">
                    Log In
                </span>
            </button>
        `;
        
        document.getElementById('login-btn').addEventListener('click', async () => {
            const btn = document.getElementById('login-btn');
            const textSpan = document.getElementById('login-text');
            textSpan.textContent = "Wait...";
            btn.classList.add('cursor-wait', 'opacity-80');
            btn.disabled = true;
            try {
                const url = await api.getAuthUrl();
                window.location.href = url;
            } catch (e) {
                showNotification('Failed to initialize login.', 'error');
                renderAuthUI();
            }
        });
    }
}