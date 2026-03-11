import { ApiService } from '../../../services/ApiService.js';
import { ValidationService as VS } from '../../../services/ValidationService.js';
import { ROUTES } from '../../../services/Constants.js';
import { Toast } from '../../../services/Toast.js';

export class CourseForm {
    constructor(courseId = null) {
        this.courseId = courseId;
        this.isEdit = !!courseId;
        this.courseData = null;
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
            <div style="display: flex; align-items: center; gap: 1rem; cursor: pointer; color: var(--text-secondary);" onclick="window.location.hash='${ROUTES.COURSES_LIST}'">
                <span>← Back to List</span>
            </div>
            <h2 style="margin-top: 1rem;">${this.isEdit ? 'Edit Academic Program' : 'Add New Course'}</h2>
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
                    <label>Course Name</label>
                    <input type="text" name="name" placeholder="e.g. B.Sc Computer Science" required>
                </div>
                 <div>
                    <label>Course Code</label>
                    <input type="text" name="code" placeholder="e.g. BSCCS" required>
                </div>
                <div>
                    <label>Duration (Years)</label>
                    <input type="number" name="duration" placeholder="e.g. 3" min="1" max="5" required>
                </div>
                 <div style="grid-column: span 2;">
                    <label>Description</label>
                    <textarea name="description" placeholder="A brief overview of this academic program..." style="width: 100%; height: 100px; padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); color: #fff;"></textarea>
                </div>
            </div>

            <div style="border-top: 1px solid var(--glass-border); padding-top: 2rem; display: flex; justify-content: flex-end; gap: 1rem;">
                <button type="button" class="glass-button" style="background: transparent;" onclick="window.history.back()">Cancel</button>
                <button type="submit" id="submitBtn" class="glass-button">${this.isEdit ? 'Save Changes' : 'Create Course'}</button>
            </div>
        `;

        const submitBtn = /** @type {HTMLButtonElement} */ (form.querySelector('#submitBtn'));

        const initForm = async () => {
            if (this.isEdit) {
                try {
                    const courses = await ApiService.getCourses();
                    this.courseData = courses.find(c => c._id === this.courseId);
                    if (this.courseData) {
                        /** @type {HTMLInputElement} */ (form.querySelector('[name="name"]')).value = this.courseData.name;
                        /** @type {HTMLInputElement} */ (form.querySelector('[name="code"]')).value = this.courseData.code;
                        /** @type {HTMLInputElement} */ (form.querySelector('[name="duration"]')).value = this.courseData.duration;
                        /** @type {HTMLTextAreaElement} */ (form.querySelector('[name="description"]')).value = this.courseData.description || '';
                    } else {
                        Toast.error('Course not found');
                        window.location.hash = ROUTES.COURSES_LIST;
                    }
                } catch (err) {
                    Toast.error('Failed to load course details: ' + err.message);
                }
            }
        };

        initForm();

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            VS.clearErrors(form);

            const formData = new FormData(form);
            const data = /** @type {Record<string, string>} */ (Object.fromEntries(formData.entries()));

            // --- Validation ---
            let isValid = true;
            if (!VS.validateRequired(data.name)) { VS.highlightError(form.querySelector('[name="name"]'), 'Course name is required'); isValid = false; }
            if (!VS.validateRequired(data.code)) { VS.highlightError(form.querySelector('[name="code"]'), 'Course code is required'); isValid = false; }
            if (!VS.validateRequired(data.duration)) { VS.highlightError(form.querySelector('[name="duration"]'), 'Duration is required'); isValid = false; }

            if (!isValid) return;

            submitBtn.textContent = this.isEdit ? 'Saving...' : 'Creating...';
            submitBtn.disabled = true;

            try {
                if (this.isEdit) {
                    await ApiService.updateCourse(this.courseId, {
                        ...data,
                        duration: parseInt(data.duration)
                    });
                    Toast.success('Course Updated Successfully!');
                } else {
                    await ApiService.addCourse({
                        ...data,
                        duration: parseInt(data.duration)
                    });
                    Toast.success('Academic Program Registered Successfully!');
                }
                window.location.hash = ROUTES.COURSES_LIST;
            } catch (err) {
                Toast.error(err.message);
                submitBtn.textContent = this.isEdit ? 'Save Changes' : 'Create Course';
                submitBtn.disabled = false;
            }
        });

        card.appendChild(form);
        container.appendChild(card);
        return container;
    }
}
