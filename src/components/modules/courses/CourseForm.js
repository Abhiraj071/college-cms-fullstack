import { ApiService } from '../../../services/ApiService.js';
import { ValidationService as VS } from '../../../services/ValidationService.js';
import { ROUTES } from '../../../services/Constants.js';
import { Toast } from '../../../services/Toast.js';

export class CourseForm {
    constructor(courseId = null) {
        this.courseId = courseId;
        this.isEdit = !!courseId;
        this.courseData = null;
        this.existingSubjects = [];
        this.semestersCount = 0;
    }

    async render() {
        this.container = document.createElement('div');
        this.container.className = 'fade-in';
        this.container.style.maxWidth = '1000px';
        this.container.style.margin = '0 auto';
        this.container.style.paddingBottom = '4rem';

        // Header
        const header = document.createElement('div');
        header.style.marginBottom = '2rem';
        header.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem; cursor: pointer; color: var(--text-secondary);" onclick="window.location.hash='${ROUTES.COURSES_LIST}'">
                <span>← Back to List</span>
            </div>
            <h2 style="margin-top: 1rem;">${this.isEdit ? 'Edit Academic Program & Subjects' : 'Create Academic Program'}</h2>
            <p style="color: var(--text-secondary);">Define the course details and its entire curriculum below.</p>
        `;
        this.container.appendChild(header);

        // Form Card
        this.card = document.createElement('div');
        this.card.className = 'glass-panel';
        this.card.style.padding = '2.5rem';

        this.form = document.createElement('form');
        this.form.innerHTML = `
            <!-- Step 1: Course Details -->
            <div style="margin-bottom: 3rem;">
                <h3 style="border-bottom: 1px solid var(--glass-border); padding-bottom: 0.5rem; margin-bottom: 1.5rem;">1. Course Details</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                    <div style="grid-column: span 2;">
                        <label>Course Name</label>
                        <input type="text" name="name" placeholder="e.g. B.Tech Computer Science" required>
                    </div>
                    <div>
                        <label>Duration (Years)</label>
                        <input type="number" name="duration" id="durationInput" placeholder="e.g. 3" min="1" max="5" required>
                        <small style="color: var(--text-secondary); display: block; margin-top: 4px;">Changes to duration will automatically adjust the semester layout below.</small>
                    </div>
                    <div style="grid-column: span 2;">
                        <label>Description</label>
                        <textarea name="description" placeholder="A brief overview of this academic program..." style="width: 100%; height: 80px; padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); color: #fff;"></textarea>
                    </div>
                </div>
            </div>

            <!-- Step 2: Subject Allocation -->
            <div>
                <h3 style="border-bottom: 1px solid var(--glass-border); padding-bottom: 0.5rem; margin-bottom: 1.5rem;">2. Curriculum Structure</h3>
                <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1.5rem;">Add subjects for each semester. You must define the duration above first.</p>
                <div id="semestersContainer" style="display: flex; flex-direction: column; gap: 2rem;">
                    <!-- Dynamically generated semester blocks will appear here -->
                </div>
            </div>

            <div style="border-top: 1px solid var(--glass-border); padding-top: 2rem; margin-top: 3rem; display: flex; justify-content: flex-end; gap: 1rem; position: sticky; bottom: 0; background: var(--bg-primary); z-index: 10; padding-bottom: 1rem;">
                <button type="button" class="glass-button" style="background: transparent;" onclick="window.history.back()">Cancel</button>
                <button type="submit" id="submitBtn" class="glass-button" style="background: var(--accent-color); color: white; border: none; font-weight: 700;">${this.isEdit ? 'Save Course & Subjects' : 'Create Course & Subjects'}</button>
            </div>
        `;

        this.card.appendChild(this.form);
        this.container.appendChild(this.card);

        this.submitBtn = this.form.querySelector('#submitBtn');
        this.durationInput = this.form.querySelector('#durationInput');
        this.semestersContainer = this.form.querySelector('#semestersContainer');

        await this.initForm();
        this.setupEventListeners();

        return this.container;
    }

    async initForm() {
        if (this.isEdit) {
            try {
                const courses = await ApiService.getCourses();
                this.courseData = courses.find(c => c._id === this.courseId);
                
                if (this.courseData) {
                    this.form.querySelector('[name="name"]').value = this.courseData.name;
                    this.durationInput.value = this.courseData.duration;
                    this.form.querySelector('[name="description"]').value = this.courseData.description || '';
                    
                    // Fetch existing subjects for this course
                    this.existingSubjects = await ApiService.getSubjects(this.courseData.name);
                    
                    this.renderSemesters();
                } else {
                    Toast.error('Course not found');
                    window.location.hash = ROUTES.COURSES_LIST;
                }
            } catch (err) {
                Toast.error('Failed to load course details: ' + err.message);
            }
        }
    }

    setupEventListeners() {
        this.durationInput.addEventListener('input', () => {
            this.renderSemesters();
        });

        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSubmit();
        });

        // Event delegation for adding/removing subject rows
        this.semestersContainer.addEventListener('click', (e) => {
            const addBtn = e.target.closest('.add-subject-btn');
            if (addBtn) {
                const sem = addBtn.dataset.semester;
                this.addSubjectRow(sem);
            }

            const removeBtn = e.target.closest('.remove-subject-btn');
            if (removeBtn) {
                const row = removeBtn.closest('.subject-row');
                row.remove();
            }
        });
    }

    renderSemesters() {
        const duration = parseInt(this.durationInput.value) || 0;
        this.semestersCount = duration * 2; // Assuming 2 semesters per year

        if (this.semestersCount <= 0 || this.semestersCount > 10) {
            this.semestersContainer.innerHTML = '<div style="padding: 2rem; text-align: center; background: rgba(0,0,0,0.2); border-radius: 8px; color: var(--text-secondary);">Please enter a valid course duration (1-5 years) to generate the semester layout.</div>';
            return;
        }

        let html = '';
        for (let sem = 1; sem <= this.semestersCount; sem++) {
            html += `
                <div class="semester-block" data-semester="${sem}" style="background: rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; padding: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h4 style="margin: 0; color: var(--accent-color);">Semester ${sem}</h4>
                        <button type="button" class="glass-button add-subject-btn" data-semester="${sem}" style="padding: 4px 12px; font-size: 0.8rem;">+ Add Subject</button>
                    </div>
                    
                    <div class="subjects-list" id="subjects-list-${sem}" style="display: flex; flex-direction: column; gap: 0.75rem;">
                        <!-- Subject rows will go here -->
                    </div>
                </div>
            `;
        }

        this.semestersContainer.innerHTML = html;

        // Populate with existing subjects or one empty row
        for (let sem = 1; sem <= this.semestersCount; sem++) {
            const semSubjects = this.existingSubjects.filter(s => parseInt(s.semester) === sem);
            
            if (semSubjects.length > 0) {
                semSubjects.forEach(s => this.addSubjectRow(sem, s));
            } else {
                this.addSubjectRow(sem); // Add one empty row by default
            }
        }
    }

    addSubjectRow(semester, data = null) {
        const list = this.form.querySelector(`#subjects-list-${semester}`);
        if (!list) return;

        const row = document.createElement('div');
        row.className = 'subject-row';
        row.style.display = 'grid';
        row.style.gridTemplateColumns = '2fr 1fr 1.5fr auto';
        row.style.gap = '0.5rem';
        row.style.alignItems = 'center';

        row.innerHTML = `
            <input type="text" class="subject-name" placeholder="Subject Name" value="${data ? data.name : ''}" required style="padding: 8px;">
            <input type="text" class="subject-code" placeholder="Code (e.g. CS101)" value="${data ? data.code : ''}" required style="padding: 8px;">
            <select class="subject-type" style="padding: 8px; border-radius: 6px; background: rgba(0,0,0,0.3); color: white; border: 1px solid rgba(255,255,255,0.1);">
                <option value="Theory" ${data && data.type === 'Theory' ? 'selected' : ''}>Theory</option>
                <option value="Practical" ${data && data.type === 'Practical' ? 'selected' : ''}>Practical</option>
            </select>
            <button type="button" class="remove-subject-btn" style="background: transparent; border: none; color: #ef4444; font-size: 1.2rem; cursor: pointer; padding: 4px 8px;">×</button>
        `;

        list.appendChild(row);
    }

