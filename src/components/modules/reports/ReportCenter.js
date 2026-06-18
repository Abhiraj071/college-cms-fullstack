import { ApiService } from '../../../services/ApiService.js';
import { Table } from '../../common/Table.js';
import { Toast } from '../../../services/Toast.js';

export class ReportCenter {
    constructor() {
        this.currentData = [];
        this.reportType = '';
        this.courses = [];
        this.activeCategory = 'All'; // 'All', 'Student', 'Academic', 'Exam', 'Finance', 'Attendance', 'Custom'
        this.searchQuery = '';
        
        // Mock pre-generated reports library
        this.libraryReports = [
            { id: 1, name: 'B.Tech CS 2026 Student Directory', category: 'Student', author: 'System Admin', date: '2026-06-15', format: 'PDF', size: '2.4 MB' },
            { id: 2, name: 'Academic Performance Summary Semester 2', category: 'Academic', author: 'Dr. Rajesh Kumar', date: '2026-06-12', format: 'Excel', size: '820 KB' },
            { id: 3, name: 'May 2026 Student Attendance Consolidated', category: 'Attendance', author: 'System Scheduler', date: '2026-06-01', format: 'Excel', size: '1.1 MB' },
            { id: 4, name: 'Mid-Semester Examination Analysis', category: 'Exam', author: 'Prof. Anita Sharma', date: '2026-05-28', format: 'PDF', size: '3.8 MB' },
            { id: 5, name: 'Spring 2026 Supplementary Exam Results', category: 'Exam', author: 'Prof. Anita Sharma', date: '2026-06-10', format: 'PDF', size: '1.5 MB' },
            { id: 6, name: 'Library Resource Utilization Report Q2', category: 'Custom', author: 'Mahendra Singh', date: '2026-06-14', format: 'Excel', size: '640 KB' },
            { id: 7, name: 'Annual Faculty Workload & Distribution', category: 'Academic', author: 'System Admin', date: '2026-05-20', format: 'PDF', size: '4.2 MB' },
            { id: 8, name: 'Fee Collection & Pending Dues Summary', category: 'Finance', author: 'Accounts Desk', date: '2026-06-08', format: 'Excel', size: '940 KB' }
        ];
    }

