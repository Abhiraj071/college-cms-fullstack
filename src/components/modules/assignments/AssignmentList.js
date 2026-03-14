import { ApiService } from '../../../services/ApiService.js';
import { auth } from '../../../services/AuthService.js';
import { Toast } from '../../../services/Toast.js';
import { Table } from '../../common/Table.js';
import { Modal } from '../../../services/Modal.js';

export class AssignmentList {
    constructor() {
        this.assignments = [];
        this.subjects = [];
        this.selectedSubject = '';
    }

    render() {
        const user = auth.getUser();
        const container = document.createElement('div');

        if (user.role === 'admin') {
            container.className = 'glass-panel fade-in';
            container.style.padding = '5rem 2rem';
            container.style.textAlign = 'center';
            container.style.marginTop = '2rem';
            container.innerHTML = `
                <div style="font-size: 4rem; margin-bottom: 1.5rem; opacity: 0.3;">🛡️</div>
                <h3 style="font-size: 1.5rem; letter-spacing: -0.5px; margin-bottom: 0.5rem;">Access Restricted</h3>
                <p style="color: var(--text-secondary); max-width: 440px; margin: 0 auto; line-height: 1.6; font-weight: 500;">
                    Administrative staff cannot manage academic assignments directly. This module is scoped exclusively for <strong>Faculty</strong> and <strong>Students</strong>.
                </p>
            `;
            return container;
        }

        container.className = 'fade-in';

        // Header Section
        const header = document.createElement('div');
        header.style.marginBottom = '2.5rem';
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'flex-end';
        header.style.flexWrap = 'wrap';
        header.style.gap = '1.5rem';

        header.innerHTML = `
            <div>
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 0.5rem;">
                    <span style="font-size: 2rem;">📚</span>
                    <h2 style="font-size: 2rem; margin: 0; letter-spacing: -1px;">Assignments</h2>
                </div>
                <p style="color: var(--text-secondary); font-size: 1rem; font-weight: 500;">Manage assessments, track deadlines, and sync evaluations.</p>
            </div>
            ${user.role === 'teacher' ? '<button id="create-assignment" class="glass-button" style="background: var(--accent-color); color: white; border: none; padding: 12px 24px; font-weight: 700;">➕ New Assignment</button>' : ''}
        `;
        container.appendChild(header);

        // Filters Section
        const filterBar = document.createElement('div');
        filterBar.className = 'glass-panel';
        filterBar.style.padding = '1.25rem';
        filterBar.style.marginBottom = '2rem';
        filterBar.style.display = 'flex';
        filterBar.style.gap = '1.5rem';
        filterBar.style.alignItems = 'center';
        filterBar.style.flexWrap = 'wrap';
        filterBar.style.background = 'var(--bg-secondary)';

        filterBar.innerHTML = `
            <div style="flex: 1; min-width: 250px;">
                <label style="font-size: 0.7rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; display: block;">Narrow by Subject</label>
                <select id="subject-filter" style="width: 100%;"></select>
            </div>
            <div style="background: var(--bg-primary); padding: 8px 16px; border-radius: 10px; border: 1px solid var(--glass-border); display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 700;">ACTIVE COUNT:</span>
                <span id="assignment-count" style="font-size: 1rem; font-weight: 800; color: var(--accent-color);">...</span>
            </div>
        `;
        container.appendChild(filterBar);

        const listResults = document.createElement('div');
        listResults.id = 'assignment-list-results';
        container.appendChild(listResults);

        const subjectSelect = filterBar.querySelector('#subject-filter');
        this.loadSubjects(subjectSelect);
        this.loadAssignments(listResults);

        const createBtn = header.querySelector('#create-assignment');
        if (createBtn) createBtn.onclick = () => this.showCreateModal(listResults);

        subjectSelect.onchange = (e) => {
            this.selectedSubject = e.target.value;
            this.loadAssignments(listResults);
        };

        return container;
    }

