import { ApiService } from '../../../services/ApiService.js';
import { auth } from '../../../services/AuthService.js';
import { Toast } from '../../../services/Toast.js';
import { Modal } from '../../../services/Modal.js';

export class Timetable {
    constructor() {
        this.selectedCourse = '';
        this.selectedYear = '';
        this.selectedSemester = '';
        this.days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        this.timeSlots = [
            '09:00 - 10:00',
            '10:00 - 11:00',
            '11:00 - 12:00',
            '12:00 - 01:00',
            '02:00 - 03:00'
        ];
        this.gridData = {}; 
        this.courses = [];
        this.subjects = []; 
        this.faculty = []; 
    }

    render() {
        const container = document.createElement('div');
        container.className = 'fade-in';
        const user = auth.getUser();
        const isAdmin = user.role === 'admin';

        // Header Section
        const header = document.createElement('div');
        header.style.marginBottom = '2.5rem';
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'flex-end';
        header.style.flexWrap = 'wrap';
        header.style.gap = '1.5rem';

        const titleSection = document.createElement('div');
        titleSection.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 0.5rem;">
                <span style="font-size: 2rem;">📅</span>
                <h2 style="font-size: 2rem; margin: 0; letter-spacing: -1px;">Academic Timetable</h2>
            </div>
            <p style="color: var(--text-secondary); font-size: 1rem; font-weight: 500;">Manage and view weekly lecture schedules by course and year.</p>
        `;

        const filterSection = document.createElement('div');
        filterSection.style.display = 'flex';
        filterSection.style.gap = '1rem';
        filterSection.style.alignItems = 'flex-end';
        filterSection.innerHTML = `
            <div style="min-width: 180px;">
                <label style="font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 0.5rem; display: block; text-transform: uppercase; letter-spacing: 0.5px;">Select Program</label>
                <select id="courseFilter" style="width: 100%;">
                    <option value="">Loading Programs...</option>
                </select>
            </div>
             <div style="min-width: 100px;">
                <label style="font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 0.5rem; display: block; text-transform: uppercase; letter-spacing: 0.5px;">Year</label>
                <select id="yearFilter" style="width: 100%;" disabled>
                    <option value="">--</option>
                </select>
            </div>
             <div style="min-width: 120px;">
                <label style="font-size: 0.75rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 0.5rem; display: block; text-transform: uppercase; letter-spacing: 0.5px;">Semester</label>
                <select id="semesterFilter" style="width: 100%;" disabled>
                    <option value="">--</option>
                </select>
            </div>
        `;

        const adminToolbar = document.createElement('div');
        adminToolbar.style.marginTop = '1.5rem';
        adminToolbar.style.display = 'none';
        adminToolbar.style.gap = '12px';
        adminToolbar.style.padding = '1rem';
        adminToolbar.style.background = 'var(--bg-secondary)';
        adminToolbar.style.borderRadius = '12px';
        adminToolbar.style.border = '1px dashed var(--glass-border)';

        if (isAdmin) {
            adminToolbar.innerHTML = `
                <button id="add-slot-btn" class="glass-button" style="background: var(--bg-primary); color: var(--text-primary); border-color: var(--glass-border); font-size: 0.8rem;">➕ Add Time Slot</button>
                <button id="add-day-btn" class="glass-button" style="background: var(--bg-primary); color: var(--text-primary); border-color: var(--glass-border); font-size: 0.8rem;">📅 Add Day</button>
                <div style="flex: 1;"></div>
                <button id="save-layout-btn" class="glass-button" style="background: var(--accent-color); color: white; border: none; font-weight: 700;">💾 Save Layout & Data</button>
             `;
        }

        header.appendChild(titleSection);
        header.appendChild(filterSection);
        container.appendChild(header);

        if (isAdmin) container.appendChild(adminToolbar);

        const gridContainer = document.createElement('div');
        gridContainer.id = 'timetable-grid';
        gridContainer.style.marginTop = '2rem';
        container.appendChild(gridContainer);

        const courseFilter = filterSection.querySelector('#courseFilter');
        const yearFilter = filterSection.querySelector('#yearFilter');
        const semesterFilter = filterSection.querySelector('#semesterFilter');

        const updateYears = (courseName) => {
            const course = this.courses.find(c => c.name === courseName);
            yearFilter.innerHTML = '<option value="">Select Year</option>';
            semesterFilter.innerHTML = '<option value="">--</option>';
            semesterFilter.disabled = true;
            if (course) {
                yearFilter.disabled = false;
                for (let i = 1; i <= (course.duration || 4); i++) {
                    const opt = document.createElement('option');
                    opt.value = String(i);
                    opt.textContent = `Year ${i}`;
                    yearFilter.appendChild(opt);
                }
            } else { yearFilter.disabled = true; }
            this.clearGrid(gridContainer);
            if (isAdmin) adminToolbar.style.display = 'none';
        };

        const updateSemesters = (year) => {
            semesterFilter.innerHTML = '<option value="">Select Sem</option>';
            if (year) {
                semesterFilter.disabled = false;
                const y = parseInt(year);
                [ (y - 1) * 2 + 1, (y - 1) * 2 + 2 ].forEach(sem => {
                    const opt = document.createElement('option');
                    opt.value = String(sem);
                    opt.textContent = `Sem ${sem}`;
                    semesterFilter.appendChild(opt);
                });
            } else { semesterFilter.disabled = true; }
            this.clearGrid(gridContainer);
            if (isAdmin) adminToolbar.style.display = 'none';
        };

        const loadCourses = async () => {
            try {
                this.courses = await ApiService.getCourses();
                courseFilter.innerHTML = '<option value="">Select Program</option>' + this.courses.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
                if (user.role === 'student') {
                    const students = await ApiService.getStudents();
                    const profile = students.find(s => String(s.userId?._id || s.userId || s.userId?.id) === String(user.id || user._id));
                    if (profile) {
                        this.selectedCourse = profile.course;
                        this.selectedYear = String(profile.year || Math.ceil(profile.semester / 2));
                        this.selectedSemester = String(profile.semester);
                        filterSection.innerHTML = `
                            <div style="display: flex; gap: 2rem; background: var(--bg-secondary); padding: 12px 24px; border-radius: 12px; border: 1px solid var(--glass-border);">
                                <div>
                                    <div style="font-size: 0.7rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 2px;">Enrolled Program</div>
                                    <div style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary);">${this.selectedCourse}</div>
                                </div>
                                <div style="width: 1px; background: var(--glass-border);"></div>
                                <div>
                                    <div style="font-size: 0.7rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 2px;">Session</div>
                                    <div style="font-size: 0.95rem; font-weight: 700; color: var(--accent-color);">Year ${this.selectedYear} • Sem ${this.selectedSemester}</div>
                                </div>
                            </div>
                        `;
                        this.loadTimetable(gridContainer, adminToolbar);
                    }
                }
            } catch (err) { console.error(err); }
        };
        loadCourses();

        courseFilter.addEventListener('change', () => {
            this.selectedCourse = courseFilter.value;
            updateYears(courseFilter.value);
        });
        yearFilter.addEventListener('change', () => {
            this.selectedYear = yearFilter.value;
            updateSemesters(yearFilter.value);
        });
        semesterFilter.addEventListener('change', () => {
            this.selectedSemester = semesterFilter.value;
            if (this.selectedSemester) this.loadTimetable(gridContainer, adminToolbar);
        });

        if (isAdmin) {
            adminToolbar.querySelector('#add-slot-btn').onclick = () => {
                const name = prompt("Enter time range (e.g. '02:00 - 03:00'):");
                if (name && !this.timeSlots.includes(name)) {
                    this.timeSlots.push(name);
                    this.renderGrid(gridContainer, isAdmin);
                }
            };
            adminToolbar.querySelector('#add-day-btn').onclick = () => {
                const name = prompt("Enter day name (e.g. 'Saturday'):");
                if (name && !this.days.includes(name)) {
                    this.days.push(name);
                    this.renderGrid(gridContainer, isAdmin);
                }
            };
            adminToolbar.querySelector('#save-layout-btn').onclick = () => this.saveTimetable();
        }

        return container;
    }

    clearGrid(container) {
        container.innerHTML = `
            <div class="glass-panel" style="padding: 6rem 2rem; text-align: center; border: 1px dashed var(--glass-border);">
                <div style="font-size: 3rem; margin-bottom: 1.5rem; opacity: 0.3;">📋</div>
                <h3 style="opacity: 0.6;">No View Selected</h3>
                <p style="color: var(--text-secondary); max-width: 320px; margin: 0 auto;">Select a program and semester to generate the academic schedule.</p>
            </div>`;
    }

    async loadTimetable(container, toolbar) {
        container.innerHTML = `
            <div style="padding: 5rem; text-align: center;">
                <div class="loader-spinner" style="width: 40px; height: 40px; border: 4px solid var(--accent-glow); border-top-color: var(--accent-color); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1.5rem;"></div>
                <p style="color: var(--text-secondary); font-weight: 500;">Generating weekly schedule...</p>
            </div>
        `;
        try {
            const [data, subjects, faculty] = await Promise.all([
                ApiService.getTimetables(this.selectedCourse, parseInt(this.selectedYear), parseInt(this.selectedSemester)),
                ApiService.getSubjects(),
                ApiService.getFaculty()
            ]);
            this.subjects = subjects;
            this.faculty = faculty;
            const doc = Array.isArray(data) ? data[0] : data;
            if (doc) {
                this.days = doc.days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
                this.timeSlots = doc.timeSlots || ['09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '12:00 - 01:00'];
                this.gridData = doc.grid || {};
            } else {
                this.days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
                this.timeSlots = ['09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '12:00 - 01:00'];
                this.gridData = {};
            }
            if (toolbar) toolbar.style.display = 'flex';
            this.renderGrid(container, auth.getUser().role === 'admin');
        } catch (err) { Toast.error('Load failed: ' + err.message); }
    }

    renderGrid(container, isAdmin) {
        container.innerHTML = '';
        const card = document.createElement('div');
        card.className = 'glass-panel fade-in';
        card.style.overflowX = 'auto';
        card.style.padding = '0';
        card.style.borderRadius = '16px';

        const table = document.createElement('table');
        table.style.width = '100.1%';
        table.style.borderCollapse = 'collapse';
        table.style.minWidth = '1000px';
        table.style.tableLayout = 'fixed';

        const thead = document.createElement('thead');
        let headHTML = `<tr style="background: var(--bg-primary); border-bottom: 2px solid var(--glass-border);">
            <th style="padding: 20px; width: 120px; font-size: 0.75rem; text-transform: uppercase; color: var(--text-secondary); letter-spacing: 1px; font-weight: 800; text-align: center;">📅 DAY</th>`;

        this.timeSlots.forEach((slot, idx) => {
            headHTML += `<th style="padding: 20px; border-left: 1px solid var(--glass-border); text-align: center;">
                <div style="font-size: 0.7rem; color: var(--text-secondary); font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Time Slot</div>
                <div style="font-size: 0.85rem; color: var(--accent-color); font-weight: 700; white-space: nowrap;">
                    ${slot}
                    ${isAdmin ? `<span class="del-col-btn" data-idx="${idx}" style="cursor:pointer; color:var(--danger); margin-left:8px; font-size: 0.9rem;">×</span>` : ''}
                </div>
            </th>`;
        });
        headHTML += '</tr>';
        thead.innerHTML = headHTML;
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        this.days.forEach((day, dayIdx) => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid var(--glass-border)';
            let rowHTML = `<td style="padding: 20px; background: var(--bg-primary); font-weight: 800; color: var(--text-primary); text-align: center; border-right: 2px solid var(--glass-border);">
                <div style="font-size: 0.9rem; letter-spacing: -0.5px; color: var(--text-primary);">${day}</div>
                ${isAdmin ? `<span class="del-row-btn" data-idx="${dayIdx}" style="cursor:pointer; color:var(--danger); display:block; margin-top: 4px; font-size: 0.8rem; font-weight: 400;">(remove)</span>` : ''}
            </td>`;

            this.timeSlots.forEach(slot => {
                const key = `${day}::${slot}`;
                const cellData = this.gridData[key] || {};
                const content = cellData.subject || '';
                const isLunch = content === 'Lunch Break';

                rowHTML += `<td style="padding: 8px; border-left: 1px solid var(--glass-border);">
                    <div class="timetable-slot ${content ? 'active' : ''} ${isAdmin ? 'editable' : ''}" data-key="${key}" style="
                        height: 75px; 
                        width: 100%;
                        border-radius: 12px;
                        ${isLunch ? 'background: var(--bg-primary);' : (content ? 'background: linear-gradient(135deg, var(--bg-secondary), rgba(99, 102, 241, 0.05)); border-left: 4px solid var(--accent-color); shadow: var(--glass-shadow);' : 'border: 1px dashed var(--glass-border);')}
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        text-align: center;
                        padding: 8px;
                        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                        cursor: pointer;
                        overflow: hidden;
                    ">
                         ${isLunch ? `<div style="font-size: 0.65rem; font-weight: 800; color: var(--text-secondary); letter-spacing: 1px;">🍴 LUNCH</div>` : 
                                    (content ? `
                                        <div style="font-weight: 800; font-size: 0.85rem; color: var(--text-primary); line-height: 1.2; margin-bottom: 4px;">${content}</div>
                                        <div style="font-size: 0.7rem; font-weight: 600; color: var(--text-secondary); opacity: 0.8;">📍 ${cellData.room || 'Room TBA'}</div>
                                    ` : (isAdmin ? '<div style="font-size: 1.25rem; opacity: 0.2;">+</div>' : ''))}
                    </div>
                </td>`;
            });
            tr.innerHTML = rowHTML;
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        card.appendChild(table);
        container.appendChild(card);

        if (isAdmin) {
            thead.querySelectorAll('.del-col-btn').forEach(btn => btn.onclick = (e) => { e.stopPropagation(); if(confirm('Remove slot?')){ this.timeSlots.splice(parseInt(btn.dataset.idx), 1); this.renderGrid(container, isAdmin); } });
            tbody.querySelectorAll('.del-row-btn').forEach(btn => btn.onclick = (e) => { e.stopPropagation(); if(confirm('Remove day?')){ this.days.splice(parseInt(btn.dataset.idx), 1); this.renderGrid(container, isAdmin); } });
            tbody.querySelectorAll('.editable').forEach(div => div.onclick = () => this.editSlot(div.dataset.key, container, isAdmin));
        } else {
            tbody.querySelectorAll('.timetable-slot.active').forEach(div => div.onclick = () => this.showSlotDetails(div.dataset.key));
        }
    }

    showSlotDetails(key) {
        const data = this.gridData[key];
        if (!data || !data.subject || data.subject === 'Lunch Break') return;
        Modal.show({
            title: 'Schedule Details',
            content: `
                <div style="padding: 1rem;">
                    <div style="background: var(--accent-glow); padding: 1.5rem; border-radius: 12px; margin-bottom: 1.5rem; text-align: center;">
                        <div style="font-size: 0.75rem; color: var(--accent-color); font-weight: 800; text-transform: uppercase; margin-bottom: 4px;">Active Session</div>
                        <h3 style="margin: 0; color: var(--text-primary); font-size: 1.5rem; letter-spacing: -0.5px;">${data.subject}</h3>
                    </div>
                    <div style="display: grid; gap: 1rem;">
                        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--glass-border);">
                            <span style="font-weight: 600; color: var(--text-secondary);">Subject Code</span>
                            <span style="font-weight: 700; color: var(--text-primary);">${data.code || 'N/A'}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--glass-border);">
                            <span style="font-weight: 600; color: var(--text-secondary);">Instructor</span>
                            <span style="font-weight: 700; color: var(--text-primary);">👨‍🏫 ${data.teacher || 'TBA'}</span>
                        </div>
                         <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--glass-border);">
                            <span style="font-weight: 600; color: var(--text-secondary);">Location</span>
                            <span style="font-weight: 700; color: var(--text-primary);">📍 ${data.room || 'TBA'}</span>
                        </div>
                         <div style="display: flex; justify-content: space-between; padding: 10px 0;">
                            <span style="font-weight: 600; color: var(--text-secondary);">Time Slot</span>
                            <span style="font-weight: 700; color: var(--accent-color);">🕒 ${key.split('::')[1]}</span>
                        </div>
                    </div>
                </div>
            `,
            confirmText: 'Done',
            onConfirm: () => true
        });
    }

    editSlot(key, container, isAdmin) {
        const current = this.gridData[key] || {};
        const form = document.createElement('div');
        form.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 1.25rem;">
                <div>
                    <label style="display: block; margin-bottom: 0.5rem; font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase;">Subject / Activity</label>
                    <select id="slot-subject" style="width: 100%;">
                        <option value="">-- Clear Slot --</option>
                        <option value="Lunch Break" ${current.subject === 'Lunch Break' ? 'selected' : ''}>🍴 Lunch Break</option>
                        ${this.subjects.map(s => `<option value="${s.name}" ${current.subject === s.name ? 'selected' : ''}>${s.name} (${s.code})</option>`).join('')}
                    </select>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase;">Teacher</label>
                        <select id="slot-teacher" style="width: 100%;">
                            <option value="">-- No Teacher --</option>
                            ${this.faculty.map(f => `<option value="${f.name}" ${current.teacher === f.name ? 'selected' : ''}>${f.name}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 0.5rem; font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase;">Room / Lab</label>
                        <input type="text" id="slot-room" style="width: 100%;" value="${current.room || ''}" placeholder="e.g. Lab 2">
                    </div>
                </div>
            </div>
        `;

        Modal.show({
            title: 'Modify Schedule Slot',
            content: form,
            confirmText: 'Sync Slot',
            onConfirm: () => {
                const subject = form.querySelector('#slot-subject').value;
                const teacher = form.querySelector('#slot-teacher').value;
                const room = form.querySelector('#slot-room').value.trim();
                if (!subject) delete this.gridData[key];
                else {
                    const subObj = this.subjects.find(s => s.name === subject);
                    this.gridData[key] = { subject, teacher, room, code: subObj ? subObj.code : '' };
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
            Toast.success('Schedule layout synchronized!');
        } catch (err) { Toast.error('Save failed: ' + err.message); }
    }
}