    async handleSubmit() {
        VS.clearErrors(this.form);

        const formData = new FormData(this.form);
        const coursePayload = {
            name: formData.get('name').toString(),
            duration: parseInt(formData.get('duration').toString()),
            description: formData.get('description').toString()
        };

        if (!coursePayload.name || !coursePayload.duration) {
            Toast.error('Please fill all required course details.');
            return;
        }

        // Extract subjects
        const subjectsPayload = [];
        let hasSubjectErrors = false;

        this.semestersContainer.querySelectorAll('.semester-block').forEach(block => {
            const sem = parseInt(block.dataset.semester);
            // Year = Math.ceil(semester / 2)
            const year = Math.ceil(sem / 2);

            block.querySelectorAll('.subject-row').forEach(row => {
                const nameInput = row.querySelector('.subject-name');
                const codeInput = row.querySelector('.subject-code');
                const typeInput = row.querySelector('.subject-type');

                const name = nameInput.value.trim();
                const code = codeInput.value.trim();
                const type = typeInput.value;

                if (name && code) {
                    subjectsPayload.push({
                        name,
                        code,
                        course: coursePayload.name, // Link to course name
                        year,
                        semester: sem,
                        type
                    });
                } else if (name || code) {
                    // Partially filled row
                    hasSubjectErrors = true;
                    nameInput.style.borderColor = 'red';
                    codeInput.style.borderColor = 'red';
                }
            });
        });

        if (hasSubjectErrors) {
            Toast.error('Please complete all fields for the subjects you added, or remove empty rows.');
            return;
        }

        this.submitBtn.textContent = 'Saving Data...';
        this.submitBtn.disabled = true;

        try {
            // 1. Save Course
            if (this.isEdit) {
                await ApiService.updateCourse(this.courseId, coursePayload);
            } else {
                await ApiService.addCourse(coursePayload);
            }

            // 2. Save Subjects (Bulk)
            if (subjectsPayload.length > 0) {
                await ApiService.addBulkSubjects({ subjects: subjectsPayload });
            }

            Toast.success('Course and Curriculum successfully saved!');
            window.location.hash = ROUTES.COURSES_LIST;
        } catch (err) {
            Toast.error(err.message);
            this.submitBtn.textContent = this.isEdit ? 'Save Course & Subjects' : 'Create Course & Subjects';
            this.submitBtn.disabled = false;
        }
    }
}
