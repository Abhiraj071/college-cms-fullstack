export const ThemeService = {
    THEMES: {
        LIGHT: 'light',
        DARK: 'dark'
    },

    init() {
        const savedTheme = localStorage.getItem('app-theme') || this.THEMES.LIGHT;
        this.setTheme(savedTheme);
    },

    setTheme(theme) {
        if (!Object.values(this.THEMES).includes(theme)) {
            console.warn(`Invalid theme: ${theme}`);
            this.setTheme(this.THEMES.LIGHT);
            return;
        }

        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('app-theme', theme);
    },

    getCurrentTheme() {
        return localStorage.getItem('app-theme') || this.THEMES.LIGHT;
    },

    cycleNext() {
        const current = this.getCurrentTheme();
        const next = current === this.THEMES.LIGHT ? this.THEMES.DARK : this.THEMES.LIGHT;
        this.setTheme(next);
        return next;
    }
};

