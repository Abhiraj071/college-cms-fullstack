import { ApiService } from '../../../services/ApiService.js';
import { auth } from '../../../services/AuthService.js';
import { Toast } from '../../../services/Toast.js';
import { Modal } from '../../../services/Modal.js';

export class Timetable {
    constructor() {
        this.selectedCourse = '';
        this.selectedYear = '';
        this.selectedSemester = '';

        // Defaults
        this.days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        this.timeSlots = [
            '09:00 - 10:00',
            '10:00 - 11:00',
            '11:00 - 12:00',
            '12:00 - 01:00',
            '02:00 - 03:00'
        ];
        this.gridData = {}; // Map "Day::Slot" -> Object
        this.courses = [];
        this.subjects = []; // Subjects for selected filters
        this.faculty = []; // All faculty members
    }

    render() {
        const container = document.createElement('div');
        container.className = 'fade-in';
        const user = auth.getUser();
        const isAdmin = user.role === 'admin';

        // Header & Filter
        const header = document.createElement('div');
        header.style.marginBottom = '2rem';
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'flex-end';
        header.style.flexWrap = 'wrap';
        header.style.gap = '1.5rem';

        const titleSection = document.createElement('div');
        titleSection.innerHTML = `
            <h2>Academic Timetable</h2>
            <p style="color: var(--text-secondary);">Manage and view weekly lecture schedules by course and year</p>
        `;

        const filterSection = document.createElement('div');
        filterSection.style.display = 'flex';
        filterSection.style.gap = '1rem';
        filterSection.style.alignItems = 'flex-end';

        filterSection.innerHTML = `
            <div>
                <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.4rem; display: block;">Course</label>
                <select id="courseFilter" class="glass-button" style="width: 150px; text-align: left; background: rgba(255,255,255,0.05); color: var(--text-primary);">
                    <option value="">Loading...</option>
                </select>
            </div>
             <div>
                <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.4rem; display: block;">Year</label>
                <select id="yearFilter" class="glass-button" style="width: 100px; text-align: left; background: rgba(255,255,255,0.05); color: var(--text-primary);" disabled>
                    <option value="">--</option>
                </select>
            </div>
             <div>
                <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.4rem; display: block;">Semester</label>
                <select id="semesterFilter" class="glass-button" style="width: 100px; text-align: left; background: rgba(255,255,255,0.05); color: var(--text-primary);" disabled>
                    <option value="">--</option>
                </select>
            </div>
        `;

        // Admin Toolbar
        const adminToolbar = document.createElement('div');
        adminToolbar.style.marginTop = '1rem';
        adminToolbar.style.display = 'none'; // Hidden by default
        adminToolbar.style.gap = '10px';

        if (isAdmin) {
            adminToolbar.innerHTML = `
                <button id="add-slot-btn" class="glass-button" style="font-size: 0.8rem;">+ Add Time Slot</button>
                <button id="add-day-btn" class="glass-button" style="font-size: 0.8rem;">+ Add Day</button>
                <button id="save-layout-btn" class="glass-button" style="background: var(--accent-color); border:none;">💾 Save Layout & Data</button>
             `;
        }

        header.appendChild(titleSection);
        header.appendChild(filterSection);
        container.appendChild(header);

        if (isAdmin) container.appendChild(adminToolbar);

        const gridContainer = document.createElement('div');
        gridContainer.id = 'timetable-grid';
        container.appendChild(gridContainer);

        // Filter Logic
        /** @type {HTMLSelectElement} */
        const courseFilter = header.querySelector('#courseFilter');
        /** @type {HTMLSelectElement} */
        const yearFilter = header.querySelector('#yearFilter');
        /** @type {HTMLSelectElement} */
        const semesterFilter = header.querySelector('#semesterFilter');

        const updateYears = (courseName) => {
            const course = this.courses.find(c => c.name === courseName);
            yearFilter.innerHTML = '<option value="">Select</option>';
            semesterFilter.innerHTML = '<option value="">Select Year</option>';
            semesterFilter.disabled = true;
            yearFilter.value = "";

            if (course) {
                yearFilter.disabled = false;
                const duration = course.duration || 4;
                for (let i = 1; i <= duration; i++) {
                    const opt = document.createElement('option');
                    opt.value = String(i);
                    opt.textContent = `Year ${i}`;
                    yearFilter.appendChild(opt);
                }
            } else {
                yearFilter.disabled = true;
            }
            this.clearGrid(gridContainer);
            if (isAdmin) adminToolbar.style.display = 'none';
        };

        const updateSemesters = (year) => {
            semesterFilter.innerHTML = '<option value="">Select</option>';
            semesterFilter.value = "";

            if (year) {
                semesterFilter.disabled = false;
                const y = parseInt(year);
                const startSem = (y - 1) * 2 + 1;
                const endSem = startSem + 1;
                [startSem, endSem].forEach(sem => {
                    const opt = document.createElement('option');
                    opt.value = String(sem);
                    opt.textContent = `Sem ${sem}`;
                    semesterFilter.appendChild(opt);
                });
            } else {
                semesterFilter.disabled = true;
            }
            this.clearGrid(gridContainer);
            if (isAdmin) adminToolbar.style.display = 'none';
        };

        const loadCourses = async () => {
            try {
                this.courses = await ApiService.getCourses();
                courseFilter.innerHTML = '<option value="">Select Program</option>' +
                    this.courses.map(c => `<option value="${c.name}">${c.name}</option>`).join('');

                // Student specific logic
                if (user.role === 'student') {
                    try {
                        const students = await ApiService.getStudents();
                        const targetId = String(user.id || user._id);
                        const profile = students.find(s => String(s.userId?._id || s.userId || s.userId?.id) === targetId);

                        if (profile) {
                            // Auto select and lock
                            this.selectedCourse = profile.course;
                            // Calculate Year from Semester if not present directly
                            this.selectedYear = String(profile.year || Math.ceil(profile.semester / 2));
                            this.selectedSemester = String(profile.semester);

                            this.selectedSemester = String(profile.semester);

                            // Professional Read-Only View for Students
                            filterSection.innerHTML = '';
                            filterSection.style.gap = '1.5rem';
                            filterSection.style.display = 'flex';
                            filterSection.style.alignItems = 'center';

                            filterSection.innerHTML = `
                                <div style="display: flex; flex-direction: column; align-items: flex-end;">
                                    <span style="font-size: 0.7rem; font-weight: 700; color: var(--text-secondary); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px;">Enrolled Program</span>
                                    <span style="font-size: 1rem; font-weight: 700; color: var(--text-primary); text-align: right;">${this.selectedCourse}</span>
                                </div>
                                <div style="width: 1px; height: 40px; background: var(--glass-border);"></div>
                                <div style="display: flex; flex-direction: column; align-items: flex-end;">
                                    <span style="font-size: 0.7rem; font-weight: 700; color: var(--text-secondary); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px;">Academic Session</span>
                                    <span style="font-size: 1rem; font-weight: 800; color: var(--accent-color);">Year ${this.selectedYear} • Sem ${this.selectedSemester}</span>
                                </div>
                            `;

                            // Trigger load without using filter inputs
                            this.loadTimetable(gridContainer, adminToolbar);
                        } else {
                            Toast.error('Student profile unavailable');
                        }
                    } catch (err) {
                        console.error('Student filter error', err);
                    }
                }

            } catch (err) { console.error(err); }
        };
        loadCourses();

        courseFilter.addEventListener('change', () => {
            this.selectedCourse = courseFilter.value;
            this.selectedYear = '';
            this.selectedSemester = '';
            updateYears(courseFilter.value);
        });

        yearFilter.addEventListener('change', () => {
            this.selectedYear = yearFilter.value;
            this.selectedSemester = '';
            updateSemesters(yearFilter.value);
        });

        semesterFilter.addEventListener('change', () => {
            this.selectedSemester = semesterFilter.value;
            if (this.selectedSemester) {
                this.loadTimetable(gridContainer, adminToolbar);
            }
        });

        // Admin Actions
        if (isAdmin) {
            const addSlotBtn = /** @type {HTMLElement} */ (adminToolbar.querySelector('#add-slot-btn'));
            if (addSlotBtn) {
                addSlotBtn.addEventListener('click', () => {
                    const name = prompt("Enter time range (e.g. '02:00 - 03:00'):");
                    if (name && !this.timeSlots.includes(name)) {
                        this.timeSlots.push(name);
                        this.renderGrid(gridContainer, isAdmin);
                    }
                });
            }

            const addDayBtn = /** @type {HTMLElement} */ (adminToolbar.querySelector('#add-day-btn'));
            if (addDayBtn) {
                addDayBtn.addEventListener('click', () => {
                    const name = prompt("Enter day name (e.g. 'Saturday'):");
                    if (name && !this.days.includes(name)) {
                        this.days.push(name);
                        this.renderGrid(gridContainer, isAdmin);
                    }
                });
            }

            const saveLayoutBtn = /** @type {HTMLElement} */ (adminToolbar.querySelector('#save-layout-btn'));
            if (saveLayoutBtn) {
                saveLayoutBtn.addEventListener('click', () => this.saveTimetable());
            }
        }

        return container;
    }

