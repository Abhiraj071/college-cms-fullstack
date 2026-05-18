import { auth } from './services/AuthService.js';
import { router } from './services/Router.js';
import { ROUTES } from './services/Constants.js';
import { Login } from './components/Login.js';
import { Layout } from './components/common/Layout.js';
import { NotFound } from './components/common/NotFound.js';
import { Toast } from './services/Toast.js';
import { ThemeService } from './services/ThemeService.js';

class App {
    constructor() {
        this.appElement = document.getElementById('app');
        // Final cleanup of global scope
        delete window['CMS'];
        this.init();
    }

    init() {
        ThemeService.init();
        auth.checkSession();
        this.handleRouting();
        window.addEventListener('hashchange', () => this.handleRouting());
    }

    handleRouting() {
        const hash = window.location.hash.substring(1) || ROUTES.DASHBOARD;

        if (!auth.isAuthenticated()) {
            if (hash !== ROUTES.LOGIN) {
                window.location.hash = ROUTES.LOGIN;
                return;
            }
            this.render();
            return;
        }

        if (hash === ROUTES.LOGIN) {
            window.location.hash = ROUTES.DASHBOARD;
            return;
        }

        this.render();
    }

    render() {
        this.appElement.innerHTML = '';
        const hash = window.location.hash.substring(1) || ROUTES.DASHBOARD;

        if (!auth.isAuthenticated()) {
            this.renderLogin();
        } else {
            this.renderAuthenticated(hash);
        }
    }

    renderLogin() {
        const loginComponent = new Login(async (username, password) => {
            try {
                if (await auth.login(username, password)) {
                    window.location.hash = ROUTES.DASHBOARD;
                } else {
                    Toast.error('Invalid credentials. Please check your username and password.');
                }
            } catch (err) {
                Toast.error(err.message || 'Server connection failed. Is the backend running?');
            }
        });
        this.appElement.appendChild(loginComponent.render());
    }

    renderAuthenticated(hash) {
        const user = auth.getUser();
        const routeInfo = router.getRouteInfo(hash);

        // Determine Page Title
        let title = 'ERP Dashboard';
        if (routeInfo.path !== ROUTES.DASHBOARD && routeInfo.path) {
            title = routeInfo.path.split('/')[0].toUpperCase().replace('-', ' ');
        }

        const layoutComp = new Layout(user, () => {
            auth.logout();
            window.location.hash = ROUTES.LOGIN;
        });

        const { element, contentContainer } = layoutComp.render(title);
        this.appElement.appendChild(element);

        // RBAC Check BEFORE loading content
        if (!routeInfo.config || !routeInfo.config.roles.includes(user.role)) {
            setTimeout(() => {
                contentContainer.classList.remove('loading');
                if (!routeInfo.config) {
                    this.renderNotFound(contentContainer, routeInfo.path);
                } else {
                    this.renderUnauthorized(contentContainer);
                }
            }, 300);
            return;
        }

        // Load Page Content
        setTimeout(() => {
            contentContainer.classList.remove('loading');
            try {
                const params = Object.fromEntries(routeInfo.params.entries());
                const component = routeInfo.config.dynamicId
                    ? new routeInfo.config.component(routeInfo.config.dynamicId, params)
                    : new routeInfo.config.component(null, params);

                contentContainer.appendChild(component.render());
            } catch (e) {
                console.error('Render Error:', e);
                contentContainer.innerHTML = `
                    <div class="glass-panel" style="padding: 2rem; color: #ef4444;">
                        <h3>System Error</h3>
                        <p>Unable to load the requested module. Please try again later.</p>
                    </div>`;
            }
        }, 300);
    }

    renderUnauthorized(container) {
        container.innerHTML = `
            <div class="glass-panel fade-in" style="padding: 4rem; text-align: center;">
                <div style="font-size: 4rem; margin-bottom: 1.5rem;">🚫</div>
                <h2 style="color: #ef4444; margin-bottom: 1rem;">Access Denied</h2>
                <p style="color: var(--text-secondary); max-width: 400px; margin: 0 auto 2rem;">You do not have the required permissions to access this administrative module.</p>
                <button class="glass-button" onclick="window.location.hash='${ROUTES.DASHBOARD}'">Return to Security</button>
            </div>
        `;
    }

    renderNotFound(container, path) {
        const notFound = new NotFound();
        container.innerHTML = '';
        container.appendChild(notFound.render());
    }
}

new App();
