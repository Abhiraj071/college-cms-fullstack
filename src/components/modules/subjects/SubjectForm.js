import { ApiService } from '../../../services/ApiService.js';
import { ValidationService as VS } from '../../../services/ValidationService.js';
import { ROUTES } from '../../../services/Constants.js';
import { Toast } from '../../../services/Toast.js';

export class SubjectForm {
    constructor(subjectId = null, params = {}) {
        this.subjectId = subjectId;
        this.params = params;
        this.isEdit = !!subjectId;
        this.subjectData = null;
        this.courses = [];
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
            <div style="display: flex; align-items: center; gap: 1rem; cursor: pointer; color: var(--text-secondary);" onclick="window.location.hash='${ROUTES.SUBJECTS_LIST}'">
                <span>← Back to List</span>
            </div>
            <h2 style="margin-top: 1rem;">${this.isEdit ? 'Edit Subject' : 'Add New Subject'}</h2>
        `;
        container.appendChild(header);

        // Form Card
        const card = document.createElement('div');
        card.className = 'glass-panel';
        card.style.padding = '2.5rem';

        const form = document.createElement('form');
        form.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 1.5rem; margin-bottom: 2rem;">
                <div>
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; font-size: 0.85rem; color: var(--text-secondary);">Subject Name</label>
                    <input type="text" name="name" placeholder="e.g. Data Structures and Algorithms" class="glass-button" style="width: 100%; text-align: left; background: rgba(0,0,0,0.1);" required>
                </div>

                <div>
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; font-size: 0.85rem; color: var(--text-secondary);">Subject Code</label>
                    <input type="text" name="code" placeholder="e.g. CS101" class="glass-button" style="width: 100%; text-align: left; background: rgba(0,0,0,0.1);" required>
                </div>

                <div>
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; font-size: 0.85rem; color: var(--text-secondary);">Subject Type</label>
                    <select name="type" class="glass-button" style="width: 100%; text-align: left; background: rgba(0,0,0,0.1); color: var(--text-primary);" required>
                        <option value="Theory">Theory</option>
                        <option value="Practical">Practical</option>
                    </select>
                </div>

                <div>
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; font-size: 0.85rem; color: var(--text-secondary);">Course Program</label>
                    <select name="course" id="courseSelect" class="glass-button" style="width: 100%; text-align: left; background: rgba(0,0,0,0.1); color: var(--text-primary);" required>
                        <option value="">Select a Course...</option>
                    </select>
                </div>

                <div>
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; font-size: 0.85rem; color: var(--text-secondary);">Semester</label>
                    <select name="semester" id="semesterSelect" class="glass-button" style="width: 100%; text-align: left; background: rgba(0,0,0,0.1); color: var(--text-primary);" required disabled>
                        <option value="">Select a Course First...</option>
                    </select>
                </div>

                <div>
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; font-size: 0.85rem; color: var(--text-secondary);">Description</label>
                    <textarea name="description" placeholder="A brief overview of this subject..." style="width: 100%; height: 120px; padding: 12px; border-radius: 8px; border: 1px solid var(--glass-border); background: rgba(0,0,0,0.1); color: #fff;"></textarea>
                </div>
            </div>

            <div style="border-top: 1px solid var(--glass-border); padding-top: 2rem; display: flex; justify-content: flex-end; gap: 1rem;">
                <button type="button" class="glass-button" style="background: transparent;" onclick="window.history.back()">Cancel</button>
                <button type="submit" id="submitBtn" class="glass-button">${this.isEdit ? 'Save Changes' : 'Enroll Subject'}</button>
            </div>
        `;

        /** @type {HTMLButtonElement} */
        const submitBtn = form.querySelector('#submitBtn');
        const courseSelect = form.querySelector('#courseSelect');
        const semesterSelect = form.querySelector('#semesterSelect');

        courseSelect.addEventListener('change', (e) => {
            const courseName = e.target.value;
            const course = this.courses.find(c => c.name === courseName);
            semesterSelect.innerHTML = '<option value="">Select Semester...</option>';
            if (course) {
                semesterSelect.disabled = false;
                const totalSemesters = course.duration * 2;
                for (let i = 1; i <= totalSemesters; i++) {
                    const opt = document.createElement('option');
                    opt.value = i;
                    opt.textContent = `Semester ${i} (Year ${Math.ceil(i/2)})`;
                    semesterSelect.appendChild(opt);
                }
            } else {
                semesterSelect.disabled = true;
                semesterSelect.innerHTML = '<option value="">Select a Course First...</option>';
            }
        });

        const initForm = async () => {
            try {
                this.courses = await ApiService.getCourses();
                
                // Populate courses
                this.courses.forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c.name;
                    opt.textContent = `${c.name} (${c.duration} Years)`;
                    courseSelect.appendChild(opt);
                });

                if (this.isEdit) {
                    const subjects = await ApiService.getSubjects();
                    this.subjectData = subjects.find(s => s._id === this.subjectId);

                    if (this.subjectData) {
                        /** @type {HTMLInputElement} */ (form.querySelector('input[name="name"]')).value = this.subjectData.name;
                        /** @type {HTMLInputElement} */ (form.querySelector('input[name="code"]')).value = this.subjectData.code || '';
                        /** @type {HTMLSelectElement} */ (form.querySelector('select[name="type"]')).value = this.subjectData.type;
                        /** @type {HTMLTextAreaElement} */ (form.querySelector('textarea[name="description"]')).value = this.subjectData.description || '';
                        
                        if (this.subjectData.course) {
                            courseSelect.value = this.subjectData.course;
                            courseSelect.dispatchEvent(new Event('change'));
                            semesterSelect.value = this.subjectData.semester || '';
                        }
                    } else {
                        Toast.error('Subject not found');
                        window.location.hash = ROUTES.SUBJECTS_LIST;
                    }
                }
            } catch (err) {
                Toast.error('Failed to load data: ' + err.message);
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
            if (!VS.validateRequired(data.name)) {
                VS.highlightError(/** @type {HTMLElement} */(form.querySelector('[name="name"]')), 'Subject name is required');
                isValid = false;
            }

            if (!VS.validateRequired(data.code)) {
                VS.highlightError(/** @type {HTMLElement} */(form.querySelector('[name="code"]')), 'Subject code is required');
                isValid = false;
            }

            if (!data.course || !data.semester) {
                Toast.error('Please select a valid Course and Semester.');
                isValid = false;
            }

            if (!isValid) return;

            submitBtn.textContent = this.isEdit ? 'Saving...' : 'Enrolling...';
            submitBtn.disabled = true;

            try {
                const payload = {
                    ...data,
                    semester: parseInt(data.semester),
                    year: Math.ceil(parseInt(data.semester) / 2)
                };

                if (this.isEdit) {
                    await ApiService.updateSubject(this.subjectId, payload);
                    Toast.success('Subject Updated Successfully!');
                } else {
                    await ApiService.addSubject(payload);
                    Toast.success('Subject Enrolled Successfully!');
                }
                window.location.hash = ROUTES.SUBJECTS_LIST;
            } catch (err) {
                Toast.error(err.message);
                submitBtn.textContent = this.isEdit ? 'Save Changes' : 'Enroll Subject';
                submitBtn.disabled = false;
            }
        });

        card.appendChild(form);
        container.appendChild(card);
        return container;
    }
}
