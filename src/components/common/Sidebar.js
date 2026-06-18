import { ROLES, ROUTES } from '../../services/Constants.js';

export class Sidebar {
    constructor(user) {
        this.user = user;
    }

    render() {
        const aside = document.createElement('aside');
        aside.className = 'sidebar';

        // Add backdrop for mobile
        const backdrop = document.createElement('div');
        backdrop.className = 'sidebar-backdrop';
        backdrop.onclick = () => aside.classList.remove('open');

        aside.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 20px; border-bottom: 1px solid var(--border-color);">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 24px; height: 24px; background: var(--text-primary); border-radius: 4px; display: flex; align-items: center; justify-content: center;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--bg-primary)" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                    </div>
                    <span style="font-weight: 600; font-size: 0.95rem; letter-spacing: -0.02em;">College ERP</span>
                </div>
                <button id="closeSidebar" class="secondary-button mobile-only" style="padding: 4px; border:none;">✕</button>
            </div>
            
            <nav id="sidebar-nav" style="flex: 1; display: flex; flex-direction: column; padding: 12px 10px; overflow-y: auto;">
                <!-- Links injected here -->
            </nav>

            <div style="padding: 12px; border-top: 1px solid var(--border-color);">
                <div style="display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: var(--radius-sm); cursor: pointer; transition: background 0.15s;" onmouseover="this.style.background='var(--sidebar-bg-hover)'" onmouseout="this.style.background='transparent'" onclick="window.location.hash='${ROUTES.PROFILE}'">
                    <div style="width: 28px; height: 28px; background: var(--border-color); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.75rem; color: var(--text-primary);">
                        ${(this.user.name || 'U').charAt(0)}
                    </div>
                    <div style="overflow: hidden; flex: 1;">
                        <p style="font-size: 0.8rem; font-weight: 500; white-space: nowrap; text-overflow: ellipsis; margin: 0; color: var(--text-primary); line-height: 1.2;">${this.user.name}</p>
                        <p style="font-size: 0.7rem; color: var(--text-tertiary); text-transform: capitalize; margin: 0; line-height: 1.2;">${this.user.role}</p>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2"><path d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                </div>
            </div>
        `;

        const nav = aside.querySelector('#sidebar-nav');
        const groups = this.getLinkGroups();

        const closeBtn = aside.querySelector('#closeSidebar');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                aside.classList.remove('open');
                backdrop.classList.remove('active');
            });
        }

        groups.forEach(group => {
            if (group.title) {
                const title = document.createElement('div');
                title.className = 'sidebar-section-title';
                title.textContent = group.title;
                nav.appendChild(title);
            }
            
            group.links.forEach(link => {
                const a = document.createElement('a');
                a.href = link.href;
                a.className = 'sidebar-link';
                a.innerHTML = `
                    <span style="display:flex;align-items:center;opacity:0.7">${link.icon}</span>
                    <span>${link.label}</span>
                `;

                a.onclick = () => {
                    const currentOpen = document.querySelector('.sidebar.open');
                    if (currentOpen) {
                        currentOpen.classList.remove('open');
                        document.querySelector('.sidebar-backdrop').classList.remove('active');
                    }
                };

                const currentHash = location.hash || '#dashboard';
                if (currentHash === link.href) {
                    a.classList.add('active');
                    a.querySelector('span').style.opacity = '1';
                }
                nav.appendChild(a);
            });
        });

        const fragment = document.createDocumentFragment();
        fragment.appendChild(backdrop);
        fragment.appendChild(aside);

        return fragment;
    }

    getLinkGroups() {
        const role = this.user.role;
        const ICONS = {
            dashboard: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>',
            students: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
            courses: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>',
            subjects: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>',
            exams: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
            settings: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>',
            results: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>'
        };

        const overview = {
            title: 'Overview',
            links: [{ href: `#${ROUTES.DASHBOARD}`, label: 'Dashboard', icon: ICONS.dashboard }]
        };

        if (role === ROLES.ADMIN) {
            return [
                overview,
                {
                    title: 'Management',
                    links: [
                        { href: `#${ROUTES.STUDENTS_LIST}`, label: 'Students', icon: ICONS.students },
                        { href: `#${ROUTES.COURSES_LIST}`, label: 'Courses', icon: ICONS.courses },
                        { href: `#${ROUTES.SUBJECTS_LIST}`, label: 'Subjects', icon: ICONS.subjects },
                        { href: `#${ROUTES.EXAMS_DASHBOARD}`, label: 'Exams', icon: ICONS.exams }
                    ]
                },
                {
                    title: 'System',
                    links: [
                        { href: `#${ROUTES.SETTINGS}`, label: 'Settings', icon: ICONS.settings }
                    ]
                }
            ];
        } else {
            return [
                overview,
                {
                    title: 'Academics',
                    links: [
                        { href: `#${ROUTES.SUBJECTS_LIST}`, label: 'My Subjects', icon: ICONS.subjects },
                        { href: `#${ROUTES.EXAMS_LIST}`, label: 'Exams Schedule', icon: ICONS.exams },
                        { href: `#${ROUTES.EXAM_REGISTRATION}`, label: 'Register Exam', icon: ICONS.settings },
                        { href: `#${ROUTES.RESULTS}`, label: 'My Results', icon: ICONS.results }
                    ]
                }
            ];
        }
    }
}