    async loadSubjects(select) {
        try {
            const user = auth.getUser();
            const allSubjects = await ApiService.getSubjects();
            let subjects = [];

            if (user.role === 'teacher') {
                const facId = user.facultyId;
                subjects = allSubjects.filter(s => String(s.faculty?._id || s.faculty) === String(facId));
                // Add timetable check if needed (omitted here for brevity unless necessary)
            } else if (user.role === 'student') {
                const students = await ApiService.getStudents();
                const profile = students.find(s => String(s.userId?._id || s.userId || s.userId?.id) === String(user.id || user._id));
                if (profile) {
                    subjects = allSubjects.filter(s => s.course === profile.course && String(s.semester) === String(profile.semester));
                }
            } else { subjects = allSubjects; }

            this.subjects = subjects;
            if (select) {
                select.innerHTML = '<option value="">All Academic Subjects</option>' + 
                    subjects.map(s => `<option value="${s._id}">${s.name} (${s.code || 'N/A'})</option>`).join('');
            }
        } catch (err) { console.error(err); }
    }

    async loadAssignments(container) {
        container.innerHTML = `
            <div style="padding: 5rem; text-align: center;">
                <div class="loader-spinner" style="width: 40px; height: 40px; border: 4px solid var(--accent-glow); border-top-color: var(--accent-color); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1.5rem;"></div>
                <p style="color: var(--text-secondary); font-weight: 500;">Syncing assignment repository...</p>
            </div>
        `;
        try {
            const user = auth.getUser();
            const data = await ApiService.getAssignments(null, this.selectedSubject);
            let displayData = data;
            
            if (user.role === 'student' && this.subjects.length > 0) {
                const myIds = this.subjects.map(s => s._id);
                displayData = data.filter(a => myIds.includes(a.subject?._id || a.subject));
            }

            this.assignments = displayData;
            const countLabel = document.querySelector('#assignment-count');
            if (countLabel) countLabel.textContent = this.assignments.length.toString();

            if (this.assignments.length === 0) {
                container.innerHTML = `
                    <div class="glass-panel" style="padding: 5rem 2rem; text-align: center; border: 1px dashed var(--glass-border);">
                        <div style="font-size: 3rem; margin-bottom: 1.5rem; opacity: 0.2;">📂</div>
                        <h3 style="opacity: 0.6;">Repository Empty</h3>
                        <p style="color: var(--text-secondary); max-width: 320px; margin: 0 auto;">No assignments have been published for the selected criteria.</p>
                    </div>`;
                return;
            }

            const tableCard = document.createElement('div');
            tableCard.className = 'glass-panel';
            tableCard.style.padding = '0';
            tableCard.style.overflow = 'hidden';

            const columns = [
                { key: 'title', label: 'Title', render: (v) => `<div style="font-weight: 800; color: var(--text-primary);">${v}</div>` },
                { key: 'subject', label: 'Subject', render: (v) => v ? `<div style="font-weight: 600;">${v.name}</div><div style="font-size: 0.7rem; color: var(--text-secondary); font-weight: 700; text-transform: uppercase;">CODE: ${v.code || '---'}</div>` : '---' },
                { key: 'deadline', label: 'Due Date', render: (v) => {
                    const d = new Date(v);
                    const isLate = new Date() > d;
                    return `<div style="font-weight: 700; color: ${isLate ? 'var(--danger)' : 'var(--text-secondary)'};">${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>`;
                }},
                { key: 'fileUrl', label: 'Reference', render: (v) => v ? `<a href="${v}" target="_blank" style="color: var(--accent-color); font-weight: 700; text-decoration: none; font-size: 0.85rem;">📑 View File</a>` : '<span style="opacity:0.3;">---</span>' }
            ];

            if (user.role === 'student') {
                columns.push({
                    key: 'submissions',
                    label: 'My Status',
                    render: (v, item) => {
                        const mySub = v.find(s => s.student === user.username || s.student === user.name);
                        if (!mySub) return `<span style="padding: 4px 10px; background: rgba(0,0,0,0.05); border-radius: 20px; font-size: 0.7rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase;">Pending</span>`;
                        if (mySub.grade) return `<span style="padding: 4px 10px; background: var(--success); color: white; border-radius: 20px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase;">Graded: ${mySub.grade}</span>`;
                        return `<span style="padding: 4px 10px; background: var(--accent-glow); color: var(--accent-color); border-radius: 20px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase;">Submitted</span>`;
                    }
                });
                columns.push({
                    key: 'actions',
                    label: 'Action',
                    render: (v, item) => {
                        const mySub = item.submissions.find(s => s.student === user.username || s.student === user.name);
                        const isLate = new Date() > new Date(item.deadline);
                        if (!mySub) {
                            if (isLate) return `<button disabled style="opacity:0.3; font-size:0.75rem;">Closed</button>`;
                            return `<button class="glass-button submit-btn" data-id="${item._id}" style="padding: 6px 14px; font-size: 0.75rem; font-weight: 700;">Submit Work</button>`;
                        }
                        return `---`;
                    }
                });
            } else {
                columns.push({
                    key: 'submissions',
                    label: 'Reports',
                    render: (v) => `
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-weight: 800; color: var(--text-primary); font-size: 0.9rem;">${v.length}</span>
                            <span style="font-size: 0.7rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase;">entries</span>
                        </div>
                    `
                });
            }

            const table = new Table({
                columns,
                data: this.assignments,
                actions: user.role !== 'student',
                onEdit: (id) => this.showSubmissions(id),
                onDelete: (id) => this.deleteAssignment(id, container)
            });

            if (user.role === 'student') {
                tableCard.addEventListener('click', (e) => {
                    const target = e.target.closest('.submit-btn');
                    if (target) {
                        const a = this.assignments.find(x => x._id === target.dataset.id);
                        if (a) this.showStudentSubmitModal(a);
                    }
                });
            }

            container.innerHTML = '';
            tableCard.appendChild(table.render());
            container.appendChild(tableCard);
        } catch (err) { Toast.error('Load Error'); }
    }

