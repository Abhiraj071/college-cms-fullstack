export class ThemeService {
    static THEMES = {
        INDIGO: { name: 'Indigo', color: '#6366F1', hover: '#4F46E5', glow: 'rgba(99, 102, 241, 0.1)' },
        EMERALD: { name: 'Emerald', color: '#10B981', hover: '#059669', glow: 'rgba(16, 185, 129, 0.1)' },
        ROSE: { name: 'Rose', color: '#F43F5E', hover: '#E11D48', glow: 'rgba(244, 63, 94, 0.1)' },
        AMBER: { name: 'Amber', color: '#F59E0B', hover: '#D97706', glow: 'rgba(245, 158, 11, 0.1)' },
        VIOLET: { name: 'Violet', color: '#8B5CF6', hover: '#7C3AED', glow: 'rgba(139, 92, 246, 0.1)' }
    };

    static init() {
        const mode = localStorage.getItem('theme-mode') || 'light';
        const accent = localStorage.getItem('theme-accent') || 'VIOLET'; // Default to Violet accent to match purple theme
        
        this.setMode(mode);
        this.setAccent(accent);
    }

    static setMode(mode) {
        document.documentElement.setAttribute('data-theme', mode);
        localStorage.setItem('theme-mode', mode);
    }

    static setAccent(themeKey) {
        const theme = this.THEMES[themeKey];
        if (!theme) return;

        const root = document.documentElement;
        root.style.setProperty('--accent-color', theme.color);
        root.style.setProperty('--accent-hover', theme.hover);
        root.style.setProperty('--accent-glow', theme.glow);
        
        localStorage.setItem('theme-accent', themeKey);
    }

    static getMode() {
        return localStorage.getItem('theme-mode') || 'light';
    }

    static getAccent() {
        return localStorage.getItem('theme-accent') || 'INDIGO';
    }

    // Compatibility for legacy Navbar.js
    static getCurrentTheme() {
        return this.getMode();
    }

    static cycleNext() {
        const next = this.getMode() === 'light' ? 'dark' : 'light';
        this.setMode(next);
        return next;
    }
}
