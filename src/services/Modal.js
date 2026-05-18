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
            -webkit-backdrop-filter: blur(8px);
            z-index: 11000;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        `;

        const card = document.createElement('div');
        card.className = 'glass-panel modal-card';
        card.style.cssText = `
            width: 90%;
            max-width: 520px;
            padding: 0;
            background: var(--bg-primary);
            border: 1px solid var(--glass-border);
            border-radius: 20px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            transform: scale(0.95) translateY(10px);
            transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        `;

        const header = document.createElement('div');
        header.style.cssText = `
            padding: 1.75rem 2rem 1.25rem;
            border-bottom: 1px solid var(--glass-border);
            display: flex;
            align-items: center;
            justify-content: space-between;
        `;
        header.innerHTML = `<h3 style="margin: 0; font-size: 1.25rem; font-weight: 800; letter-spacing: -0.5px;">${title}</h3>`;
        card.appendChild(header);

        const body = document.createElement('div');
        body.style.cssText = `
            padding: 2rem;
            overflow-y: auto;
            flex: 1;
        `;
        if (typeof content === 'string') {
            body.innerHTML = `<p style="color: var(--text-secondary); line-height: 1.6; font-size: 0.95rem; font-weight: 500; margin: 0;">${content}</p>`;
        } else {
            body.appendChild(content);
        }
        card.appendChild(body);

        const footer = document.createElement('div');
        footer.style.cssText = `
            padding: 1.25rem 2rem;
            background: var(--bg-secondary);
            border-top: 1px solid var(--glass-border);
            display: flex;
            gap: 0.75rem;
            justify-content: flex-end;
            align-items: center;
        `;

        if (showCancel) {
            const cancelBtn = document.createElement('button');
            cancelBtn.style.cssText = `
                background: transparent;
                border: none;
                padding: 10px 18px;
                color: var(--text-secondary);
                font-weight: 700;
                font-size: 0.85rem;
                cursor: pointer;
                border-radius: 10px;
                transition: background 0.2s;
            `;
            cancelBtn.textContent = 'Cancel';
            cancelBtn.onmouseenter = () => cancelBtn.style.background = 'rgba(0,0,0,0.05)';
            cancelBtn.onmouseleave = () => cancelBtn.style.background = 'transparent';
            cancelBtn.onclick = () => close();
            footer.appendChild(cancelBtn);
        }

        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'glass-button';
        const isDestructive = confirmText.toLowerCase().includes('delete') || confirmText.toLowerCase().includes('purge') || confirmText.toLowerCase().includes('remove');
        confirmBtn.style.cssText = `
            background: ${isDestructive ? '#ef4444' : 'var(--accent-color)'};
            color: white;
            border: none;
            padding: 10px 24px;
            border-radius: 10px;
            font-weight: 800;
            font-size: 0.85rem;
            cursor: pointer;
            box-shadow: 0 4px 12px ${isDestructive ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.2)'};
        `;
        confirmBtn.textContent = confirmText;
        confirmBtn.onclick = async () => {
            confirmBtn.disabled = true;
            confirmBtn.style.opacity = '0.7';
            if (onConfirm) {
                const result = await onConfirm();
                if (result === false) {
                    confirmBtn.disabled = false;
                    confirmBtn.style.opacity = '1';
                    return;
                }
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
        card.style.transform = 'scale(1) translateY(0)';

        const close = () => {
            overlay.style.opacity = '0';
            card.style.transform = 'scale(0.95) translateY(10px)';
            setTimeout(() => overlay.remove(), 300);
        };

        overlay.onclick = (e) => {
            if (e.target === overlay) close();
        };

        return { close };
    }

    /**
     * Confirmation short-hand
     */
    static confirm(title, message, onConfirm) {
        if (typeof title === 'object') return this.show(title);
        return this.show({
            title,
            content: message,
            onConfirm,
            confirmText: 'Confirm'
        });
    }
}
