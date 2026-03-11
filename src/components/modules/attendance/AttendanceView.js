import { ApiService } from '../../../services/ApiService.js';
import { auth } from '../../../services/AuthService.js';
import { Table } from '../../common/Table.js';
import { Toast } from '../../../services/Toast.js';
import { ROUTES } from '../../../services/Constants.js';

export class AttendanceView {
    constructor(id = null, params = {}) {
        this.params = params || {};
        this.selectedCourse = this.params.course || null;
        // Use local date for default to avoid timezone issues (e.g. UTC showing yesterday)
        const localDate = new Date();
        const offset = localDate.getTimezoneOffset();
        const localDateString = new Date(localDate.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0];
        this.selectedDate = this.params.date || localDateString;
        this.sessionDetails = null; // { course, year, semester, subject }
        this.activeTab = 'mark'; // mark, defaulters, history
        this.assignedClasses = [];
    }

    render() {
        const container = document.createElement('div');
        container.className = 'fade-in';
        const user = auth.getUser();

        // 1. Header Section
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'flex-end';
        header.style.marginBottom = '2rem';
        header.style.flexWrap = 'wrap';
        header.style.gap = '1rem';

        const titleSection = document.createElement('div');
        titleSection.innerHTML = `
            <h2 style="font-size: 2rem; margin-bottom: 0.5rem; letter-spacing: -0.5px;">Attendance</h2>
            <p style="color: var(--text-secondary); font-size: 1rem;">
                ${user.role === 'student' ? 'Track your academic consistency' : 'Manage student presence and participation'}
            </p>
        `;
        header.appendChild(titleSection);
        container.appendChild(header);



        // 2. Tab Navigation
        const tabsContainer = document.createElement('div');
        tabsContainer.style.marginBottom = '2rem';

        const tabs = document.createElement('div');
        tabs.className = 'glass-panel';
        tabs.style.padding = '0.5rem';
        tabs.style.display = 'inline-flex';
        tabs.style.gap = '0.5rem';
        tabs.style.borderRadius = '12px';

        let tabList = [];

        if (user.role === 'student') {
            tabList = [
                { id: 'my-attendance', label: 'My Attendance', icon: '✅' }
            ];
            if (!this.activeTab || this.activeTab === 'mark') this.activeTab = 'my-attendance';
        } else {
            tabList = [
                { id: 'mark', label: 'Mark Attendance', icon: '📝' },
                { id: 'defaulters', label: 'Defaulters', icon: '⚠️' },
                { id: 'history', label: 'History', icon: '🕒' }
            ];
        }

        tabs.innerHTML = tabList.map(tab => `
            <button class="glass-button" data-tab="${tab.id}" style="padding: 10px 20px; font-size: 0.85rem; background: transparent; color: var(--text-secondary); border: none; font-weight: 600; display: flex; align-items: center; gap: 8px; transition: all 0.3s ease;">
                <span>${tab.icon}</span> ${tab.label}
            </button>
        `).join('');

        tabsContainer.appendChild(tabs);
        container.appendChild(tabsContainer);

        const content = document.createElement('div');
        content.id = 'attendance-tab-content';
        container.appendChild(content);

        const updateTabStyles = () => {
            tabs.querySelectorAll('button').forEach(btn => {
                const isActive = btn.dataset.tab === this.activeTab;
                btn.style.background = isActive ? 'var(--accent-color)' : 'transparent';
                btn.style.color = isActive ? 'white' : 'var(--text-secondary)';
                btn.style.boxShadow = isActive ? '0 4px 12px var(--accent-glow)' : 'none';
                btn.style.transform = isActive ? 'translateY(-1px)' : 'none';
            });
        };

        tabs.querySelectorAll('button').forEach(btn => {
            btn.onclick = () => {
                this.activeTab = btn.dataset.tab || 'mark';
                updateTabStyles();
                this.renderTab(content);
            };
        });

        updateTabStyles();
        this.renderTab(content);
        return container;
    }

    renderTab(container) {
        container.innerHTML = '';
        if (this.activeTab === 'mark') {
            if (this.selectedCourse) {
                this.renderAttendanceForm(container);
            } else {
                this.renderMarkTab(container);
            }
        } else if (this.activeTab === 'defaulters') {
            this.renderDefaultersTab(container);
        } else if (this.activeTab === 'my-attendance') {
            const user = auth.getUser();
            this.renderStudentView(container, user);
        } else {
            this.renderHistoryTab(container);
        }
    }

