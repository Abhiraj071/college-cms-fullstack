import { ApiService } from '../../../services/ApiService.js';
import { auth } from '../../../services/AuthService.js';
import { Toast } from '../../../services/Toast.js';
import { Table } from '../../common/Table.js';
import { Modal } from '../../../services/Modal.js';
import { ROUTES } from '../../../services/Constants.js';

export class ExamList {
    constructor() {
        this.exams = [];
    }

    render() {
        const user = auth.getUser();
        const container = document.createElement('div');
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
                    <span style="font-size: 2rem;">📝</span>
                    <h2 style="font-size: 2rem; margin: 0; letter-spacing: -1px;">Exams & Results</h2>
                </div>
                <p style="color: var(--text-secondary); font-size: 1rem; font-weight: 500;">Manage examinations, view schedules, and publish results.</p>
            </div>
            ${user.role === 'admin' ? '<button id="create-exam" class="glass-button" style="background: var(--accent-color); color: white; border: none; padding: 12px 24px; font-weight: 700;">➕ Schedule Exam</button>' : ''}
        `;
        container.appendChild(header);

        const listResults = document.createElement('div');
        container.appendChild(listResults);

        this.loadExams(listResults);

        const createBtn = header.querySelector('#create-exam');
        if (createBtn) createBtn.onclick = () => this.showCreateModal(listResults);

        return container;
    }

    async loadExams(container) {
        container.innerHTML = `
            <div style="padding: 5rem; text-align: center;">
                <div class="loader-spinner" style="width: 40px; height: 40px; border: 4px solid var(--accent-glow); border-top-color: var(--accent-color); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1.5rem;"></div>
                <p style="color: var(--text-secondary); font-weight: 500;">Loading examinations...</p>
            </div>
        `;
        try {
            const user = auth.getUser();
            const data = await ApiService.getExams();
            let displayData = data;
            if (user.role === 'student' && user.course) {
                displayData = data.filter(exam => exam.course === user.course);
            }

            this.exams = displayData;

            if (this.exams.length === 0) {
                container.innerHTML = `
                    <div class="glass-panel" style="padding: 5rem 2rem; text-align: center; border: 1px dashed var(--glass-border);">
                        <div style="font-size: 3rem; margin-bottom: 1.5rem; opacity: 0.2;">📅</div>
                        <h3 style="opacity: 0.6;">No Exams Found</h3>
                        <p style="color: var(--text-secondary); max-width: 320px; margin: 0 auto;">There are no exams scheduled currently.</p>
                    </div>`;
                return;
            }

            const tableCard = document.createElement('div');
            tableCard.className = 'glass-panel';
            tableCard.style.padding = '0';
            tableCard.style.overflow = 'hidden';

            const columns = [
                { key: 'title', label: 'Exam Title', render: (v) => `<div style="font-weight: 800; color: var(--text-primary);">${v}</div>` },
                { key: 'type', label: 'Type', render: (v) => `<div style="font-weight: 600; color: var(--accent-color);">${v}</div>` },
                { key: 'course', label: 'Course/Sem', render: (v, item) => `<div style="font-size: 0.85rem; color: var(--text-secondary);">${item.course} ${item.semester ? '- Sem ' + item.semester : '(Full Course)'}</div>` },
                { key: 'date', label: 'Date', render: (v) => `<div style="font-weight: 700;">${new Date(v).toLocaleDateString()}</div>` },
                { key: 'status', label: 'Status', render: (v) => `<span style="padding: 4px 10px; background: rgba(0,0,0,0.05); border-radius: 20px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase;">${v}</span>` },
                { key: 'actions', label: 'Actions', render: (v, item) => `<button class="glass-button view-schedule-btn" data-id="${item._id}" style="padding: 6px 14px; font-size: 0.75rem; font-weight: 700; margin-right: 5px;">📅 Schedule</button> <button class="glass-button view-results-btn" data-id="${item._id}" style="padding: 6px 14px; font-size: 0.75rem; font-weight: 700;">📊 Results</button>` }
            ];

            const table = new Table({
                columns,
                data: this.exams,
                actions: user.role === 'admin',
                onDelete: user.role === 'admin' ? (id) => this.deleteExam(id, container) : null
            });

            container.innerHTML = '';
            tableCard.appendChild(table.render());
            
            tableCard.addEventListener('click', (e) => {
                const resultsBtn = e.target.closest('.view-results-btn');
                const scheduleBtn = e.target.closest('.view-schedule-btn');
                if (resultsBtn) {
                    window.location.hash = ROUTES.EXAMS_RESULTS.replace(':id', resultsBtn.dataset.id);
                } else if (scheduleBtn) {
                    this.openScheduleModal(scheduleBtn.dataset.id, container);
                }
            });

            container.appendChild(tableCard);
        } catch (err) { Toast.error('Load Error'); }
    }

    async showCreateModal(refreshContainer) {
        let courseOptions = '<option value="">Select Course...</option>';
        let courses = [];
        try {
            courses = await ApiService.getCourses();
            courseOptions += courses.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
        } catch(err) {
            console.error('Failed to load courses', err);
        }

        const modalContent = document.createElement('div');
        modalContent.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 1.25rem;">
                <div>
                    <label style="display: block; margin-bottom: 6px; font-size: 0.75rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase;">Exam Title</label>
                    <input type="text" id="exam-title" style="width: 100%;" placeholder="e.g. Final Semester 2026">
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <label style="display: block; margin-bottom: 6px; font-size: 0.75rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase;">Course</label>
                        <select id="exam-course" style="width: 100%;">
                            ${courseOptions}
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 6px; font-size: 0.75rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase;">Semester (Optional)</label>
                        <select id="exam-sem" style="width: 100%;" disabled>
                            <option value="">-- Select Course First --</option>
                        </select>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <label style="display: block; margin-bottom: 6px; font-size: 0.75rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase;">Date</label>
                        <input type="date" id="exam-date" style="width: 100%;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 6px; font-size: 0.75rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase;">Type</label>
                        <select id="exam-type" style="width: 100%;">
                            <option value="Regular">Regular</option>
                            <option value="Supplementary">Supplementary</option>
                        </select>
                    </div>
                </div>
            </div>
        `;

        const courseSelect = modalContent.querySelector('#exam-course');
        const semSelect = modalContent.querySelector('#exam-sem');
        
        courseSelect.addEventListener('change', (e) => {
            const courseName = e.target.value;
            const course = courses.find(c => c.name === courseName);
            semSelect.innerHTML = '<option value="">Full Course (All Semesters)</option>';
            if (course) {
                semSelect.disabled = false;
                const totalSems = (course.duration || 4) * 2;
                for (let i = 1; i <= totalSems; i++) {
                    semSelect.innerHTML += `<option value="${i}">Semester ${i}</option>`;
                }
            } else {
                semSelect.innerHTML = '<option value="">-- Select Course First --</option>';
                semSelect.disabled = true;
            }
        });

        Modal.show({
            title: 'Schedule Exam',
            content: modalContent,
            confirmText: 'Create Exam',
            onConfirm: async () => {
                const title = modalContent.querySelector('#exam-title').value;
                const course = modalContent.querySelector('#exam-course').value;
                const semester = modalContent.querySelector('#exam-sem').value;
                const date = modalContent.querySelector('#exam-date').value;
                const type = modalContent.querySelector('#exam-type').value;

                if (!title || !course || !date) {
                    Toast.error('Please fill all fields');
                    return false;
                }

                try { 
                    const payload = { title, course, date, type };
                    if (semester) payload.semester = semester;
                    await ApiService.addExam(payload); 
                    Toast.success('Exam Scheduled!'); 
                    this.loadExams(refreshContainer); 
                    return true; 
                }
                catch (err) { Toast.error(err.message); return false; }
            }
        });
    }

