import { ApiService } from '../../../services/ApiService.js';
import { Table } from '../../common/Table.js';
import { Toast } from '../../../services/Toast.js';
import { Modal } from '../../../services/Modal.js';
import { ROUTES } from '../../../services/Constants.js';
import { auth } from '../../../services/AuthService.js';

export class StudentList {
    constructor() {
        this.students = [];
        this.courses = [];
    }

    render() {
        const container = document.createElement('div');
        const user = auth.getUser();
        container.className = 'fade-in';

        // Header Section
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'flex-end';
        header.style.gap = '2rem';
        header.style.flexWrap = 'wrap';
        header.style.marginBottom = '2.5rem';

        const titleSection = document.createElement('div');
        titleSection.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 0.5rem;">
                <span style="font-size: 2rem;">👨‍🎓</span>
                <h2 style="font-size: 2rem; margin: 0; letter-spacing: -1px;">Students</h2>
            </div>
            <p style="color: var(--text-secondary); font-size: 1rem; font-weight: 500;">Manage student profiles, enrollment, and academic status.</p>
        `;

        const actionGroup = document.createElement('div');
        actionGroup.style.display = 'flex';
        actionGroup.style.gap = '1rem';
        actionGroup.style.alignItems = 'center';

        if (user.role === 'admin') {
            const bulkAddBtn = document.createElement('button');
            bulkAddBtn.className = 'glass-button';
            bulkAddBtn.style.background = 'var(--bg-secondary)';
            bulkAddBtn.style.color = 'var(--text-primary)';
            bulkAddBtn.style.borderColor = 'var(--glass-border)';
            bulkAddBtn.innerHTML = '📤 Bulk Import';
            bulkAddBtn.onclick = () => { window.location.hash = ROUTES.STUDENTS_BULK; };

            const addBtn = document.createElement('button');
            addBtn.className = 'glass-button';
            addBtn.style.background = 'var(--accent-color)';
            addBtn.style.color = 'white';
            addBtn.style.border = 'none';
            addBtn.style.padding = '10px 24px';
            addBtn.style.fontWeight = '700';
            addBtn.innerHTML = '➕ Add Student';
            addBtn.onclick = () => { window.location.hash = ROUTES.STUDENTS_ADD; };

            actionGroup.appendChild(bulkAddBtn);
            actionGroup.appendChild(addBtn);
        }

        header.appendChild(titleSection);
        header.appendChild(actionGroup);
        container.appendChild(header);

        // Filter Bar
        const filterBar = document.createElement('div');
        filterBar.className = 'glass-panel';
        filterBar.style.padding = '1rem';
        filterBar.style.marginBottom = '2rem';
        filterBar.style.display = 'flex';
        filterBar.style.gap = '1rem';
        filterBar.style.alignItems = 'center';
        filterBar.style.flexWrap = 'wrap';
        filterBar.style.background = 'var(--bg-secondary)';

        filterBar.innerHTML = `
            <div style="min-width: 200px; flex: 1;">
                <label style="font-size: 0.7rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; display: block;">Academic Program</label>
                <select id="courseFilter" style="width: 100%;"></select>
            </div>
            <div style="min-width: 120px;">
                <label style="font-size: 0.7rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; display: block;">Year</label>
                <select id="yearFilter" style="width: 100%;" disabled><option value="">--</option></select>
            </div>
            <div style="min-width: 150px;">
                <label style="font-size: 0.7rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; display: block;">Semester</label>
                <select id="semesterFilter" style="width: 100%;" disabled><option value="">--</option></select>
            </div>
            <div style="display: flex; align-items: flex-end; height: 100%; padding-top: 1.2rem;">
                <button id="resetFilters" style="background:transparent; border:none; color:var(--text-secondary); cursor:pointer; font-size: 0.8rem; font-weight: 600; text-decoration: underline;">Reset Filters</button>
            </div>
        `;
        container.appendChild(filterBar);

        const tableCard = document.createElement('div');
        tableCard.className = 'glass-panel';
        tableCard.style.padding = '0';
        tableCard.style.minHeight = '300px';
        tableCard.style.overflow = 'hidden';

        const renderEmptyState = (msg = 'Please select a course and year to view students.') => {
            tableCard.innerHTML = `
                <div style="text-align: center; padding: 6rem 2rem; color: var(--text-secondary);">
                    <div style="font-size: 4rem; margin-bottom: 1.5rem; opacity: 0.2;">🎓</div>
                    <h3 style="opacity: 0.6; margin-bottom: 0.5rem;">No Selection</h3>
                    <p style="font-size: 0.95rem; max-width: 300px; margin: 0 auto; line-height: 1.5;">${msg}</p>
                </div>
            `;
        };
        renderEmptyState();

        const courseSelect = filterBar.querySelector('#courseFilter');
        const yearSelect = filterBar.querySelector('#yearFilter');
        const semesterSelect = filterBar.querySelector('#semesterFilter');

        const updateYears = (courseName) => {
            const course = this.courses.find(c => c.name === courseName);
            yearSelect.innerHTML = '<option value="">All Years</option>';
            semesterSelect.innerHTML = '<option value="">--</option>';
            semesterSelect.disabled = true;
            if (course) {
                yearSelect.disabled = false;
                for (let i = 1; i <= (course.duration || 4); i++) {
                    const opt = document.createElement('option');
                    opt.value = String(i);
                    opt.textContent = `Year ${i}`;
                    yearSelect.appendChild(opt);
                }
            } else { yearSelect.disabled = true; }
            loadStudents();
        };

        const updateSemesters = (year) => {
            semesterSelect.innerHTML = '<option value="">All Semesters</option>';
            if (year) {
                semesterSelect.disabled = false;
                const y = parseInt(year);
                [ (y-1)*2+1, (y-1)*2+2 ].forEach(sem => {
                    const opt = document.createElement('option');
                    opt.value = String(sem);
                    opt.textContent = `Semester ${sem}`;
                    semesterSelect.appendChild(opt);
                });
            } else { semesterSelect.disabled = true; }
            loadStudents();
        };

        const loadStudents = async () => {
            const course = courseSelect.value;
            const year = parseInt(yearSelect.value);
            const semester = parseInt(semesterSelect.value);

            if (!course) {
                renderEmptyState('Please choose an academic program to start.');
                return;
            }

            tableCard.innerHTML = `
                <div style="padding: 5rem; text-align: center;">
                    <div class="loader-spinner" style="width: 40px; height: 40px; border: 4px solid var(--accent-glow); border-top-color: var(--accent-color); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1.5rem;"></div>
                    <p style="color: var(--text-secondary); font-weight: 500;">Reading student records...</p>
                </div>
            `;

            try {
                const all = await ApiService.getStudents();
                const filtered = all.filter(s => {
                    if (s.course !== course) return false;
                    if (semester) return s.semester === semester;
                    if (year) return (s.semester === (year*2)-1 || s.semester === (year*2));
                    return true;
                });

                tableCard.innerHTML = '';
                if (filtered.length === 0) {
                    renderEmptyState('No students found matching the selected criteria.');
                    return;
                }

                const table = new Table({
                    columns: [
                        { key: 'rollNo', label: 'Roll No', render: (v) => `<code style="font-weight: 700; color: var(--text-secondary);">${v}</code>` },
                        { key: 'name', label: 'Full identity', render: (v, item) => `
                            <div>
                                <div style="font-weight: 800; color: var(--text-primary); font-size: 0.95rem;">${v}</div>
                                <div style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 600;">@${item.userId?.username || 'unassigned'}</div>
                            </div>` 
                        },
                        { key: 'course', label: 'Program' },
                        { key: 'semester', label: 'Session', render: (v) => `<span style="padding: 4px 10px; background: var(--bg-primary); border: 1px solid var(--glass-border); border-radius: 20px; font-size: 0.75rem; font-weight: 700; color: var(--accent-color);">SEM ${v}</span>` }
                    ],
                    data: filtered,
                    onEdit: user.role !== 'admin' ? null : (id) => window.location.hash = ROUTES.STUDENTS_EDIT.replace(':id', id),
                    onDelete: user.role !== 'admin' ? null : (id) => {
                        const s = filtered.find(x => x._id === id);
                        Modal.confirm('Permanently Delete Student?', `This will remove ${s?.name || 'the student'} and all associated records forever.`, async () => {
                            try { await ApiService.deleteStudent(id); loadStudents(); Toast.success('Record purged.'); }
                            catch (err) { Toast.error(err.message); }
                        });
                    }
                });
                tableCard.appendChild(table.render());
            } catch (err) { Toast.error('Sync Error: ' + err.message); }
        };

        (async () => {
            try {
                this.courses = await ApiService.getCourses();
                courseSelect.innerHTML = `<option value="">Select Program</option>` + this.courses.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
            } catch (err) { Toast.error('Load Error'); }
        })();

        courseSelect.onchange = () => updateYears(courseSelect.value);
        yearSelect.onchange = () => updateSemesters(yearSelect.value);
        semesterSelect.onchange = loadStudents;
        filterBar.querySelector('#resetFilters').onclick = () => { courseSelect.value = ''; updateYears(''); };

        container.appendChild(tableCard);
        return container;
    }
}