    render() {
        const container = document.createElement('div');
        container.className = 'fade-in';
        container.style.padding = '1.5rem';

        // Styling injection
        const style = document.createElement('style');
        style.textContent = `
            .reports-layout {
                display: grid;
                grid-template-columns: 240px 1fr;
                gap: 1.5rem;
                align-items: start;
            }
            .sidebar-card {
                background: #FFFFFF;
                border: 1px solid #E2E8F0;
                border-radius: 20px;
                padding: 1.25rem;
                box-shadow: 0 4px 10px rgba(0,0,0,0.01);
            }
            .category-list {
                display: flex;
                flex-direction: column;
                gap: 6px;
                margin-top: 1rem;
            }
            .category-btn {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 10px 12px;
                border: none;
                background: none;
                border-radius: 10px;
                text-align: left;
                font-size: 0.88rem;
                font-weight: 600;
                color: #64748B;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            .category-btn:hover {
                background: #F8FAFC;
                color: #0F172A;
            }
            .category-btn.active {
                background: #ECEFFC;
                color: #4F46E5;
            }
            .stat-card-reports {
                padding: 1.25rem;
                display: flex;
                align-items: center;
                gap: 1rem;
                background: #FFFFFF;
                border: 1px solid #E2E8F0;
                border-radius: 20px;
                box-shadow: 0 4px 10px rgba(0,0,0,0.01);
            }
            .report-item-row:hover {
                background: #F8FAFC;
            }
            .badge-pdf {
                background: #FCE8E6;
                color: #EF4444;
                font-weight: 700;
                font-size: 0.72rem;
                padding: 2px 6px;
                border-radius: 4px;
            }
            .badge-excel {
                background: #E2FBF0;
                color: #10B981;
                font-weight: 700;
                font-size: 0.72rem;
                padding: 2px 6px;
                border-radius: 4px;
            }
            .action-link {
                color: #4F46E5;
                font-weight: 600;
                font-size: 0.82rem;
                background: none;
                border: none;
                cursor: pointer;
                padding: 0;
            }
            .action-link:hover {
                text-decoration: underline;
            }
            .form-group-reports {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }
            .form-group-reports label {
                font-size: 0.75rem;
                font-weight: 700;
                color: #64748B;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .form-group-reports select, .form-group-reports input {
                padding: 0.6rem;
                border-radius: 10px;
                background: #FFFFFF;
                border: 1px solid #E2E8F0;
                color: #0F172A;
                outline: none;
                font-size: 0.88rem;
                transition: border-color 0.2s ease, box-shadow 0.2s ease;
            }
            .form-group-reports select:focus, .form-group-reports input:focus {
                border-color: #6366F1;
                box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
            }
            @media (max-width: 992px) {
                .reports-layout {
                    grid-template-columns: 1fr !important;
                }
            }
        `;
        container.appendChild(style);

        // Header
        const header = document.createElement('div');
        header.style.marginBottom = '1.5rem';
        header.innerHTML = `
            <h1 style="font-size: 1.8rem; font-weight: 700; font-family: 'Outfit'; letter-spacing: -0.02em; margin-bottom: 4px;">Report Center 📊</h1>
            <p style="color: var(--text-secondary); font-size: 0.95rem; margin: 0;">Analyze, filter, and export system statistics and records library.</p>
        `;
        container.appendChild(header);

        // 4 Stats Cards
        const statsGrid = document.createElement('div');
        statsGrid.style.display = 'grid';
        statsGrid.style.gridTemplateColumns = 'repeat(4, 1fr)';
        statsGrid.style.gap = '1.25rem';
        statsGrid.style.marginBottom = '2rem';
        statsGrid.innerHTML = `
            <div class="stat-card-reports">
                <div style="width: 44px; height: 44px; background: #ECEFFC; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; color: #4F46E5; flex-shrink: 0;">
                    📂
                </div>
                <div>
                    <div style="font-size: 0.72rem; color: #64748B; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Total Reports</div>
                    <div style="font-size: 1.4rem; font-weight: 800; color: #0F172A; margin: 2px 0;">24</div>
                </div>
            </div>

            <div class="stat-card-reports">
                <div style="width: 44px; height: 44px; background: #E2FBF0; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; color: #10B981; flex-shrink: 0;">
                    🔄
                </div>
                <div>
                    <div style="font-size: 0.72rem; color: #64748B; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Reports Generated</div>
                    <div style="font-size: 1.4rem; font-weight: 800; color: #0F172A; margin: 2px 0;">128</div>
                </div>
            </div>

            <div class="stat-card-reports">
                <div style="width: 44px; height: 44px; background: #FEF3C7; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; color: #D97706; flex-shrink: 0;">
                    📥
                </div>
                <div>
                    <div style="font-size: 0.72rem; color: #64748B; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Total Exports</div>
                    <div style="font-size: 1.4rem; font-weight: 800; color: #0F172A; margin: 2px 0;">84</div>
                </div>
            </div>

            <div class="stat-card-reports">
                <div style="width: 44px; height: 44px; background: #FCE7F3; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; color: #DB2777; flex-shrink: 0;">
                    👤
                </div>
                <div>
                    <div style="font-size: 0.72rem; color: #64748B; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Active Staff</div>
                    <div style="font-size: 1.4rem; font-weight: 800; color: #0F172A; margin: 2px 0;">18</div>
                </div>
            </div>
        `;
        container.appendChild(statsGrid);

        // Split Layout: Sidebar & Main Panel
        const layout = document.createElement('div');
        layout.className = 'reports-layout';
        container.appendChild(layout);

        // Sidebar
        this.sidebar = document.createElement('div');
        this.sidebar.className = 'sidebar-card';
        this.sidebar.innerHTML = `
            <h3 style="margin: 0 0 10px 0; font-size: 0.95rem; font-weight: 700; color: #0F172A; font-family: 'Outfit';">Report Categories</h3>
            <div class="category-list">
                <button class="category-btn active" data-cat="All">📁 All Categories</button>
                <button class="category-btn" data-cat="Student">👤 Student Reports</button>
                <button class="category-btn" data-cat="Academic">📚 Academic Reports</button>
                <button class="category-btn" data-cat="Exam">📝 Exam Reports</button>
                <button class="category-btn" data-cat="Finance">💳 Finance Reports</button>
                <button class="category-btn" data-cat="Attendance">🕒 Attendance Reports</button>
                <button class="category-btn" data-cat="Custom">🛠️ Custom Reports</button>
            </div>
        `;
        layout.appendChild(this.sidebar);

        this.sidebar.querySelectorAll('.category-btn').forEach(btn => {
            btn.onclick = () => {
                this.sidebar.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.activeCategory = btn.getAttribute('data-cat');
                this.updateLibraryTable();
            };
        });

        // Right side container
        const mainPanel = document.createElement('div');
        mainPanel.style.display = 'flex';
        mainPanel.style.flexDirection = 'column';
        mainPanel.style.gap = '1.5rem';
        layout.appendChild(mainPanel);

        // Dynamic Query Box
        const queryCard = document.createElement('div');
        queryCard.className = 'glass-panel';
        queryCard.style.cssText = 'padding: 1.5rem; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 20px;';
        queryCard.innerHTML = `
            <h3 style="margin: 0 0 1.25rem 0; font-size: 1rem; font-family: 'Outfit'; font-weight: 700; color: #0F172A;">Dynamic Query Generator</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)) 180px; gap: 1rem; align-items: end;">
                <div class="form-group-reports">
                    <label>Report Type</label>
                    <select id="query-type">
                        <option value="">-- Select Type --</option>
                        <option value="students">Student Database</option>
                        <option value="attendance">Consolidated Attendance</option>
                    </select>
                </div>
                <div class="form-group-reports">
                    <label>Course Program</label>
                    <select id="query-course">
                        <option value="">-- Select Course --</option>
                    </select>
                </div>
                <div class="form-group-reports">
                    <label>Academic Year</label>
                    <select id="query-year" disabled>
                        <option value="">-- Course First --</option>
                    </select>
                </div>
                <div class="form-group-reports">
                    <label>Semester</label>
                    <select id="query-semester" disabled>
                        <option value="">-- Year First --</option>
                    </select>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="glass-button" id="query-run-btn" style="flex: 1; padding: 0.6rem; border-radius: 10px; background: #6366F1; color: white; border: none; font-weight: 600; cursor: pointer;">Generate</button>
                    <button class="secondary-button" id="query-csv-btn" style="padding: 0.6rem; border-radius: 10px; border: 1px solid #E2E8F0; background: #FFFFFF; color: #10B981; font-weight: 600; cursor: pointer; display: none;">CSV</button>
                </div>
            </div>
        `;
        mainPanel.appendChild(queryCard);

        // Load courses logic
        const queryCourse = queryCard.querySelector('#query-course');
        const queryYear = queryCard.querySelector('#query-year');
        const querySemester = queryCard.querySelector('#query-semester');
        const runBtn = queryCard.querySelector('#query-run-btn');
        const csvBtn = queryCard.querySelector('#query-csv-btn');

        const loadCourses = async () => {
            try {
                this.courses = await ApiService.getCourses();
                queryCourse.innerHTML = '<option value="">-- Select Course --</option>' + 
                    this.courses.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
            } catch (err) {
                queryCourse.innerHTML = '<option value="">Error Loading</option>';
            }
        };
        loadCourses();

        // Dropdowns update
        const updateYears = (courseName) => {
            const course = this.courses.find(c => c.name === courseName);
            queryYear.innerHTML = '<option value="">-- Select Year --</option>';
            querySemester.innerHTML = '<option value="">-- Year First --</option>';
            querySemester.disabled = true;
            queryYear.value = '';

            if (course) {
                queryYear.disabled = false;
                const duration = course.duration || 4;
                for (let i = 1; i <= duration; i++) {
                    const opt = document.createElement('option');
                    opt.value = String(i);
                    opt.textContent = `${i}${getOrdinal(i)} Year`;
                    queryYear.appendChild(opt);
                }
            } else {
                queryYear.disabled = true;
                queryYear.innerHTML = '<option value="">-- Course First --</option>';
            }
        };

        const updateSemesters = (year) => {
            querySemester.innerHTML = '<option value="">-- Select Semester --</option>';
            querySemester.value = '';

            if (year) {
                querySemester.disabled = false;
                const y = parseInt(year);
                const startSem = (y - 1) * 2 + 1;
                const endSem = startSem + 1;

                [startSem, endSem].forEach(sem => {
                    const opt = document.createElement('option');
                    opt.value = String(sem);
                    opt.textContent = `Semester ${sem}`;
                    querySemester.appendChild(opt);
                });
            } else {
                querySemester.disabled = true;
                querySemester.innerHTML = '<option value="">-- Year First --</option>';
            }
        };

        const getOrdinal = (n) => {
            const s = ["th", "st", "nd", "rd"];
            const v = n % 100;
            return s[(v - 20) % 10] || s[v] || s[0];
        };

        queryCourse.addEventListener('change', () => updateYears(queryCourse.value));
        queryYear.addEventListener('change', () => updateSemesters(queryYear.value));

        // Results Container
        this.resultsCard = document.createElement('div');
        this.resultsCard.className = 'glass-panel';
        this.resultsCard.style.cssText = 'padding: 1.5rem; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 20px;';
        mainPanel.appendChild(this.resultsCard);

        // Run query logic
        runBtn.onclick = async () => {
            const filters = {
                type: queryCard.querySelector('#query-type').value,
                course: queryCourse.value,
                year: queryYear.value,
                semester: querySemester.value
            };

            if (!filters.type) {
                Toast.error('Please select a report type first');
                return;
            }

            runBtn.textContent = 'Generating...';
            runBtn.disabled = true;

            try {
                this.reportType = filters.type;
                const data = await this.getFilteredData(filters);
                this.currentData = data;

                if (data.length > 0) {
                    csvBtn.style.display = 'block';
                } else {
                    csvBtn.style.display = 'none';
                }

                this.renderDynamicTable(data, filters.type);
            } catch (err) {
                Toast.error(err.message);
            } finally {
                runBtn.textContent = 'Generate';
                runBtn.disabled = false;
            }
        };

        csvBtn.onclick = () => {
            this.generateCSV(this.reportType, this.currentData);
        };

        // Render initial library table
        this.updateLibraryTable();

        return container;
    }

