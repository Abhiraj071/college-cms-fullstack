export class Toast {
    static init() {
        if (document.getElementById('toast-container')) return;

        const container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            z-index: 20000;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            pointer-events: none;
        `;
        document.body.appendChild(container);

        const style = document.createElement('style');
        style.textContent = `
            .toast-item {
                min-width: 320px;
                max-width: 400px;
                background: var(--bg-primary);
                border: 1px solid var(--glass-border);
                color: var(--text-primary);
                padding: 1rem 1.25rem;
                border-radius: 16px;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
                display: flex;
                align-items: center;
                gap: 1rem;
                transform: translateX(120%);
                transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                pointer-events: auto;
                position: relative;
                overflow: hidden;
            }
            .toast-item.show {
                transform: translateX(0);
            }
            .toast-status-line {
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                width: 4px;
            }
            .toast-item.success .toast-status-line { background: var(--success); }
            .toast-item.error .toast-status-line { background: var(--danger); }
            .toast-item.info .toast-status-line { background: var(--accent-color); }
            .toast-item.warning .toast-status-line { background: var(--warning); }
            
            .toast-icon-box {
                width: 32px;
                height: 32px;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.1rem;
            }
            .toast-item.success .toast-icon-box { background: rgba(16, 185, 129, 0.1); color: var(--success); }
            .toast-item.error .toast-icon-box { background: rgba(239, 68, 68, 0.1); color: var(--danger); }
            .toast-item.info .toast-icon-box { background: var(--accent-glow); color: var(--accent-color); }
            .toast-item.warning .toast-icon-box { background: rgba(245, 158, 11, 0.1); color: var(--warning); }

            .toast-content { flex: 1; }
            .toast-title { font-weight: 800; font-size: 0.9rem; letter-spacing: -0.2px; }
            .toast-msg { font-size: 0.8rem; color: var(--text-secondary); font-weight: 500; margin-top: 2px; }
        `;
        document.head.appendChild(style);
    }

    static show(title, message, type = 'success', duration = 4000) {
        this.init();
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast-item ${type}`;

        const icons = {
            success: '✓',
            error: '✕',
            info: 'i',
            warning: '!'
        };

        toast.innerHTML = `
            <div class="toast-status-line"></div>
            <div class="toast-icon-box">${icons[type]}</div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-msg">${message}</div>
            </div>
        `;

        container.appendChild(toast);
        toast.offsetHeight;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, duration);
    }

    static success(msg) { this.show('Confirmed', msg, 'success'); }
    static error(msg) { this.show('Error', msg, 'error'); }
    static info(msg) { this.show('Sync Information', msg, 'info'); }
    static warning(msg) { this.show('Action Required', msg, 'warning'); }
}
