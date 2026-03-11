export class Toast {
    static init() {
        if (document.getElementById('toast-container')) return;

        const container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed;
            top: 2rem;
            right: 2rem;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 1rem;
            pointer-events: none;
        `;
        document.body.appendChild(container);

        const style = document.createElement('style');
        style.textContent = `
            .toast-item {
                min-width: 300px;
                background: rgba(15, 23, 42, 0.9);
                backdrop-filter: blur(12px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: white;
                padding: 1rem 1.5rem;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
                display: flex;
                align-items: center;
                gap: 0.75rem;
                transform: translateX(120%);
                transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                pointer-events: auto;
            }
            .toast-item.show {
                transform: translateX(0);
            }
            .toast-item.success { border-left: 4px solid #10b981; }
            .toast-item.error { border-left: 4px solid #ef4444; }
            .toast-item.info { border-left: 4px solid #3b82f6; }
            .toast-item.warning { border-left: 4px solid #f59e0b; }
            .toast-icon { font-size: 1.25rem; }
            .toast-content { flex: 1; }
            .toast-title { font-weight: 600; font-size: 0.95rem; }
            .toast-msg { font-size: 0.85rem; color: #94a3b8; margin-top: 0.1rem; }
        `;
        document.head.appendChild(style);
    }

    static show(title, message, type = 'success', duration = 4000) {
        this.init();
        const container = document.getElementById('toast-container');

        const toast = document.createElement('div');
        toast.className = `toast-item ${type}`;

        const icons = {
            success: '✅',
            error: '❌',
            info: 'ℹ️',
            warning: '⚠️'
        };

        toast.innerHTML = `
            <div class="toast-icon">${icons[type]}</div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-msg">${message}</div>
            </div>
        `;

        container.appendChild(toast);

        // Force reflow
        toast.offsetHeight;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, duration);
    }

    static success(msg) { this.show('Success', msg, 'success'); }
    static error(msg) { this.show('Error', msg, 'error'); }
    static info(msg) { this.show('Notice', msg, 'info'); }
    static warning(msg) { this.show('Warning', msg, 'warning'); }
}
