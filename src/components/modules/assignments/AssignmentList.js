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
            container.className = 'glass-panel';
            container.style.padding = '3rem';
            container.style.textAlign = 'center';
            container.style.marginTop = '2rem';
            container.innerHTML = `
                <div style="display: flex; flex-direction: column; alignItems: center; gap: 1rem;">
                    <div style="background: rgba(255, 99, 71, 0.1); padding: 1rem; borderRadius: 50%; color: var(--danger);">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                    </div>
                    <div>
                        <h3 style="font-size: 1.25rem; margin-bottom: 0.5rem;">Access Restricted</h3>
                        <p style="color: var(--text-secondary); max-width: 400px; margin: 0 auto; line-height: 1.5;">
                            Administrative staff do not have access to the Assignment Section.<br>
                            This module is exclusively for <strong>Faculty</strong> and <strong>Students</strong>.
                        </p>
                    </div>
                </div>
            `;
            return container;
        }

        container.className = 'fade-in';

        // Header
        const header = document.createElement('div');
        header.style.marginBottom = 'var(--space-md)';
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.flexWrap = 'wrap';
        header.style.gap = '1.25rem';

        header.innerHTML = `
            <div>
                <h2 style="font-size: 1.75rem; margin-bottom: 0.2rem;">Academic Assignments</h2>
                <p style="color: var(--text-secondary); font-size: 0.95rem;">Manage and grade student evaluations</p>
            </div>
            ${user.role === 'teacher' ? '<button id="create-assignment" class="glass-button" style="padding: 10px 20px; font-size: 0.85rem; border:none;">+ New Assignment</button>' : ''}
        `;
        container.appendChild(header);

        // Filters
        const filters = document.createElement('div');
        filters.className = 'glass-panel';
        filters.style.padding = '1.5rem';
        filters.style.marginBottom = '1.5rem';
        filters.innerHTML = `
            <div style="display: flex; gap: 1.5rem; align-items: flex-end; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 200px;">
                    <label style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 0.5rem; display: block;">Narrow by Subject</label>
                    <select id="subject-filter" class="glass-button" style="width: 100%; text-align: left; background: var(--bg-secondary); color: var(--text-primary); padding: 10px;">
                        <option value="">All Academic Subjects</option>
                    </select>
                </div>
                <div style="padding-bottom: 4px;">
                    <p style="color: var(--text-secondary); font-size: 0.8rem; margin: 0;">Total: <strong id="assignment-count">...</strong></p>
                </div>
            </div>
        `;
        container.appendChild(filters);

        const listContainer = document.createElement('div');
        listContainer.id = 'assignment-list-results';
        container.appendChild(listContainer);

        const subjectSelect = filters.querySelector('#subject-filter');
        this.loadSubjects(subjectSelect);
        this.loadAssignments(listContainer);

        const createBtn = /** @type {HTMLElement} */ (header.querySelector('#create-assignment'));
        if (createBtn) createBtn.onclick = () => this.showCreateModal(listContainer);

        const filterSelect = /** @type {HTMLSelectElement} */ (filters.querySelector('#subject-filter'));
        if (filterSelect) {
            filterSelect.onchange = (e) => {
                this.selectedSubject = /** @type {HTMLSelectElement} */ (e.target).value;
                this.loadAssignments(listContainer);
            };
        }

        return container;
    }

    async loadSubjects(select) {
        try {
            const user = auth.getUser();
            const userId = String(user.id || user._id);

            // If faculty, pass their Faculty ID (provided in login response) to filter subjects
            let facultyId = null;
            let subjects = [];

            if (user.role === 'teacher') {
                facultyId = user.facultyId;
                console.log('Assignments: Current User ID:', userId, 'Initial FacultyID:', facultyId);

                // If facultyId is missing (legacy session), try to fetch it from profile
                if (!facultyId) {
                    try {
                        const faculties = await ApiService.getFaculty();
                        const myFac = faculties.find(f => {
                            const fUserId = f.userId && (f.userId._id || f.userId);
                            return String(fUserId) === userId;
                        });
                        if (myFac) facultyId = myFac._id;
                        console.log('Assignments: Resolved FacultyID from profile:', facultyId);
                    } catch (e) {
                        console.warn('Could not auto-fetch faculty ID', e);
                    }
                }

                // Client-side filtering strategy for robustness
                // 1. Direct Assignment (via Subject.faculty)
                const allSubjects = await ApiService.getSubjects();
                let mySubjects = [];

                if (facultyId) {
                    mySubjects = allSubjects.filter(s => {
                        const sFacId = s.faculty && (s.faculty._id || s.faculty);
                        return String(sFacId) === String(facultyId);
                    });
                }

                // 2. Timetable Assignment (via Timetable.grid.teacher)
                // "Assign by admin in time-table" - User requirement
                try {
                    let facultyName = user.name;
                    // Ensure we have the correct faculty name from profile matching
                    if (facultyId) {
                        const faculties = await ApiService.getFaculty();
                        const myFac = faculties.find(f => f._id === facultyId);
                        if (myFac) facultyName = myFac.name;
                    }
                    console.log('Assignments: Checking Timetables for Faculty Name:', facultyName);

                    const allTimetables = await ApiService.getTimetables();
                    const timetableSubjectNames = new Set();

                    allTimetables.forEach(tt => {
                        if (tt.grid) {
                            // Grid is stored as Object in JSON
                            Object.values(tt.grid).forEach(slot => {
                                if (slot && slot.teacher && slot.teacher.trim().toLowerCase() === facultyName.trim().toLowerCase()) {
                                    if (slot.subject) timetableSubjectNames.add(slot.subject.trim());
                                }
                            });
                        }
                    });

                    console.log('Assignments: Subjects found in Timetable:', [...timetableSubjectNames]);

                    // Merge Timetable subjects into mySubjects
                    // We match by Name since Timetable stores Subject Name string
                    const timetableSubjects = allSubjects.filter(s => timetableSubjectNames.has(s.name.trim()));

                    // Deduplicate
                    const subjectIds = new Set(mySubjects.map(s => s._id));
                    timetableSubjects.forEach(s => {
                        if (!subjectIds.has(s._id)) {
                            mySubjects.push(s);
                            subjectIds.add(s._id);
                        }
                    });

                } catch (err) {
                    console.error('Error fetching timetable assignments', err);
                }

                subjects = mySubjects;
                console.log('Assignments: Final Subject List for Faculty:', subjects.length);
            } else {
                // Admin or Student strategy (students filtered client-side below)
                subjects = await ApiService.getSubjects();
            }

            if (user.role === 'student') {
                const allStudents = await ApiService.getStudents();
                const profile = allStudents.find(s => (s.userId?._id || s.userId) === userId);
                if (profile) {
                    console.log('Student Profile:', profile.course, profile.year, profile.semester);
                    console.log('Total Subjects Before Filter:', subjects.length);
                    // Debug first 3 subjects
                    subjects.slice(0, 3).forEach(s => console.log('Sub:', s.name, s.course, s.year, s.semester));

                    subjects = subjects.filter(s => {
                        // Loose comparison for strings/numbers and trim
                        const matchCourse = s.course && profile.course && s.course.trim().toLowerCase() === profile.course.trim().toLowerCase();

                        let studentYear = profile.year;
                        if (!studentYear && profile.semester) {
                            studentYear = Math.ceil(profile.semester / 2);
                        }

                        const matchYear = String(s.year) === String(studentYear);
                        const matchSem = String(s.semester) === String(profile.semester);
                        return matchCourse && matchYear && matchSem;
                    });
                    this.studentProfile = profile; // Cache for use in loadAssignments
                    console.log('Total Subjects After Filter:', subjects.length);
                } else {
                    console.warn('Student profile not found for user:', userId);
                }
            }

            this.subjects = subjects;
            if (select) {
                const defaultText = user.role === 'teacher' ? 'Your Assigned Subjects' : 'All Academic Subjects';
                select.innerHTML = `<option value="">${defaultText}</option>` +
                    subjects.map(s => `<option value="${s._id}">${s.name} (${s.code || 'N/A'})</option>`).join('');
            }
        } catch (err) { console.error(err); }
    }

    async loadAssignments(container) {
        container.innerHTML = '<p style="text-align:center; padding:3rem; font-size: 0.9rem;">Syncing repository...</p>';
        try {
            const user = auth.getUser();
            const data = await ApiService.getAssignments(null, this.selectedSubject);

            // Filter assignments for students if no specific subject selected (client-side filter)
            let displayData = data;
            if (user.role === 'student' && this.subjects.length > 0) {
                const mySubjectIds = this.subjects.map(s => s._id);
                displayData = data.filter(a => {
                    const subId = a.subject?._id || a.subject;
                    return mySubjectIds.includes(subId);
                });
            } else if (user.role === 'student' && this.subjects.length === 0) {
                displayData = []; // No subjects = no assignments
            }

            this.assignments = displayData;

            const countLabel = document.querySelector('#assignment-count');
            if (countLabel) countLabel.textContent = this.assignments.length.toString();

            if (this.assignments.length === 0) {
                container.innerHTML = `
                    <div class="glass-panel" style="padding: 4rem; text-align: center; border: 1px dashed var(--glass-border);">
                        <p style="color: var(--text-secondary); font-size: 0.95rem;">No assignments found.</p>
                    </div>`;
                return;
            }

            const tableCard = document.createElement('div');
            tableCard.className = 'glass-panel';
            tableCard.style.padding = '0';

            // Distinct Columns for Student
            const columns = [
                { key: 'title', label: 'Title' },
                { key: 'subject', label: 'Subject', render: (v) => v ? `${v.name} <span style="opacity:0.6; font-size:0.85em;">(${v.code || 'N/A'})</span>` : '---' },
                { key: 'faculty', label: 'Assigned By', render: (v) => v?.name || '<span style="color:var(--text-secondary)">Unknown</span>' },
                {
                    key: 'fileUrl',
                    label: 'Attachment',
                    render: (v) => v ? `<a href="${v}" target="_blank" style="color: var(--primary); text-decoration: underline;">View Document</a>` : '<span style="color:var(--text-secondary)">-</span>'
                },
                { key: 'deadline', label: 'Due Date', render: (v) => new Date(v).toLocaleDateString(undefined, { dateStyle: 'medium' }) }
            ];

            if (user.role === 'student') {
                columns.push({
                    key: 'submissions',
                    label: 'My Status',
                    render: (v, item) => {
                        // Find my submission
                        const mySub = v.find(s => s.student === user.username || s.student === user.name); // Using username/name as loosely matched, ideally specific ID

                        if (!mySub) {
                            // Check deadline
                            const isLate = new Date() > new Date(item.deadline);
                            return isLate ?
                                `<span style="color: var(--danger); font-weight: 600; font-size: 0.8rem;">Missing</span>` :
                                `<span style="color: var(--text-secondary); font-size: 0.8rem;">Pending</span>`;
                        }

                        if (mySub.grade) {
                            return `<div style="display:flex; flex-direction:column;">
                                <span style="color: var(--success); font-weight: 700;">Graded: ${mySub.grade}</span>
                                <span style="font-size: 0.7rem; color: var(--text-secondary);">Submitted</span>
                            </div>`;
                        }

                        return `<span style="color: var(--accent-color); font-weight: 600; font-size: 0.8rem;">Submitted</span>`;
                    }
                });

                columns.push({
                    key: 'actions',
                    label: 'Action',
                    render: (v, item) => {
                        const mySub = item.submissions.find(s => s.student === user.username || s.student === user.name);
                        const isLate = new Date() > new Date(item.deadline);

                        if (!mySub) {
                            if (isLate) return `<button disabled class="glass-button" style="opacity:0.5; font-size: 0.75rem;">Closed</button>`;
                            return `<button class="glass-button submit-btn" data-id="${item._id}" style="font-size: 0.75rem; padding: 4px 10px; cursor: pointer;">Submit</button>`;
                        }
                        return `<button disabled class="glass-button" style="opacity:0.6; font-size: 0.75rem; background: var(--success); border-color: var(--success); color: white;">Done</button>`;
                    }
                });
            } else {
                columns.push({
                    key: 'submissions',
                    label: 'Progress',
                    render: (v) => {
                        const graded = v.filter(s => s.grade).length;
                        const perc = v.length > 0 ? Math.round((graded / v.length) * 100) : 0;
                        return `
                            <div style="display: flex; flex-direction: column; gap: 3px;">
                                <div style="font-size: 0.75rem; font-weight: 600;">${v.length} Submissions</div>
                                <div style="width: 70px; height: 3px; background: rgba(0,0,0,0.05); border-radius: 2px;">
                                    <div style="width: ${perc}%; height: 100%; background: var(--success); border-radius: 2px;"></div>
                                </div>
                            </div>`;
                    }
                });
            }

            const table = new Table({
                columns: columns,
                data: this.assignments,
                actions: user.role !== 'student', // Students can't edit/delete assignments
                onEdit: (id) => this.showSubmissions(id),
                onDelete: (id) => this.deleteAssignment(id, container)
            });

            // Handle custom column clicks if Table supports it, otherwise rely on specific button class listeners if needed.
            // But standard Table implementation usually handles actions via row or cell rendering.
            // Since Table.js is generic, I relies on finding buttons after render or if Table supports onClick in column def.
            // Assuming Table doesn't support column.onClick directly in standard implementation, I need to wire it up.
            // I will attach a global listener to the card or make buttons have unique IDs? 
            // Better: Table probably renders the HTML strings. I'll add the event listener to the tableCard.

            // Attach listener for student submit buttons (global listener on tableCard)
            if (user.role === 'student') {
                tableCard.addEventListener('click', (e) => {
                    const target = /** @type {HTMLElement} */ (e.target);
                    if (target.classList.contains('submit-btn')) {
                        const id = target.dataset.id;
                        const assignment = this.assignments.find(a => a._id === id);
                        if (assignment) {
                            this.showStudentSubmitModal(assignment);
                        }
                    }
                });
            }

            container.innerHTML = '';
            tableCard.appendChild(table.render());
            container.appendChild(tableCard);

        } catch (err) {
            Toast.error('Sync failed');
            container.innerHTML = `<p style="color:var(--danger); text-align:center; padding:3rem;">Error: ${err.message}</p>`;
        }
    }

    async showCreateModal(refreshContainer) {
        // Fetch valid classes for the Faculty
        let facultyClasses = [];
        try {
            const user = auth.getUser();
            if (user.role === 'teacher') {
                facultyClasses = await ApiService.getFacultyClasses();
            }
        } catch (e) {
            console.error('Failed to load faculty classes', e);
            Toast.error('Could not load your assigned classes');
            return;
        }

        if (facultyClasses.length === 0) {
            Toast.error('You have no assigned classes globally.');
            return;
        }

        const modalContent = document.createElement('div');
        modalContent.style.padding = '0.5rem 0';

        // Generate options
        const optionsHtml = facultyClasses.map((cls, index) => {
            const label = `${cls.name} (${cls.code || ''}) - ${cls.course} Y${cls.year}`;
            // Store data in value as JSON string for easy retrieval
            const value = JSON.stringify({
                subjectId: cls._id,
                course: cls.course,
                year: cls.year,
                semester: cls.semester
            });
            return `<option value='${value}'>${label}</option>`;
        }).join('');

        modalContent.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 1rem;">
                <div>
                    <label style="font-weight: 600; font-size: 0.85rem; margin-bottom: 0.4rem; display: block;">Assignment Title</label>
                    <input type="text" id="new-title" style="width: 100%; padding: 10px;" placeholder="Mid-term Paper">
                </div>
                
                <div style="background: rgba(var(--primary-rgb), 0.05); padding: 1rem; border-radius: 8px; border: 1px dashed var(--primary);">
                    <label style="font-weight: 600; font-size: 0.85rem; margin-bottom: 0.4rem; display: block; color: var(--primary);">Select Class & Subject</label>
                    <select id="new-class-select" style="width: 100%; padding: 10px; font-weight: 600;">
                        ${optionsHtml}
                    </select>
                    <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 5px;">
                        * You can only create assignments for classes assigned to you in the timetable or subject list.
                    </p>
                </div>

                <div>
                    <label style="font-weight: 600; font-size: 0.85rem; margin-bottom: 0.4rem; display: block;">Upload Document (PDF/Doc/Image)</label>
                    <input type="file" id="new-file-upload" style="width: 100%; padding: 10px;">
                </div>
                <div>
                    <label style="font-weight: 600; font-size: 0.85rem; margin-bottom: 0.4rem; display: block;">Deadline</label>
                    <input type="date" id="new-deadline" style="width: 100%; padding: 10px;" value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div>
                    <label style="font-weight: 600; font-size: 0.85rem; margin-bottom: 0.4rem; display: block;">Instructions</label>
                    <textarea id="new-desc" style="width: 100%; height: 100px; padding: 10px;" placeholder="Brief details..."></textarea>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <input type="checkbox" id="new-allowLate">
                    <label for="new-allowLate" style="font-size: 0.85rem; font-weight: 600;">Allow Late Submission</label>
                </div>
            </div>
        `;

        Modal.show({
            title: 'Deploy Assignment',
            content: modalContent,
            confirmText: 'Publish',
            onConfirm: async () => {
                const title = /** @type {HTMLInputElement} */ (modalContent.querySelector('#new-title')).value;
                const classSelect = /** @type {HTMLSelectElement} */ (modalContent.querySelector('#new-class-select'));
                const fileInput = /** @type {HTMLInputElement} */ (modalContent.querySelector('#new-file-upload'));
                const deadline = /** @type {HTMLInputElement} */ (modalContent.querySelector('#new-deadline')).value;
                const description = /** @type {HTMLTextAreaElement} */ (modalContent.querySelector('#new-desc')).value;
                const allowLate = /** @type {HTMLInputElement} */ (modalContent.querySelector('#new-allowLate')).checked;

                if (!title) return Toast.error('Title mandatory');
                if (!classSelect.value) return Toast.error('Please select a valid class');

                try {
                    const selectedClass = JSON.parse(classSelect.value);

                    const formData = new FormData();
                    formData.append('title', title);
                    formData.append('subject', selectedClass.subjectId);
                    formData.append('description', description);
                    formData.append('deadline', deadline);
                    formData.append('allowLate', String(allowLate));
                    formData.append('course', selectedClass.course);
                    formData.append('year', selectedClass.year);
                    formData.append('semester', selectedClass.semester);

                    if (fileInput.files.length > 0) {
                        formData.append('file', fileInput.files[0]);
                    }

                    await ApiService.createAssignment(formData);
                    Toast.success('Assignment published!');
                    this.loadAssignments(refreshContainer);
                    return true;
                } catch (err) {
                    Toast.error(err.message);
                    return false;
                }
            }
        });
    }

    showStudentSubmitModal(assignment) {
        const modalContent = document.createElement('div');
        modalContent.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 1rem;">
                <p style="font-size: 0.9rem; color: var(--text-secondary);">Submit your work for <strong>${assignment.title}</strong>.</p>
                <div>
                    <label style="font-weight: 600; font-size: 0.85rem; margin-bottom: 0.4rem; display: block;">Upload Document</label>
                    <input type="file" id="sub-file-upload" style="width: 100%; padding: 10px;">
                </div>
            </div>
        `;

        Modal.show({
            title: 'Submit Assignment',
            content: modalContent,
            confirmText: 'Submit',
            onConfirm: async () => {
                const fileInput = /** @type {HTMLInputElement} */ (modalContent.querySelector('#sub-file-upload'));
                if (fileInput.files.length === 0) return Toast.error('File required');

                try {
                    const formData = new FormData();
                    formData.append('file', fileInput.files[0]);

                    await ApiService.submitAssignment(assignment._id, formData);
                    Toast.success('Submitted successfully');
                    this.loadAssignments(document.querySelector('#assignment-list-results'));
                    return true;
                } catch (err) {
                    Toast.error(err.message);
                    return false;
                }
            }
        });
    }

    async showSubmissions(id) {
        const assignmentId = id._id || id;
        const assignment = this.assignments.find(a => a._id === assignmentId);
        if (!assignment) return;

        const container = document.createElement('div');
        container.style.padding = '0.5rem 0';

        if (assignment.submissions.length === 0) {
            container.innerHTML = `<p style="text-align:center; padding: 2rem; color: var(--text-secondary); font-size: 0.9rem;">No submissions yet.</p>`;
        } else {
            const list = document.createElement('div');
            list.style.display = 'flex';
            list.style.flexDirection = 'column';
            list.style.gap = '0.75rem';

            assignment.submissions.forEach((sub) => {
                const item = document.createElement('div');
                item.className = 'glass-panel';
                item.style.padding = '1rem';
                item.style.display = 'flex';
                item.style.justifyContent = 'space-between';
                item.style.alignItems = 'center';
                item.style.gap = '1rem';

                item.innerHTML = `
                    <div style="flex: 1;">
                        <div style="font-weight: 700; font-size: 0.9rem;">Student: ${sub.student}</div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary);">${new Date(sub.submittedAt).toLocaleDateString()}</div>
                        ${sub.fileUrl ? `<a href="${sub.fileUrl}" target="_blank" style="font-size: 0.75rem; color: var(--primary);">View Submission</a>` : ''}
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 0.5rem; width: 250px;">
                        <input type="text" class="grade-input" placeholder="Grade (e.g. A, 90%)" value="${sub.grade || ''}" 
                            style="width: 100%; padding: 6px; border: 1px solid var(--glass-border); border-radius: 6px; font-size: 0.85rem;">
                         <textarea class="feedback-input" placeholder="Feedback/Remarks" 
                            style="width: 100%; padding: 6px; border: 1px solid var(--glass-border); border-radius: 6px; font-size: 0.85rem; height: 50px;">${sub.feedback || ''}</textarea>
                        <button class="glass-button grade-btn" style="padding: 6px; font-size: 0.8rem; align-self: flex-end;">Save Evaluation</button>
                    </div>
                `;

                const btn = /** @type {HTMLButtonElement} */ (item.querySelector('.grade-btn'));
                if (btn) {
                    btn.onclick = async () => {
                        const grade = /** @type {HTMLInputElement} */ (item.querySelector('.grade-input')).value;
                        const feedback = /** @type {HTMLTextAreaElement} */ (item.querySelector('.feedback-input')).value;
                        try {
                            btn.disabled = true;
                            await ApiService.gradeSubmission(assignment._id, sub._id, { grade, feedback });
                            Toast.success('Evaluation saved');
                        } catch (err) { Toast.error(err.message); }
                        finally { btn.disabled = false; }
                    };
                }
                list.appendChild(item);
            });
            container.appendChild(list);
        }

        Modal.show({ title: `Submissions: ${assignment.title}`, content: container, confirmText: 'Done', showCancel: false });
    }

    async deleteAssignment(id, refreshContainer) {
        const assignmentId = id._id || id;
        Modal.confirm('Delete Assignment?', 'Continue?', async () => {
            try {
                await ApiService.deleteAssignment(assignmentId);
                Toast.success('Purged');
                this.loadAssignments(refreshContainer);
                return true;
            } catch (err) { Toast.error(err.message); return false; }
        });
    }
}
