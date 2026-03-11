import { ROLES, ROUTES } from '../../services/Constants.js';

export class Sidebar {
    constructor(user) {
        this.user = user;
    }

    render() {
        const aside = document.createElement('aside');
        aside.className = 'sidebar glass-panel';

        // Add backdrop for mobile
        const backdrop = document.createElement('div');
        backdrop.className = 'sidebar-backdrop';
        backdrop.onclick = () => aside.classList.remove('open');

        aside.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3rem; padding: 0 1rem;">
                <div>
                    <h2 style="margin:0; background: linear-gradient(135deg, var(--text-primary), var(--accent-color)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">CollegeOS</h2>
                    <p style="font-size: 0.8rem; color: var(--text-secondary);">Enterprise v2.0</p>
                </div>
                <button id="closeSidebar" class="glass-button mobile-only" style="padding: 10px; background: rgba(0,0,0,0.05);">✕</button>
            </div>
            
            <nav id="sidebar-nav" style="flex: 1; display: flex; flex-direction: column; gap: 0.5rem; overflow-y: auto;">
                <!-- Links injected here -->
            </nav>

            <div style="padding: 1.5rem 1rem; border-top: 1px solid var(--glass-border);">
                <div style="display: flex; align-items: center; gap: 12px; cursor: pointer;" onclick="window.location.hash='${ROUTES.PROFILE}'">
                    <div style="width: 38px; height: 38px; background: var(--accent-color); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white;">
                        ${(this.user.name || 'U').charAt(0)}
                    </div>
                    <div style="overflow: hidden;">
                        <p style="font-size: 0.9rem; font-weight: 600; white-space: nowrap; text-overflow: ellipsis; margin: 0;">${this.user.name}</p>
                        <p style="font-size: 0.75rem; color: var(--text-secondary); text-transform: capitalize; margin: 0;">${this.user.role}</p>
                    </div>
                </div>
            </div>
        `;

        const nav = aside.querySelector('#sidebar-nav');
        const links = this.getLinks();

        const closeBtn = aside.querySelector('#closeSidebar');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                aside.classList.remove('open');
                backdrop.classList.remove('active');
            });
        }

        links.forEach(link => {
            const a = document.createElement('a');
            a.href = link.href;
            a.className = 'sidebar-link';
            a.innerHTML = `
                <span class="icon">${link.icon}</span>
                <span class="label">${link.label}</span>
            `;

            a.onclick = () => {
                const currentOpen = document.querySelector('.sidebar.open');
                if (currentOpen) {
                    currentOpen.classList.remove('open');
                    document.querySelector('.sidebar-backdrop').classList.remove('active');
                }
            };

            // Highlight active link
            const currentHash = location.hash || '#dashboard';
            if (currentHash === link.href) {
                a.classList.add('active');
            }
            nav.appendChild(a);
        });

        const fragment = document.createDocumentFragment();
        fragment.appendChild(backdrop);
        fragment.appendChild(aside);

        return fragment;
    }

    getLinks() {
        const role = this.user.role;
        const common = [
            { href: `#${ROUTES.DASHBOARD}`, label: 'Dashboard', icon: '💎' },
            { href: `#${ROUTES.NOTICES}`, label: 'Notice Board', icon: '📢' },
        ];


        if (role === ROLES.ADMIN) {
            return [
                ...common,
                { href: `#${ROUTES.STUDENTS_LIST}`, label: 'Students', icon: '👨‍🎓' },
                { href: `#${ROUTES.FACULTY_LIST}`, label: 'Faculty', icon: '👨‍🏫' },
                { href: `#${ROUTES.COURSES_LIST}`, label: 'Courses (Beta)', icon: '📚' },
                { href: `#${ROUTES.SUBJECTS_LIST}`, label: 'Subjects', icon: '📖' },
                { href: `#${ROUTES.TIMETABLE}`, label: 'Timetable (Beta)', icon: '📅' },
                { href: `#${ROUTES.REPORTS}`, label: 'Reports (Beta)', icon: '📈' },
                { href: `#${ROUTES.SETTINGS}`, label: 'Settings', icon: '⚙️' }
            ];
        } else if (role === ROLES.TEACHER) {
            return [
                ...common,
                { href: `#${ROUTES.SUBJECTS_LIST}?mode=assigned`, label: 'My Classes', icon: '🏫' },
                { href: `#${ROUTES.TIMETABLE}`, label: 'Timetable', icon: '📅' },
                { href: `#${ROUTES.ATTENDANCE}`, label: 'Attendance', icon: '📝' },
                { href: `#${ROUTES.ASSIGNMENTS}`, label: 'Assignments', icon: '✍️' },
                { href: `#${ROUTES.REPORTS}`, label: 'Reports', icon: '📈' }
            ];
        } else {
            // Student
            return [
                ...common,
                { href: `#${ROUTES.SUBJECTS_LIST}`, label: 'Subjects', icon: '📚' },
                { href: `#${ROUTES.TIMETABLE}`, label: 'Timetable', icon: '🗓️' },
                { href: `#${ROUTES.ATTENDANCE}`, label: 'Attendance', icon: '📝' },
                { href: `#${ROUTES.ASSIGNMENTS}`, label: 'Assignments', icon: '🧾' },
                // { href: '#', label: 'Messages', icon: '💬' } // Placeholder if no route
            ];
        }
    }
}
