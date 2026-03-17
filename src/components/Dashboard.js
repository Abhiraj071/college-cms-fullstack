import { storage } from '../services/StorageService.js';
import { PollingService } from '../services/PollingService.js';
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
        grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(200px, 1fr))';
        grid.style.gap = '1.25rem';
        grid.innerHTML = '<div style="grid-column: span 3; padding: 2rem; text-align: center;">Loading Fresh Analytics...</div>';
        this.updateDashboardStats(grid, user);
        content.appendChild(grid);

        // ── Real-time polling (every 30 s) ────────────────────────────────
        this._stopPoll = PollingService.start('dashboard', 30_000, () => {
            this.updateDashboardStats(grid, user);
        });
        // Stop polling when user navigates away
        window.addEventListener('hashchange', () => {
            if (this._stopPoll) this._stopPoll();
        }, { once: true });

        // 3. Main Body Split
        const body = document.createElement('div');
        body.style.display = 'grid';
        body.style.gridTemplateColumns = '1fr';
        body.style.gap = '1.5rem';
        body.style.marginTop = 'var(--space-md)';

        if (window.innerWidth > 1024) {
            body.style.gridTemplateColumns = user.role === 'admin' ? '1fr 1fr' : '1.2fr 0.8fr';
        }

        // Right Side: Announcements & Upcoming
        const rightSide = document.createElement('div');
        rightSide.style.display = 'flex';
        rightSide.style.flexDirection = 'column';
        rightSide.style.gap = '1.5rem';

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
            leftSide.appendChild(this.renderEnrollmentChart());
            rightSide.appendChild(this.renderLowAttendanceStudents());
        }

        rightSide.appendChild(this.renderAnnouncements());

        body.appendChild(leftSide);
        body.appendChild(rightSide);
        content.appendChild(body);

        return content;
    }

    async updateDashboardStats(container, user) {
        const role = user.role;
        const cardStyle = (borderColor) => `
            padding: 1.75rem 1.5rem 1.5rem;
            min-height: 150px;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 0.6rem;
            background: var(--bg-primary);
            border-radius: 16px;
            border-top: 4px solid ${borderColor};
            box-shadow: 0 2px 12px rgba(0,0,0,0.06);
            position: relative;
            overflow: hidden;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            cursor: default;
        `.replace(/\s+/g, ' ').trim();
        const statCard = (icon, label, value, borderColor, numColor) => `
            <div class="glass-panel stat-card" style="${cardStyle(borderColor)}"
                 onmouseenter="this.style.transform='translateY(-3px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.1)'"
                 onmouseleave="this.style.transform='translateY(0)';this.style.boxShadow='0 2px 12px rgba(0,0,0,0.06)'">
                <div style="font-size: 2.4rem; line-height: 1;">${icon}</div>
                <div style="font-size: 0.72rem; letter-spacing: 0.08em; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-top: 0.25rem;">${label}</div>
                <div style="font-size: 2.6rem; font-weight: 800; color: ${numColor}; line-height: 1.1;">${value}</div>
            </div>
        `;

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
                    ${statCard('📚', 'Active Subjects', activeSubjectsCount, '#6366f1', '#6366f1')}
                    ${statCard('📅', 'Attendance', attendancePct, '#10b981', '#10b981')}
                    ${statCard('📝', 'Pending Tasks', pendingAssignmentsCount, '#f59e0b', '#f59e0b')}
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
                    ${statCard('🏫', 'My Classes', mySubjects.length, '#6366f1', '#6366f1')}
                    ${statCard('🕒', 'Classes Today', todayClassesCount, '#10b981', '#10b981')}
                    ${statCard('✍️', 'Ungraded Tasks', pendingGradesCount, '#f59e0b', '#f59e0b')}
                `;
            } else {
                const [students, faculty, courses, subjects] = await Promise.all([
                    ApiService.getStudents(),
                    ApiService.getFaculty(),
                    ApiService.getCourses(),
                    ApiService.getSubjects()
                ]);

                statsHtml = `
                    ${statCard('👨‍🎓', 'Students', students.length, '#6366f1', '#6366f1')}
                    ${statCard('👩‍🏫', 'Faculty', faculty.length, '#10b981', '#10b981')}
                    ${statCard('📚', 'Courses', courses.length, '#f59e0b', '#f59e0b')}
                    ${statCard('📖', 'Subjects', subjects.length, '#8b5cf6', '#8b5cf6')}
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

    renderEnrollmentChart() {
        const div = document.createElement('div');
        div.className = 'glass-panel';
        div.style.padding = '1.5rem';
        div.innerHTML = `
            <h3 style="margin: 0 0 1.25rem; font-size: 1.1rem; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                🎓 Enrollment by Course
            </h3>
            <div style="position: relative; height: 260px; display: flex; align-items: center; justify-content: center;">
                <canvas id="enrollmentDonutChart"></canvas>
                <div id="enrollment-empty" style="display:none; color: var(--text-secondary); font-size: 0.9rem;">No enrollment data.</div>
            </div>
            <div id="enrollment-legend" style="display: flex; flex-wrap: wrap; gap: 0.5rem 1rem; margin-top: 1rem; justify-content: center;"></div>
        `;
        this._loadEnrollmentChart(div);
        return div;
    }

    async _loadEnrollmentChart(container) {
        try {
            const { ApiService } = await import('../services/ApiService.js');
            const students = await ApiService.getStudents();

            const counts = {};
            students.forEach(s => {
                if (s.course) counts[s.course] = (counts[s.course] || 0) + 1;
            });
            const labels = Object.keys(counts);
            const data = Object.values(counts);

            if (!labels.length) {
                container.querySelector('#enrollment-empty').style.display = 'block';
                container.querySelector('#enrollmentDonutChart').style.display = 'none';
                return;
            }

            const palette = ['#6366f1','#10b981','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#f97316','#84cc16'];

            const waitForChart = (attempts = 0) => {
                const canvas = container.querySelector('#enrollmentDonutChart');
                if (!canvas) return;
                if (window.Chart) {
                    new window.Chart(canvas.getContext('2d'), {
                        type: 'doughnut',
                        data: {
                            labels,
                            datasets: [{
                                data,
                                backgroundColor: palette.slice(0, labels.length),
                                borderColor: '#fff',
                                borderWidth: 3,
                                hoverOffset: 8
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            cutout: '62%',
                            plugins: {
                                legend: { display: false },
                                tooltip: {
                                    callbacks: {
                                        label: ctx => ` ${ctx.label}: ${ctx.raw} students`
                                    }
                                }
                            }
                        }
                    });
                    // Custom legend
                    const legend = container.querySelector('#enrollment-legend');
                    if (legend) {
                        legend.innerHTML = labels.map((label, i) => `
                            <div style="display:flex; align-items:center; gap:6px; font-size:0.78rem; color: var(--text-secondary);">
                                <span style="width:14px; height:14px; border-radius:3px; background:${palette[i % palette.length]}; flex-shrink:0; display:inline-block;"></span>
                                ${label}
                            </div>
                        `).join('');
                    }
                } else if (attempts < 20) {
                    setTimeout(() => waitForChart(attempts + 1), 300);
                }
            };
            setTimeout(() => waitForChart(), 400);
        } catch (e) {
            console.error('Enrollment chart error', e);
        }
    }

    renderLowAttendanceStudents() {
        const div = document.createElement('div');
        div.className = 'glass-panel';
        div.style.padding = '1.5rem';
        div.innerHTML = `
            <h3 style="margin: 0 0 0.25rem; font-size: 1.1rem; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                ⚠️ Low Attendance Students
            </h3>
            <p style="margin: 0 0 1rem; font-size: 0.82rem; color: var(--text-secondary);">Students below 75% threshold</p>
            <div id="low-attendance-list" style="display: flex; flex-direction: column; gap: 0.6rem; max-height: 400px; overflow-y: auto; padding-right: 4px;">
                <p style="color: var(--text-secondary); font-size: 0.9rem; text-align:center; padding: 1rem 0;">Loading...</p>
            </div>
        `;
        this._loadLowAttendanceStudents(div.querySelector('#low-attendance-list'));
        return div;
    }

    async _loadLowAttendanceStudents(container) {
        try {
            const { ApiService } = await import('../services/ApiService.js');
            const students = await ApiService.getStudents();

            const low = students
                .filter(s => {
                    const pct = parseFloat(String(s.attendancePercentage || '0').replace('%',''));
                    return pct > 0 && pct < 75;
                })
                .sort((a, b) => {
                    const pa = parseFloat(String(a.attendancePercentage).replace('%',''));
                    const pb = parseFloat(String(b.attendancePercentage).replace('%',''));
                    return pa - pb;
                });

            if (!low.length) {
                container.innerHTML = `
                    <div style="text-align:center; padding: 2rem 0;">
                        <div style="font-size: 2rem; margin-bottom: 0.5rem;">✅</div>
                        <p style="color: var(--text-secondary); font-size: 0.9rem; margin:0;">All students above 75% — great!</p>
                    </div>`;
                return;
            }

            container.innerHTML = low.map(s => {
                const pct = parseFloat(String(s.attendancePercentage || '0').replace('%',''));
                const color = pct < 60 ? '#ef4444' : '#f59e0b';
                return `
                    <div style="display: flex; align-items: center; justify-content: space-between;
                                padding: 0.85rem 1rem; background: var(--bg-secondary);
                                border-radius: 10px; border: 1px solid var(--glass-border);">
                        <div>
                            <div style="font-weight: 700; font-size: 0.95rem; margin-bottom: 2px;">${s.name || s.userId?.name || 'Unknown'}</div>
                            <div style="font-size: 0.78rem; color: var(--text-secondary);">
                                ${s.enrollmentNumber || s._id?.slice(-5) || '—'} · ${s.course || ''}
                            </div>
                        </div>
                        <div style="font-size: 1.3rem; font-weight: 800; color: ${color}; flex-shrink:0; margin-left: 1rem;">
                            ${Math.round(pct)}%
                        </div>
                    </div>
                `;
            }).join('');
        } catch (e) {
            container.innerHTML = '<p style="color: var(--text-secondary); font-size:0.85rem;">Failed to load attendance data.</p>';
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