    clearGrid(container) {
        container.innerHTML = `
            <div class="glass-panel" style="padding: 4rem; text-align: center;">
                <p style="color: var(--text-secondary);">Select Course, Year, and Semester to view/edit timetable.</p>
            </div>`;
    }

    async loadTimetable(container, toolbar) {
        container.innerHTML = '<p style="text-align:center; padding:4rem;">Loading...</p>';
        try {
            const [data, subjects, faculty] = await Promise.all([
                ApiService.getTimetables(this.selectedCourse, parseInt(this.selectedYear), parseInt(this.selectedSemester)),
                ApiService.getSubjects(),
                ApiService.getFaculty()
            ]);

            this.subjects = subjects;
            this.faculty = faculty;

            // Should be a single document, but might be array [0]
            const doc = Array.isArray(data) ? data[0] : data;

            if (doc) {
                this.days = doc.days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
                this.timeSlots = doc.timeSlots || ['09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '12:00 - 01:00'];
                this.gridData = doc.grid || {};
            } else {
                // Default structure for new
                this.days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
                this.timeSlots = ['09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '12:00 - 01:00'];
                this.gridData = {};
            }

            if (toolbar) toolbar.style.display = 'flex';
            this.renderGrid(container, auth.getUser().role === 'admin');

        } catch (err) {
            Toast.error('Load failed: ' + err.message);
        }
    }

    renderGrid(container, isAdmin) {
        container.innerHTML = '';
        const card = document.createElement('div');
        card.className = 'glass-panel';
        card.style.overflowX = 'auto';
        card.style.padding = '0';

        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.minWidth = '900px';
        table.style.tableLayout = 'fixed'; // Ensures equal column widths

        // Head
        const thead = document.createElement('thead');
        let headHTML = `<tr style="background: rgba(0,0,0,0.02);">
            <th style="padding: 1rem; width: 100px; border-bottom: 1px solid var(--glass-border);">Day / Time</th>`;

        this.timeSlots.forEach((slot, idx) => {
            headHTML += `<th style="padding: 1rem; border-bottom: 1px solid var(--glass-border); color: var(--accent-color); font-size: 0.85rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                ${slot}
                ${isAdmin ? `<span class="del-col-btn" data-idx="${idx}" style="cursor:pointer; color:red; margin-left:8px; font-size:0.7rem;">✕</span>` : ''}
            </th>`;
        });
        headHTML += '</tr>';
        thead.innerHTML = headHTML;
        table.appendChild(thead);

        // Body
        const tbody = document.createElement('tbody');
        this.days.forEach((day, dayIdx) => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid var(--glass-border)';

            let rowHTML = `<td style="padding: 1rem; font-weight: 600; color: var(--text-primary); width: 100px;">
                ${day}
                ${isAdmin ? `<span class="del-row-btn" data-idx="${dayIdx}" style="cursor:pointer; color:red; margin-left:8px; font-size:0.7rem;">✕</span>` : ''}
            </td>`;

            this.timeSlots.forEach(slot => {
                const key = `${day}::${slot}`;
                const cellData = this.gridData[key] || {};
                const content = cellData.subject || '';
                const code = cellData.code ? `<span style="font-size: 0.7rem; opacity: 0.6; margin-left: 4px;">[${cellData.code}]</span>` : '';
                const teacher = cellData.teacher ? `<div style="font-size: 0.7rem; opacity: 0.8; margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">👤 ${cellData.teacher}</div>` : '';
                const room = cellData.room ? `<div style="font-size: 0.7rem; opacity: 0.8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">📍 ${cellData.room}</div>` : '';

                rowHTML += `<td style="padding: 0.35rem; text-align: center; height: 1px;">
                    <div class="timetable-slot ${content ? 'active' : ''} ${isAdmin ? 'editable' : ''}" 
                         data-key="${key}"
                         style="
                            padding: 4px; 
                            height: 100%;
                            width: 100%;
                            min-height: 50px; 
                            box-sizing: border-box; 
                            border-radius: 6px; 
                            background: ${content === 'Lunch Break' ? 'rgba(255, 255, 255, 0.03)' : (content ? 'rgba(99, 102, 241, 0.08)' : 'transparent')}; 
                            border: 1px solid ${content === 'Lunch Break' ? 'rgba(255, 255, 255, 0.05)' : (content ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)')};
                            border-left: ${content && content !== 'Lunch Break' ? '3px solid var(--accent-color)' : (content === 'Lunch Break' ? '3px solid var(--text-secondary)' : '1px solid rgba(255, 255, 255, 0.02)')};
                            color: ${content === 'Lunch Break' ? 'var(--text-secondary)' : (content ? 'var(--text-primary)' : 'var(--text-secondary)')};
                            font-size: 0.85rem;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            text-align: center;
                            transition: all 0.2s ease;
                            position: relative;
                            overflow: hidden;
                         ">
                         ${content === 'Lunch Break' ?
                        `<div style="font-weight: 600; font-size: 0.75rem; letter-spacing: 0.5px; opacity: 0.7;">LUNCH</div>` :
                        (content ?
                            `<div style="font-weight: 700; line-height: 1.2;">${content}</div>`
                            : (isAdmin ? '<div style="opacity:0.2; font-size: 1rem;">+</div>' : ''))
                    }
                    </div>
                </td>`;
            });
            tr.innerHTML = rowHTML;
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        card.appendChild(table);
        container.appendChild(card);

        // Events
        if (isAdmin) {
            // Delete Columns
            thead.querySelectorAll('.del-col-btn').forEach(btn => {
                /** @type {HTMLElement} */ (btn).addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Remove this time slot?')) {
                    this.timeSlots.splice(parseInt(/** @type {HTMLElement} */(btn).getAttribute('data-idx') || '0'), 1);
                    this.renderGrid(container, isAdmin);
                }
            });
            });
            // Delete Rows
            tbody.querySelectorAll('.del-row-btn').forEach(btn => {
                /** @type {HTMLElement} */ (btn).addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Remove this day?')) {
                    this.days.splice(parseInt(/** @type {HTMLElement} */(btn).getAttribute('data-idx') || '0'), 1);
                    this.renderGrid(container, isAdmin);
                }
            });
            });
            // Edit Cells
            tbody.querySelectorAll('.editable').forEach(div => {
                /** @type {HTMLElement} */ (div).addEventListener('click', () => {
                const key = /** @type {HTMLElement} */ (div).getAttribute('data-key') || '';
                this.editSlot(key, container, isAdmin);
            });
            });
        } else {
            // View Details for non-admins
            tbody.querySelectorAll('.timetable-slot.active').forEach(div => {
                /** @type {HTMLElement} */ (div).addEventListener('click', () => {
                const key = /** @type {HTMLElement} */ (div).getAttribute('data-key') || '';
                this.showSlotDetails(key);
            });
            });
        }
    }

    showSlotDetails(key) {
        const data = this.gridData[key];
        if (!data || !data.subject || data.subject === 'Lunch Break') return;

        Modal.show({
            title: 'Class Details',
            content: `
                <div style="padding: 1rem;">
                    <h3 style="margin-bottom: 1.5rem; color: var(--accent-color); font-size: 1.5rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 1rem;">${data.subject}</h3>
                    <div style="display: grid; gap: 1.2rem; grid-template-columns: auto 1fr; align-items: center; font-size: 1.1rem;">
                        
                        <span style="font-weight: 600; color: var(--text-secondary);">Subject Code:</span>
                        <span style="font-family: monospace; background: rgba(0,0,0,0.1); padding: 2px 6px; border-radius: 4px;">${data.code || 'N/A'}</span>
                        
                        <span style="font-weight: 600; color: var(--text-secondary);">Faculty:</span>
                        <span style="display: flex; align-items: center; gap: 8px;">👨‍🏫 ${data.teacher || 'TBA'}</span>
                        
                        <span style="font-weight: 600; color: var(--text-secondary);">Location:</span>
                        <span style="display: flex; align-items: center; gap: 8px;">📍 ${data.room || 'TBA'}</span>

                        <span style="font-weight: 600; color: var(--text-secondary);">Time Slot:</span>
                        <span>⏰ ${key.split('::')[1]}</span>
                    </div>
                </div>
            `,
            confirmText: 'Close',
            onConfirm: () => true
        });
    }

    editSlot(key, container, isAdmin) {
        const current = this.gridData[key] || {};

        const form = document.createElement('div');
        form.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 1.2rem;">
                <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 0.5rem;">Select an enrolled subject for this slot. Leaving Subject empty will clear the slot.</p>
                <div>
                    <label style="display: block; margin-bottom: 0.5rem; font-size: 0.85rem; font-weight: 600; color: var(--text-secondary);">Subject / Activity</label>
                    <select id="slot-subject" class="glass-button" style="width: 100%; text-align: left; background: rgba(0,0,0,0.1); color: var(--text-primary);">
                        <option value="">-- Clear Slot --</option>
                        <option value="Lunch Break" ${current.subject === 'Lunch Break' ? 'selected' : ''}>🥣 Lunch Break</option>
                        ${this.subjects.map(s => `<option value="${s.name}" ${current.subject === s.name ? 'selected' : ''}>${s.name} (${s.code})</option>`).join('')}
                    </select>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; font-size: 0.85rem; font-weight: 600; color: var(--text-secondary);">Teacher</label>
                        <select id="slot-teacher" class="glass-button" style="width: 100%; text-align: left; background: rgba(0,0,0,0.1); color: var(--text-primary);">
                            <option value="">-- No Teacher --</option>
                            ${this.faculty.map(f => `<option value="${f.name}" ${current.teacher === f.name ? 'selected' : ''}>${f.name} (${f.department || ''})</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; font-size: 0.85rem; font-weight: 600; color: var(--text-secondary);">Room / Lab</label>
                        <input type="text" id="slot-room" class="glass-button" style="width: 100%; text-align: left; background: rgba(0,0,0,0.1);" value="${current.room || ''}" placeholder="e.g. Lab 2">
                    </div>
                </div>
            </div>
        `;

        Modal.show({
            title: 'Edit Class Schedule',
            content: form,
            confirmText: 'Update Slot',
            onConfirm: () => {
                const subject = (/** @type {HTMLSelectElement} */ (form.querySelector('#slot-subject'))).value;
                const teacher = (/** @type {HTMLSelectElement} */ (form.querySelector('#slot-teacher'))).value;
                const room = (/** @type {HTMLInputElement} */ (form.querySelector('#slot-room'))).value.trim();

                if (!subject) {
                    delete this.gridData[key];
                } else if (subject === 'Lunch Break') {
                    this.gridData[key] = {
                        subject: 'Lunch Break',
                        teacher: '',
                        room: '',
                        code: ''
                    };
                } else {
                    const subObj = this.subjects.find(s => s.name === subject);
                    this.gridData[key] = {
                        subject,
                        teacher,
                        room,
                        code: subObj ? subObj.code : ''
                    };
                }
                this.renderGrid(container, isAdmin);
                return true;
            }
        });
    }

    async saveTimetable() {
        if (!this.selectedCourse || !this.selectedYear || !this.selectedSemester) return;

        try {
            await ApiService.updateTimetable({
                course: this.selectedCourse,
                year: parseInt(this.selectedYear),
                semester: parseInt(this.selectedSemester),
                days: this.days,
                timeSlots: this.timeSlots,
                grid: this.gridData
            });
            Toast.success('Timetable layout and data saved!');
        } catch (err) {
            Toast.error('Save failed: ' + err.message);
        }
    }
}