    async renderMarkTab(container) {
        const user = auth.getUser();

        // 1. Controls (Date Only)
        const controls = document.createElement('div');
        controls.className = 'glass-panel';
        controls.style.padding = '1.5rem';
        controls.style.marginBottom = '2rem';
        controls.innerHTML = `
                <div style="display: flex; gap: 1.5rem; align-items: center;">
                    <div style="width: 200px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 700; font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px;">Session Date</label>
                        <input type="date" id="attDate" value="${this.selectedDate}" style="width: 100%; padding: 11px; border: 1px solid var(--glass-border); border-radius: 10px; background: rgba(0,0,0,0.02); font-family: inherit; font-size: 0.95rem;">
                    </div>
                    <div style="flex: 1;">
                         <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">Select a course card below to mark attendance.</p>
                    </div>
                </div>
            `;
        container.appendChild(controls);

        // Listener for Date Change
        controls.querySelector('#attDate').onchange = (e) => {
            this.selectedDate = e.target.value;
        };

        const listResults = document.createElement('div');
        listResults.id = 'attendance-quick-selection';

        // Grid Container
        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(300px, 1fr))';
        grid.style.gap = '1.5rem';

        listResults.appendChild(grid);
        container.appendChild(listResults);

        try {
            const [allCourses, allTimetables, allSubjects] = await Promise.all([
                ApiService.getCourses(),
                ApiService.getTimetables(),
                ApiService.getSubjects()
            ]);

            // Function to filter and render cards based on date
            const renderCards = () => {
                grid.innerHTML = '';
                const dateObj = new Date(this.selectedDate);
                const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

                // Update specific indicator if it exists, otherwise we rely on the main list
                const indicator = controls.querySelector('#day-indicator');
                if (indicator) indicator.textContent = `Schedule for ${dayName}`;

                let itemsToRender = [];

                if (user.role === 'teacher') {
                    // Map key: "Course|Year|Sem|Subject"
                    const myClassMap = new Map();

                    // Check Timetables for THIS day
                    allTimetables.forEach(t => {
                        if (t.grid) {
                            // Grid keys are "Day::Time"
                            Object.entries(t.grid).forEach(([key, slot]) => {
                                const [day] = key.split('::');
                                if (day !== dayName) return;

                                // Ignore Lunch/Break slots
                                if (slot.subject && /break/i.test(slot.subject)) return;

                                // Check if this slot belongs to the logged-in teacher
                                const isMyClass = (
                                    slot.teacher === user.name ||
                                    (user.facultyId && slot.teacher === String(user.facultyId)) ||
                                    slot.teacher === user._id
                                );

                                if (isMyClass) {
                                    const uniqueKey = `${t.course}|${t.year}|${t.semester}|${slot.subject}`;
                                    if (!myClassMap.has(uniqueKey)) {
                                        myClassMap.set(uniqueKey, {
                                            course: t.course,
                                            year: t.year,
                                            semester: t.semester,
                                            subject: slot.subject,
                                            details: `Year ${t.year} • Sem ${t.semester}`,
                                            tag: 'SCHEDULED TODAY'
                                        });
                                    }
                                }
                            });
                        }
                    });

                    itemsToRender = Array.from(myClassMap.values());

                    if (itemsToRender.length === 0) {
                        grid.innerHTML = `
                            <div class="glass-panel" style="grid-column: 1/-1; text-align: center; padding: 4rem 2rem;">
                                <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;">📅</div>
                                <h3 style="color: var(--text-primary); margin-bottom: 0.5rem;">No Classes Scheduled</h3>
                                <p style="color: var(--text-secondary);">You don't have any classes scheduled for <strong>${dayName}</strong>.</p>
                                <p style="font-size: 0.8rem; opacity: 0.6; margin-top: 1rem;">(Please check the timetable or select a different date)</p>
                            </div>
                        `;
                        return;
                    }
                } else {
                    // Admin: Show All Courses (Admin has to manually select details later or logic needs extension)
                    // For now, retaining course-level selection for Admin, but ideally Admin should also see a master schedule
                    itemsToRender = allCourses.map(c => ({
                        course: c.name,
                        year: '1', // Default or need selection
                        semester: '1', // Default or need selection
                        subject: 'General',
                        name: c.name,
                        details: c.duration ? `${c.duration} Years Duration` : 'Academic Course',
                        tag: 'COURSE'
                    }));
                }

                // Render Cards
                itemsToRender.forEach(item => {
                    const card = document.createElement('div');
                    card.className = 'glass-panel fade-in';
                    card.style.padding = '0';
                    card.style.overflow = 'hidden';
                    card.style.cursor = 'pointer';
                    card.style.transition = 'transform 0.2s, box-shadow 0.2s';
                    card.onclick = () => {
                        this.sessionDetails = {
                            course: item.course,
                            year: item.year,
                            semester: item.semester,
                            subject: item.subject
                        };
                        this.renderAttendanceForm(container);
                    };

                    card.innerHTML = `
                        <div style="padding: 1.5rem; background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), transparent); border-bottom: 1px solid var(--glass-border);">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                                <span style="background: var(--accent-color); color: white; padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 700;">${item.tag}</span>
                                <span style="color: var(--text-secondary); font-size: 0.8rem; font-weight: 600;">${item.details || ''}</span>
                            </div>
                            <h4 style="margin: 0; font-size: 1.25rem; font-weight: 800; color: var(--text-primary);">${item.course}</h4>
                            <div style="margin-top: 0.5rem; font-size: 0.95rem; color: var(--text-primary); font-weight: 600;">
                                📚 ${item.subject}
                            </div>
                        </div>
                        <div style="padding: 1rem; text-align: center; background: var(--bg-secondary); font-size: 0.85rem; font-weight: 700; color: var(--accent-color);">
                            MARK ATTENDANCE &rarr;
                        </div>
                    `;
                    grid.appendChild(card);
                });
            };

            // Initial Render
            renderCards();

            // Listener for Date Change
            controls.querySelector('#attDate').onchange = (e) => {
                this.selectedDate = e.target.value;
                renderCards();
            };

        } catch (err) {
            Toast.error('Failed to load classes: ' + err.message);
        }
    }

    async renderAttendanceForm(container) {
        const { course, year, semester, subject } = this.sessionDetails;

        container.innerHTML = `
            <div style="padding: 5rem; text-align: center;">
                <div class="loader" style="margin: 0 auto 1.5rem;"></div>
                <p style="color: var(--text-secondary);">Loading student roster for ${course} (${year} Year, Sem ${semester})...</p>
            </div>
        `;

        try {
            const [allStudents, existingRecords] = await Promise.all([
                ApiService.getStudents(),
                ApiService.getAttendance(this.selectedDate, course, year, semester, subject)
            ]);

            // STRICT FILTERING: Course & Semester (Year derived from Sem)
            const students = allStudents.filter(s =>
                s.course === course &&
                String(s.semester) === String(semester)
            );

            if (students.length === 0) {
                container.innerHTML = `
                    <div class="glass-panel" style="padding: 5rem; text-align: center; border: 1px dashed var(--glass-border);">
                        <div style="font-size: 4rem; opacity: 0.5; margin-bottom: 1rem;">👥</div>
                        <h3>No Students Found</h3>
                        <p style="color: var(--text-secondary);">There are no students enrolled in ${this.selectedCourse}.</p>
                        <button class="glass-button" style="margin-top: 1.5rem;" onclick="location.reload()">Back to Select</button>
                    </div>
                `;
                return;
            }

            const session = existingRecords.length > 0 ? existingRecords[0] : null;
            const isEditing = !!session;

            container.innerHTML = '';

            // Layout with Stats and Table
            const topBar = document.createElement('div');
            topBar.style.display = 'flex';
            topBar.style.justifyContent = 'space-between';
            topBar.style.alignItems = 'center';
            topBar.style.marginBottom = '2rem';
            topBar.style.flexWrap = 'wrap';
            topBar.style.gap = '1.5rem';

            topBar.innerHTML = `
                <div>
                     <button class="glass-button" style="padding: 8px 16px; font-size: 0.8rem; margin-bottom: 1rem; background: var(--bg-secondary); border: 1px solid var(--glass-border); color: var(--text-secondary);" id="backToSelectBtn">← Back to Schedule</button>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <h3 style="margin: 0; font-size: 1.5rem;">${subject}</h3>
                        ${isEditing ? `<span style="background: var(--warning); color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700;">EDITING RECORD</span>` : ''}
                    </div>
                    <p style="color: var(--text-secondary); font-size: 0.95rem; margin-top: 4px;">
                        ${course} • Year ${year} • Sem ${semester}
                    </p>
                    <p style="color: var(--text-secondary); font-size: 0.8rem; margin-top: 2px; opacity: 0.8;">
                        ${new Date(this.selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                </div>
                <div style="display: flex; gap: 1rem;">
                    <div class="glass-panel" style="padding: 15px 25px; display: flex; flex-direction: column; align-items: center; min-width: 120px; border: 1px solid rgba(16, 185, 129, 0.1);">
                        <span style="font-size: 0.75rem; color: var(--success); font-weight: 700; text-transform: uppercase;">Present</span>
                        <span id="stat-pcount" style="font-size: 1.8rem; font-weight: 800;">0</span>
                    </div>
                    <div class="glass-panel" style="padding: 15px 25px; display: flex; flex-direction: column; align-items: center; min-width: 120px; border: 1px solid rgba(239, 68, 68, 0.1);">
                        <span style="font-size: 0.75rem; color: var(--danger); font-weight: 700; text-transform: uppercase;">Absent</span>
                        <span id="stat-acount" style="font-size: 1.8rem; font-weight: 800;">0</span>
                    </div>
                </div>
            `;
            container.appendChild(topBar);

            topBar.querySelector('#backToSelectBtn').onclick = () => {
                this.selectedCourse = null;
                this.renderTab(container);
            };

            const sheetCard = document.createElement('div');
            sheetCard.className = 'glass-panel fade-in';
            sheetCard.style.padding = '0';
            sheetCard.style.overflow = 'hidden';

            const table = document.createElement('table');
            table.style.width = '100%';
            table.style.borderCollapse = 'collapse';
            table.innerHTML = `
                <thead style="background: rgba(0,0,0,0.02);">
                    <tr>
                        <th style="padding: 1.25rem 1.5rem; text-align: left; font-size: 0.75rem; text-transform: uppercase; color: var(--text-secondary); width: 15%;">Roll No</th>
                        <th style="padding: 1.25rem 1.5rem; text-align: left; font-size: 0.75rem; text-transform: uppercase; color: var(--text-secondary);">Student Name</th>
                        <th style="padding: 1.25rem 1.5rem; text-align: center; font-size: 0.75rem; text-transform: uppercase; color: var(--text-secondary); width: 30%;">Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${students.map(s => {
                const status = session?.students.find(sr => (sr.studentId?._id || sr.studentId) === s._id)?.status || 'Present';
                return `
                            <tr style="border-bottom: 1px solid var(--glass-border); transition: background 0.2s;">
                                <td style="padding: 1.25rem 1.5rem; font-weight: 600; font-family: monospace;">${s.rollNo}</td>
                                <td style="padding: 1.25rem 1.5rem; font-weight: 700; color: var(--text-primary); font-size: 1rem;">${s.name}</td>
                                <td style="padding: 1rem 1.5rem; text-align: center;">
                                    <div class="att-toggle-group" data-sid="${s._id}" data-status="${status}">
                                        <button class="att-btn p-btn ${status === 'Present' ? 'active' : ''}" data-val="Present">P</button>
                                        <button class="att-btn a-btn ${status === 'Absent' ? 'active' : ''}" data-val="Absent">A</button>
                                        <button class="att-btn l-btn ${status === 'Late' ? 'active' : ''}" data-val="Late">L</button>
                                    </div>
                                </td>
                            </tr>
                        `;
            }).join('')}
                </tbody>
            `;
            sheetCard.appendChild(table);
            container.appendChild(sheetCard);

            const updateStats = () => {
                const absents = container.querySelectorAll('.att-toggle-group[data-status="Absent"]').length;
                const presents = container.querySelectorAll('.att-toggle-group[data-status="Present"]').length;
                container.querySelector('#stat-pcount').textContent = presents;
                container.querySelector('#stat-acount').textContent = absents;
            };

            table.addEventListener('click', (e) => {
                const btn = e.target.closest('.att-btn');
                if (!btn) return;
                const group = btn.closest('.att-toggle-group');
                group.querySelectorAll('.att-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                group.dataset.status = btn.dataset.val;
                updateStats();
            });

            // Action section
            const footer = document.createElement('div');
            footer.style.marginTop = '2rem';
            footer.style.display = 'flex';
            footer.style.justifyContent = 'flex-end';

            const saveBtn = document.createElement('button');
            saveBtn.className = 'glass-button';
            saveBtn.style.padding = '16px 48px';
            saveBtn.style.fontSize = '1.1rem';
            saveBtn.style.background = 'var(--accent-color)';
            saveBtn.style.color = 'white';
            saveBtn.style.fontWeight = '800';
            saveBtn.style.border = 'none';
            saveBtn.style.borderRadius = '16px';
            saveBtn.style.boxShadow = '0 10px 25px -5px var(--accent-glow)';
            saveBtn.textContent = isEditing ? 'Update Attendance Sheet' : 'Save Attendance Sheet';

            saveBtn.onclick = async () => {
                saveBtn.disabled = true;
                saveBtn.textContent = 'Uploading Records...';

                const records = Array.from(container.querySelectorAll('.att-toggle-group')).map(g => ({
                    studentId: g.dataset.sid,
                    status: g.dataset.status
                }));

                try {
                    await ApiService.markAttendance({
                        date: this.selectedDate,
                        course: this.sessionDetails.course,
                        year: this.sessionDetails.year,
                        semester: this.sessionDetails.semester,
                        subject: this.sessionDetails.subject,
                        students: records
                    });
                    Toast.success('Attendance recorded successfully!');
                } catch (err) {
                    Toast.error(err.message);
                } finally {
                    saveBtn.disabled = false;
                    saveBtn.textContent = isEditing ? 'Update Attendance Sheet' : 'Save Attendance Sheet';
                }
            };

            footer.appendChild(saveBtn);
            container.appendChild(footer);

            // Sheet Styles
            const style = document.createElement('style');
            style.textContent = `
                .att-toggle-group { display: inline-flex; background: rgba(0,0,0,0.03); padding: 4px; border-radius: 14px; border: 1px solid var(--glass-border); gap: 4px; }
                .att-btn { border: none; background: transparent; padding: 6px 16px; border-radius: 10px; font-weight: 800; font-size: 0.85rem; cursor: pointer; color: var(--text-secondary); transition: all 0.2s; }
                .att-btn:hover { background: rgba(0,0,0,0.05); }
                .p-btn.active { background: var(--success); color: white; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.25); }
                .a-btn.active { background: var(--danger); color: white; box-shadow: 0 4px 10px rgba(239, 68, 68, 0.25); }
                .l-btn.active { background: var(--warning); color: white; box-shadow: 0 4px 10px rgba(245, 158, 11, 0.25); }
                tr:hover { background: rgba(0,0,0,0.01); }
            `;
            container.appendChild(style);
            updateStats();

        } catch (err) {
            Toast.error(err.message);
        }
    }

    async renderDefaultersTab(container) {
        container.innerHTML = `
            <div style="padding: 5rem; text-align: center;">
                <div class="loader" style="margin: 0 auto 1.5rem;"></div>
                <p style="color: var(--text-secondary);">Analyzing academic records for low attendance...</p>
            </div>
        `;

        try {
            const [students, records] = await Promise.all([
                ApiService.getStudents(),
                ApiService.getAttendance()
            ]);

            const defaulters = students.map(s => {
                const totalSessions = records.filter(r => r.course === s.course).length;
                const sessionsPresent = records.filter(r =>
                    r.course === s.course &&
                    r.students.some(rs => (rs.studentId?._id === s._id || rs.studentId === s._id) && rs.status === 'Present')
                ).length;
                const perc = totalSessions ? Math.round((sessionsPresent / totalSessions) * 100) : 0;
                return { ...s, perc, sessions: `${sessionsPresent}/${totalSessions}` };
            }).filter(s => s.perc < 75);

            if (defaulters.length === 0) {
                container.innerHTML = `
                    <div class="glass-panel" style="padding: 5rem; text-align: center; border: 1px dashed var(--glass-border);">
                        <div style="font-size: 4rem; margin-bottom: 1.5rem;">✨</div>
                        <h3 style="font-size: 1.5rem;">No Defaulters Found</h3>
                        <p style="color: var(--text-secondary);">All students are maintaining healthy attendance levels above 75%.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = `
                <div class="glass-panel" style="padding: 1.5rem; margin-bottom: 2rem; background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.1);">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="font-size: 1.5rem;">🚩</span>
                        <div>
                            <h3 style="color: var(--danger); margin: 0; font-size: 1.25rem;">Attendance Shortage Alert</h3>
                            <p style="margin: 0; color: var(--danger); opacity: 0.8; font-size: 0.9rem;">Found ${defaulters.length} students with attendance below 75% threshold.</p>
                        </div>
                    </div>
                </div>
            `;

            const table = new Table({
                columns: [
                    { key: 'rollNo', label: 'Roll Number' },
                    { key: 'name', label: 'Student Name', render: (v) => `<span style="font-weight: 700;">${v}</span>` },
                    { key: 'course', label: 'Academic Program' },
                    { key: 'sessions', label: 'Sessions (P/T)', render: (v) => `<span style="font-family: monospace; font-weight: 600;">${v}</span>` },
                    {
                        key: 'perc',
                        label: 'Attendance Score',
                        render: (v) => `
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <div style="flex: 1; height: 6px; background: rgba(0,0,0,0.05); border-radius: 3px; min-width: 80px;">
                                    <div style="width: ${v}%; height: 100%; background: var(--danger); border-radius: 3px;"></div>
                                </div>
                                <span style="color: var(--danger); font-weight: 800; font-size: 0.95rem;">${v}%</span>
                            </div>
                        `
                    }
                ],
                data: defaulters,
                actions: false
            });

            const content = document.createElement('div');
            content.className = 'glass-panel';
            content.style.padding = '0';
            content.appendChild(table.render());
            container.appendChild(content);

        } catch (err) {
            container.innerHTML = `<p style="color:var(--danger); padding: 2rem; text-align: center;">Error analytics: ${err.message}</p>`;
        }
    }

    renderHistoryTab(container) {
        container.innerHTML = `
            <div class="glass-panel fade-in" style="padding: 8rem 2rem; text-align: center; border: 1px dashed var(--glass-border);">
                <div style="font-size: 4rem; margin-bottom: 2rem; opacity: 0.2; filter: grayscale(1);">📊</div>
                <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem; opacity: 0.6;">Historical Analytics Coming Soon</h3>
                <p style="color: var(--text-secondary); max-width: 400px; margin: 0 auto;">We're building an advanced tracking engine to help you visualize attendance trends over the entire semester.</p>
            </div>
        `;
    }

    async renderStudentView(container, user) {
        container.innerHTML = `
            <div style="padding: 5rem; text-align: center;">
                <div class="loader" style="margin: 0 auto 1.5rem;"></div>
                <p style="color: var(--text-secondary);">Syncing your attendance records...</p>
            </div>
        `;

        try {
            // Fetch all students and find the profile manually to avoid backend query param issues
            const allStudents = await ApiService.getStudents();
            const targetId = String(user.id || user._id);
            const profile = allStudents.find(s => String(s.userId?._id || s.userId || s.userId?.id) === targetId);

            if (!profile) {
                container.innerHTML = '<div class="glass-panel" style="padding: 4rem; text-align: center;">No student profile associated with this account.</div>';
                return;
            }

            const rawRecords = await ApiService.getStudentAttendance(profile._id);
            // Filter by student's current course
            const records = rawRecords.filter(r => r.course === profile.course);

            const profileId = String(profile._id);

            // Calculate Subject-wise Stats
            const subjectStats = {};
            records.forEach(r => {
                const subject = r.subject || 'General'; // Fallback if subject not recorded
                if (!subjectStats[subject]) {
                    subjectStats[subject] = { total: 0, present: 0 };
                }
                subjectStats[subject].total++;

                const myRecord = r.students.find(s => String(s.studentId?._id || s.studentId) === profileId);
                // Counting 'Present' and 'Late' (optional) as Present for percentage, usually just 'Present'
                if (myRecord && myRecord.status === 'Present') {
                    subjectStats[subject].present++;
                }
            });

            // Calculate Overall Stats (Strict Day-wise)
            // Rule: Student must be Present in ALL classes of a day to be marked Present for that day.
            const dailyRecords = {};
            records.forEach(r => {
                const dateKey = new Date(r.date).toISOString().split('T')[0];
                if (!dailyRecords[dateKey]) {
                    dailyRecords[dateKey] = { totalSessions: 0, presentSessions: 0 };
                }
                dailyRecords[dateKey].totalSessions++;

                const myRecord = r.students.find(s => String(s.studentId?._id || s.studentId) === profileId);
                if (myRecord && myRecord.status === 'Present') {
                    dailyRecords[dateKey].presentSessions++;
                }
            });

            const totalDays = Object.keys(dailyRecords).length;
            let presentDays = 0;

            Object.values(dailyRecords).forEach(day => {
                if (day.totalSessions > 0 && day.presentSessions === day.totalSessions) {
                    presentDays++;
                }
            });

            const perc = totalDays ? Math.round((presentDays / totalDays) * 100) : 0;

            container.innerHTML = `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
                    <div class="glass-panel" style="padding: 1.5rem; display: flex; align-items: center; gap: 1.5rem;">
                         <div style="width: 80px; height: 80px; border-radius: 50%; background: var(--accent-glow); display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">📈</div>
                         <div>
                            <div style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 600;">Overall Attendance (Day-wise)</div>
                            <div style="font-size: 2rem; font-weight: 800; color: ${perc >= 75 ? 'var(--success)' : 'var(--danger)'}">${perc}%</div>
                            <p style="margin:0; font-size: 0.8rem; opacity: 0.7;">Threshold: 75%</p>
                         </div>
                    </div>
                    <div class="glass-panel" style="padding: 1.5rem; display: flex; align-items: center; gap: 1.5rem;">
                         <div style="width: 80px; height: 80px; border-radius: 50%; background: rgba(16, 185, 129, 0.1); display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">✅</div>
                         <div>
                            <div style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 600;">Days Present</div>
                            <div style="font-size: 2rem; font-weight: 800;">${presentDays} <span style="font-size: 1.2rem; opacity: 0.4;">/ ${totalDays}</span></div>
                            <p style="margin:0; font-size: 0.75rem; opacity: 0.7; color: var(--warning);">*Must attend all classes to count</p>
                         </div>
                    </div>
                </div>

                <h3 style="margin-bottom: 1.25rem;">Subject Performance</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 3rem;">
                    ${Object.entries(subjectStats).map(([subject, stats]) => {
                const subjectPerc = stats.total ? Math.round((stats.present / stats.total) * 100) : 0;
                const color = subjectPerc >= 75 ? 'var(--success)' : 'var(--danger)';
                return `
                            <div class="glass-panel" style="padding: 1.5rem; border-left: 4px solid ${color};">
                                <h4 style="margin: 0 0 0.5rem 0; font-size: 1.1rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${subject}</h4>
                                <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 0.5rem;">
                                    <span style="font-size: 2rem; font-weight: 800; color: ${color};">${subjectPerc}%</span>
                                    <span style="font-size: 0.9rem; color: var(--text-secondary); font-weight: 600;">${stats.present} / ${stats.total}</span>
                                </div>
                                <div style="width: 100%; height: 6px; background: rgba(0,0,0,0.05); border-radius: 3px;">
                                    <div style="width: ${subjectPerc}%; height: 100%; background: ${color}; border-radius: 3px;"></div>
                                </div>
                            </div>
                        `;
            }).join('')}
                </div>
                
                <h3 style="margin-bottom: 1.25rem;">Recent Activity Log</h3>
            `;

            const table = new Table({
                columns: [
                    { key: 'date', label: 'Session Date', render: (v) => `<div style="font-weight: 700;">${new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>` },
                    { key: 'course', label: 'Academic Course' },
                    {
                        key: 'students',
                        label: 'Verification Status',
                        render: (v) => {
                            const status = v.find(s => String(s.studentId?._id || s.studentId) === String(profile._id))?.status || 'Unknown';
                            const colors = {
                                'Present': 'var(--success)',
                                'Absent': 'var(--danger)',
                                'Late': 'var(--warning)',
                                'Unknown': 'var(--text-secondary)'
                            };
                            return `<div style="display: flex; align-items: center; gap: 8px;">
                                <div style="width: 8px; height: 8px; border-radius: 50%; background: ${colors[status]}"></div>
                                <span style="color: ${colors[status]}; font-weight: 800; font-size: 0.85rem; text-transform: uppercase;">${status}</span>
                            </div>`;
                        }
                    }
                ],
                data: records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
                actions: false
            });

            const content = document.createElement('div');
            content.className = 'glass-panel';
            content.style.padding = '0';
            content.appendChild(table.render());
            container.appendChild(content);

        } catch (err) {
            container.innerHTML = `<div class="glass-panel" style="padding: 3rem; text-align: center; color: var(--danger);">Failed to load logs: ${err.message}</div>`;
        }
    }
}
