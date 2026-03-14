import { storage } from '../services/StorageService.js';
import { auth } from '../services/AuthService.js';

export class Dashboard {
    constructor() {
    }

    render() {
        const user = auth.getUser();
        if (!user) return document.createElement('div');

        const content = document.createElement('div');
        content.className = 'fade-in';

        const firstName = (user.name || 'User').split(' ')[0];

        // 1. Welcome Section
        const welcome = document.createElement('div');
        welcome.className = 'glass-panel';
        welcome.style.padding = '2rem';
        welcome.style.marginBottom = 'var(--space-lg)';
        welcome.style.display = 'flex';
        welcome.style.justifyContent = 'space-between';
        welcome.style.alignItems = 'center';
        welcome.style.overflow = 'hidden';
        welcome.style.background = 'linear-gradient(135deg, var(--accent-color), #818cf8)';
        welcome.style.color = 'white';

        welcome.innerHTML = `
            <div style="flex: 1; z-index: 1;">
                <h1 style="font-size: 2.2rem; margin-bottom: 0.5rem; letter-spacing: -1px; color: #FFFFFF; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">👋 Welcome back, ${firstName}!</h1>
                <p style="color: rgba(255,255,255,0.95); font-size: 1.1rem; margin-bottom: 1.5rem; font-weight: 500;">You have 
                    <span style="font-weight: 800; color: #FFFFFF;">${user.role === 'student' ? 'new assignments' : 'classes today'}</span>. 
                    Manage your campus activities more efficiently.
                </p>
                <div style="display: flex; gap: 0.75rem;">
                    ${user.role === 'teacher' ? `<button class="glass-button" style="background: white; color: var(--accent-color); padding: 10px 20px; font-weight: 700; border: none;" onclick="window.location.hash='attendance'">✅ Take Attendance</button>` : ''}
                    ${user.role === 'admin' ? `<button class="glass-button" style="background: white; color: var(--accent-color); padding: 10px 20px; font-weight: 700; border: none;" onclick="window.location.hash='settings'">⚙️ System Settings</button>` : ''}
                    <button class="glass-button" onclick="window.location.hash='notices'" style="background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.4); padding: 10px 20px; backdrop-filter: blur(4px);">📢 View Notices</button>
                </div>
            </div>
            <div class="mobile-hide" style="flex: 0 0 260px; text-align: right; margin: -2.5rem -2rem -2.5rem 0;">
                <img src="./welcome_illustration.png" style="width: 100%; height: auto; opacity: 0.95; -webkit-mask-image: radial-gradient(ellipse at 50% 50%, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 75%); mask-image: radial-gradient(ellipse at 50% 50%, rgba(0,0,0,1) 45%, rgba(0,0,0,0) 75%); filter: drop-shadow(0 15px 25px rgba(0,0,0,0.15));" />
            </div>
        `;
        content.appendChild(welcome);

        // 2. Stats Grid
        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(240px, 1fr))';
        grid.style.gap = '1.25rem';
        grid.innerHTML = '<div style="grid-column: span 3; padding: 2rem; text-align: center;">Loading Fresh Analytics...</div>';
        this.updateDashboardStats(grid, user);
        content.appendChild(grid);

        // 3. Main Body Split
        const body = document.createElement('div');
        body.style.display = 'grid';
        body.style.gridTemplateColumns = '1fr';
        body.style.gap = '1.5rem';
        body.style.marginTop = 'var(--space-md)';

        if (window.innerWidth > 1024) {
            body.style.gridTemplateColumns = '1.2fr 0.8fr';
        }

        // Left Side: Schedule & Tasks
        const leftSide = document.createElement('div');
        leftSide.style.display = 'flex';
        leftSide.style.flexDirection = 'column';
        leftSide.style.gap = '1.5rem';

        if (user.role === 'teacher') {
            leftSide.appendChild(this.renderTodayTimetablePanel(user));
            leftSide.appendChild(this.renderTeacherPendingTasks(user));
        } else if (user.role === 'student') {
            leftSide.appendChild(this.renderTodayTimetablePanel(user));
        } else {
            leftSide.appendChild(this.renderAdminQuickActions());
            leftSide.appendChild(this.renderSystemOverview());
        }

