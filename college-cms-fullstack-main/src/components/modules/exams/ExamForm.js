import { ApiService } from '../../../services/ApiService.js';
import { ValidationService as VS } from '../../../services/ValidationService.js';
import { ROUTES } from '../../../services/Constants.js';
import { Toast } from '../../../services/Toast.js';

export class ExamForm {
    constructor(examId = null) {
        this.examId = examId;
        this.isEdit = !!examId;
        this.examData = null;
    }

    render() {
        const container = document.createElement('div');
        container.className = 'fade-in';
        container.style.maxWidth = '800px';
        container.style.margin = '0 auto';

        // Header
        const header = document.createElement('div');
        header.style.marginBottom = '2rem';
        header.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem; cursor: pointer; color: var(--text-secondary);" onclick="window.location.hash='${ROUTES.EXAMS_LIST}'">
                <span>← Back to List</span>
            </div>
            <h2 style="margin-top: 1rem;">${this.isEdit ? 'Edit Exam Schedule' : 'Schedule New Exam'}</h2>
        `;
        container.appendChild(header);

        // Form Card
        const card = document.createElement('div');
        card.className = 'glass-panel';
        card.style.padding = '2.5rem';

        const form = document.createElement('form');
        form.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
                <div style="grid-column: span 2;">
                    <label>Exam Title</label>
                    <input type="text" name="title" placeholder="e.g. Mid-Term Examination 2025" required>
                </div>
                <div>
                    <label>Course / Program</label>
                    <select name="course" id="courseSelect" required>
                        <option value="">-- Loading Courses --</option>
                    </select>
                </div>
                <div>
                    <label>Subject</label>
                    <input type="text" name="subject" placeholder="e.g. Data Structures" required>
                </div>
                <div>
                    <label>Date</label>
                    <input type="date" name="date" required>
                </div>
                <div>
                    <label>Time</label>
                    <input type="time" name="time" required>
                </div>
                <div>
                    <label>Total Marks</label>
                    <input type="number" name="totalMarks" value="100" required>
                </div>
                <div>
                    <label>Room / Venue</label>
                    <input type="text" name="room" placeholder="e.g. Room 102">
                </div>
                <div>
                    <label>Exam Type</label>
                    <select name="type" required>
                        <option value="Internal">Internal</option>
                        <option value="Mid-Term">Mid-Term</option>
                        <option value="Final">Final</option>
                        <option value="Practical">Practical</option>
                    </select>
                </div>
            </div>

            <div style="border-top: 1px solid var(--glass-border); padding-top: 2rem; display: flex; justify-content: flex-end; gap: 1rem;">
                <button type="button" class="glass-button" style="background: transparent;" onclick="window.history.back()">Cancel</button>
                <button type="submit" id="submitBtn" class="glass-button">${this.isEdit ? 'Save Changes' : 'Schedule Exam'}</button>
            </div>
        `;

        const courseSelect = form.querySelector('#courseSelect');
        /** @type {HTMLButtonElement} */
        const submitBtn = form.querySelector('#submitBtn');

        const initForm = async () => {
            try {
                const courses = await ApiService.getCourses();
                courseSelect.innerHTML = '<option value="">-- Select Course --</option>' +
                    courses.map(c => `<option value="${c.name}">${c.name}</option>`).join('');

                if (this.isEdit) {
                    const exams = await ApiService.getExams();
                    this.examData = exams.find(e => e._id === this.examId);

                    if (this.examData) {
                        form.elements['title'].value = this.examData.title;
                        form.elements['course'].value = this.examData.course;
                        form.elements['subject'].value = this.examData.subject;
                        form.elements['date'].value = this.examData.date ? this.examData.date.split('T')[0] : '';
                        form.elements['time'].value = this.examData.time || '';
                        form.elements['totalMarks'].value = this.examData.totalMarks;
                        form.elements['room'].value = this.examData.room || '';
                        form.elements['type'].value = this.examData.type;
                    } else {
                        Toast.error('Exam record not found');
                        window.location.hash = ROUTES.EXAMS_LIST;
                    }
                }
            } catch (err) {
                Toast.error('Error initializing form: ' + err.message);
            }
        };

        initForm();

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            VS.clearErrors(form);

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            // --- Validation ---
            let isValid = true;
            if (!VS.validateRequired(data.title)) { VS.highlightError(form.elements['title'], 'Exam title is required'); isValid = false; }
            if (!VS.validateRequired(data.course)) { VS.highlightError(form.elements['course'], 'Please select a course'); isValid = false; }
            if (!VS.validateRequired(data.subject)) { VS.highlightError(form.elements['subject'], 'Subject name is required'); isValid = false; }
            if (!VS.validateRequired(data.date)) { VS.highlightError(form.elements['date'], 'Date is required'); isValid = false; }
            if (!VS.validateMarks(data.totalMarks, 5000)) { VS.highlightError(form.elements['totalMarks'], 'Invalid marks'); isValid = false; }

            if (!isValid) return;

            submitBtn.textContent = this.isEdit ? 'Saving...' : 'Scheduling...';
            submitBtn.disabled = true;

            try {
                const examObj = {
                    ...data,
                    totalMarks: parseInt(String(data.totalMarks))
                };

                if (this.isEdit) {
                    await ApiService.updateExam(this.examId, examObj);
                    Toast.success('Exam Schedule Updated Successfully!');
                } else {
                    await ApiService.addExam(examObj);
                    Toast.success('Exam Scheduled Successfully!');
                }
                window.location.hash = ROUTES.EXAMS_LIST;
            } catch (err) {
                Toast.error(err.message);
                submitBtn.textContent = this.isEdit ? 'Save Changes' : 'Schedule Exam';
                submitBtn.disabled = false;
            }
        });

        card.appendChild(form);
        container.appendChild(card);
        return container;
    }
}
