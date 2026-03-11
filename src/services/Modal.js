export class Modal {
    /**
     * Show a generic modal with options
     * @param {Object} options 
     */
    static show(options) {
        const { title, content, confirmText = 'OK', onConfirm = null, showCancel = true } = options;

        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(8px);
            z-index: 11000;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        const card = document.createElement('div');
        card.className = 'glass-panel';
        card.style.cssText = `
            width: 90%;
            max-width: 600px;
            padding: 2rem;
            transform: scale(0.9);
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            max-height: 90vh;
            overflow-y: auto;
        `;

        const header = document.createElement('div');
        header.innerHTML = `<h3 style="margin-bottom: 1.5rem; font-size: 1.5rem;">${title}</h3>`;
        card.appendChild(header);

        const body = document.createElement('div');
        if (typeof content === 'string') {
            body.innerHTML = `<p style="color: var(--text-secondary); margin-bottom: 2rem;">${content}</p>`;
        } else {
            body.style.marginBottom = '2rem';
            body.appendChild(content);
        }
        card.appendChild(body);

        const footer = document.createElement('div');
        footer.style.display = 'flex';
        footer.style.gap = '1rem';
        footer.style.justifyContent = 'flex-end';

        if (showCancel) {
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'glass-button';
            cancelBtn.textContent = 'Cancel';
            cancelBtn.onclick = () => close();
            footer.appendChild(cancelBtn);
        }

        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'glass-button';
        confirmBtn.style.background = (confirmText === 'Delete' || confirmText === 'Confirm') ? 'var(--danger)' : 'var(--accent-color)';
        confirmBtn.style.border = 'none';
        confirmBtn.textContent = confirmText;
        confirmBtn.onclick = async () => {
            if (onConfirm) {
                const result = await onConfirm();
                if (result === false) return; // Keep modal if validation fails
            }
            close();
        };
        footer.appendChild(confirmBtn);

        card.appendChild(footer);
        overlay.appendChild(card);
        document.body.appendChild(overlay);

        // Force reflow
        overlay.offsetHeight;
        overlay.style.opacity = '1';
        card.style.transform = 'scale(1)';

        const close = () => {
            overlay.style.opacity = '0';
            card.style.transform = 'scale(0.9)';
            setTimeout(() => overlay.remove(), 300);
        };

        overlay.onclick = (e) => {
            if (e.target === overlay) close();
        };

        return { close };
    }

    /**
     * Preserved old method signature but uses new implementation
     */
    static confirm(title, message, onConfirm) {
        if (typeof title === 'object') {
            return this.show(title);
        }
        return this.show({
            title,
            content: message,
            onConfirm,
            confirmText: 'Confirm'
        });
    }
}
