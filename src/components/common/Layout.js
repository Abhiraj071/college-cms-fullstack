import { Sidebar } from './Sidebar.js';
import { Navbar } from './Navbar.js';

export class Layout {
    constructor(user, logoutCallback) {
        this.user = user;
        this.logoutCallback = logoutCallback;
    }

    render(routeTitle) {
        const layout = document.createElement('div');
        layout.className = 'main-layout';

        // Sidebar
        const sidebar = new Sidebar(this.user);
        layout.appendChild(sidebar.render());

        // Main Content Area
        const main = document.createElement('div');
        main.className = 'main-content';

        // Top Navbar
        const navbar = new Navbar(routeTitle, this.logoutCallback);
        main.appendChild(navbar.render());

        // Page Content placeholder
        const contentContainer = document.createElement('div');
        contentContainer.id = 'page-content';
        contentContainer.className = 'loading';

        main.appendChild(contentContainer);
        layout.appendChild(main);

        return {
            element: layout,
            contentContainer: contentContainer
        };
    }
}
