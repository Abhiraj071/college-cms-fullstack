import { ApiService } from '../../../services/ApiService.js';
import { ValidationService as VS } from '../../../services/ValidationService.js';
import { ROUTES } from '../../../services/Constants.js';
import { Toast } from '../../../services/Toast.js';

export class StudentForm {
    constructor(studentId = null, params = {}) {
        this.studentId = studentId;
        this.params = params;
        this.isEdit = !!studentId;
        this.studentData = null;
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
            <div style="display: flex; align-items: center; gap: 1rem; cursor: pointer; color: var(--text-secondary);" onclick="window.location.hash='${ROUTES.STUDENTS_LIST}'">
                <span>← Back to List</span>
            </div>
            <h2 style="margin-top: 1rem;">${this.isEdit ? 'Edit Student Profile' : 'Register New Student'}</h2>
        `;
        container.appendChild(header);

        const card = document.createElement('div');
        card.className = 'glass-panel';
        card.style.padding = '2.5rem';

        const form = document.createElement('form');
        form.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
                <div>
                    <label>Full Name</label>
                    <input type="text" name="name" placeholder="e.g. John Doe" required>
                </div>
                <div>
                    <label>Roll Number</label>
                    <input type="text" name="rollNo" placeholder="e.g. CS2025001" required>
                </div>
                <div>
                    <label>Email Address</label>
                    <input type="email" name="email" placeholder="john.doe@college.edu" required>
                </div>
                ${!this.isEdit ? `
                <div>
                    <label>Username (Login ID)</label>
                    <input type="text" name="username" placeholder="john_doe" required>
                </div>
                ` : ''}
                <div>
                    <label>Course / Program</label>
                    <select name="course" id="courseSelect" required>
                        <option value="">Loading courses...</option>
                    </select>
                </div>
                <div>
                    <label>Current Year</label>
                    <select name="year" id="yearSelect" required disabled>
                         <option value="">-- Select Course First --</option>
                    </select>
                </div>
                <div>
                    <label>Current Semester</label>
                    <select name="semester" id="semSelect" disabled required>
                        <option value="">-- Select Year First --</option>
                    </select>
                </div>
                <div>
                    <label>Phone Number</label>
                    <input type="tel" name="phone" placeholder="+1 (555) 000-0000">
                </div>
                <div>
                    <label>Registration Date</label>
                    <input type="date" name="joinDate" value="${new Date().toISOString().split('T')[0]}">
                </div>
            </div>

            <div style="border-top: 1px solid var(--glass-border); padding-top: 2rem; display: flex; justify-content: flex-end; gap: 1rem;">
                <button type="button" class="glass-button" style="background: transparent;" onclick="window.history.back()">Cancel</button>
                <button type="submit" id="submitBtn" class="glass-button">${this.isEdit ? 'Save Changes' : 'Finalize Registration'}</button>
            </div>
        `;

        /** @type {HTMLSelectElement} */
        const courseSelect = form.querySelector('#courseSelect');
        /** @type {HTMLSelectElement} */
        const yearSelect = form.querySelector('#yearSelect');
        /** @type {HTMLSelectElement} */
        const semSelect = form.querySelector('#semSelect');
        /** @type {HTMLButtonElement} */
        const submitBtn = form.querySelector('#submitBtn');
        /** @type {HTMLInputElement} */
        const nameInput = form.querySelector('[name="name"]');

        let courses = [];

        const updateYears = (courseName, selectedYear = null) => {
            const course = courses.find(c => c.name === courseName);
            yearSelect.innerHTML = '<option value="">-- Select Year --</option>';
            semSelect.innerHTML = '<option value="">-- Select Year First --</option>';
            semSelect.disabled = true;

            if (course) {
                yearSelect.disabled = false;
                const duration = course.duration || 4;
                for (let i = 1; i <= duration; i++) {
                    const opt = document.createElement('option');
                    opt.value = String(i);
                    opt.textContent = `Year ${i}`;
                    if (selectedYear && i == selectedYear) opt.selected = true;
                    yearSelect.appendChild(opt);
                }
            } else {
                yearSelect.disabled = true;
            }
        };

        const updateSemesters = (year, selectedSem = null) => {
            semSelect.innerHTML = '<option value="">-- Select Semester --</option>';
            if (year) {
                semSelect.disabled = false;
                const startSem = (year - 1) * 2 + 1;
                const endSem = startSem + 1;

                [startSem, endSem].forEach(sem => {
                    const opt = document.createElement('option');
                    opt.value = String(sem);
                    opt.textContent = `Semester ${sem}`;
                    if (selectedSem && sem == selectedSem) opt.selected = true;
                    semSelect.appendChild(opt);
                });
            } else {
                semSelect.disabled = true;
            }
        };

        courseSelect.addEventListener('change', () => updateYears(courseSelect.value));
        yearSelect.addEventListener('change', () => updateSemesters(yearSelect.value));

        // Auto-fill username from roll number
        if (!this.isEdit) {
            /** @type {HTMLInputElement} */
            const rollInput = form.querySelector('[name="rollNo"]');
            /** @type {HTMLInputElement} */
            const usernameInput = form.querySelector('[name="username"]');

            rollInput.addEventListener('input', () => {
                if (usernameInput) {
                    usernameInput.value = rollInput.value;
                }
            });
        }

        const initForm = async () => {
            try {
                courses = await ApiService.getCourses();
                courseSelect.innerHTML = '<option value="">-- Select Course --</option>' +
                    courses.map(c => `<option value="${c.name}">${c.name}</option>`).join('');

                if (this.isEdit) {
                    const allStudents = await ApiService.getStudents();
                    this.studentData = allStudents.find(s => s._id === this.studentId);

                    if (this.studentData) {
                        nameInput.value = this.studentData.name;
                        form.rollNo.value = this.studentData.rollNo;
                        form.email.value = this.studentData.email;
                        form.course.value = this.studentData.course;
                        form.phone.value = this.studentData.phone || '';
                        if (this.studentData.joinDate) {
                            form.joinDate.value = new Date(this.studentData.joinDate).toISOString().split('T')[0];
                        }

                        // Calculate Year from Semester for UI
                        const currentSem = this.studentData.semester;
                        const calculatedYear = Math.ceil(currentSem / 2);

                        updateYears(this.studentData.course, calculatedYear);
                        updateSemesters(calculatedYear, currentSem);
                    } else {
                        Toast.error('Student data not found');
                        window.location.hash = ROUTES.STUDENTS_LIST;
                    }
                } else {
                    // Pre-fill from usage params
                    if (this.params.course) {
                        form.course.value = this.params.course;
                        updateYears(this.params.course, this.params.year);
                        if (this.params.year) {
                            form.year.value = this.params.year; // Set year dropdown
                            updateSemesters(this.params.year, this.params.semester);
                        }
                    }
                }
            } catch (err) {
                Toast.error('Load Error: ' + err.message);
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
            if (!VS.validateRequired(data.name)) { VS.highlightError(nameInput, 'Full name is required'); isValid = false; }
            if (!VS.validateRequired(data.rollNo)) { VS.highlightError(form.rollNo, 'Roll number is required'); isValid = false; }
            if (!VS.validateEmail(data.email)) { VS.highlightError(form.email, 'Valid email is required'); isValid = false; }
            if (!this.isEdit && !VS.validateRequired(data.username)) { VS.highlightError(form.username, 'Username is required'); isValid = false; }
            if (!VS.validateRequired(data.course)) { VS.highlightError(form.course, 'Please select a course'); isValid = false; }

            if (!isValid) return;

            submitBtn.textContent = this.isEdit ? 'Saving...' : 'Registering...';
            submitBtn.disabled = true;

            try {
                if (this.isEdit) {
                    await ApiService.updateStudent(this.studentId, {
                        ...data,
                        semester: parseInt(String(data.semester))
                    });
                    Toast.success('Student Profile Updated Successfully!');
                } else {
                    await ApiService.addStudent({
                        ...data,
                        semester: parseInt(String(data.semester))
                    });
                    Toast.success('Student Registered Successfully! Default Password: password123');
                }
                window.location.hash = ROUTES.STUDENTS_LIST;
            } catch (err) {
                Toast.error(err.message);
                submitBtn.textContent = this.isEdit ? 'Save Changes' : 'Finalize Registration';
                submitBtn.disabled = false;
            }
        });

        card.appendChild(form);
        container.appendChild(card);
        return container;
    }
}