    showCreateModal(refreshContainer) {
        const modalContent = document.createElement('div');
        modalContent.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 1.25rem;">
                <div>
                    <label style="display: block; margin-bottom: 6px; font-size: 0.75rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase;">Assignment Title</label>
                    <input type="text" id="new-title" style="width: 100%;" placeholder="e.g. Unit 1 Quiz">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 6px; font-size: 0.75rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase;">Target Subject</label>
                    <select id="new-subj" style="width: 100%;">
                        ${this.subjects.map(s => `<option value="${JSON.stringify(s)}">${s.name} (${s.course})</option>`).join('')}
                    </select>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <label style="display: block; margin-bottom: 6px; font-size: 0.75rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase;">Deadline</label>
                        <input type="date" id="new-deadline" style="width: 100%;" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 6px; font-size: 0.75rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase;">Reference File</label>
                        <input type="file" id="new-file" style="width: 100%;">
                    </div>
                </div>
                <div>
                    <label style="display: block; margin-bottom: 6px; font-size: 0.75rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase;">Brief Instructions</label>
                    <textarea id="new-desc" style="width: 100%; height: 80px;" placeholder="Instructions for students..."></textarea>
                </div>
            </div>
        `;

        Modal.show({
            title: 'Publish Assignment',
            content: modalContent,
            confirmText: 'Publish Now',
            onConfirm: async () => {
                const title = modalContent.querySelector('#new-title').value;
                const subjStr = modalContent.querySelector('#new-subj').value;
                if (!title || !subjStr) return Toast.error('Missing fields');
                const subj = JSON.parse(subjStr);
                const fd = new FormData();
                fd.append('title', title);
                fd.append('subject', subj._id);
                fd.append('deadline', modalContent.querySelector('#new-deadline').value);
                fd.append('course', subj.course);
                fd.append('year', subj.year);
                fd.append('semester', subj.semester);
                fd.append('description', modalContent.querySelector('#new-desc').value);
                const file = modalContent.querySelector('#new-file').files[0];
                if (file) fd.append('file', file);

                try { await ApiService.createAssignment(fd); Toast.success('Published!'); this.loadAssignments(refreshContainer); return true; }
                catch (err) { Toast.error(err.message); return false; }
            }
        });
    }

    showStudentSubmitModal(assignment) {
        const modalContent = document.createElement('div');
        modalContent.innerHTML = `
            <div style="padding: 0.5rem 0;">
                <label style="display: block; margin-bottom: 8px; font-size: 0.75rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase;">Upload Submission (PDF/DOC/ZIP)</label>
                <input type="file" id="sub-file" style="width: 100%;">
            </div>
        `;
        Modal.show({
            title: `Submit: ${assignment.title}`,
            content: modalContent,
            confirmText: 'Submit Work',
            onConfirm: async () => {
                const file = modalContent.querySelector('#sub-file').files[0];
                if (!file) return Toast.error('File required');
                const fd = new FormData();
                fd.append('file', file);
                try { await ApiService.submitAssignment(assignment._id, fd); Toast.success('Work Submitted!'); this.loadAssignments(document.querySelector('#assignment-list-results')); return true; }
                catch (err) { Toast.error(err.message); return false; }
            }
        });
    }

    async showSubmissions(id) {
        const aId = id._id || id;
        const a = this.assignments.find(x => x._id === aId);
        if (!a) return;
        const container = document.createElement('div');
        if (a.submissions.length === 0) {
            container.innerHTML = `<p style="text-align:center; padding: 2rem; color: var(--text-secondary);">No submissions received yet.</p>`;
        } else {
            const list = document.createElement('div');
            list.style.display = 'flex';
            list.style.flexDirection = 'column';
            list.style.gap = '1rem';
            a.submissions.forEach((sub) => {
                const item = document.createElement('div');
                item.className = 'glass-panel';
                item.style.padding = '1.25rem';
                item.style.background = 'var(--bg-secondary)';
                item.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                        <div>
                            <div style="font-weight: 800; color: var(--text-primary);">${sub.student}</div>
                            <div style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 600;">Submitted: ${new Date(sub.submittedAt).toDateString()}</div>
                        </div>
                        ${sub.fileUrl ? `<a href="${sub.fileUrl}" target="_blank" style="padding: 6px 12px; background: var(--bg-primary); border-radius: 8px; font-size: 0.7rem; font-weight: 800; color: var(--accent-color); border: 1px solid var(--glass-border); text-decoration: none;">📥 DOWNLOAD FILE</a>` : ''}
                    </div>
                    <div style="display: flex; gap: 0.75rem; align-items: flex-end;">
                        <div style="flex: 1;">
                            <label style="font-size: 0.65rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase;">Feedback / Remarks</label>
                            <textarea class="fb-in" style="width: 100%; height: 50px; font-size: 0.85rem;" placeholder="Excellent work...">${sub.feedback || ''}</textarea>
                        </div>
                        <div style="width: 100px;">
                            <label style="font-size: 0.65rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase;">Grade</label>
                            <input type="text" class="gr-in" style="width: 100%; text-align: center; font-weight: 800;" value="${sub.grade || ''}" placeholder="A">
                        </div>
                        <button class="grade-btn glass-button" style="background: var(--accent-color); color: white; border: none; padding: 10px; height: 38px;">✔️</button>
                    </div>
                `;
                item.querySelector('.grade-btn').onclick = async (e) => {
                    const grade = item.querySelector('.gr-in').value;
                    const feedback = item.querySelector('.fb-in').value;
                    const btn = e.currentTarget;
                    btn.disabled = true;
                    try { await ApiService.gradeSubmission(a._id, sub._id, { grade, feedback }); Toast.success('Saved'); }
                    catch (err) { Toast.error(err.message); }
                    finally { btn.disabled = false; }
                };
                list.appendChild(item);
            });
            container.appendChild(list);
        }
        Modal.show({ title: `Entries: ${a.title}`, content: container, confirmText: 'Close', showCancel: false });
    }

    deleteAssignment(id, refreshContainer) {
        Modal.confirm('Purge Assignment?', 'This cannot be undone.', async () => {
            try { await ApiService.deleteAssignment(id._id || id); Toast.success('Purged'); this.loadAssignments(refreshContainer); return true; }
            catch (err) { Toast.error(err.message); return false; }
        });
    }
}
