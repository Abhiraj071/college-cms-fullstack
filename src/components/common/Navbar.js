import { ThemeService }       from '../../services/ThemeService.js';
import { NotificationBell }   from './NotificationBell.js';
import { ROLES, ROUTES }      from '../../services/Constants.js';
import { ApiService }         from '../../services/ApiService.js';

export class Navbar {
    constructor(title, user, logoutCallback) {
        this.title          = title;
        this.user           = user;
        this.logoutCallback = logoutCallback;
    }

    render() {
        const navWrapper = document.createElement('div');
        navWrapper.className = 'top-navbar-container';

        const navInner = document.createElement('div');
        navInner.className = 'top-navbar-inner';

        // 1. Logo Section (Left)
        const left = document.createElement('div');
        left.style.cssText = 'display:flex; align-items:center; gap:8px; cursor: pointer; flex-shrink: 0;';
        left.onclick = () => window.location.hash = ROUTES.DASHBOARD;
        left.innerHTML = `
            <div style="width: 28px; height: 28px; background: #6366F1; border-radius: 8px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(99, 102, 241, 0.25);">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <span style="font-weight: 700; font-size: 1.1rem; color: var(--text-primary); font-family: 'Outfit'; letter-spacing: -0.02em;">College ERP</span>
        `;

        // 2. Navigation Links (Center)
        const center = document.createElement('div');
        center.className = 'top-nav-links';
        
        const links = this.getLinks();
        links.forEach(link => {
            const a = document.createElement('a');
            a.href = link.href;
            a.className = 'top-nav-link';
            
            let icon = '';
            if (link.label === 'Dashboard') {
                icon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`;
            } else if (link.label === 'Students') {
                icon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`;
            } else if (link.label === 'Courses') {
                icon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`;
            } else if (link.label === 'Subjects') {
                icon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><circle cx="9" cy="9" r="1"></circle></svg>`;
            } else if (link.label === 'Exams') {
                icon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`;
            } else if (link.label === 'Reports') {
                icon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`;
            } else if (link.label === 'Settings') {
                icon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`;
            }
            
            a.innerHTML = `${icon} <span>${link.label}</span>`;
            
            let currentHash = location.hash || '#dashboard';
            if (currentHash.startsWith('#/')) {
                currentHash = '#' + currentHash.substring(2);
            }
            
            if (currentHash === link.href) {
                a.classList.add('active');
            }
            center.appendChild(a);
        });

        // 3. Right Controls (Search, Notification, Theme, Logout, Mobile Menu)
        const right = document.createElement('div');
        right.style.cssText = 'display:flex; align-items:center; gap:0.5rem; flex-shrink: 0;';

        // Desktop Search Box (Large viewports)
        const searchBoxDesktop = document.createElement('div');
        searchBoxDesktop.className = 'search-bar-desktop';
        searchBoxDesktop.style.cssText = `
            display: flex; align-items: center; gap: 8px;
            background: var(--bg-secondary); border: 1px solid var(--border-color);
            padding: 6px 12px; border-radius: 10px; color: var(--text-tertiary);
            font-size: 0.8rem; cursor: pointer; width: 180px; transition: all 0.2s;
        `;
        searchBoxDesktop.innerHTML = `
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <span style="flex:1; margin-right: 8px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">Search...</span>
            <span style="background:var(--border-color); padding: 1px 4px; border-radius:4px; font-size:0.65rem; color: var(--text-secondary); font-weight:700;">⌘K</span>
        `;
        searchBoxDesktop.onclick = () => this.openSearchModal();
        searchBoxDesktop.onmouseover = () => {
            searchBoxDesktop.style.borderColor = 'var(--accent-color)';
            searchBoxDesktop.style.background = 'var(--bg-primary)';
        };
        searchBoxDesktop.onmouseout = () => {
            searchBoxDesktop.style.borderColor = 'var(--border-color)';
            searchBoxDesktop.style.background = 'var(--bg-secondary)';
        };

        // Collapsed Search Toggle (Smaller viewports)
        const searchToggleBtn = document.createElement('button');
        searchToggleBtn.className = 'search-toggle-btn';
        searchToggleBtn.title = 'Search System';
        searchToggleBtn.style.cssText = 'background: #FFFFFF; color: #475569; border: 1px solid #E2E8F0; width: 34px; height: 34px; cursor: pointer; border-radius: 50%; transition: all 0.2s; display: none; align-items:center; justify-content:center;';
        searchToggleBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;
        searchToggleBtn.onclick = () => this.openSearchModal();
        searchToggleBtn.onmouseover = () => searchToggleBtn.style.background = '#F8FAFC';
        searchToggleBtn.onmouseout = () => searchToggleBtn.style.background = '#FFFFFF';

        // Notification Bell
        const bell = new NotificationBell();
        const bellEl = bell.render();
        
        setTimeout(() => {
            const bellBtn = bellEl.querySelector('#notif-btn');
            if (bellBtn) {
                bellBtn.style.cssText = `
                    position:relative; width: 34px; height: 34px; border-radius:50%;
                    background:#FFFFFF; border:1px solid #E2E8F0;
                    color:#475569; cursor:pointer; font-size:1rem;
                    display:flex; align-items:center; justify-content:center; transition:all 0.2s;
                `;
                bellBtn.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                    <span id="notif-badge" style="
                        position:absolute; top:-2px; right:-2px;
                        min-width:16px; height:16px; background:#EF4444; color:#fff;
                        border-radius:50%; font-size:0.62rem; font-weight:800;
                        display:flex; align-items:center; justify-content:center; padding:0 3px;
                        border: 2px solid #FFFFFF;
                    ">3</span>
                `;
                bellBtn.onmouseover = () => bellBtn.style.background = '#F8FAFC';
                bellBtn.onmouseout = () => bellBtn.style.background = '#FFFFFF';
            }
        }, 50);

        // Theme Toggle Button
        const themeBtn = document.createElement('button');
        themeBtn.title = 'Toggle Theme';
        themeBtn.style.cssText = 'background: #FFFFFF; color: #475569; border: 1px solid #E2E8F0; width: 34px; height: 34px; cursor: pointer; border-radius: 50%; transition: all 0.2s; display: flex; align-items:center; justify-content:center;';
        themeBtn.onmouseover = () => themeBtn.style.background = '#F8FAFC';
        themeBtn.onmouseout = () => themeBtn.style.background = '#FFFFFF';
        
        const updateThemeIcon = (theme) => {
            if (theme === 'dark') {
                themeBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
            } else {
                themeBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
            }
        };
        updateThemeIcon(ThemeService.getCurrentTheme());

        themeBtn.addEventListener('click', () => {
            const t = ThemeService.cycleNext();
            updateThemeIcon(t);
        });

        // User Avatar Dropdown
        const profileContainer = document.createElement('div');
        profileContainer.style.cssText = 'position:relative; display:flex; align-items:center; cursor:pointer;';
        
        const avatarImg = document.createElement('img');
        avatarImg.src = 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=100';
        avatarImg.alt = 'User Avatar';
        avatarImg.style.cssText = 'width:32px; height:32px; border-radius:50%; object-fit:cover; border: 1.5px solid #6366F1;';
        
        const arrowDown = document.createElement('span');
        arrowDown.style.cssText = 'font-size:0.6rem; color:#64748B; margin-left:4px;';
        arrowDown.innerHTML = '▼';

        profileContainer.appendChild(avatarImg);
        profileContainer.appendChild(arrowDown);

        const profileDropdown = document.createElement('div');
        profileDropdown.style.cssText = 'display:none; position:absolute; top:calc(100% + 10px); right:0; width:180px; background:#FFFFFF; border:1px solid #E2E8F0; border-radius:10px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); z-index:9999; padding:6px 0;';
        profileDropdown.innerHTML = `
            <div style="padding:8px 14px; border-bottom:1px solid #F1F5F9;">
                <div style="font-weight:600; font-size:0.85rem; color:#0F172A; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${this.user.name || 'System Admin'}</div>
                <div style="font-size:0.75rem; color:#64748B; text-transform:capitalize;">${this.user.role}</div>
            </div>
            <a href="#my-profile" style="display:flex; align-items:center; gap:8px; padding:8px 14px; color:#475569; text-decoration:none; font-size:0.8rem; transition:background 0.2s;">👤 My Profile</a>
            <a href="#settings" style="display:flex; align-items:center; gap:8px; padding:8px 14px; color:#475569; text-decoration:none; font-size:0.8rem; transition:background 0.2s;">⚙️ Settings</a>
            <div style="border-top:1px solid #F1F5F9; margin-top:4px; padding-top:4px;">
                <button id="logout-menu-btn" style="width:100%; display:flex; align-items:center; gap:8px; padding:8px 14px; background:none; border:none; color:#EF4444; font-size:0.8rem; cursor:pointer; text-align:left; font-family:var(--font-body); font-weight:600;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                    Logout
                </button>
            </div>
        `;
        profileContainer.appendChild(profileDropdown);

        profileContainer.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = profileDropdown.style.display === 'block';
            profileDropdown.style.display = isOpen ? 'none' : 'block';
        });

        document.addEventListener('click', () => {
            profileDropdown.style.display = 'none';
        });

        setTimeout(() => {
            const lBtn = profileDropdown.querySelector('#logout-menu-btn');
            if (lBtn) lBtn.onclick = this.logoutCallback;
        }, 50);

        // Mobile Hamburger Toggle
        const mobileToggleBtn = document.createElement('button');
        mobileToggleBtn.className = 'mobile-menu-toggle';
        mobileToggleBtn.title = 'Open Menu';
        mobileToggleBtn.style.cssText = 'background: #FFFFFF; color: #475569; border: 1px solid #E2E8F0; width: 34px; height: 34px; cursor: pointer; border-radius: 50%; transition: all 0.2s; display: none; align-items:center; justify-content:center;';
        mobileToggleBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`;

        // Mobile Navigation Dropdown Menu
        const mobileMenu = document.createElement('div');
        mobileMenu.className = 'mobile-nav-menu';
        
        links.forEach(link => {
            const a = document.createElement('a');
            a.href = link.href;
            a.className = 'mobile-nav-link';
            
            let icon = '';
            if (link.label === 'Dashboard') {
                icon = '🏠';
            } else if (link.label === 'Students') {
                icon = '👤';
            } else if (link.label === 'Courses') {
                icon = '📚';
            } else if (link.label === 'Subjects') {
                icon = '📄';
            } else if (link.label === 'Exams') {
                icon = '📝';
            } else if (link.label === 'Reports') {
                icon = '📊';
            } else if (link.label === 'Settings') {
                icon = '⚙️';
            }
            
            a.innerHTML = `<span style="font-size:1.1rem; line-height:1;">${icon}</span> <span>${link.label}</span>`;
            
            let currentHash = location.hash || '#dashboard';
            if (currentHash.startsWith('#/')) {
                currentHash = '#' + currentHash.substring(2);
            }
            if (currentHash === link.href) {
                a.style.background = '#ECEFFC';
                a.style.color = '#4F46E5';
            }

            a.onclick = () => {
                mobileMenu.style.display = 'none';
                mobileToggleBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`;
            };
            mobileMenu.appendChild(a);
        });

        mobileToggleBtn.onclick = (e) => {
            e.stopPropagation();
            const isOpen = mobileMenu.style.display === 'flex';
            mobileMenu.style.display = isOpen ? 'none' : 'flex';
            if (isOpen) {
                mobileToggleBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`;
            } else {
                mobileToggleBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
            }
        };

        document.addEventListener('click', () => {
            mobileMenu.style.display = 'none';
            mobileToggleBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`;
        });
        mobileMenu.onclick = (e) => e.stopPropagation();

        right.appendChild(searchBoxDesktop);
        right.appendChild(searchToggleBtn);
        right.appendChild(bellEl);
        right.appendChild(themeBtn);
        right.appendChild(profileContainer);
        right.appendChild(mobileToggleBtn);

        navInner.appendChild(left);
        navInner.appendChild(center);
        navInner.appendChild(right);
        navWrapper.appendChild(navInner);
        navWrapper.appendChild(mobileMenu);

        // Bind global Ctrl+K command palette keybind
        if (window.__navbarKeydownHandler) {
            window.removeEventListener('keydown', window.__navbarKeydownHandler);
        }
        window.__navbarKeydownHandler = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                this.openSearchModal();
            }
        };
        window.addEventListener('keydown', window.__navbarKeydownHandler);

        return navWrapper;
    }

    getLinks() {
        const role = this.user.role;
        const common = [
            { href: `#${ROUTES.DASHBOARD}`, label: 'Dashboard' }
        ];

        if (role === ROLES.ADMIN) {
            return [
                ...common,
                { href: `#${ROUTES.STUDENTS_LIST}`, label: 'Students' },
                { href: `#${ROUTES.COURSES_LIST}`, label: 'Courses' },
                { href: `#${ROUTES.SUBJECTS_LIST}`, label: 'Subjects' },
                { href: `#${ROUTES.EXAMS_DASHBOARD}`, label: 'Exams' },
                { href: `#${ROUTES.REPORTS}`, label: 'Reports' },
                { href: `#${ROUTES.SETTINGS}`, label: 'Settings' }
            ];
        } else {
            return [
                ...common,
                { href: `#${ROUTES.SUBJECTS_LIST}`, label: 'Subjects' },
                { href: `#${ROUTES.EXAMS_LIST}`, label: 'Exams' },
                { href: `#${ROUTES.EXAM_REGISTRATION}`, label: 'Register' },
                { href: `#${ROUTES.RESULTS}`, label: 'Results' }
            ];
        }
    }

    openSearchModal() {
        if (document.getElementById('global-search-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'global-search-overlay';
        overlay.className = 'search-overlay';
        overlay.innerHTML = `
            <div class="search-modal">
                <div class="search-modal-header">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color: var(--text-tertiary);"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    <input type="text" class="search-modal-input" placeholder="Search students, courses, subjects, notices..." autofocus>
                    <span style="font-size: 0.65rem; background: var(--bg-secondary); border: 1px solid var(--border-color); padding: 3px 6px; border-radius: 4px; color: var(--text-tertiary); font-weight: 700;">ESC</span>
                </div>
                <div class="search-modal-results" id="search-modal-results">
                    <div style="text-align: center; padding: 2rem; color: var(--text-tertiary); font-size: 0.88rem;">
                        Type to search system records...
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const input = overlay.querySelector('.search-modal-input');
        const resultsContainer = overlay.querySelector('#search-modal-results');

        setTimeout(() => input.focus(), 50);

        overlay.onclick = (e) => {
            if (e.target === overlay) overlay.remove();
        };

        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                overlay.remove();
                window.removeEventListener('keydown', handleEsc);
            }
        };
        window.addEventListener('keydown', handleEsc);

        let debounceTimeout = null;
        input.oninput = () => {
            clearTimeout(debounceTimeout);
            const q = input.value.trim();
            if (q.length < 2) {
                resultsContainer.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: var(--text-tertiary); font-size: 0.88rem;">
                        Type at least 2 characters to search...
                    </div>
                `;
                return;
            }

            resultsContainer.innerHTML = `
                <div style="display: flex; justify-content: center; padding: 2rem;">
                    <div class="spinner" style="width: 20px; height: 20px; border-radius: 50%; border: 2px solid var(--accent-glow); border-top-color: var(--accent-color); animation: spin 0.8s linear infinite;"></div>
                </div>
            `;

            debounceTimeout = setTimeout(async () => {
                try {
                    const data = await ApiService.globalSearch(q);
                    this.renderSearchResults(resultsContainer, data, q);
                } catch (err) {
                    resultsContainer.innerHTML = `
                        <div style="text-align: center; padding: 2rem; color: var(--danger); font-size: 0.88rem;">
                            Error fetching search results.
                        </div>
                    `;
                }
            }, 250);
        };
    }

    renderSearchResults(container, data, query) {
        container.innerHTML = '';
        const { students = [], courses = [], subjects = [], notices = [] } = data;

        const hasResults = students.length > 0 || courses.length > 0 || subjects.length > 0 || notices.length > 0;

        if (!hasResults) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2.5rem; color: var(--text-tertiary); font-size: 0.88rem;">
                    No matches found for "<strong>${query}</strong>"
                </div>
            `;
            return;
        }

        let html = '';

        if (students.length > 0) {
            html += `<div class="search-category-title">Students</div>`;
            students.forEach(st => {
                html += `
                    <div class="search-result-item" onclick="window.location.hash='#students'; document.getElementById('global-search-overlay').remove();">
                        <div>
                            <strong style="color: var(--text-primary);">${st.name}</strong>
                            <span style="font-size: 0.72rem; color: var(--text-tertiary); margin-left: 8px;">Roll No: ${st.rollNo}</span>
                        </div>
                        <span style="font-size: 0.78rem; color: var(--text-secondary);">${st.course} • Sem ${st.semester}</span>
                    </div>
                `;
            });
        }

        if (courses.length > 0) {
            html += `<div class="search-category-title">Courses</div>`;
            courses.forEach(c => {
                html += `
                    <div class="search-result-item" onclick="window.location.hash='#courses'; document.getElementById('global-search-overlay').remove();">
                        <div>
                            <strong style="color: var(--text-primary);">${c.name}</strong>
                        </div>
                        <span style="font-size: 0.78rem; color: var(--text-secondary);">Code: ${c.code || 'N/A'}</span>
                    </div>
                `;
            });
        }

        if (subjects.length > 0) {
            html += `<div class="search-category-title">Subjects</div>`;
            subjects.forEach(sub => {
                html += `
                    <div class="search-result-item" onclick="window.location.hash='#subjects'; document.getElementById('global-search-overlay').remove();">
                        <div>
                            <strong style="color: var(--text-primary);">${sub.name}</strong>
                            <span style="font-size: 0.72rem; color: var(--text-tertiary); margin-left: 8px;">Code: ${sub.code}</span>
                        </div>
                        <span style="font-size: 0.78rem; color: var(--text-secondary);">${sub.course} • Sem ${sub.semester}</span>
                    </div>
                `;
            });
        }

        if (notices.length > 0) {
            html += `<div class="search-category-title">Notices & Bulletins</div>`;
            notices.forEach(n => {
                html += `
                    <div class="search-result-item" onclick="window.location.hash='#notices'; document.getElementById('global-search-overlay').remove();">
                        <div>
                            <strong style="color: var(--text-primary);">${n.title}</strong>
                        </div>
                        <span style="font-size: 0.78rem; color: var(--text-secondary);">${n.category}</span>
                    </div>
                `;
            });
        }

        container.innerHTML = html;
    }
}
