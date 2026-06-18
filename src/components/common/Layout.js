import { Navbar } from './Navbar.js';
import { AIAssistant } from './AIAssistant.js';

export class Layout {
    constructor(user, logoutCallback) {
        this.user = user;
        this.logoutCallback = logoutCallback;
    }

    render(routeTitle) {
        const layout = document.createElement('div');
        layout.className = 'main-layout';

        // Top Navbar
        const navbar = new Navbar(routeTitle, this.user, this.logoutCallback);
        layout.appendChild(navbar.render());

        // Main Content Area
        const main = document.createElement('div');
        main.className = 'main-content';

        // Page Content placeholder
        const contentContainer = document.createElement('div');
        contentContainer.id = 'page-content';
        contentContainer.className = 'loading';

        main.appendChild(contentContainer);
        layout.appendChild(main);

        // Floating AI Assistant
        const assistant = new AIAssistant();
        layout.appendChild(assistant.render());

        return {
            element: layout,
            contentContainer: contentContainer
        };
    }
}