    updateLibraryTable() {
        this.resultsCard.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 10px;">
                <h3 style="margin: 0; font-size: 1rem; font-family: 'Outfit'; font-weight: 700; color: #0F172A;" id="table-title">${this.activeCategory} Reports Library</h3>
                <div style="position: relative; width: 220px;">
                    <input type="text" id="lib-search" placeholder="Search report name..." style="width: 100%; padding: 6px 12px 6px 28px; border-radius: 8px; border: 1px solid #E2E8F0; font-size: 0.82rem; outline: none;">
                    <span style="position: absolute; left: 10px; top: 7px; font-size: 0.8rem; color: #94A3B8;">🔍</span>
                </div>
            </div>

            <div style="overflow-x: auto; margin: 0 -1.5rem;">
                <table class="grid-table" style="width: 100%;">
                    <thead>
                        <tr>
                            <th>Report Name</th>
                            <th>Category</th>
                            <th>Author</th>
                            <th>Date Generated</th>
                            <th>Format</th>
                            <th>Size</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="library-tbody">
                    </tbody>
                </table>
            </div>
        `;

        const searchInput = this.resultsCard.querySelector('#lib-search');
        searchInput.value = this.searchQuery;
        searchInput.oninput = (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.filterAndRenderLibraryRows();
        };

        this.filterAndRenderLibraryRows();
    }

    filterAndRenderLibraryRows() {
        const tbody = this.resultsCard.querySelector('#library-tbody');
        if (!tbody) return;

        let filtered = this.libraryReports;
        if (this.activeCategory !== 'All') {
            filtered = filtered.filter(rep => rep.category === this.activeCategory);
        }
        if (this.searchQuery) {
            filtered = filtered.filter(rep => rep.name.toLowerCase().includes(this.searchQuery));
        }

        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: #64748B; padding: 3rem;">
                        No pre-generated reports found matching filters.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filtered.map(rep => {
            const fmtClass = rep.format === 'PDF' ? 'badge-pdf' : 'badge-excel';
            return `
                <tr class="report-item-row">
                    <td style="font-weight: 600; color: #0F172A;">${rep.name}</td>
                    <td>
                        <span style="background: #ECEFFC; color: #4F46E5; font-size: 0.72rem; font-weight: 700; padding: 2px 6px; border-radius: 4px;">
                            ${rep.category}
                        </span>
                    </td>
                    <td style="color: #475569;">${rep.author}</td>
                    <td style="color: #64748B;">${new Date(rep.date).toLocaleDateString()}</td>
                    <td><span class="${fmtClass}">${rep.format}</span></td>
                    <td style="color: #64748B;">${rep.size}</td>
                    <td>
                        <div style="display: flex; gap: 12px;">
                            <button class="action-link" onclick="window.ReportCenter_view('${rep.name}')">View</button>
                            <button class="action-link" style="color: #10B981;" onclick="window.ReportCenter_download('${rep.name}', '${rep.format}')">Download</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Expose action callbacks
        window.ReportCenter_view = (name) => {
            Toast.success(`Previewing report: ${name}`);
        };
        window.ReportCenter_download = (name, format) => {
            Toast.success(`Downloading ${name}.${format.toLowerCase()}...`);
        };
    }

