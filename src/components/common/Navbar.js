import { ThemeService } from '../../services/ThemeService.js';

export class Navbar {
    constructor(title, logoutCallback) {
        this.title = title;
        this.logoutCallback = logoutCallback;
    }

    render() {
        const nav = document.createElement('nav');
        nav.className = 'glass-panel';
        nav.style.cssText = `
            margin-bottom: 2rem;
            padding: 1rem 1.5rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;

        nav.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem;">
                <button id="menuToggle" class="glass-button" style="display: none; padding: 8px; background: rgba(0,0,0,0.05); color: var(--text-primary);">
                    ☰
                </button>
                <h2 style="margin: 0; font-size: 1.2rem;">${this.title}</h2>
            </div>
            <div style="display: flex; gap: 0.75rem;">
                <button id="themeToggle" class="glass-button" title="Switch Theme" style="padding: 8px 12px; font-size: 1.2rem;">
                    ${ThemeService.getCurrentTheme() === 'dark' ? '☀️' : '🌙'}
                </button>
                <button id="logoutBtn" class="glass-button" style="padding: 8px 16px; background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3); color: #fca5a5; font-size: 0.9rem;">
                    Logout
                </button>
            </div>
        `;

        // CSS to show toggle only on mobile
        const style = document.createElement('style');
        style.textContent = `
            @media (max-width: 1024px) {
                #menuToggle { display: block !important; }
            }
        `;
        nav.appendChild(style);

        nav.querySelector('#menuToggle').addEventListener('click', () => {
            const sidebar = document.querySelector('.sidebar');
            const backdrop = document.querySelector('.sidebar-backdrop');
            if (sidebar) sidebar.classList.toggle('open');
            if (backdrop) backdrop.classList.toggle('active');
        });

        nav.querySelector('#themeToggle').addEventListener('click', (e) => {
            const newTheme = ThemeService.cycleNext();
            e.currentTarget.innerHTML = newTheme === 'dark' ? '☀️' : '🌙';
        });

        nav.querySelector('#logoutBtn').addEventListener('click', this.logoutCallback);
        return nav;
    }
}

