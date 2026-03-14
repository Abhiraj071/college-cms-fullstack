export class Login {
    constructor(loginCallback) {
        this.loginCallback = loginCallback;
    }

    render() {
        const container = document.createElement('div');
        // Container Setup
        container.style.display = 'flex';
        container.style.height = '100vh';
        container.style.width = '100vw';
        container.style.overflow = 'hidden';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'center';
        container.style.background = 'var(--bg-primary)';
        container.className = 'fade-in';

        // Professional Clean Login Panel
        const loginPanel = document.createElement('div');
        loginPanel.style.width = '100%';
        loginPanel.style.maxWidth = '380px';
        loginPanel.style.padding = '2.5rem 2rem';
        loginPanel.style.background = 'var(--bg-secondary)';
        loginPanel.style.borderRadius = '12px';
        loginPanel.style.border = '1px solid var(--glass-border)';
        loginPanel.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)';
        loginPanel.style.margin = '1rem';
        loginPanel.style.color = 'var(--text-primary)';
        loginPanel.style.boxSizing = 'border-box';

        loginPanel.innerHTML = `
            <div style="margin-bottom: 2rem; text-align: center;">
                <h1 style="color: var(--text-primary); font-size: 1.7rem; letter-spacing: -0.5px; margin: 0; font-weight: 700;">College OS</h1>
                <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.5rem; margin-bottom: 0;">Sign in to your dashboard</p>
            </div>

            <div style="margin-bottom: 1.25rem;">
                <label style="display: block; margin-bottom: 0.35rem; color: var(--text-primary); font-weight: 600; font-size: 0.85rem;">Username</label>
                <input type="text" id="username" placeholder="Enter username" style="width: 100%; background: var(--bg-primary); border: 1px solid var(--glass-border); color: var(--text-primary); border-radius: 8px; padding: 12px 14px; outline: none; transition: all 0.2s; box-sizing: border-box; font-size: 0.95rem;" onfocus="this.style.borderColor='var(--accent-color)'; this.style.boxShadow='0 0 0 3px var(--accent-glow)';" onblur="this.style.borderColor='var(--glass-border)'; this.style.boxShadow='none';" autocomplete="off">
            </div>
            
            <div style="margin-bottom: 2rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.35rem;">
                    <label style="color: var(--text-primary); font-weight: 600; font-size: 0.85rem;">Password</label>
                    <a href="#" style="color: var(--accent-color); font-size: 0.8rem; text-decoration: none; font-weight: 600; transition: color 0.2s;" onmouseover="this.style.color='var(--accent-hover)'" onmouseout="this.style.color='var(--accent-color)'">Forgot?</a>
                </div>
                <input type="password" id="password" placeholder="••••••••" style="width: 100%; background: var(--bg-primary); border: 1px solid var(--glass-border); color: var(--text-primary); border-radius: 8px; padding: 12px 14px; outline: none; transition: all 0.2s; box-sizing: border-box; font-size: 0.95rem;" onfocus="this.style.borderColor='var(--accent-color)'; this.style.boxShadow='0 0 0 3px var(--accent-glow)';" onblur="this.style.borderColor='var(--glass-border)'; this.style.boxShadow='none';">
            </div>

            <button id="loginBtn" style="width: 100%; padding: 12px; font-size: 0.95rem; font-weight: 600; margin-bottom: 1.5rem; background: var(--accent-color); border: none; color: white; border-radius: 8px; cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05);" onmouseover="this.style.background='var(--accent-hover)'" onmouseout="this.style.background='var(--accent-color)'">
                Sign In
            </button>

            <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--glass-border);">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 1rem;">
                    <span style="font-size: 0.70rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; width: 100%; text-align: center;">Demo Access</span>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <button type="button" onclick="document.getElementById('username').value='admin'; document.getElementById('password').value='admin123';" style="padding: 10px; background: var(--bg-primary); border: 1px solid var(--glass-border); border-radius: 6px; text-align: left; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.borderColor='var(--text-secondary)'" onmouseout="this.style.borderColor='var(--glass-border)'">
                        <div style="font-size: 0.7rem; color: var(--text-primary); font-weight: 600; margin-bottom: 2px;">Admin</div>
                        <code style="font-size: 0.75rem; color: var(--text-secondary); background: transparent; padding: 0;">admin123</code>
                    </button>
                    <button type="button" onclick="document.getElementById('username').value='student'; document.getElementById('password').value='password';" style="padding: 10px; background: var(--bg-primary); border: 1px solid var(--glass-border); border-radius: 6px; text-align: left; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.borderColor='var(--text-secondary)'" onmouseout="this.style.borderColor='var(--glass-border)'">
                        <div style="font-size: 0.7rem; color: var(--text-primary); font-weight: 600; margin-bottom: 2px;">Student</div>
                        <code style="font-size: 0.75rem; color: var(--text-secondary); background: transparent; padding: 0;">password</code>
                    </button>
                </div>
            </div>
        `;

        const btn = loginPanel.querySelector('#loginBtn');
        btn.onclick = async () => {
            const userField = loginPanel.querySelector('#username');
            const passField = loginPanel.querySelector('#password');
            const user = userField.value;
            const pass = passField.value;

            if (!user || !pass) {
                userField.style.borderColor = 'var(--danger)';
                passField.style.borderColor = 'var(--danger)';
                setTimeout(() => {
                    userField.style.borderColor = 'var(--glass-border)';
                    passField.style.borderColor = 'var(--glass-border)';
                }, 1500);
                return;
            }

            const originalText = btn.innerHTML;
            btn.innerHTML = `
                <svg class="spinner" viewBox="0 0 50 50" style="width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block; vertical-align: middle;"></svg>
                <span style="display: inline-block; vertical-align: middle; margin-left: 8px;">Signing In...</span>
            `;
            btn.disabled = true;

            try {
                await this.loginCallback(user, pass);
            } catch (err) {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        };

        container.appendChild(loginPanel);
        return container;
    }
}