    async getFilteredData(filters) {
        const { type, course, year, semester } = filters;
        let data = [];

        const matchesYear = (itemYear, targetYear) => {
            if (!targetYear) return true;
            return itemYear == targetYear;
        };

        const matchesSemester = (itemSem, targetSem) => {
            if (!targetSem) return true;
            return itemSem == targetSem;
        };

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

    renderDynamicTable(data, type) {
        this.resultsCard.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 10px;">
                <h3 style="margin: 0; font-size: 1rem; font-family: 'Outfit'; font-weight: 700; color: #0F172A;">Query Results (${data.length} records)</h3>
                <button class="secondary-button" id="lib-back-btn" style="padding: 4px 10px; font-size: 0.78rem; border-radius: 6px; border: 1px solid #E2E8F0; background: #FFFFFF; color:#6366F1; font-weight:600; cursor:pointer;">Back to Library</button>
            </div>
            <div style="overflow-x: auto; margin: 0 -1.5rem;" id="dynamic-table-container"></div>
        `;

        this.resultsCard.querySelector('#lib-back-btn').onclick = () => {
            this.updateLibraryTable();
            const csvBtn = document.getElementById('query-csv-btn');
            if (csvBtn) csvBtn.style.display = 'none';
        };

        const tableContainer = this.resultsCard.querySelector('#dynamic-table-container');

        if (data.length === 0) {
            tableContainer.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #64748B;">
                    <p>No records found for the selected query filters.</p>
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
                    return `<span style="color: ${color}; font-weight: 600;">${val}</span>`;
                }
                return val;
            }
        }));

        const table = new Table({
            columns: columns,
            data: data,
            actions: false
        });

        tableContainer.appendChild(table.render());
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
