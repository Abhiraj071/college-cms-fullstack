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

        // Header Section
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.marginBottom = '2rem';

        const title = document.createElement('h2');
        title.textContent = 'Examination Schedules';
        title.style.margin = '0';

        const addBtn = document.createElement('button');
        addBtn.className = 'glass-button';
        addBtn.textContent = '+ Schedule Exam';
        addBtn.onclick = () => { window.location.hash = 'exams/schedule'; };

        if (user.role === 'student') {
            addBtn.style.display = 'none';
        }

        header.appendChild(title);
        header.appendChild(addBtn);
        container.appendChild(header);

        // Table container
        const tableCard = document.createElement('div');
        tableCard.className = 'glass-panel';
        tableCard.style.padding = '1rem';

        const loadData = async () => {
            tableCard.innerHTML = '<div style="padding: 2rem; text-align: center;">Loading examination schedules...</div>';
            try {
                const [allExams, allTimetables] = await Promise.all([
                    ApiService.getExams(),
                    ApiService.getTimetables()
                ]);

                this.exams = allExams;
                if (user.role === 'teacher') {
                    // Find my assigned subjects and courses from global timetables
                    const myAssignments = new Set(); // Stores "Course::Subject"
                    allTimetables.forEach(t => {
                        if (t.grid) {
                            Object.values(t.grid).forEach(slot => {
                                const isMine = slot.teacher === user.name ||
                                    (user.facultyId && slot.teacher === String(user.facultyId)) ||
                                    slot.teacher === user._id;
                                if (isMine) myAssignments.add(`${t.course}::${slot.subject}`);
                            });
                        }
                    });
                    this.exams = allExams.filter(e => myAssignments.has(`${e.course}::${e.subject}`));
                }

                tableCard.innerHTML = '';

                const tableData = this.exams.map(e => ({
                    ...e,
                    status: new Date(e.date) < new Date() ? 'Completed' : 'Upcoming'
                }));

                const table = new Table({
                    columns: [
                        { key: 'title', label: 'Exam Title', render: (val) => `<strong>${val}</strong>` },
                        { key: 'course', label: 'Course' },
                        { key: 'subject', label: 'Subject' },
                        { key: 'date', label: 'Date', render: (val) => new Date(val).toLocaleDateString() },
                        { key: 'totalMarks', label: 'Max Marks' },
                        {
                            key: 'status', label: 'Status', render: (val) => {
                                const color = val === 'Completed' ? '#94a3b8' : '#3b82f6';
                                const bg = val === 'Completed' ? 'rgba(148, 163, 184, 0.1)' : 'rgba(59, 130, 246, 0.1)';
                                return `<span style="padding: 4px 12px; background: ${bg}; color: ${color}; border-radius: 12px; font-size: 0.8rem;">${val}</span>`;
                            }
                        },
                        {
                            key: '_id', label: 'Grading', render: (val, item) => {
                                if (user.role === 'student') return '-';
                                return `<button class="glass-button marks-entry-btn" data-id="${val}" style="padding: 4px 10px; font-size: 0.75rem;">Enter Marks</button>`;
                            }
                        }
                    ],
                    data: tableData,
                    onEdit: (user.role === 'student') ? null : (id) => {
                        window.location.hash = ROUTES.EXAMS_EDIT.replace(':id', id);
                    },
                    onDelete: (user.role !== 'admin') ? null : (id) => {
                        const exam = this.exams.find(e => e._id === id);
                        Modal.confirm('Delete Exam Schedule?', `Are you sure you want to remove the exam for ${exam?.subject || 'this subject'}? All recorded grades will be lost.`, async () => {
                            try {
                                await ApiService.deleteExam(id);
                                loadData();
                                Toast.success('Exam schedule removed.');
                            } catch (err) {
                                Toast.error(err.message);
                            }
                        });
                    }
                });

                const tableNode = table.render();
                tableNode.addEventListener('click', (e) => {
                    const target = e.target;
                    if (!(target instanceof HTMLElement)) return;

                    const marksBtn = target.closest('.marks-entry-btn');
                    if (marksBtn instanceof HTMLElement) {
                        const id = marksBtn.dataset.id;
                        if (id) {
                            window.location.hash = ROUTES.EXAMS_MARKS.replace(':id', id) + `?id=${id}`;
                        }
                    }
                });

                tableCard.appendChild(tableNode);

                if (user.role !== 'student') {
                    const note = document.createElement('p');
                    note.style.color = 'var(--text-secondary)';
                    note.style.fontSize = '0.9rem';
                    note.style.marginTop = '1rem';
                    note.innerHTML = '💡 Click the ✏️ Edit icon to <strong>Update Schedule</strong> or "Enter Marks" for results.';
                    tableCard.appendChild(note);
                }
            } catch (err) {
                Toast.error('Failed to load exams: ' + err.message);
                tableCard.innerHTML = `<p style="padding: 2rem; color: red; text-align: center;">Error: ${err.message}</p>`;
            }
        };

        loadData();
        container.appendChild(tableCard);

        return container;
    }
}