    async openScheduleModal(examId, refreshContainer) {
        let exam = this.exams.find(e => e._id === examId);
        if (!exam) return;

        const user = auth.getUser();
        let systemSubjects = [];
        try {
            const allSubjects = await ApiService.getSubjects();
            // Filter gently just in case casing issues exist, but if none match, fallback to all.
            const exactMatches = allSubjects.filter(s => s.course && exam.course && s.course.toLowerCase() === exam.course.toLowerCase());
            systemSubjects = exactMatches.length > 0 ? exactMatches : allSubjects;
            
            // Sort by semester (e.g., 1st year/Sem 1, Sem 2...)
            systemSubjects.sort((a, b) => (a.semester || 0) - (b.semester || 0));
        } catch(err) {
            console.error('Failed to load system subjects', err);
        }

        let subjectOptions = '<option value="">-- Select Subject from System --</option>';
        subjectOptions += systemSubjects.map(s => `<option value="${s._id}" data-name="${s.name}" data-code="${s.code}">Sem ${s.semester || '?'} - ${s.name} (${s.code})</option>`).join('');
        
        let html = `
            <div>
                <p style="margin-bottom: 1rem; color: var(--text-secondary);">Manage Exam Timetable for <b style="color:white;">${exam.title}</b> (${exam.course} - ${exam.semester ? 'Sem ' + exam.semester : 'Full Course'})</p>
                <div id="timetable-container" style="max-height: 400px; overflow-y: auto;">
                    <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem;">
                        <thead>
                            <tr style="border-bottom: 1px solid var(--glass-border);">
                                <th style="padding: 10px;">Date</th>
                                <th style="padding: 10px;">Timing</th>
                                <th style="padding: 10px;">Sub. Code</th>
                                <th style="padding: 10px;">Subject Name</th>
                                ${user.role === 'admin' ? '<th style="padding: 10px;"></th>' : ''}
                            </tr>
                        </thead>
                        <tbody id="timetable-body">
                            ${(exam.timetable || []).map((t, index) => `
                                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                                    <td style="padding: 10px;">${new Date(t.date).toISOString().split('T')[0]}</td>
                                    <td style="padding: 10px;">${t.timing}</td>
                                    <td style="padding: 10px;">${t.code || '-'}</td>
                                    <td style="padding: 10px; font-weight: bold;">${t.subject}</td>
                                    ${user.role === 'admin' ? `<td style="padding: 10px;"><button type="button" class="del-tt-row" data-idx="${index}" style="background:none;border:none;color:#ef4444;cursor:pointer;">✖</button></td>` : ''}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    ${(!exam.timetable || exam.timetable.length === 0) ? '<p style="text-align: center; padding: 2rem; color: rgba(255,255,255,0.4);">No subjects scheduled yet.</p>' : ''}
                </div>
                ${user.role === 'admin' ? `
                <div style="margin-top: 1rem; padding: 1rem; background: rgba(0,0,0,0.1); border-radius: 8px;">
                    <h4 style="margin-bottom: 10px; font-size: 0.85rem;">Add Timetable Slot</h4>
                    <form id="add-tt-form" style="display: flex; flex-wrap: wrap; gap: 10px; align-items: end;">
                        <div style="flex: 1; min-width: 120px;">
                            <label style="font-size: 0.6rem; text-transform: uppercase; color: var(--text-secondary);">Date</label>
                            <input type="date" id="tt-date" style="width: 100%; font-size: 0.8rem; padding: 8px;" required>
                        </div>
                        <div style="flex: 1; min-width: 120px;">
                            <label style="font-size: 0.6rem; text-transform: uppercase; color: var(--text-secondary);">Timing</label>
                            <input type="text" id="tt-timing" placeholder="e.g. 9:30 To 12:30" style="width: 100%; font-size: 0.8rem; padding: 8px;" required>
                        </div>
                        <div style="flex: 2; min-width: 200px;">
                            <label style="font-size: 0.6rem; text-transform: uppercase; color: var(--text-secondary);">System Subject (Auto-fill)</label>
                            <select id="tt-subject-select" style="width: 100%; font-size: 0.8rem; padding: 8px;">
                                ${subjectOptions}
                            </select>
                        </div>
                        <div style="flex: 1; min-width: 80px;">
                            <label style="font-size: 0.6rem; text-transform: uppercase; color: var(--text-secondary);">Code</label>
                            <input type="text" id="tt-code" placeholder="C5.1" style="width: 100%; font-size: 0.8rem; padding: 8px;">
                        </div>
                        <div style="flex: 2; min-width: 150px;">
                            <label style="font-size: 0.6rem; text-transform: uppercase; color: var(--text-secondary);">Subject Title</label>
                            <input type="text" id="tt-subject" placeholder="Manual Entry" style="width: 100%; font-size: 0.8rem; padding: 8px;" required>
                        </div>
                        <div style="flex: 0 0 auto;">
                            <button type="submit" class="glass-button" style="padding: 8.5px 16px; font-size: 0.8rem;">Add</button>
                        </div>
                    </form>
                </div>
                ` : ''}
            </div>
        `;

        const modalDiv = document.createElement('div');
        modalDiv.innerHTML = html;

        if (user.role === 'admin') {
            const form = modalDiv.querySelector('#add-tt-form');
            const selectElement = form.querySelector('#tt-subject-select');
            const codeInput = form.querySelector('#tt-code');
            const nameInput = form.querySelector('#tt-subject');

            selectElement.addEventListener('change', () => {
                const selectedOption = selectElement.options[selectElement.selectedIndex];
                if (selectElement.value) {
                    codeInput.value = selectedOption.dataset.code || '';
                    nameInput.value = selectedOption.dataset.name || '';
                }
            });

            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const newRow = {
                    date: form.querySelector('#tt-date').value,
                    timing: form.querySelector('#tt-timing').value,
                    code: codeInput.value,
                    subject: nameInput.value
                };
                try {
                    const currentTimetable = exam.timetable || [];
                    const updatedExam = await ApiService.updateExam(examId, { timetable: [...currentTimetable, newRow] });
                    Toast.success('Timetable row added!');
                    exam.timetable = updatedExam.timetable; // Update local memory
                    Modal.close();
                    this.openScheduleModal(examId, refreshContainer);
                } catch(err) {
                    Toast.error('Failed to add timetable row');
                }
            });

            modalDiv.addEventListener('click', async (e) => {
                if (e.target.classList.contains('del-tt-row')) {
                    const idx = e.target.dataset.idx;
                    const newTimetable = [...(exam.timetable || [])];
                    newTimetable.splice(idx, 1);
                    try {
                        const updatedExam = await ApiService.updateExam(examId, { timetable: newTimetable });
                        Toast.success('Row deleted');
                        exam.timetable = updatedExam.timetable;
                        Modal.close();
                        this.openScheduleModal(examId, refreshContainer);
                    } catch(err) {
                        Toast.error('Failed to delete row');
                    }
                }
            });
        }

        Modal.show({
            title: 'Exam Timetable',
            content: modalDiv,
            showCancel: false,
            confirmText: 'Done',
            onConfirm: () => true
        });
    }

    deleteExam(id, refreshContainer) {
        Modal.confirm('Delete Exam?', 'All associated results will be erased.', async () => {
            try { 
                await ApiService.deleteExam(id._id || id); 
                Toast.success('Exam Deleted'); 
                this.loadExams(refreshContainer); 
                return true; 
            }
            catch (err) { Toast.error(err.message); return false; }
        });
    }
}
