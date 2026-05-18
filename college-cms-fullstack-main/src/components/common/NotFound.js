import { ROUTES } from '../../services/Constants.js';

export class NotFound {
    render() {
        const container = document.createElement('div');
        container.className = 'fade-in';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'center';
        container.style.minHeight = '60vh';
        container.style.textAlign = 'center';

        container.innerHTML = `
            <div class="glass-panel" style="padding: 4rem; max-width: 500px;">
                <div style="font-size: 6rem; margin-bottom: 2rem;">🚀</div>
                <h1 style="font-size: 3rem; margin-bottom: 1rem; color: #ef4444;">404</h1>
                <h2 style="margin-bottom: 1.5rem;">Page Not Found</h2>
                <p style="color: var(--text-secondary); margin-bottom: 2.5rem;">The module you are looking for might have been moved, deleted, or is temporarily unavailable.</p>
                <button class="glass-button" style="padding: 12px 30px;" onclick="window.location.hash='${ROUTES.DASHBOARD}'">
                    Return to Mission Control
                </button>
            </div>
        `;

        return container;
    }
}
