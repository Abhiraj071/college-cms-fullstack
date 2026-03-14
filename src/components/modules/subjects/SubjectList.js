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
        this.selectedDate = new Date();
    }

    render() {
        const container = document.createElement('div');
        container.className = 'fade-in';
        const user = auth.getUser();
        const isAdmin = user.role === 'admin';
        const isStudent = user.role === 'student';

        // Header Section
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'flex-end';
        header.style.marginBottom = '2.5rem';
        header.style.flexWrap = 'wrap';
        header.style.gap = '1.5rem';

        const titleSection = document.createElement('div');
        titleSection.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 0.5rem;">
                <span style="font-size: 2rem;">📚</span>
                <h2 style="font-size: 2rem; margin: 0; letter-spacing: -1px;">Subjects</h2>
            </div>
            <p style="color: var(--text-secondary); font-size: 1rem; font-weight: 500;">Manage the institutional subject repository and class assignments.</p>
        `;

        if (this.params.mode === 'assigned' || isStudent) {
            titleSection.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 0.5rem;">
                    <span style="font-size: 2rem;">🏫</span>
                    <h2 style="font-size: 2rem; margin: 0; letter-spacing: -1px;">${isStudent ? 'My Enrolled Subjects' : 'My Academic Load'}</h2>
                </div>
                <p style="color: var(--text-secondary); font-size: 1rem; font-weight: 500;">${isStudent ? 'Track your current semester subjects and resources.' : 'Manage your assigned subjects and teaching schedule.'}</p>
            `;
        }

        const actionGroup = document.createElement('div');
        if (isAdmin && this.params.mode !== 'assigned') {
            const addBtn = document.createElement('button');
            addBtn.className = 'glass-button';
            addBtn.style.background = 'var(--accent-color)';
            addBtn.style.color = 'white';
            addBtn.style.border = 'none';
            addBtn.style.padding = '10px 24px';
            addBtn.style.fontWeight = '700';
            addBtn.textContent = '➕ Add Subject';
            addBtn.onclick = () => { window.location.hash = ROUTES.SUBJECTS_ADD; };
            actionGroup.appendChild(addBtn);
        }

        header.appendChild(titleSection);
        header.appendChild(actionGroup);
        container.appendChild(header);

        // Filter Bar (Only for global view)
        const filterBar = document.createElement('div');
        filterBar.className = 'glass-panel';
        filterBar.style.padding = '1rem';
        filterBar.style.marginBottom = '2rem';
        filterBar.style.display = (this.params.mode === 'assigned' || isStudent) ? 'none' : 'flex';
        filterBar.style.gap = '1rem';
        filterBar.style.alignItems = 'center';
        filterBar.style.background = 'var(--bg-secondary)';

        filterBar.innerHTML = `
            <div style="flex: 1; min-width: 200px;">
                <label style="font-size: 0.7rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; display: block;">Search Catalog</label>
                <input type="text" id="subjectSearch" placeholder="Filter by name or code..." style="width: 100%;">
            </div>
            <div id="facultyFilterContainer" style="width: 240px; ${isAdmin ? '' : 'display:none;'}">
                <label style="font-size: 0.7rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; display: block;">Narrow by Faculty</label>
                <select id="facultyFilter" style="width: 100%;"><option value="">All Faculty</option></select>
            </div>
        `;
        container.appendChild(filterBar);

        const tableCard = document.createElement('div');
        tableCard.id = 'subjects-content';
        container.appendChild(tableCard);

        const loadData = async () => {
            const facultyFilter = filterBar.querySelector('#facultyFilter');
            const subjectSearch = filterBar.querySelector('#subjectSearch');
            this.selectedFaculty = facultyFilter ? facultyFilter.value : '';
            const searchTerm = (subjectSearch ? subjectSearch.value : '').toLowerCase();

            tableCard.innerHTML = `
                <div style="padding: 5rem; text-align: center;">
                    <div class="loader-spinner" style="width: 40px; height: 40px; border: 4px solid var(--accent-glow); border-top-color: var(--accent-color); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1.5rem;"></div>
                    <p style="color: var(--text-secondary); font-weight: 500;">Gathering academic records...</p>
                </div>
            `;

            try {
                const [subjectsData, timetablesData, allStudents] = await Promise.all([
                    ApiService.getSubjects(),
                    ApiService.getTimetables(),
                    isStudent ? ApiService.getStudents() : Promise.resolve([])
                ]);
                this.subjects = subjectsData;
                this.timetables = timetablesData;

                if (isStudent) {
                    const profile = allStudents.find(s => String(s.userId?._id || s.userId || s.userId?.id) === String(user.id || user._id));
                    if (profile) {
                        const year = Math.ceil((profile.semester || 1) / 2);
                        const relevantT = this.timetables.filter(t => t.course === profile.course && String(t.year) === String(year) && String(t.semester) === String(profile.semester));
                        const uniqueSubjects = new Set();
                        relevantT.forEach(t => { if(t.grid) Object.values(t.grid).forEach(slot => { if(slot.subject && !slot.subject.match(/lunch|break/i)) uniqueSubjects.add(slot.subject); }); });
                        this.subjects = this.subjects.filter(s => uniqueSubjects.has(s.name)).map(s => ({ ...s, course: profile.course, year, semester: profile.semester }));
                    }
                } else if (searchTerm) {
                    this.subjects = this.subjects.filter(s => s.name.toLowerCase().includes(searchTerm) || (s.code && s.code.toLowerCase().includes(searchTerm)));
                }

                if (this.selectedFaculty && isAdmin) {
                    this.subjects = this.subjects.filter(s => String(s.faculty?._id || s.faculty) === String(this.selectedFaculty));
                }

                if (this.params.mode === 'assigned' && user.role === 'teacher') {
                    const flattened = [];
                    this.subjects.forEach(s => {
                        const prim = s.faculty?._id || s.faculty;
                        const isPrimary = (prim && user.facultyId && String(prim) === String(user.facultyId)) || (prim && String(prim) === String(user._id));
                        const ctx = [];
                        this.timetables.forEach(t => { if(t.grid && Object.values(t.grid).some(slot => slot.subject === s.name && (slot.teacher === user.name || (user.facultyId && slot.teacher === String(user.facultyId)) || slot.teacher === user._id))) ctx.push({ course: t.course, year: t.year, semester: t.semester, timetableId: t._id }); });
                        if (ctx.length > 0) ctx.forEach(c => flattened.push({ ...s, ...c, _isContextual: true }));
                        else if (isPrimary) flattened.push({ ...s, _isContextual: false });
                    });
                    this.subjects = flattened;
                }

                tableCard.innerHTML = '';
                if (this.params.mode === 'assigned' || isStudent) {
                    if (this.subjects.length === 0) {
                        tableCard.innerHTML = `
                            <div class="glass-panel" style="padding: 5rem 2rem; text-align: center; border: 1px dashed var(--glass-border); border-radius: 16px;">
                                <div style="font-size: 4rem; margin-bottom: 1.5rem; opacity: 0.2;">🗺️</div>
                                <h3 style="opacity: 0.6;">No Subjects Found</h3>
                                <p style="color: var(--text-secondary); max-width: 320px; margin: 0 auto;">You aren't associated with any active academic sessions yet.</p>
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
                        card.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                        
                        const entries = [];
                        const relevantT = item.course ? this.timetables.filter(t => t.course === item.course && t.year == item.year && t.semester == item.semester) : this.timetables;
                        relevantT.forEach(t => { if(t.grid) Object.entries(t.grid).forEach(([key, slot]) => { if(slot.subject === item.name && (isStudent || (slot.teacher === user.name || (user.facultyId && slot.teacher === String(user.facultyId)) || slot.teacher === user._id))) { const [day, time] = key.split('::'); entries.push({ day, time, room: slot.room }); } }); });
                        entries.sort((a,b) => { const days = {'Monday':1,'Tuesday':2,'Wednesday':3,'Thursday':4,'Friday':5}; return (days[a.day] - days[b.day]) || a.time.localeCompare(b.time); });

                        card.innerHTML = `
                            <div style="padding: 1.75rem; background: linear-gradient(135deg, var(--bg-secondary), rgba(99, 102, 241, 0.05)); border-bottom: 1px solid var(--glass-border);">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                                    <span style="background: var(--accent-glow); color: var(--accent-color); padding: 4px 10px; border-radius: 8px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase;">${item.type || 'Lecture'}</span>
                                    <span style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 700; font-family: monospace;">#${item.code || '---'}</span>
                                </div>
                                <h3 style="margin: 0; font-size: 1.35rem; letter-spacing: -0.5px; color: var(--text-primary); line-height: 1.2;">${item.name}</h3>
                                ${item.course ? `<div style="margin-top: 12px; font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); display: flex; align-items: center; gap: 8px;">
                                    <span style="color: var(--accent-color); opacity: 0.8;">📍 ${item.course}</span> • <span>Y${item.year} S${item.semester}</span>
                                </div>` : ''}
                            </div>
                            <div style="padding: 1.25rem; flex: 1; background: var(--bg-primary);">
                                <div style="font-size: 0.7rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">Weekly Schedule</div>
                                <div style="display: flex; flex-direction: column; gap: 6px;">
                                    ${entries.length > 0 ? entries.map(e => `
                                        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; padding: 6px 10px; background: var(--bg-secondary); border-radius: 8px; border: 1px solid var(--glass-border);">
                                            <span style="font-weight: 600; color: var(--text-primary);">${e.day.substring(0,3)} • ${e.time}</span>
                                            <span style="font-weight: 700; color: var(--accent-color); font-size: 0.75rem;">Room ${e.room || 'TBA'}</span>
                                        </div>
                                    `).join('') : `<div style="font-size: 0.8rem; color: var(--text-secondary); opacity: 0.5; font-style: italic; padding: 10px; text-align: center; border: 1px dashed var(--glass-border); border-radius: 8px;">No sessions mapped.</div>`}
                                </div>
                            </div>
                            <div style="padding: 12px; background: var(--bg-secondary); border-top: 1px solid var(--glass-border); text-align: center;">
                                <button class="glass-button" style="width: 100%; font-size: 0.8rem; font-weight: 700; padding: 8px;" onclick="window.location.hash='${ROUTES.ATTENDANCE}?course=${encodeURIComponent(item.course || '')}'">📝 View Attendance Records</button>
                            </div>
                        `;
                        grid.appendChild(card);
                    });
                    tableCard.appendChild(grid);
                } else {
                    const table = new Table({
                        columns: [
                            { key: 'name', label: 'Identity', render: (v, item) => `<div><div style="font-weight: 800; color: var(--text-primary); font-size: 1rem;">${v}</div><div style="font-size: 0.7rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; margin-top: 2px;">Code: ${item.code || '---'}</div></div>` },
                            { key: 'type', label: 'Category', render: (v) => `<span style="padding: 4px 10px; background: var(--bg-secondary); border: 1px solid var(--glass-border); border-radius: 20px; font-size: 0.7rem; font-weight: 800; color: var(--text-primary);">${v || 'Theory'}</span>` },
                            { key: 'description', label: 'Summary', render: (v) => `<div style="font-size: 0.85rem; color: var(--text-secondary); max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${v || 'No brief available.'}</div>` }
                        ],
                        data: this.subjects,
                        onEdit: !isAdmin ? null : (id) => window.location.hash = ROUTES.SUBJECTS_EDIT.replace(':id', id),
                        onDelete: !isAdmin ? null : (id) => {
                            const sub = this.subjects.find(s => s._id === id);
                            Modal.confirm('Purge Subject?', `Remove ${sub.name} from global catalog?`, async () => {
                                try { await ApiService.deleteSubject(id); loadData(); Toast.success('Subject purged.'); } catch (err) { Toast.error(err.message); }
                            });
                        }
                    });
                    tableCard.appendChild(table.render());
                }
            } catch (err) { Toast.error('Load Error'); }
        };

        (async () => {
            try {
                this.faculty = await ApiService.getFaculty();
                const ff = filterBar.querySelector('#facultyFilter');
                if(ff) { ff.innerHTML = '<option value="">All Faculty Members</option>' + this.faculty.map(f => `<option value="${f._id}">${f.name}</option>`).join(''); ff.onchange = () => loadData(); }
                const ss = filterBar.querySelector('#subjectSearch');
                if(ss) ss.oninput = () => loadData();
                loadData();
            } catch (err) { loadData(); }
        })();

        return container;
    }
}
