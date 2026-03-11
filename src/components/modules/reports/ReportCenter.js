import { ApiService } from '../../../services/ApiService.js';
import { Table } from '../../common/Table.js';
import { Toast } from '../../../services/Toast.js';

export class ReportCenter {
    constructor() {
        this.currentData = [];
        this.reportType = '';
        this.courses = [];
    }

    render() {
        const container = document.createElement('div');
        container.className = 'fade-in';

        // Header
        const header = document.createElement('div');
        header.style.marginBottom = '2rem';
        header.innerHTML = `
            <h2>Report Center</h2>
            <p style="color: var(--text-secondary);">Filter and export system data by course and year</p>
        `;
        container.appendChild(header);

        // Filter Bar
        const filterBar = document.createElement('div');
        filterBar.className = 'glass-panel';
        filterBar.style.padding = '1.5rem';
        filterBar.style.marginBottom = '2rem';
        filterBar.style.display = 'grid';
        filterBar.style.gridTemplateColumns = 'repeat(auto-fit, minmax(200px, 1fr))';
        filterBar.style.gap = '1.5rem';
        filterBar.style.alignItems = 'end';

        // 1. Report Type
        const typeGroup = this.createFilterGroup('Report Type', 'select');
        const typeSelect = typeGroup.querySelector('select');
        typeSelect.innerHTML = `
            <option value="">-- Select Report --</option>
            <option value="students">Student Report</option>
            <option value="faculty">Teacher Report</option>
            <option value="attendance">Attendance Report</option>
        `;

        // 2. Course
        const courseGroup = this.createFilterGroup('Course', 'select');
        const courseSelect = courseGroup.querySelector('select');
        const loadCourses = async () => {
            try {
                this.courses = await ApiService.getCourses();
                courseSelect.innerHTML = `<option value="">-- Select Course --</option>` +
                    this.courses.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
            } catch (err) {
                courseSelect.innerHTML = `<option value="">Error loading</option>`;
            }
        };
        loadCourses();

        // 3. Year
        const yearGroup = this.createFilterGroup('Year', 'select');
        const yearSelect = yearGroup.querySelector('select');
        yearSelect.disabled = true;
        yearSelect.innerHTML = '<option value="">-- Select Course First --</option>';

        // 4. Semester
        const semesterGroup = this.createFilterGroup('Semester', 'select');
        const semesterSelect = semesterGroup.querySelector('select');
        semesterSelect.disabled = true;
        semesterSelect.innerHTML = '<option value="">-- Select Year First --</option>';

        // Dynamic Dropdown Logic
        const updateYears = (courseName) => {
            const course = this.courses.find(c => c.name === courseName);
            yearSelect.innerHTML = '<option value="">-- Select Year --</option>';
            semesterSelect.innerHTML = '<option value="">-- Select Year First --</option>';
            semesterSelect.disabled = true;
            yearSelect.value = "";

            if (course) {
                yearSelect.disabled = false;
                const duration = course.duration || 4;
                for (let i = 1; i <= duration; i++) {
                    const opt = document.createElement('option');
                    opt.value = String(i);
                    opt.textContent = `${i}${getOrdinal(i)} Year`;
                    yearSelect.appendChild(opt);
                }
            } else {
                yearSelect.disabled = true;
                yearSelect.innerHTML = '<option value="">-- Select Course First --</option>';
            }
        };

        const updateSemesters = (year) => {
            semesterSelect.innerHTML = '<option value="">-- Select Semester --</option>';
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
                semesterSelect.innerHTML = '<option value="">-- Select Year First --</option>';
            }
        };

        const getOrdinal = (n) => {
            const s = ["th", "st", "nd", "rd"];
            const v = n % 100;
            return s[(v - 20) % 10] || s[v] || s[0];
        };

        courseSelect.addEventListener('change', () => updateYears(courseSelect.value));
        yearSelect.addEventListener('change', () => updateSemesters(yearSelect.value));

        // 4. Action Buttons
        const actionGroup = document.createElement('div');
        actionGroup.style.display = 'flex';
        actionGroup.style.gap = '1rem';

        const generateBtn = document.createElement('button');
        generateBtn.className = 'glass-button';
        generateBtn.textContent = 'Generate Report';
        generateBtn.style.flex = '1';

        const exportBtn = document.createElement('button');
        exportBtn.className = 'glass-button';
        exportBtn.textContent = 'Export CSV';
        exportBtn.style.flex = '1';
        exportBtn.style.background = 'var(--accent-color)';
        exportBtn.style.display = 'none';

        actionGroup.appendChild(generateBtn);
        actionGroup.appendChild(exportBtn);

        filterBar.appendChild(typeGroup);
        filterBar.appendChild(courseGroup);
        filterBar.appendChild(yearGroup);
        filterBar.appendChild(semesterGroup);
        filterBar.appendChild(actionGroup);
        container.appendChild(filterBar);