        // Right Side: Announcements & Upcoming
        const rightSide = document.createElement('div');
        rightSide.style.display = 'flex';
        rightSide.style.flexDirection = 'column';
        rightSide.style.gap = '1.5rem';

        rightSide.appendChild(this.renderAnnouncements());

        body.appendChild(leftSide);
        body.appendChild(rightSide);
        content.appendChild(body);

        return content;
    }

    async updateDashboardStats(container, user) {
        const role = user.role;
        const cardStyle = 'padding: 1.5rem; min-height: 140px; display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden;';
        const bgGlow = (color) => `<div style="position: absolute; top: -40px; right: -40px; width: 120px; height: 120px; background: ${color}; filter: blur(50px); opacity: 0.1; border-radius: 50%;"></div>`;

        try {
            const { ApiService } = await import('../services/ApiService.js');
            let statsHtml = '';

            if (role === 'student') {
                const students = await ApiService.getStudents();
                const targetId = String(user.id || user._id);
                const student = students.find(s => {
                    const sId = s.userId?._id || s.userId || s.userId?.id;
                    return String(sId) === targetId;
                });

                if (!student) {
                    container.innerHTML = `<div style="grid-column: span 3; padding: 1.5rem; color: var(--warning); text-align: center; background: rgba(255,165,0,0.1); border-radius: 8px;">Student profile not found. Please contact administration.</div>`;
                    return;
                }

                // Calculate Active Subjects
                let activeSubjectsCount = 0;
                try {
                    const year = Math.ceil((student.semester || 1) / 2);
                    const timetables = await ApiService.getTimetables(student.course, year, student.semester);
                    const uniqueSubjects = new Set();
                    timetables.forEach(t => {
                        if (t.grid) {
                            Object.values(t.grid).forEach(slot => {
                                if (slot.subject && !slot.subject.match(/lunch|break/i)) {
                                    uniqueSubjects.add(slot.subject);
                                }
                            });
                        }
                    });
                    activeSubjectsCount = uniqueSubjects.size;
                } catch (e) {
                    console.error('Failed to fetch subjects count', e);
                }

                const attendancePct = student?.attendancePercentage || '0%';

                let pendingAssignmentsCount = 0;
                try {
                    const assignments = await ApiService.getAssignments(student.course);
                    const now = new Date();
                    pendingAssignmentsCount = assignments.filter(a => {
                        const isSubmitted = a.submissions && a.submissions.some(sub => String(sub.student?._id || sub.student) === String(student._id));
                        return !isSubmitted;
                    }).length;
                } catch (e) {
                    console.error('Assignments calc failed', e);
                }

                statsHtml = `
                    <div class="glass-panel" style="${cardStyle} border-left: 4px solid var(--accent-color);">
                        ${bgGlow('var(--accent-color)')}
                        <div style="font-size: 2rem; margin-bottom: 0.5rem;">📚</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase;">Active Subjects</div>
                        <div style="font-size: 2.4rem; font-weight: 800;">${activeSubjectsCount}</div>
                    </div>
                    <div class="glass-panel" style="${cardStyle} border-left: 4px solid var(--success);">
                        ${bgGlow('var(--success)')}
                        <div style="font-size: 2rem; margin-bottom: 0.5rem;">📅</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase;">Attendance</div>
                        <div style="font-size: 2.4rem; font-weight: 800;">${attendancePct}</div>
                    </div>
                    <div class="glass-panel" style="${cardStyle} border-left: 4px solid var(--warning);">
                        ${bgGlow('var(--warning)')}
                        <div style="font-size: 2rem; margin-bottom: 0.5rem;">📝</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase;">Pending Tasks</div>
                        <div style="font-size: 2.4rem; font-weight: 800;">${pendingAssignmentsCount}</div>
                    </div>
                `;
            } else if (role === 'teacher') {
                const [subjects, assignments, timetables] = await Promise.all([
                    ApiService.getSubjects(),
                    ApiService.getAssignments(),
                    ApiService.getTimetables()
                ]);

                const mySubjects = subjects.filter(s => {
                    const facultyId = s.faculty?._id || s.faculty;
                    return facultyId === user._id || (user.facultyId && facultyId === user.facultyId);
                });

                const day = new Date().toLocaleDateString('en-US', { weekday: 'long' });
                let todayClassesCount = 0;
                timetables.forEach(t => {
                    if (t.grid) {
                        Object.entries(t.grid).forEach(([key, slot]) => {
                            if (key.startsWith(day)) {
                                const isMyClass = slot.teacher === user.name ||
                                    (user.facultyId && slot.teacher === user.facultyId) ||
                                    slot.teacher === user._id;
                                if (isMyClass) todayClassesCount++;
                            }
                        });
                    }
                });

                const pendingGradesCount = assignments.filter(a => a.submissions.some(s => !s.grade)).length;

                statsHtml = `
                    <div class="glass-panel" style="${cardStyle} border-left: 4px solid var(--accent-color);">
                        ${bgGlow('var(--accent-color)')}
                        <div style="font-size: 2rem; margin-bottom: 0.5rem;">🏫</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase;">My Classes</div>
                        <div style="font-size: 2.4rem; font-weight: 800;">${mySubjects.length}</div>
                    </div>
                    <div class="glass-panel" style="${cardStyle} border-left: 4px solid var(--success);">
                        ${bgGlow('var(--success)')}
                        <div style="font-size: 2rem; margin-bottom: 0.5rem;">🕒</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase;">Classes Today</div>
                        <div style="font-size: 2.4rem; font-weight: 800;">${todayClassesCount}</div>
                    </div>
                    <div class="glass-panel" style="${cardStyle} border-left: 4px solid var(--warning);">
                        ${bgGlow('var(--warning)')}
                        <div style="font-size: 2rem; margin-bottom: 0.5rem;">✍️</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase;">Ungraded Tasks</div>
                        <div style="font-size: 2.4rem; font-weight: 800;">${pendingGradesCount}</div>
                    </div>
                `;
            } else {
                const [students, faculty, courses] = await Promise.all([
                    ApiService.getStudents(),
                    ApiService.getFaculty(),
                    ApiService.getCourses()
                ]);

                statsHtml = `
                    <div class="glass-panel" style="${cardStyle} border-left: 4px solid var(--accent-color);">
                        ${bgGlow('var(--accent-color)')}
                        <div style="font-size: 2rem; margin-bottom: 0.5rem;">👨‍🎓</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase;">Total Students</div>
                        <div style="font-size: 2.4rem; font-weight: 800;">${students.length}</div>
                    </div>
                    <div class="glass-panel" style="${cardStyle} border-left: 4px solid var(--success);">
                        ${bgGlow('var(--success)')}
                        <div style="font-size: 2rem; margin-bottom: 0.5rem;">👨‍🏫</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase;">Faculty Base</div>
                        <div style="font-size: 2.4rem; font-weight: 800;">${faculty.length}</div>
                    </div>
                    <div class="glass-panel" style="${cardStyle} border-left: 4px solid var(--warning);">
                        ${bgGlow('var(--warning)')}
                        <div style="font-size: 2rem; margin-bottom: 0.5rem;">📚</div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 600; text-transform: uppercase;">Offered Courses</div>
                        <div style="font-size: 2.4rem; font-weight: 800;">${courses.length}</div>
                    </div>
                `;
            }

            container.innerHTML = statsHtml;

            if (role === 'student') {
                this.renderAttendanceChart(container.parentElement);
            }
        } catch (err) {
            console.error('Stats Error', err);
            container.innerHTML = '<p style="color:red; padding: 1rem;">Failed to load stats.</p>';
        }
    }

    renderTodayTimetablePanel(user) {
        const div = document.createElement('div');
        div.className = 'glass-panel';
        div.style.padding = '1.5rem';
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
                <h3 style="margin: 0; font-size: 1.2rem;">Today's Schedule</h3>
                <span style="font-size: 0.75rem; background: var(--accent-glow); color: var(--accent-color); padding: 4px 10px; border-radius: 12px; font-weight: 600;">${new Date().toLocaleDateString('en-US', { weekday: 'long' })}</span>
            </div>
            <div id="today-timetable-list">
                <p style="color: var(--text-secondary); font-size: 0.9rem;">Syncing your classes...</p>
            </div>
        `;

        this.updateTodayTimetable(div.querySelector('#today-timetable-list'), user);
        return div;
    }

    async updateTodayTimetable(container, user) {
        try {
            const { ApiService } = await import('../services/ApiService.js');
            const day = new Date().toLocaleDateString('en-US', { weekday: 'long' });

            const [allSchedules, allSubjects] = await Promise.all([
                ApiService.getTimetables(),
                ApiService.getSubjects()
            ]);

            let myClasses = [];
            let studentProfile = null;
            if (user.role === 'student') {
                const students = await ApiService.getStudents();
                const targetId = String(user.id || user._id);
                studentProfile = students.find(s => String(s.userId?._id || s.userId || s.userId?.id) === targetId);
            }

            allSchedules.forEach(sched => {
                if (sched.grid) {
                    if (user.role === 'student') {
                        if (!studentProfile) return;
                        if (sched.course !== studentProfile.course ||
                            String(sched.year) !== String(Math.ceil((studentProfile.semester || 1) / 2)) ||
                            String(sched.semester) !== String(studentProfile.semester)) {
                            return;
                        }
                    }

                    const grid = sched.grid;
                    Object.keys(grid).forEach(key => {
                        if (key.startsWith(day)) {
                            const slot = grid[key];
                            const subjectDef = allSubjects.find(sub => sub.name === slot.subject);
                            const subjectCode = subjectDef ? subjectDef.code : 'N/A';
                            
                            if (user.role === 'teacher') {
                                const isMyClass = slot.teacher === user.name ||
                                    (user.facultyId && slot.teacher === user.facultyId) ||
                                    slot.teacher === user._id;
                                if (isMyClass) {
                                    myClasses.push({
                                        ...slot,
                                        time: key.split('::')[1],
                                        course: sched.course,
                                        year: sched.year,
                                        semester: sched.semester,
                                        code: subjectCode
                                    });
                                }
                            } else if (user.role === 'student') {
                                myClasses.push({
                                    ...slot,
                                    time: key.split('::')[1],
                                    course: sched.course,
                                    year: sched.year,
                                    semester: sched.semester,
                                    code: subjectCode
                                });
                            }
                        }
                    });
                }
            });

            if (myClasses.length === 0) {
                container.innerHTML = `
                    <div style="padding: 1.5rem; text-align: center; background: rgba(0,0,0,0.01); border-radius: var(--radius-md); border: 1px dashed var(--glass-border);">
                        <p style="color: var(--text-secondary); margin: 0; font-size: 0.9rem;">No classes scheduled for today.</p>
                    </div>`;
                return;
            }

            myClasses.sort((a, b) => {
                const parse = (t) => {
                    let h = parseInt(t.split(':')[0]);
                    if (h >= 1 && h <= 6) h += 12;
                    return h;
                };
                return parse(a.time) - parse(b.time);
            });

            container.innerHTML = myClasses.map(c => `
                <div style="display: flex; gap: 1.25rem; padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md); margin-bottom: 0.75rem; border: 1px solid var(--glass-border); transition: transform 0.2s ease;">
                    <div style="width: 100px; font-weight: 700; color: var(--accent-color); font-size: 0.9rem;">${c.time}</div>
                    <div style="flex: 1;">
                        <div style="font-weight: 700; font-size: 0.95rem; margin-bottom: 2px;">
                            ${c.subject} <span style="font-size: 0.75rem; opacity: 0.6; font-weight: 400;">[${c.code || 'N/A'}]</span>
                        </div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary);">
                            ${c.course} • Year ${c.year} • Sem ${c.semester} • <span style="color: var(--text-primary); font-weight: 500;">${c.room || 'Room TBA'}</span>
                        </div>
                    </div>
                </div>
            `).join('');

        } catch (err) {
            container.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.9rem;">Unable to load timetable.</p>';
        }
    }

    renderTeacherPendingTasks(user) {
        const div = document.createElement('div');
        div.className = 'glass-panel';
        div.style.padding = '1.5rem';
        div.innerHTML = `
            <h3 style="margin-bottom: 1.25rem; font-size: 1.2rem;">Action Items</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                <div style="padding: 1rem; background: rgba(255,165,0,0.05); border-radius: var(--radius-md); border: 1px solid rgba(255,165,0,0.1);">
                    <div style="font-size: 0.75rem; color: var(--warning); font-weight: 700; text-transform: uppercase;">Grading Queue</div>
                    <div style="font-size: 1rem; font-weight: 700; margin: 4px 0;">Pending Evaluations</div>
                    <a href="#assignments" style="font-size: 0.85rem; color: var(--accent-color); text-decoration: none; font-weight: 600;">Review →</a>
                </div>
                <div style="padding: 1rem; background: rgba(99,102,241,0.05); border-radius: var(--radius-md); border: 1px solid rgba(99,102,241,0.1);">
                    <div style="font-size: 0.75rem; color: var(--accent-color); font-weight: 700; text-transform: uppercase;">Attendance Log</div>
                    <div style="font-size: 1rem; font-weight: 700; margin: 4px 0;">Session Markers</div>
                    <a href="#attendance" style="font-size: 0.85rem; color: var(--accent-color); text-decoration: none; font-weight: 600;">Open Sheet →</a>
                </div>
            </div>
        `;
        return div;
    }

    renderAnnouncements() {
        const div = document.createElement('div');
        div.className = 'glass-panel';
        div.style.padding = '1.5rem';

        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
                <h3 style="margin: 0; font-size: 1.2rem;">Notice Board</h3>
                <a href="#notices" style="font-size: 0.85rem; color: var(--accent-color); text-decoration: none; font-weight: 600;">View All</a>
            </div>
            <div id="announcements-list" style="font-size: 0.9rem;">Syncing updates...</div>
        `;

        this.updateAnnouncements(div.querySelector('#announcements-list'));
        return div;
    }

    async updateAnnouncements(container) {
        try {
            const { ApiService } = await import('../services/ApiService.js');
            const notices = await ApiService.getNotices();
            const recent = notices.slice(0, 3);

            if (recent.length === 0) {
                container.innerHTML = `
                    <div style="padding: 1rem; text-align: center;">
                        <img src="./no_notices.png" style="width: 120px; opacity: 0.5; margin-bottom: 1rem;" />
                        <p style="color: var(--text-secondary); margin: 0; font-size: 0.9rem;">No active announcements.</p>
                    </div>`;
                return;
            }

            container.innerHTML = recent.map(n => `
                <div style="margin-bottom: 1.25rem; padding-left: 0.75rem; border-left: 2px solid var(--accent-color);">
                    <div style="font-size: 0.65rem; color: var(--accent-color); font-weight: 800; text-transform: uppercase; margin-bottom: 2px;">${n.category || 'GENERAL'}</div>
                    <div style="font-weight: 700; font-size: 0.95rem; margin-bottom: 2px; line-height: 1.3;">${n.title}</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">${new Date(n.date || n.createdAt).toDateString()}</div>
                </div>
            `).join('');
        } catch (err) {
            container.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.9rem;">Failed to load announcements.</p>';
        }
    }

    renderAdminQuickActions() {
        const div = document.createElement('div');
        div.className = 'glass-panel';
        div.style.padding = '1.5rem';
        div.innerHTML = `
            <h3 style="margin-bottom: 1.25rem; font-size: 1.2rem;">System Controls</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem;">
                <button class="glass-button" style="padding: 10px; font-size: 0.85rem;" onclick="window.location.hash='students/add'">➕ Registrar Student</button>
                <button class="glass-button" style="padding: 10px; font-size: 0.85rem;" onclick="window.location.hash='faculty/add'">👨‍🏫 Recruit Faculty</button>
                <button class="glass-button" style="padding: 10px; font-size: 0.85rem;" onclick="window.location.hash='notices/add'">📢 Post Notice</button>
                <button class="glass-button" style="padding: 10px; font-size: 0.85rem;" onclick="window.location.hash='courses'">📚 Curriculum</button>
            </div>
        `;
        return div;
    }

    renderSystemOverview() {
        const div = document.createElement('div');
        div.className = 'glass-panel';
        div.style.padding = '1.5rem';
        div.innerHTML = `
            <h3 style="margin-bottom: 1.25rem; font-size: 1.2rem;">Academic Vitality</h3>
            <div id="admin-analytics-container" style="min-height: 180px; display: flex; flex-direction: column; gap: 1rem;">
                <div style="text-align: center;">
                     <p style="color: var(--text-secondary); font-size: 0.85rem;">Collecting live campus metrics...</p>
                </div>
            </div>
        `;
        this.updateAdminWithLiveAnalytics(div.querySelector('#admin-analytics-container'));
        return div;
    }

    async updateAdminWithLiveAnalytics(container) {
        try {
            const { ApiService } = await import('../services/ApiService.js');
            const [students, faculty, courses] = await Promise.all([
                ApiService.getStudents(),
                ApiService.getFaculty(),
                ApiService.getCourses()
            ]);

            const ratio = faculty.length ? Math.round(students.length / faculty.length) : students.length;
            const topCourses = {};
            students.forEach(s => {
                topCourses[s.course] = (topCourses[s.course] || 0) + 1;
            });
            const sortedCourses = Object.entries(topCourses).sort((a, b) => b[1] - a[1]).slice(0, 3);

            container.innerHTML = `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div style="padding: 1rem; background: var(--bg-primary); border-radius: var(--radius-md); border: 1px solid var(--glass-border);">
                         <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700;">Ratio</div>
                         <div style="font-size: 1.5rem; font-weight: 800; color: var(--accent-color);">${ratio}:1</div>
                    </div>
                     <div style="padding: 1rem; background: var(--bg-primary); border-radius: var(--radius-md); border: 1px solid var(--glass-border);">
                         <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700;">Depts</div>
                         <div style="font-size: 1.5rem; font-weight: 800; color: var(--success);">${courses.length}</div>
                    </div>
                </div>
                <div>
                     <div style="font-size: 0.85rem; font-weight: 700; margin-bottom: 0.75rem; color: var(--text-primary); display: flex; align-items: center; gap: 6px;">
                        <span>🏆</span> Top Enrollments
                     </div>
                     ${sortedCourses.map(([course, count]) => `
                         <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding: 10px; background: var(--bg-primary); border-radius: var(--radius-sm); border-left: 3px solid var(--accent-color);">
                             <span style="font-size: 0.9rem; font-weight: 600;">${course}</span>
                             <span style="font-weight: 700; color: var(--accent-color); font-size: 0.85rem;">${count}</span>
                         </div>
                     `).join('') || '<div style="font-style:italic; font-size:0.8rem; opacity:0.6;">No data</div>'}
                </div>
            `;
        } catch (e) {
            container.innerHTML = '<p style="color:red; font-size:0.8rem;">Data error</p>';
        }
    }

    renderAttendanceChart(container) {
        const chartWrapper = document.createElement('div');
        chartWrapper.className = 'glass-panel';
        chartWrapper.style.gridColumn = 'span 3';
        chartWrapper.style.padding = '1.5rem';
        chartWrapper.style.marginTop = '1.5rem';
        chartWrapper.innerHTML = `
            <h3 style="margin-bottom: 1rem; font-size: 1.2rem;">📈 Attendance Trends</h3>
            <div style="height: 250px; width: 100%;">
                <canvas id="attendanceChart"></canvas>
            </div>
        `;
        container.appendChild(chartWrapper);

        setTimeout(() => {
            const canvas = document.getElementById('attendanceChart');
            if (canvas && window.Chart) {
                const ctx = canvas.getContext('2d');
                new window.Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                        datasets: [{
                            label: 'Attendance %',
                            data: [82, 85, 89, 87, 92, 95],
                            borderColor: '#6366F1',
                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                            fill: true,
                            tension: 0.4,
                            borderWidth: 3,
                            pointBackgroundColor: '#6366F1'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { beginAtZero: true, max: 100, grid: { color: 'rgba(0,0,0,0.05)' } },
                            x: { grid: { display: false } }
                        }
                    }
                });
            }
        }, 500);
    }
}
