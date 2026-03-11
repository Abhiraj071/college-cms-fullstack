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
        header.style.alignItems = 'center';
        header.style.gap = '2rem';
        header.style.flexWrap = 'wrap';
        header.style.marginBottom = '2rem';

        const title = document.createElement('h2');
        title.textContent = 'Students';
        title.style.margin = '0';
        title.style.marginRight = '2rem';
        title.style.minWidth = 'fit-content';

        const layoutGroup = document.createElement('div');
        layoutGroup.style.display = 'flex';
        layoutGroup.style.gap = '1.5rem';
        layoutGroup.style.alignItems = 'center';
        layoutGroup.style.flexWrap = 'wrap';

        const filterGroup = document.createElement('div');
        filterGroup.style.display = 'flex';
        filterGroup.style.gap = '1rem';
        filterGroup.style.background = 'rgba(255,255,255,0.05)';
        filterGroup.style.padding = '4px';
        filterGroup.style.borderRadius = '8px';

        const createSelect = (placeholder) => {
            const select = document.createElement('select');
            select.style.padding = '0.5rem';
            select.style.borderRadius = '6px';
            select.style.border = 'none';
            select.style.background = 'transparent';
            select.style.color = 'var(--text-primary)';
            select.style.cursor = 'pointer';
            select.innerHTML = `<option value="">${placeholder}</option>`;
            return select;
        };

        // 1. Course Filter
        const courseSelect = createSelect('Select Course');

        // 2. Year Filter
        const yearSelect = createSelect('Select Course First');
        yearSelect.disabled = true;

        // 3. Semester Filter
        const semesterSelect = createSelect('Select Year First');
        semesterSelect.disabled = true;

        filterGroup.appendChild(courseSelect);
        filterGroup.appendChild(yearSelect);
        filterGroup.appendChild(semesterSelect);

        // 3. Add New Student Button
        const addBtn = document.createElement('button');
        addBtn.className = 'glass-button';
        addBtn.innerHTML = '<span style="font-size:1.2rem; vertical-align: middle;">+</span> Add Student';
        addBtn.style.padding = '8px 20px';
        addBtn.onclick = () => { window.location.hash = ROUTES.STUDENTS_ADD; };
        if (user.role !== 'admin') addBtn.style.display = 'none';

        const bulkAddBtn = document.createElement('button');
        bulkAddBtn.className = 'glass-button';
        bulkAddBtn.style.background = 'rgba(255, 255, 255, 0.05)';
        bulkAddBtn.style.color = 'var(--text-primary)';
        bulkAddBtn.innerHTML = 'Import CSV/Excel';
        bulkAddBtn.style.padding = '8px 20px';
        bulkAddBtn.onclick = () => { window.location.hash = ROUTES.STUDENTS_BULK; };
        if (user.role !== 'admin') bulkAddBtn.style.display = 'none';

        layoutGroup.appendChild(filterGroup);
        layoutGroup.appendChild(bulkAddBtn);
        layoutGroup.appendChild(addBtn);

        header.appendChild(title);
        header.appendChild(layoutGroup);
        container.appendChild(header);

        // Main Content Area (Table)
        const tableCard = document.createElement('div');
        tableCard.className = 'glass-panel';
        tableCard.style.padding = '1rem';
        tableCard.style.minHeight = '200px';

        // Initial State
        tableCard.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🎓</div>
                <p>Please select a <strong>Course</strong>, <strong>Year</strong> and <strong>Semester</strong>.</p>
            </div>
        `;

        // Filter Logic
        const updateYears = (courseName) => {
            const course = this.courses.find(c => c.name === courseName);
            yearSelect.innerHTML = '<option value="">Select Year</option>';
            semesterSelect.innerHTML = '<option value="">Select Year First</option>';
            semesterSelect.disabled = true;
            yearSelect.value = "";
            semesterSelect.value = "";

            if (course) {
                yearSelect.disabled = false;
                const duration = course.duration || 4;
                for (let i = 1; i <= duration; i++) {
                    const opt = document.createElement('option');
                    opt.value = String(i);
                    opt.textContent = `Year ${i}`;
                    yearSelect.appendChild(opt);
                }
            } else {
                yearSelect.disabled = true;
                yearSelect.innerHTML = '<option value="">Select Course First</option>';
            }
            loadStudents();
        };

        const updateSemesters = (year) => {
            semesterSelect.innerHTML = '<option value="">All Semesters</option>';
            semesterSelect.value = "";

            if (year) {
                semesterSelect.disabled = false;
                const y = parseInt(year);
                const startSem = (y - 1) * 2 + 1;
                const endSem = startSem + 1;

                [startSem, endSem].forEach(sem => {
                    const opt = document.createElement('option');
                    opt.value = String(sem);
                    opt.textContent = `Semester ${sem}`;
                    semesterSelect.appendChild(opt);
                });
            } else {
                semesterSelect.disabled = true;
                semesterSelect.innerHTML = '<option value="">Select Year First</option>';
            }
            loadStudents();
        };

        const loadCourseData = async () => {
            try {
                this.courses = await ApiService.getCourses();
                courseSelect.innerHTML = `<option value="">Select Course</option>` +
                    this.courses.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
            } catch (err) {
                Toast.error('Failed to load courses');
            }
        };

        const loadStudents = async () => {
            const selectedCourse = courseSelect.value;
            const selectedYear = parseInt(yearSelect.value);
            const selectedSemester = parseInt(semesterSelect.value);

            if (!selectedCourse || !selectedYear) {
                tableCard.innerHTML = `
                    <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">🎓</div>
                        <p>Please select a <strong>Course</strong> and <strong>Year</strong>.</p>
                    </div>
                `;
                return;
            }

            tableCard.innerHTML = '<div style="padding: 2rem; text-align: center;">Loading students...</div>';

            try {
                // Fetch from Backend
                const allStudents = await ApiService.getStudents();

                const filtered = allStudents.filter(s => {
                    if (s.course !== selectedCourse) return false;

                    // Filter by Semester if selected, otherwise by Year
                    if (selectedSemester) {
                        return s.semester === selectedSemester;
                    } else {
                        const startSem = (selectedYear * 2) - 1;
                        const endSem = selectedYear * 2;
                        return s.semester === startSem || s.semester === endSem;
                    }
                });

                tableCard.innerHTML = '';

                if (filtered.length === 0) {
                    tableCard.innerHTML = `
                        <div style="text-align: center; padding: 2rem;">
                            <p>No students found.</p>
                        </div>
                    `;
                    return;
                }

                const table = new Table({
                    columns: [
                        { key: 'rollNo', label: 'Roll No' },
                        { key: 'name', label: 'Name', render: (val, item) => `<strong>${val}</strong><br><span style="font-size:0.75rem; color:var(--text-secondary)">${item.userId?.username || 'no-login'}</span>` },
                        { key: 'course', label: 'Course' },
                        { key: 'semester', label: 'Sem', render: (val) => `<span style="padding: 2px 8px; background: rgba(255,255,255,0.1); border-radius: 10px; font-size: 0.8rem;">${val}</span>` }
                    ],
                    data: filtered,
                    onEdit: user.role !== 'admin' ? null : (id) => {
                        window.location.hash = ROUTES.STUDENTS_EDIT.replace(':id', id);
                    },
                    onDelete: user.role !== 'admin' ? null : (id) => {
                        const student = filtered.find(s => s._id === id);
                        Modal.confirm('Delete Student?', `Are you sure you want to remove ${student?.name || 'this student'}? This will also delete their academic history and login account.`, async () => {
                            try {
                                await ApiService.deleteStudent(id);
                                loadStudents(); // Refresh
                                Toast.success('Student record removed.');
                            } catch (err) {
                                Toast.error(err.message);
                            }
                        });
                    }
                });
                tableCard.appendChild(table.render());
            } catch (err) {
                Toast.error('Failed to load students: ' + err.message);
                tableCard.innerHTML = `<p style="color:red; text-align:center; padding:2rem;">Error: ${err.message}</p>`;
            }
        };

        // Attach Listeners
        courseSelect.addEventListener('change', () => updateYears(courseSelect.value));
        yearSelect.addEventListener('change', () => updateSemesters(yearSelect.value));
        semesterSelect.addEventListener('change', loadStudents);

        loadCourseData();
        container.appendChild(tableCard);

        return container;
    }
}
