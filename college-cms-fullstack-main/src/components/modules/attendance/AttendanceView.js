import { ApiService } from '../../../services/ApiService.js';
import { auth } from '../../../services/AuthService.js';
import { Table } from '../../common/Table.js';
import { Toast } from '../../../services/Toast.js';
import { ROUTES } from '../../../services/Constants.js';

export class AttendanceView {
    constructor(id = null, params = {}) {
        this.params = params || {};
        this.selectedCourse = this.params.course || null;
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
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 0.5rem;">
                <span style="font-size: 2rem;">📅</span>
                <h2 style="font-size: 2rem; margin: 0; letter-spacing: -1px;">Attendance</h2>
            </div>
            <p style="color: var(--text-secondary); font-size: 1rem; font-weight: 500;">
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
        tabs.style.padding = '4px';
        tabs.style.display = 'inline-flex';
        tabs.style.gap = '4px';
        tabs.style.borderRadius = '12px';
        tabs.style.background = 'var(--bg-secondary)';

        let tabList = [];
        if (user.role === 'student') {
            tabList = [{ id: 'my-attendance', label: 'My Attendance', icon: '✅' }];
            if (!this.activeTab || this.activeTab === 'mark') this.activeTab = 'my-attendance';
        } else {
            tabList = [
                { id: 'mark', label: 'Mark Attendance', icon: '📝' },
                { id: 'defaulters', label: 'Defaulters', icon: '⚠️' },
                { id: 'history', label: 'History', icon: '🕒' }
            ];
        }

        tabs.innerHTML = tabList.map(tab => `
            <button class="nav-tab" data-tab="${tab.id}" style="
                padding: 8px 16px; 
                font-size: 0.85rem; 
                background: transparent; 
                color: var(--text-secondary); 
                border: none; 
                border-radius: 8px;
                font-weight: 600; 
                display: flex; 
                align-items: center; 
                gap: 8px; 
                cursor: pointer;
                transition: all 0.2s ease;">
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
                btn.style.boxShadow = isActive ? '0 4px 12px rgba(99, 102, 241, 0.2)' : 'none';
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

        const controls = document.createElement('div');
        controls.className = 'glass-panel';
        controls.style.padding = '1.5rem';
        controls.style.marginBottom = '2rem';
        controls.innerHTML = `
            <div style="display: flex; gap: 1.5rem; align-items: center; flex-wrap: wrap;">
                <div style="width: 220px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 700; font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase;">Session Date</label>
                    <input type="date" id="attDate" value="${this.selectedDate}" style="width: 100%;">
                </div>
                <div style="flex: 1; min-width: 250px; padding: 12px 20px; background: var(--bg-primary); border-radius: 12px; border: 1px solid var(--glass-border);">
                     <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem; font-weight: 500;">
                        <span id="day-indicator" style="color: var(--accent-color); font-weight: 700;">Select a date</span> to view scheduled classes.
                     </p>
                </div>
            </div>
        `;
        container.appendChild(controls);

        const listResults = document.createElement('div');
        listResults.id = 'attendance-quick-selection';
        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(320px, 1fr))';
        grid.style.gap = '1.5rem';
        listResults.appendChild(grid);
        container.appendChild(listResults);

        try {
            const [allCourses, allTimetables, allSubjects, dateAttendance] = await Promise.all([
                ApiService.getCourses(),
                ApiService.getTimetables(),
                ApiService.getSubjects(),
                ApiService.getAttendance(this.selectedDate)
            ]);

            const renderCards = () => {
                grid.innerHTML = '';
                const dateObj = new Date(this.selectedDate);
                const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                controls.querySelector('#day-indicator').textContent = `Schedule for ${dayName}`;

                let itemsToRender = [];
                if (user.role === 'teacher') {
                    const myClassMap = new Map();
                    allTimetables.forEach(t => {
                        if (t.grid) {
                            Object.entries(t.grid).forEach(([key, slot]) => {
                                const [day] = key.split('::');
                                if (day !== dayName) return;
                                if (slot.subject && /break/i.test(slot.subject)) return;

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
                                            time: key.split('::')[1],
                                            tag: 'SCHEDULED'
                                        });
                                    }
                                }
                            });
                        }
                    });
                    itemsToRender = Array.from(myClassMap.values());
                } else {
                    itemsToRender = allCourses.map(c => ({
                        course: c.name,
                        year: '1',
                        semester: '1',
                        subject: 'Manual Entry',
                        details: c.duration ? `${c.duration} Years` : 'Course',
                        tag: 'COURSE'
                    }));
                }

                if (itemsToRender.length === 0) {
                    grid.innerHTML = `
                        <div class="glass-panel" style="grid-column: 1/-1; text-align: center; padding: 5rem 2rem;">
                            <div style="font-size: 3rem; margin-bottom: 1.5rem; opacity: 0.3;">📅</div>
                            <h3 style="color: var(--text-primary); margin-bottom: 0.5rem; font-size: 1.5rem;">No Classes Today</h3>
                            <p style="color: var(--text-secondary); max-width: 400px; margin: 0 auto;">No teaching sessions are found in the timetable for this date. You can still manually enter attendance if needed.</p>
                        </div>
                    `;
                    return;
                }

                itemsToRender.forEach(item => {
                    const card = document.createElement('div');
                    card.className = 'glass-panel fade-in';
                    card.style.padding = '0';
                    card.style.cursor = 'pointer';
                    card.style.border = '1px solid var(--glass-border)';
                    card.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                    
                    card.onmouseenter = () => {
                        card.style.transform = 'translateY(-4px)';
                        card.style.borderColor = 'var(--accent-color)';
                        card.style.boxShadow = 'var(--hover-shadow)';
                    };
                    card.onmouseleave = () => {
                        card.style.transform = 'none';
                        card.style.borderColor = 'var(--glass-border)';
                        card.style.boxShadow = 'var(--glass-shadow)';
                    };

                    card.onclick = () => {
                        this.sessionDetails = {
                            course: item.course,
                            year: item.year,
                            semester: item.semester,
                            subject: item.subject
                        };
                        this.renderAttendanceForm(container);
                    };

                    const isTaken = dateAttendance && dateAttendance.some(att => 
                        String(att.course).trim() === String(item.course).trim() && 
                        String(att.year) === String(item.year) && 
                        String(att.semester) === String(item.semester) && 
                        String(att.subject).trim() === String(item.subject).trim() &&
                        att.students && att.students.length > 0
                    );

                    card.style.border = isTaken ? '1px solid var(--success)' : '1px solid var(--glass-border)';
                    card.style.borderRadius = '12px';

                    card.innerHTML = `
                        <div style="padding: 1.5rem; background: ${isTaken ? 'rgba(16, 185, 129, 0.05)' : 'transparent'}; border-radius: 12px 12px 0 0;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                                <span style="background: var(--accent-glow); color: var(--accent-color); padding: 4px 10px; border-radius: 8px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase;">${item.tag}</span>
                                <span style="color: var(--text-secondary); font-size: 0.8rem; font-weight: 600;">Year ${item.year} • Sem ${item.semester}</span>
                            </div>
                            <h4 style="margin: 0; font-size: 1.2rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem;">${item.course}</h4>
                            <div style="display: flex; align-items: center; gap: 8px; color: var(--text-secondary); font-size: 0.95rem; font-weight: 500;">
                                <span>📚</span> ${item.subject}
                            </div>
                            ${item.time ? `<div style="margin-top: 8px; font-size: 0.85rem; color: var(--text-secondary); font-weight: 600;">🕒 Time: ${item.time}</div>` : ''}
                        </div>
                        <div style="padding: 12px; text-align: center; background: ${isTaken ? 'var(--success)' : 'var(--bg-primary)'}; border-top: 1px solid ${isTaken ? 'var(--success)' : 'var(--glass-border)'};; font-size: 0.85rem; font-weight: 700; color: ${isTaken ? 'white' : 'var(--accent-color)'}; border-radius: 0 0 12px 12px;">
                            ${isTaken ? '✅ ATTENDANCE LOGGED' : 'MARK ATTENDANCE &rarr;'}
                        </div>
                    `;
                    grid.appendChild(card);
                });
            };

            renderCards();
            controls.querySelector('#attDate').addEventListener('change', (e) => {
                this.selectedDate = e.target.value;
                renderCards();
            });

        } catch (err) {
            Toast.error('Load Error: ' + err.message);
        }
    }

    async renderAttendanceForm(container) {
        const { course, year, semester, subject } = this.sessionDetails;

        container.innerHTML = `
            <div style="padding: 5rem; text-align: center;">
                <div class="loader-spinner" style="width: 40px; height: 40px; border: 4px solid var(--accent-glow); border-top-color: var(--accent-color); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1rem;"></div>
                <p style="color: var(--text-secondary); font-weight: 500;">Fetching student roster...</p>
            </div>
        `;

        try {
            const [allStudents, existingRecords] = await Promise.all([
                ApiService.getStudents(),
                ApiService.getAttendance(this.selectedDate, course, String(year), String(semester), subject)
            ]);

            const students = allStudents.filter(s =>
                String(s.course) === String(course) &&
                String(s.semester) === String(semester)
            );

            if (students.length === 0) {
                container.innerHTML = `
                    <div class="glass-panel" style="padding: 5rem; text-align: center; border: 1px dashed var(--glass-border);">
                        <div style="font-size: 4rem; opacity: 0.5; margin-bottom: 1.5rem;">👥</div>
                        <h3 style="font-size: 1.5rem;">Student List Empty</h3>
                        <p style="color: var(--text-secondary); max-width: 400px; margin: 0 auto;">No students are currently registered for ${course} in Semester ${semester}.</p>
                        <button class="glass-button" style="margin-top: 2rem;" onclick="location.reload()">Back to Schedule</button>
                    </div>
                `;
                return;
            }

            const session = existingRecords.length > 0 ? existingRecords[0] : null;
            const isEditing = !!session;

            container.innerHTML = '';

            const topBar = document.createElement('div');
            topBar.style.display = 'flex';
            topBar.style.justifyContent = 'space-between';
            topBar.style.alignItems = 'center';
            topBar.style.marginBottom = '2.5rem';
            topBar.style.flexWrap = 'wrap';
            topBar.style.gap = '1.5rem';

            topBar.innerHTML = `
                <div>
                     <button class="glass-button" style="padding: 6px 12px; font-size: 0.75rem; margin-bottom: 1.5rem; background: var(--bg-secondary); border: 1px solid var(--glass-border); color: var(--text-secondary);" id="backToSelectBtn">← Back to Schedule</button>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <h3 style="margin: 0; font-size: 1.8rem; letter-spacing: -1px;">${subject}</h3>
                        ${isEditing ? `<span style="background: var(--warning); color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase;">UPDATING RECORD</span>` : ''}
                    </div>
                    <p style="color: var(--text-secondary); font-size: 0.95rem; margin-top: 8px; font-weight: 500;">
                        ${course} • Year ${year} • Sem ${semester} • <span style="color: var(--accent-color);">${new Date(this.selectedDate).toDateString()}</span>
                    </p>
                </div>
                <div style="display: flex; gap: 0.75rem;">
                    <div class="glass-panel" style="padding: 12px 20px; text-align: center; min-width: 100px;">
                        <span style="font-size: 0.7rem; color: var(--success); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Present</span>
                        <div id="stat-pcount" style="font-size: 1.5rem; font-weight: 800;">0</div>
                    </div>
                    <div class="glass-panel" style="padding: 12px 20px; text-align: center; min-width: 100px;">
                        <span style="font-size: 0.7rem; color: var(--danger); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Absent</span>
                        <div id="stat-acount" style="font-size: 1.5rem; font-weight: 800;">0</div>
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
                <thead>
                    <tr style="background: var(--bg-primary); border-bottom: 1px solid var(--glass-border);">
                        <th style="padding: 16px 24px; text-align: left; font-size: 0.75rem; text-transform: uppercase; color: var(--text-secondary); font-weight: 700;">Roll No</th>
                        <th style="padding: 16px 24px; text-align: left; font-size: 0.75rem; text-transform: uppercase; color: var(--text-secondary); font-weight: 700;">Student Name</th>
                        <th style="padding: 16px 24px; text-align: center; font-size: 0.75rem; text-transform: uppercase; color: var(--text-secondary); font-weight: 700;">Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${students.map(s => {
                const status = session?.students.find(sr => {
                    const recId = (sr.studentId && typeof sr.studentId === 'object') ? sr.studentId._id : sr.studentId;
                    return String(recId) === String(s._id);
                })?.status || 'Present';
                return `
                            <tr style="border-bottom: 1px solid var(--glass-border); transition: all 0.2s;">
                                <td style="padding: 16px 24px; font-weight: 700; color: var(--text-secondary); font-family: monospace;">${s.rollNo}</td>
                                <td style="padding: 16px 24px;">
                                    <div style="font-weight: 700; color: var(--text-primary); font-size: 0.95rem;">${s.name}</div>
                                </td>
                                <td style="padding: 12px 24px; text-align: center;">
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

            const footer = document.createElement('div');
            footer.style.marginTop = '2.5rem';
            footer.style.display = 'flex';
            footer.style.justifyContent = 'flex-end';

            const saveBtn = document.createElement('button');
            saveBtn.className = 'glass-button';
            saveBtn.style.padding = '14px 40px';
            saveBtn.style.fontSize = '1rem';
            saveBtn.style.fontWeight = '700';
            saveBtn.textContent = isEditing ? 'Update Records' : 'Save Attendance Sheet';

            saveBtn.onclick = async () => {
                const records = Array.from(container.querySelectorAll('.att-toggle-group')).map(g => ({
                    studentId: g.dataset.sid,
                    status: g.dataset.status
                }));
                saveBtn.disabled = true;
                saveBtn.textContent = 'Syncing...';
                try {
                    await ApiService.markAttendance({
                        date: this.selectedDate,
                        course: this.sessionDetails.course,
                        year: String(this.sessionDetails.year),
                        semester: String(this.sessionDetails.semester),
                        subject: this.sessionDetails.subject,
                        students: records
                    });
                    
                    // Create and show success popup modal
                    const popupOverlay = document.createElement('div');
                    popupOverlay.style.position = 'fixed';
                    popupOverlay.style.top = '0';
                    popupOverlay.style.left = '0';
                    popupOverlay.style.width = '100vw';
                    popupOverlay.style.height = '100vh';
                    popupOverlay.style.background = 'rgba(0,0,0,0.5)';
                    popupOverlay.style.backdropFilter = 'blur(4px)';
                    popupOverlay.style.WebkitBackdropFilter = 'blur(4px)';
                    popupOverlay.style.zIndex = '9999';
                    popupOverlay.style.display = 'flex';
                    popupOverlay.style.alignItems = 'center';
                    popupOverlay.style.justifyContent = 'center';
                    
                    popupOverlay.innerHTML = `
                        <div class="fade-in" style="background: var(--bg-secondary); padding: 2.5rem; border-radius: 16px; border: 1px solid var(--glass-border); box-shadow: 0 20px 40px rgba(0,0,0,0.2); text-align: center; max-width: 400px; width: 90%;">
                            <div style="width: 60px; height: 60px; background: var(--success); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;">
                                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            </div>
                            <h2 style="margin: 0 0 0.5rem 0; color: var(--text-primary); font-size: 1.5rem;">Attendance Saved!</h2>
                            <p style="color: var(--text-secondary); margin-bottom: 2rem;">The attendance records for ${this.sessionDetails.subject} have been successfully synced.</p>
                            <button id="successOkBtn" style="background: var(--accent-color); color: white; border: none; padding: 12px 30px; border-radius: 8px; font-weight: 700; font-size: 0.95rem; cursor: pointer; width: 100%; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">Return to Schedule</button>
                        </div>
                    `;
                    document.body.appendChild(popupOverlay);
                    
                    popupOverlay.querySelector('#successOkBtn').onclick = () => {
                        document.body.removeChild(popupOverlay);
                        this.selectedCourse = null;
                        this.renderTab(container);
                    };

                } catch (err) { Toast.error(err.message); }
                finally { saveBtn.disabled = false; saveBtn.textContent = isEditing ? 'Update Records' : 'Save Attendance Sheet'; }
            };

            footer.appendChild(saveBtn);
            container.appendChild(footer);

            const style = document.createElement('style');
            style.textContent = `
                .att-toggle-group { display: inline-flex; background: var(--bg-primary); padding: 4px; border-radius: 10px; border: 1px solid var(--glass-border); gap: 4px; }
                .att-btn { border: none; background: transparent; padding: 6px 14px; border-radius: 7px; font-weight: 800; font-size: 0.8rem; cursor: pointer; color: var(--text-secondary); transition: all 0.2s; }
                .p-btn.active { background: var(--success); color: white; }
                .a-btn.active { background: var(--danger); color: white; }
                .l-btn.active { background: var(--warning); color: white; }
                tr:hover { background: var(--bg-primary) !important; }
            `;
            container.appendChild(style);
            updateStats();

        } catch (err) { Toast.error(err.message); }
    }

    async renderDefaultersTab(container) {
        container.innerHTML = `
            <div style="padding: 5rem; text-align: center;">
                <div class="loader-spinner" style="width: 40px; height: 40px; border: 4px solid var(--accent-glow); border-top-color: var(--accent-color); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1rem;"></div>
                <p style="color: var(--text-secondary);">Analyzing academic vital records...</p>
            </div>
        `;

        try {
            const students = await ApiService.getStudents();
            const defaulters = students.filter(s => {
                const percNum = parseInt((s.attendancePercentage || '0').replace('%', ''), 10);
                return percNum < 75;
            }).map(s => ({ 
                ...s, 
                perc: parseInt((s.attendancePercentage || '0').replace('%', ''), 10), 
                sessions: `${s.present || 0}/${s.totalClasses || 0}` 
            }));

            if (defaulters.length === 0) {
                container.innerHTML = `
                    <div class="glass-panel" style="padding: 5rem; text-align: center; border: 1px dashed var(--glass-border);">
                        <div style="font-size: 4rem; margin-bottom: 1.5rem;">🎒</div>
                        <h3 style="font-size: 1.5rem;">All Clear!</h3>
                        <p style="color: var(--text-secondary);">Every student is above the 75% attendance criteria.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = `
                <div class="glass-panel" style="padding: 1.5rem; margin-bottom: 2rem; border-left: 6px solid var(--danger); background: rgba(239, 68, 68, 0.05);">
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <span style="font-size: 1.8rem;">🚨</span>
                        <div>
                            <h3 style="color: var(--danger); margin: 0; font-size: 1.3rem; letter-spacing: -0.5px;">Attention Required</h3>
                            <p style="margin: 0; color: var(--text-secondary); font-size: 0.95rem; font-weight: 500;">Detected <strong>${defaulters.length} students</strong> falling behind the mandatory 75% attendance threshold.</p>
                        </div>
                    </div>
                </div>
            `;

            const table = new Table({
                columns: [
                    { key: 'rollNo', label: 'Roll No', render: (v) => `<span style="font-family: monospace; font-weight: 700;">${v}</span>` },
                    { key: 'name', label: 'Student', render: (v) => `<span style="font-weight: 700; color: var(--text-primary);">${v}</span>` },
                    { key: 'course', label: 'Course' },
                    { key: 'sessions', label: 'Presence', render: (v) => `<span style="font-weight: 600;">${v}</span>` },
                    {
                        key: 'perc',
                        label: 'Score',
                        render: (v) => `
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="flex: 1; height: 6px; background: var(--bg-primary); border-radius: 3px; min-width: 100px; border: 1px solid var(--glass-border);">
                                    <div style="width: ${v}%; height: 100%; background: var(--danger); border-radius: 3px;"></div>
                                </div>
                                <span style="color: var(--danger); font-weight: 800; font-size: 0.9rem;">${v}%</span>
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

        } catch (err) { Toast.error(err.message); }
    }

    renderHistoryTab(container) {
        container.innerHTML = `
            <div class="glass-panel fade-in" style="padding: 6rem 2rem; text-align: center; border: 1px dashed var(--glass-border);">
                <div style="font-size: 4rem; opacity: 0.1; filter: grayscale(1); margin-bottom: 1.5rem;">📊</div>
                <h3 style="font-size: 1.5rem; opacity: 0.5;">Trend Reports Coming Soon</h3>
                <p style="color: var(--text-secondary); max-width: 440px; margin: 0 auto; line-height: 1.6;">We're working on advanced data visualization tools to track monthly progress and historical consistency across departments.</p>
            </div>
        `;
    }

    async renderStudentView(container, user) {
        container.innerHTML = `
            <div style="padding: 5rem; text-align: center;">
                <div class="loader-spinner" style="width: 40px; height: 40px; border: 4px solid var(--accent-glow); border-top-color: var(--accent-color); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1rem;"></div>
                <p style="color: var(--text-secondary); font-weight: 500;">Syncing your academic records...</p>
            </div>
        `;

        try {
            const allStudents = await ApiService.getStudents();
            const targetId = String(user.id || user._id);
            const profile = allStudents.find(s => String(s.userId?._id || s.userId || s.userId?.id) === targetId);

            if (!profile) {
                container.innerHTML = '<div class="glass-panel" style="padding: 4rem; text-align: center;">Student profile not found. Please contact administration.</div>';
                return;
            }

            const rawRecords = await ApiService.getStudentAttendance(profile._id);
            const records = rawRecords.filter(r => r.course === profile.course);
            const profileId = String(profile._id);

            const subjectStats = {};
            records.forEach(r => {
                const subj = r.subject || 'General';
                if (!subjectStats[subj]) subjectStats[subj] = { total: 0, present: 0 };
                subjectStats[subj].total++;
                const myRecord = r.students.find(sr => {
                    const recId = (sr.studentId && typeof sr.studentId === 'object') ? sr.studentId._id : sr.studentId;
                    return String(recId) === String(profileId);
                });
                if (myRecord && myRecord.status === 'Present') subjectStats[subj].present++;
            });

            const perc = parseInt((profile.attendancePercentage || '0').replace('%', ''), 10);
            const statusColor = perc >= 75 ? 'var(--success)' : 'var(--danger)';

            container.innerHTML = `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-bottom: 2.5rem;">
                    <div class="glass-panel" style="padding: 1.75rem; display: flex; align-items: center; gap: 1.5rem; border-left: 6px solid ${statusColor};">
                         <div style="width: 70px; height: 70px; border-radius: 16px; background: var(--bg-primary); border: 1px solid var(--glass-border); display: flex; align-items: center; justify-content: center; font-size: 1.75rem;">📊</div>
                         <div>
                            <div style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 700; text-transform: uppercase;">Overall Consistency</div>
                            <div style="font-size: 2.2rem; font-weight: 800; color: ${statusColor}">${perc}%</div>
                            <div style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); opacity: 0.8;">Eligibility Status: ${perc >= 75 ? 'Excellent' : 'Risk'}</div>
                         </div>
                    </div>
                    <div class="glass-panel" style="padding: 1.75rem; display: flex; align-items: center; gap: 1.5rem;">
                         <div style="width: 70px; height: 70px; border-radius: 16px; background: var(--bg-primary); border: 1px solid var(--glass-border); display: flex; align-items: center; justify-content: center; font-size: 1.75rem;">📝</div>
                         <div>
                            <div style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 700; text-transform: uppercase;">Sessions Present</div>
                            <div style="font-size: 2.2rem; font-weight: 800;">${profile.present || 0} <span style="font-size: 1rem; opacity: 0.3;">/ ${profile.totalClasses || 0}</span></div>
                            <div style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); opacity: 0.8;">Out of total sessions</div>
                         </div>
                    </div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
                    <h3 style="margin: 0; font-size: 1.3rem; letter-spacing: -0.5px;">Subject Breakdown</h3>
                    <span style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600;">Current Semester: ${profile.semester}</span>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 3rem;">
                    ${Object.entries(subjectStats).length > 0 ? Object.entries(subjectStats).map(([subj, stats]) => {
                const sPerc = stats.total ? Math.round((stats.present / stats.total) * 100) : 0;
                const sColor = sPerc >= 75 ? 'var(--success)' : 'var(--danger)';
                return `
                            <div class="glass-panel" style="padding: 1.5rem; border-top: 3px solid ${sColor};">
                                <h4 style="margin: 0 0 1rem 0; font-size: 1.05rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${subj}</h4>
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                                    <span style="font-size: 1.75rem; font-weight: 800; color: ${sColor};">${sPerc}%</span>
                                    <span style="font-size: 0.9rem; color: var(--text-secondary); font-weight: 600;">${stats.present}/${stats.total}</span>
                                </div>
                                <div style="width: 100%; height: 6px; background: var(--bg-primary); border-radius: 3px; border: 1px solid var(--glass-border);">
                                    <div style="width: ${sPerc}%; height: 100%; background: ${sColor}; border-radius: 3px;"></div>
                                </div>
                            </div>
                        `;
            }).join('') : '<div class="glass-panel" style="grid-column: 1/-1; padding: 3rem; text-align: center; color: var(--text-secondary);">No subject records found.</div>'}
                </div>
                
                <h3 style="margin-bottom: 1.25rem; font-size: 1.3rem; letter-spacing: -0.5px;">Attendance Log</h3>
            `;

            const table = new Table({
                columns: [
                    { key: 'date', label: 'Date', render: (v) => `<div style="font-weight: 700;">${new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>` },
                    { key: 'subject', label: 'Subject', render: (v) => `<div style="font-weight: 600; color: var(--text-primary);">${v}</div>` },
                    {
                        key: 'students',
                        label: 'Status',
                        render: (v) => {
                            const st = v.find(sr => {
                                const recId = (sr.studentId && typeof sr.studentId === 'object') ? sr.studentId._id : sr.studentId;
                                return String(recId) === String(profile._id);
                            })?.status || 'Unknown';
                            const colors = { 'Present': 'var(--success)', 'Absent': 'var(--danger)', 'Late': 'var(--warning)' };
                            const color = colors[st] || 'var(--text-secondary)';
                            return `<div style="display: flex; align-items: center; gap: 8px;">
                                <div style="width: 8px; height: 8px; border-radius: 50%; background: ${color}"></div>
                                <span style="color: ${color}; font-weight: 800; font-size: 0.75rem; text-transform: uppercase;">${st}</span>
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

        } catch (err) { Toast.error(err.message); }
    }
}
