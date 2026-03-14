import { ApiService } from '../../../services/ApiService.js';
import { Table } from '../../common/Table.js';
import { Toast } from '../../../services/Toast.js';
import { Modal } from '../../../services/Modal.js';
import { ROUTES } from '../../../services/Constants.js';
import { auth } from '../../../services/AuthService.js';

export class ExamList {
    constructor() {
        this.exams = [];
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
                <span style="font-size: 2rem;">📝</span>
                <h2 style="font-size: 2rem; margin: 0; letter-spacing: -1px;">Examinations</h2>
            </div>
            <p style="color: var(--text-secondary); font-size: 1rem; font-weight: 500;">Monitor assessment schedules, eligibility, and academic grading.</p>
        `;

        const actionGroup = document.createElement('div');
        if (!isStudent) {
            const addBtn = document.createElement('button');
            addBtn.className = 'glass-button';
            addBtn.style.background = 'var(--accent-color)';
            addBtn.style.color = 'white';
            addBtn.style.border = 'none';
            addBtn.style.padding = '10px 24px';
            addBtn.style.fontWeight = '700';
            addBtn.textContent = '➕ Schedule New';
            addBtn.onclick = () => { window.location.hash = ROUTES.EXAMS_ADD; };
            actionGroup.appendChild(addBtn);
        }

        header.appendChild(titleSection);
        header.appendChild(actionGroup);
        container.appendChild(header);

        const tableCard = document.createElement('div');
        tableCard.className = 'glass-panel';
        tableCard.style.padding = '0';
        tableCard.style.overflow = 'hidden';
        tableCard.style.minHeight = '300px';

        const loadData = async () => {
            tableCard.innerHTML = `
                <div style="padding: 5rem; text-align: center;">
                    <div class="loader-spinner" style="width: 40px; height: 40px; border: 4px solid var(--accent-glow); border-top-color: var(--accent-color); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1.5rem;"></div>
                    <p style="color: var(--text-secondary); font-weight: 500;">Retrieving evaluation cycles...</p>
                </div>
            `;
            try {
                const [allExams, allTimetables] = await Promise.all([
                    ApiService.getExams(),
                    ApiService.getTimetables()
                ]);

                this.exams = allExams;
                if (user.role === 'teacher') {
                    const myAssignments = new Set();
                    allTimetables.forEach(t => {
                        if (t.grid) {
                            Object.values(t.grid).forEach(slot => {
                                if (slot.teacher === user.name || (user.facultyId && slot.teacher === String(user.facultyId)) || slot.teacher === user._id) {
                                    myAssignments.add(`${t.course}::${slot.subject}`);
                                }
                            });
                        }
                    });
                    this.exams = allExams.filter(e => myAssignments.has(`${e.course}::${e.subject}`));
                }

                tableCard.innerHTML = '';
                if (this.exams.length === 0) {
                    tableCard.innerHTML = `
                        <div style="text-align: center; padding: 5rem 2rem; border: 1px dashed var(--glass-border); border-radius: 16px;">
                            <div style="font-size: 3rem; margin-bottom: 1.5rem; opacity: 0.2;">📄</div>
                            <h3 style="opacity: 0.6;">No Assessments Found</h3>
                            <p style="color: var(--text-secondary); max-width: 320px; margin: 0 auto;">There are no examination cycles scheduled for your current parameters.</p>
                        </div>
                    `;
                    return;
                }

                const tableData = this.exams.map(e => ({
                    ...e,
                    statusText: new Date(e.date) < new Date() ? 'Archived' : 'Active'
                }));

                const table = new Table({
                    columns: [
                        { key: 'title', label: 'Evaluation Title', render: (v) => `<div style="font-weight: 800; color: var(--text-primary);">${v}</div>` },
                        { key: 'subject', label: 'Subject', render: (v, item) => `<div><div style="font-weight: 700;">${v}</div><div style="font-size: 0.7rem; color: var(--text-secondary); font-weight: 800; text-transform: uppercase;">Prog: ${item.course}</div></div>` },
                        { key: 'date', label: 'Calendar', render: (v) => `<div style="font-weight: 700;">${new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>` },
                        { key: 'totalMarks', label: 'Max', render: (v) => `<code style="font-weight: 800; color: var(--accent-color);">${v}pts</code>` },
                        { key: 'statusText', label: 'Status', render: (v) => {
                            const active = v === 'Active';
                            return `<span style="padding: 4px 10px; background: ${active ? 'var(--accent-glow)' : 'rgba(0,0,0,0.05)'}; border-radius: 20px; font-size: 0.7rem; font-weight: 800; color: ${active ? 'var(--accent-color)' : 'var(--text-secondary)'}; text-transform: uppercase;">${v}</span>`;
                        }},
                        { key: '_id', label: 'Actions', render: (v, item) => {
                            if (isStudent) return '---';
                            return `<button class="glass-button marks-entry-btn" data-id="${v}" style="padding: 6px 12px; font-size: 0.7rem; font-weight: 700;">📥 Assign Grades</button>`;
                        }}
                    ],
                    data: tableData,
                    onEdit: isStudent ? null : (id) => window.location.hash = ROUTES.EXAMS_EDIT.replace(':id', id),
                    onDelete: !isAdmin ? null : (id) => {
                        const e = this.exams.find(x => x._id === id);
                        Modal.confirm('Purge Exam Schedule?', `Remove the assessment cycle for ${e?.subject}? This action cleans all associated results.`, async () => {
                            try { await ApiService.deleteExam(id); loadData(); Toast.success('Purged.'); }
                            catch (err) { Toast.error(err.message); }
                        });
                    }
                });

                const tableNode = table.render();
                tableNode.onclick = (e) => {
                    const btn = e.target.closest('.marks-entry-btn');
                    if (btn) {
                        const id = btn.dataset.id;
                        window.location.hash = ROUTES.EXAMS_MARKS.replace(':id', id) + `?id=${id}`;
                    }
                };
                tableCard.appendChild(tableNode);

                if (!isStudent) {
                    const tip = document.createElement('div');
                    tip.style.padding = '1.25rem 2rem';
                    tip.style.background = 'var(--bg-secondary)';
                    tip.style.borderTop = '1px solid var(--glass-border)';
                    tip.innerHTML = `<p style="margin:0; font-size:0.8rem; color:var(--text-secondary); font-weight:600;">💡 Tip: Use the <strong>Assign Grades</strong> button to sync student performances or the pencil icon to modify schedule details.</p>`;
                    tableCard.appendChild(tip);
                }
            } catch (err) { Toast.error('Load Error'); }
        };

        loadData();
        container.appendChild(tableCard);
        return container;
    }
}
