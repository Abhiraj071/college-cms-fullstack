import { ApiService } from '../../../services/ApiService.js';
import { ValidationService as VS } from '../../../services/ValidationService.js';
import { ROUTES } from '../../../services/Constants.js';
import { Toast } from '../../../services/Toast.js';

export class FacultyForm {
    constructor(facultyId = null) {
        this.facultyId = facultyId;
        this.isEdit = !!facultyId;
        this.facultyData = null;
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
            <div style="display: flex; align-items: center; gap: 1rem; cursor: pointer; color: var(--text-secondary);" onclick="window.location.hash='${ROUTES.FACULTY_LIST}'">
                <span>← Back to List</span>
            </div>
            <h2 style="margin-top: 1rem;">${this.isEdit ? 'Edit Faculty Member' : 'Add New Faculty'}</h2>
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
                    <label>Full Name</label>
                    <input type="text" name="name" placeholder="e.g. Prof. Sarah Doe" required>
                </div>
                <div>
                    <label>Email Address</label>
                    <input type="email" name="email" placeholder="sarah.doe@college.edu" required>
                </div>
                <div>
                    <label>Phone Number</label>
                    <input type="tel" name="phone" placeholder="+1 (555) 000-0000">
                </div>
                ${!this.isEdit ? `
                <div>
                    <label>Username (Login ID)</label>
                    <input type="text" name="username" placeholder="s.doe123" required>
                </div>
                ` : ''}
                <div>
                    <label>Assigned Program</label>
                    <select name="department" id="deptSelect" required>
                        <option value="">Loading programs...</option>
                    </select>
                </div>
                <div>
                    <label>Designation</label>
                    <input type="text" name="designation" placeholder="e.g. Associate Professor" required>
                </div>
                <div>
                    <label>Qualification</label>
                    <input type="text" name="qualification" placeholder="e.g. PhD in Computer Science" required>
                </div>
            </div>

            <div style="border-top: 1px solid var(--glass-border); padding-top: 2rem; display: flex; justify-content: flex-end; gap: 1rem;">
                <button type="button" class="glass-button" style="background: transparent;" onclick="window.history.back()">Cancel</button>
                <button type="submit" id="submitBtn" class="glass-button">${this.isEdit ? 'Save Changes' : 'Add Faculty Member'}</button>
            </div>
        `;

        /** @type {HTMLButtonElement} */
        const submitBtn = form.querySelector('#submitBtn');
        /** @type {HTMLSelectElement} */
        const deptSelect = form.querySelector('#deptSelect');

        const initForm = async () => {
            try {
                const courses = await ApiService.getCourses();
                deptSelect.innerHTML = '<option value="">-- Select Program --</option>' +
                    courses.map(c => `<option value="${c.name}">${c.name}</option>`).join('') +
                    '<option value="General">General Faculty</option>';

                if (this.isEdit) {
                    const allFaculty = await ApiService.getFaculty();
                    this.facultyData = allFaculty.find(f => f._id === this.facultyId);

                    if (this.facultyData) {
                        form.elements['name'].value = this.facultyData.name;
                        form.elements['email'].value = this.facultyData.email;
                        form.elements['phone'].value = this.facultyData.phone || '';
                        form.elements['department'].value = this.facultyData.department || '';
                        form.elements['designation'].value = this.facultyData.designation || '';
                        form.elements['qualification'].value = this.facultyData.qualification || '';
                    } else {
                        Toast.error('Faculty member not found');
                        window.location.hash = ROUTES.FACULTY_LIST;
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
            if (!VS.validateRequired(data.name)) { VS.highlightError(form.elements['name'], 'Full name is required'); isValid = false; }
            if (!VS.validateEmail(data.email)) { VS.highlightError(form.elements['email'], 'Valid email is required'); isValid = false; }
            if (!this.isEdit && !VS.validateRequired(data.username)) { VS.highlightError(form.elements['username'], 'Username is required'); isValid = false; }
            if (!VS.validateRequired(data.department)) { VS.highlightError(form.elements['department'], 'Please select a program'); isValid = false; }
            if (!VS.validateRequired(data.designation)) { VS.highlightError(form.elements['designation'], 'Designation is required'); isValid = false; }
            if (!VS.validateRequired(data.qualification)) { VS.highlightError(form.elements['qualification'], 'Qualification is required'); isValid = false; }

            if (!isValid) return;

            submitBtn.textContent = 'Processing...';
            submitBtn.disabled = true;

            try {
                if (this.isEdit) {
                    await ApiService.updateFaculty(this.facultyId, data);
                    Toast.success('Faculty Member Updated Successfully!');
                } else {
                    await ApiService.addFaculty({
                        ...data,
                        joinDate: new Date().toISOString().split('T')[0]
                    });
                    Toast.success('Faculty Added Successfully! Default Password: faculty123');
                }
                window.location.hash = ROUTES.FACULTY_LIST;
            } catch (err) {
                Toast.error(err.message);
                submitBtn.textContent = this.isEdit ? 'Save Changes' : 'Add Faculty Member';
                submitBtn.disabled = false;
            }
        });

        card.appendChild(form);
        container.appendChild(card);

        return container;
    }
}
