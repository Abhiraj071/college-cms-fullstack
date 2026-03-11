export class Login {
    constructor(loginCallback) {
        this.loginCallback = loginCallback;
    }

    render() {
        const container = document.createElement('div');
        container.className = 'container fade-in';
        container.style.display = 'flex';
        container.style.justifyContent = 'center';
        container.style.alignItems = 'center';
        container.style.height = '100vh';

        const card = document.createElement('div');
        card.className = 'glass-panel';
        card.style.padding = '3rem';
        card.style.width = '100%';
        card.style.maxWidth = '400px';
        card.style.textAlign = 'center';

        card.innerHTML = `
            <div style="margin-bottom: 2rem;">
                <h1 style="background: linear-gradient(135deg, #fff, #94a3b8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 2.5rem;">CollegeOS</h1>
                <p style="color: var(--text-secondary);">Academic Management System</p>
            </div>
            
            <div style="margin-bottom: 1.5rem; text-align: left;">
                <label style="display: block; margin-bottom: 0.5rem; color: var(--text-secondary); font-size: 0.9rem;">Username</label>
                <input type="text" id="username" placeholder="admin" style="width: 100%; padding: 12px; border-radius: var(--radius-sm); border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); color: white; outline: none; transition: all 0.3s ease;">
            </div>
            <div style="margin-bottom: 2rem; text-align: left;">
                <label style="display: block; margin-bottom: 0.5rem; color: var(--text-secondary); font-size: 0.9rem;">Password</label>
                <input type="password" id="password" placeholder="password" style="width: 100%; padding: 12px; border-radius: var(--radius-sm); border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); color: white; outline: none; transition: all 0.3s ease;">
            </div>
            <button id="loginBtn" class="glass-button" style="width: 100%; padding: 14px;">Sign In</button>
            
            <div style="margin-top: 2rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1rem;">
                <p style="font-size: 0.8rem; color: var(--text-secondary);">Demo Credentials:</p>
                <div style="display: flex; gap: 10px; justify-content: center; margin-top: 0.5rem; font-size: 0.8rem; color: var(--accent-color);">
                    <span>admin/password</span>
                    <span>student/password</span>
                </div>
            </div>
        `;

        // Add event listeners after attaching to DOM
        /** @type {HTMLButtonElement} */
        const btn = card.querySelector('#loginBtn');
        btn.onclick = async () => {
            const user = /** @type {HTMLInputElement} */ (card.querySelector('#username')).value;
            const pass = /** @type {HTMLInputElement} */ (card.querySelector('#password')).value;

            if (!user || !pass) return;

            const originalText = btn.textContent;
            btn.textContent = 'Signing in...';
            btn.disabled = true;
            btn.style.opacity = '0.7';

            try {
                await this.loginCallback(user, pass);
            } finally {
                btn.textContent = originalText;
                btn.disabled = false;
                btn.style.opacity = '1';
            }
        };

        // Add input focus effects
        const inputs = card.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                input.style.borderColor = 'var(--accent-color)';
                input.style.background = 'rgba(0,0,0,0.4)';
            });
            input.addEventListener('blur', () => {
                input.style.borderColor = 'rgba(255,255,255,0.1)';
                input.style.background = 'rgba(0,0,0,0.2)';
            });
        });

        container.appendChild(card);
        return container;
    }
}
