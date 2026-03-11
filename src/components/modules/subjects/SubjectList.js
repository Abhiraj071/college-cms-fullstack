import { ApiService } from '../../../services/ApiService.js';
import { Table } from '../../common/Table.js';
import { auth } from '../../../services/AuthService.js';
import { Toast } from '../../../services/Toast.js';
import { Modal } from '../../../services/Modal.js';
import { ROUTES } from '../../../services/Constants.js';

export class SubjectList {
    constructor(id = null, params = {}) {
        this.params = params;
        this.subjects = [];
        this.selectedFaculty = '';
        this.faculty = [];
        this.timetables = [];
        this.selectedDate = new Date(); // Default to today
    }

    render() {
        const container = document.createElement('div');
        container.className = 'fade-in';
        const user = auth.getUser();

        // Header
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.marginBottom = '2rem';
        header.style.flexWrap = 'wrap';
        header.style.gap = '1rem';

        const titleSection = document.createElement('div');
        titleSection.innerHTML = `
            <h2>Subject Management</h2>
            <p style="color: var(--text-secondary); margin-top: 0.5rem;">Manage the institutional subject repository</p>
        `;

        const addBtn = document.createElement('button');
        addBtn.className = 'glass-button';
        addBtn.textContent = '+ Add Subject';
        addBtn.onclick = () => {
            window.location.hash = ROUTES.SUBJECTS_ADD;
        };

        if (user.role !== 'admin') {
            addBtn.style.display = 'none';
        }

        header.appendChild(titleSection);
        header.appendChild(addBtn);
        container.appendChild(header);

        // Filter Bar
        const filterBar = document.createElement('div');
        filterBar.className = 'glass-panel';
        filterBar.style.padding = '1.25rem';
        filterBar.style.marginBottom = '2rem';
        filterBar.style.display = 'flex';
        filterBar.style.gap = '1rem';
        filterBar.style.alignItems = 'center';

        filterBar.innerHTML = `
            <div style="flex: 1;">
                 <label style="display: block; margin-bottom: 0.4rem; font-weight: 600; font-size: 0.85rem; color: var(--text-secondary);">Search Subjects</label>
                 <input type="text" id="subjectSearch" placeholder="Search by name or code..." style="width: 100%; border: 1px solid var(--glass-border); padding: 10px; border-radius: 8px; background: rgba(0,0,0,0.1); color:#fff;">
            </div>
            <div id="facultyFilterContainer" style="width: 250px;">
                <label style="display: block; margin-bottom: 0.4rem; font-weight: 600; font-size: 0.85rem; color: var(--text-secondary);">Filter by Faculty</label>
                <select id="facultyFilter" style="width: 100%; padding: 10px; border: 1px solid var(--glass-border); border-radius: 8px; background: rgba(0,0,0,0.1); color:#fff;">
                    <option value="">All Faculty</option>
                </select>
            </div>
        `;

        container.appendChild(filterBar);

        // Content container
        const tableCard = document.createElement('div');
        tableCard.id = 'subjects-content';
        container.appendChild(tableCard);

        const loadData = async () => {
            const facultyFilter = /** @type {HTMLSelectElement} */ (filterBar.querySelector('#facultyFilter'));
            const subjectSearch = /** @type {HTMLInputElement} */ (filterBar.querySelector('#subjectSearch'));

            this.selectedFaculty = facultyFilter.value;
            const searchTerm = (subjectSearch ? subjectSearch.value : '').toLowerCase();

            tableCard.innerHTML = '<div style="padding: 3rem; text-align: center; font-size: 0.9rem;">Gathering academic records...</div>';
            try {
                let isAssignedMode = this.params.mode === 'assigned';
                const isStudent = user.role === 'student';

                // Auto-enable assigned mode for Students to use the Card view
                if (isStudent) {
                    isAssignedMode = true;
                }

                if (isAssignedMode) {
                    titleSection.innerHTML = `
                        <h2>${isStudent ? 'My Enrolled Subjects' : 'My Classes'}</h2>
                        <p style="color: var(--text-secondary); margin-top: 0.5rem; font-size: 0.95rem;">${isStudent ? 'Subjects for your current semester' : 'Subjects and schedule assigned to you'}</p>
                    `;
                    addBtn.style.display = 'none';
                    filterBar.style.display = 'none';

                    // Date Navigation for Teachers - REMOVED per requirements to show all classes
                    if (user.role === 'teacher') {
                        const header = document.querySelector('header'); // Re-query header just in case, though scope is available
                        // No specific date UI needed anymore
                    }
                }

                const [subjectsData, timetablesData, allStudents] = await Promise.all([
                    ApiService.getSubjects(),
                    ApiService.getTimetables(),
                    isStudent ? ApiService.getStudents() : Promise.resolve([])
                ]);

                this.subjects = subjectsData;
                this.timetables = timetablesData;

                // 1. Filter for Students
                if (isStudent) {
                    const targetId = String(user.id || user._id);
                    const profile = allStudents.find(s => String(s.userId?._id || s.userId || s.userId?.id) === targetId);
                    if (profile) {
                        this.subjects = this.subjects.filter(s =>
                            s.course === profile.course &&
                            String(s.year) === String(Math.ceil(profile.semester / 2)) &&
                            String(s.semester) === String(profile.semester)
                        );
                    } else {
                        this.subjects = [];
                        Toast.error('Student profile not found. Please contact admin.');
                    }
                }
                // 2. Search Filter (if not assigned mode or applied on top)
                else if (searchTerm) {
                    this.subjects = this.subjects.filter(s =>
                        s.name.toLowerCase().includes(searchTerm) ||
                        (s.code && s.code.toLowerCase().includes(searchTerm))
                    );
                }

                // 3. Admin Faculty Filter
                if (this.selectedFaculty && user.role === 'admin') {
                    this.subjects = this.subjects.filter(s => {
                        const prim = s.faculty?._id || s.faculty;
                        return String(prim) === String(this.selectedFaculty);
                    });
                }

                // 4. Teacher "Assigned" Logic
                if (isAssignedMode && user.role === 'teacher') {
                    const flattened = [];
                    this.subjects.forEach(s => {
                        const prim = s.faculty?._id || s.faculty;
                        const isPrimary = (prim && user.facultyId && String(prim) === String(user.facultyId)) ||
                            (prim && String(prim) === String(user._id));

                        const contextAssignments = [];
                        this.timetables.forEach(t => {
                            if (!t.grid) return;
                            const hasMySlot = Object.values(t.grid).some(slot =>
                                slot.subject === s.name &&
                                (slot.teacher === user.name || (user.facultyId && slot.teacher === String(user.facultyId)) || slot.teacher === user._id)
                            );
                            if (hasMySlot) {
                                contextAssignments.push({ course: t.course, year: t.year, semester: t.semester, timetableId: t._id });
                            }
                        });

                        if (contextAssignments.length > 0) {
                            contextAssignments.forEach(ctx => {
                                flattened.push({ ...s, ...ctx, _isContextual: true });
                            });
                        } else if (isPrimary) {
                            flattened.push({ ...s, _isContextual: false });
                        }
                    });
                    this.subjects = flattened;
                }

                tableCard.innerHTML = '';

                // Render Card View (Teacher or Student)
                if (isAssignedMode && (user.role === 'teacher' || user.role === 'student')) {
                    // Removed date filtering for teachers

                    if (this.subjects.length === 0) {
                        tableCard.innerHTML = `
                            <div class="glass-panel" style="padding: 5rem 2rem; text-align: center; border: 1px dashed var(--glass-border);">
                                <div style="font-size: 4rem; margin-bottom: 1.5rem; opacity: 0.5;">🏫</div>
                                <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">No Subjects Found</h3>
                                <p style="color: var(--text-secondary);">
                                    ${isStudent ? 'You are not enrolled in any subjects yet.' : 'No subjects assigned to you found.'}
                                </p>
                            </div>
                        `;
                        return;
                    }

                    const grid = document.createElement('div');
                    grid.style.display = 'grid';
                    grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(320px, 1fr))';
                    grid.style.gap = '1.5rem';

                    this.subjects.forEach(item => {
                        const card = document.createElement('div');
                        card.className = 'glass-panel fade-in';
                        card.style.padding = '0';
                        card.style.overflow = 'hidden';
                        card.style.display = 'flex';
                        card.style.flexDirection = 'column';
                        card.style.border = '1px solid var(--glass-border)';

                        const entries = [];
                        // For students, check entire timetable for this subject
                        const relevantT = item.course
                            ? this.timetables.filter(t => t.course === item.course && t.year == item.year && t.semester == item.semester)
                            : this.timetables;

                        relevantT.forEach(t => {
                            if (t.grid) {
                                Object.entries(t.grid).forEach(([key, slot]) => {
                                    // Match subject name. For Teachers, match teacher too. For Students, just subject is enough (class schedule).
                                    const matchSubject = slot.subject === item.name;
                                    const matchTeacher = isStudent ? true : (slot.teacher === user.name || (user.facultyId && slot.teacher === String(user.facultyId)) || slot.teacher === user._id);

                                    if (matchSubject && matchTeacher) {
                                        const [day, time] = key.split('::');
                                        // if (user.role === 'teacher' && day !== currentDay) return; // REMOVED: Show all days
                                        entries.push({ day, time, room: slot.room });
                                    }
                                });
                            }
                        });




                        entries.sort((a, b) => {
                            const days = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7 };
                            if (days[a.day] !== days[b.day]) return days[a.day] - days[b.day];
                            return a.time.localeCompare(b.time);
                        });

                        card.innerHTML = `
                            <div style="padding: 1.5rem; background: linear-gradient(135deg, rgba(79, 70, 229, 0.1), transparent); border-bottom: 1px solid var(--glass-border);">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                                    <div style="background: var(--accent-color); color: white; padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 700;">${item.type || 'Theory'}</div>
                                    <div style="color: var(--text-secondary); font-size: 0.75rem;">#${item.code || 'N/A'}</div>
                                </div>
                                <h3 style="margin: 0; font-size: 1.25rem; font-weight: 800;">${item.name}</h3>
                                ${item.course ? `
                                    <div style="margin-top: 10px; font-size: 0.8rem; font-weight: 700; color: var(--accent-color); display: flex; align-items: center; gap: 8px;">
                                        <span style="background: rgba(79, 70, 229, 0.1); padding: 4px 8px; border-radius: 6px;">📚 ${item.course}</span>
                                        <span>Y${item.year} S${item.semester}</span>
                                    </div>
                                ` : ''}
                            </div>

                            <div style="padding: 1rem; background: var(--bg-primary); border-top: 1px solid var(--glass-border); display: grid; grid-template-columns: 1fr ${user.role !== 'teacher' ? '1fr' : ''}; gap: 10px;">
                                <button class="glass-button" style="padding: 8px; font-size: 0.75rem; border: none; background: rgba(255,255,255,0.05);" onclick="window.location.hash='${ROUTES.ATTENDANCE}?course=${encodeURIComponent(item.course || '')}'">📝 Attendance</button>
                                ${user.role !== 'teacher' ? `<button class="glass-button" style="padding: 8px; font-size: 0.75rem; border: none; background: rgba(255,255,255,0.05);" onclick="window.location.hash='${ROUTES.STUDY_MATERIALS}'">📖 Resources</button>` : ''}
                            </div>
                        `;
                        grid.appendChild(card);
                    });
                    tableCard.appendChild(grid);
                }
                // Render Standard Table View (Admin)
                else {
                    const columns = [
                        {
                            key: 'name', label: 'Subject Details', render: (val, item) => `
                            <div style="font-weight: 700; color: var(--text-primary); font-size: 0.95rem;">${val}</div>
                            <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px; font-weight: 600;">CODE: ${item.code || 'N/A'}</div>
                        `},
                        { key: 'type', label: 'Type', render: (val) => `<span class="badge" style="background: rgba(255,255,255,0.05); font-size: 0.75rem; padding: 4px 8px; border-radius: 4px; border: 1px solid var(--glass-border); color: var(--text-primary); font-weight: 600;">${val || 'Theory'}</span>` },
                        { key: 'description', label: 'Overview', render: (val) => `<div style="font-size: 0.8rem; color: var(--text-secondary); max-width:250px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${val || '---'}</div>` }
                    ];
                    const table = new Table({
                        columns: columns,
                        data: this.subjects,
                        onEdit: (user.role !== 'admin') ? null : (id) => { window.location.hash = ROUTES.SUBJECTS_EDIT.replace(':id', id); },
                        onDelete: (user.role !== 'admin') ? null : (id) => {
                            const sub = this.subjects.find(s => s._id === id);
                            Modal.confirm('Delete Subject?', `Are you sure you want to remove ${sub.name}?`, async () => {
                                try { await ApiService.deleteSubject(id); loadData(); Toast.success('Subject removed'); } catch (err) { Toast.error(err.message); }
                            });
                        }
                    });
                    tableCard.appendChild(table.render());
                }
            } catch (err) {
                Toast.error('Load failed: ' + err.message);
                tableCard.innerHTML = `<div style="padding:4rem; text-align:center; color:var(--danger);">Error loading subjects: ${err.message}</div>`;
            }
        };

        const loadFilterData = async () => {
            try {
                const faculty = await ApiService.getFaculty();
                this.faculty = faculty;

                const facultyFilter = /** @type {HTMLSelectElement} */ (filterBar.querySelector('#facultyFilter'));
                const subjectSearch = /** @type {HTMLInputElement} */ (filterBar.querySelector('#subjectSearch'));

                facultyFilter.innerHTML = '<option value="">All Faculty Members</option>';
                this.faculty.forEach(f => {
                    const opt = document.createElement('option');
                    opt.value = f._id;
                    opt.textContent = `${f.name} (${f.department || 'N/A'})`;
                    facultyFilter.appendChild(opt);
                });

                if (user.role !== 'admin') {
                    const container = /** @type {HTMLElement} */ (filterBar.querySelector('#facultyFilterContainer'));
                    if (container) container.style.display = 'none';
                }

                facultyFilter.addEventListener('change', () => loadData());
                if (subjectSearch) subjectSearch.addEventListener('input', () => loadData());

                loadData();
            } catch (err) {
                console.error('Filter load error:', err);
                loadData();
            }
        };

        loadFilterData();
        return container;
    }
}
