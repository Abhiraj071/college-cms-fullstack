import { ThemeService }       from '../../services/ThemeService.js';
import { NotificationBell }   from './NotificationBell.js';
import { globalSearch }       from './GlobalSearch.js';

export class Navbar {
    constructor(title, logoutCallback) {
        this.title          = title;
        this.logoutCallback = logoutCallback;
    }

    render() {
        const nav = document.createElement('nav');
        nav.className = 'glass-panel';
        nav.style.cssText = `
            margin-bottom: 2rem; padding: 0.75rem 1.5rem;
            display: flex; justify-content: space-between; align-items: center;
        `;

        // Left: hamburger + title
        const left = document.createElement('div');
        left.style.cssText = 'display:flex;align-items:center;gap:0.75rem;';
        left.innerHTML = `
            <button id="menuToggle" class="glass-button" style="
                display:none; padding:8px 10px; background:var(--bg-secondary)!important;
                border:1px solid var(--glass-border)!important; color:var(--text-primary)!important; font-size:1.1rem;
            ">☰</button>
            <h2 style="margin:0;font-size:1.15rem;">${this.title}</h2>
        `;

        // Right: search + notifications + theme + logout
        const right = document.createElement('div');
        right.style.cssText = 'display:flex;align-items:center;gap:0.5rem;';

        // Search button
        const searchBtn = document.createElement('button');
        searchBtn.title = 'Global Search (Ctrl+K)';
        searchBtn.style.cssText = `
            padding:8px 14px; border-radius:var(--radius-sm); border:1px solid var(--glass-border);
            background:var(--bg-secondary); color:var(--text-secondary); cursor:pointer;
            font-size:0.85rem; display:flex; align-items:center; gap:6px; transition:all 0.2s;
            min-width:180px; justify-content:space-between;
        `;
        searchBtn.innerHTML = `<span style="display:flex;align-items:center;gap:6px;">🔍 <span style="color:var(--text-secondary);">Search anything…</span></span><kbd style="font-size:0.65rem;padding:2px 6px;background:var(--bg-primary);border:1px solid var(--glass-border);border-radius:4px;color:var(--text-secondary);">Ctrl K</kbd>`;
        searchBtn.addEventListener('click', () => globalSearch.mount());

        // Notification bell
        const bell = new NotificationBell();
        const bellEl = bell.render();

        // Theme toggle
        const themeBtn = document.createElement('button');
        themeBtn.title = 'Toggle Theme';
        themeBtn.style.cssText = `
            padding:8px 12px; border-radius:var(--radius-sm); border:1px solid var(--glass-border);
            background:var(--bg-secondary); color:var(--text-primary); cursor:pointer; font-size:1.1rem;
            transition:all 0.2s;
        `;
        themeBtn.textContent = ThemeService.getCurrentTheme() === 'dark' ? '☀️' : '🌙';
        themeBtn.addEventListener('click', () => {
            const t = ThemeService.cycleNext();
            themeBtn.textContent = t === 'dark' ? '☀️' : '🌙';
        });

        // Logout
        const logoutBtn = document.createElement('button');
        logoutBtn.textContent = 'Logout';
        logoutBtn.style.cssText = `
            padding:8px 16px; border-radius:var(--radius-sm);
            background:rgba(239,68,68,0.1)!important; border:1px solid rgba(239,68,68,0.3)!important;
            color:var(--danger)!important; font-weight:700; font-size:0.9rem; cursor:pointer;
            transition:all 0.2s;
        `;
        logoutBtn.addEventListener('click', this.logoutCallback);

        right.appendChild(searchBtn);
        right.appendChild(bellEl);
        right.appendChild(themeBtn);
        right.appendChild(logoutBtn);

        nav.appendChild(left);
        nav.appendChild(right);

        // Show hamburger only on mobile
        const style = document.createElement('style');
        style.textContent = `
            @media (max-width: 1024px) {
                #menuToggle { display:flex !important; }
            }
            @media (max-width: 768px) {
                nav .search-btn-label { display:none; }
            }
        `;
        nav.appendChild(style);

        left.querySelector('#menuToggle').addEventListener('click', () => {
            const sidebar  = document.querySelector('.sidebar');
            const backdrop = document.querySelector('.sidebar-backdrop');
            if (sidebar)  sidebar.classList.toggle('open');
            if (backdrop) backdrop.classList.toggle('active');
        });

        // Global Ctrl+K shortcut
        const handler = e => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                globalSearch.mount();
            }
        };
        document.addEventListener('keydown', handler);
        // Clean up when nav is removed from DOM
        nav._cleanup = () => document.removeEventListener('keydown', handler);

        return nav;
    }
}