        // Results Area
        const resultsContainer = document.createElement('div');
        resultsContainer.className = 'glass-panel';
        resultsContainer.style.padding = '1rem';
        resultsContainer.innerHTML = `
            <div style="text-align: center; padding: 4rem; color: var(--text-secondary);">
                <div style="font-size: 3rem; margin-bottom: 1rem;">📊</div>
                <p>Select filter criteria and click <strong>Generate Report</strong> to view data.</p>
            </div>
        `;
        container.appendChild(resultsContainer);

        // Logic
        generateBtn.onclick = async () => {
            const filters = {
                type: typeSelect.value,
                course: courseSelect.value,
                year: yearSelect.value,
                semester: semesterSelect.value
            };

            if (!filters.type) {
                Toast.error('Please select a report type before generating.');
                return;
            }

            generateBtn.textContent = 'Generating...';
            generateBtn.disabled = true;

            try {
                this.reportType = filters.type;
                const data = await this.getFilteredData(filters);
                this.currentData = data;

                if (data.length > 0) {
                    exportBtn.style.display = 'block';
                } else {
                    exportBtn.style.display = 'none';
                }

                this.renderTable(resultsContainer, data, filters.type);
            } catch (err) {
                Toast.error(err.message);
            } finally {
                generateBtn.textContent = 'Generate Report';
                generateBtn.disabled = false;
            }
        };

        exportBtn.onclick = () => {
            this.generateCSV(this.reportType, this.currentData);
        };

        return container;
    }

    createFilterGroup(label, type) {
        const group = document.createElement('div');
        group.innerHTML = `
            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem; color: var(--text-secondary);">${label}</label>
            <select style="width: 100%; padding: 0.6rem; border-radius: 8px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); color: var(--text-primary); outline: none;">
            </select>
        `;
        return group;
    }

    async getFilteredData(filters) {
        const { type, course, year, semester } = filters;
        let data = [];

        // Helper to check year
        const matchesYear = (itemYear, targetYear) => {
            if (!targetYear) return true;
            return itemYear == targetYear;
        };

        // Helper to check semester
        const matchesSemester = (itemSem, targetSem) => {
            if (!targetSem) return true;
            return itemSem == targetSem;
        };

        // Helper to check course
        const matchesCourse = (itemCourse, targetCourse) => {
            if (!targetCourse) return true;
            return itemCourse === targetCourse;
        };

        switch (type) {
            case 'students': {
                const students = await ApiService.getStudents();
                data = students.filter(s => {
                    const studentYear = Math.ceil(s.semester / 2);
                    return matchesCourse(s.course, course) &&
                        matchesYear(studentYear, year) &&
                        matchesSemester(s.semester, semester);
                }).map(s => ({
                    'Roll No': s.rollNo,
                    'Name': s.name,
                    'Course': s.course,
                    'Year': Math.ceil(s.semester / 2),
                    'Semester': s.semester,
                    'Email': s.userId?.email || 'N/A'
                }));
                break;
            }
            case 'faculty': {
                const faculty = await ApiService.getFaculty();
                data = faculty.filter(f => {
                    return matchesCourse(f.department, course);
                }).map(f => ({
                    'Name': f.name,
                    'Email': f.email,
                    'Role': f.role,
                    'Department': f.department || 'General'
                }));
                break;
            }
            case 'attendance': {
                const attRecords = await ApiService.getAttendance();
                const students = await ApiService.getStudents();

                attRecords.forEach(att => {
                    if (!matchesCourse(att.course, course)) return;

                    att.students.forEach(rec => {
                        const student = students.find(s => s._id === (rec.studentId?._id || rec.studentId));
                        if (!student) return;

                        const studentYear = Math.ceil(student.semester / 2);
                        if (matchesYear(studentYear, year)) {
                            data.push({
                                'Date': new Date(att.date).toLocaleDateString(),
                                'Student': student.name,
                                'Roll No': student.rollNo,
                                'Course': att.course,
                                'Status': rec.status
                            });
                        }
                    });
                });
                break;
            }

        }
        return data;
    }

    renderTable(container, data, type) {
        container.innerHTML = '';
        if (data.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <p>No records found for the selected criteria.</p>
                </div>
            `;
            return;
        }

        const columns = Object.keys(data[0]).map(key => ({
            key: key,
            label: key,
            render: (val) => {
                if (key === 'Status') {
                    const color = val === 'Present' ? '#10b981' : (val === 'Absent' ? '#ef4444' : '#f59e0b');
                    return `<span style="color: ${color}; font-weight: 500;">${val}</span>`;
                }
                return val;
            }
        }));

        const table = new Table({
            columns: columns,
            data: data,
            actions: false
        });

        container.appendChild(table.render());
    }

    generateCSV(type, data) {
        if (!data || data.length === 0) return;

        const filename = `${type}_report_${new Date().toISOString().split('T')[0]}.csv`;
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(fieldName => JSON.stringify(row[fieldName], (key, value) => value === null ? '' : value)).join(','))
        ].join('\r\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}

