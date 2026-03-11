/* global XLSX */
import { ApiService } from '../../../services/ApiService.js';
import { ROUTES } from '../../../services/Constants.js';
import { Toast } from '../../../services/Toast.js';

export class BulkStudentForm {
    constructor() {
        this.courses = [];
        this.parsedStudents = [];
    }

    render() {
        const container = document.createElement('div');
        container.className = 'fade-in';
        container.style.maxWidth = '900px';
        container.style.margin = '0 auto';

        // Header
        const header = document.createElement('div');
        header.style.marginBottom = '2rem';
        header.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; color: var(--text-secondary);" onclick="window.location.hash='${ROUTES.STUDENTS_LIST}'">
                <span>← Back to List</span>
            </div>
            <h2 style="margin-top: 1rem; margin-bottom: 0.5rem;">Batch Student Import</h2>
        `;
        container.appendChild(header);

        const card = document.createElement('div');
        card.className = 'glass-panel';
        card.style.padding = '2.5rem';

        card.innerHTML = `
            <div style="margin-bottom: 2rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 2rem;">
                <h3 style="margin-bottom: 1.5rem; font-size: 1.1rem;">Batch Settings</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem;">
                    <div>
                        <label>Course / Program</label>
                        <select id="bulkCourse" required>
                            <option value="">Loading courses...</option>
                        </select>
                    </div>
                    <div>
                        <label>Current Semester</label>
                        <select id="bulkSem" required disabled>
                             <option value="">-- Select Course First --</option>
                        </select>
                    </div>
                </div>
            </div>

            <div style="margin-bottom: 2rem;">
                <h3 style="margin-bottom: 1rem; font-size: 1.1rem;">Student List</h3>
                
                <div style="display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem;">
                    <div style="flex: 1; min-width: 300px;">
                        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.75rem;">
                            <strong>Option 1:</strong> Upload Excel or CSV file
                        </p>
                        <div style="position: relative; height: 100px; border: 2px dashed var(--glass-border); border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(255,255,255,0.02); transition: all 0.3s ease; cursor: pointer;" 
                             id="dropZone"
                             onclick="document.getElementById('fileInput').click()">
                            <span style="font-size: 1.5rem; margin-bottom: 0.5rem;">📄</span>
                            <span id="fileStatus">Click or Drag & Drop Excel/CSV</span>
                            <input type="file" id="fileInput" accept=".xlsx, .xls, .csv" style="display: none;">
                        </div>
                    </div>
                    <div style="flex: 1; min-width: 300px;">
                        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.75rem;">
                            <strong>Option 2:</strong> Paste from Excel directly
                        </p>
                        <textarea id="bulkData" placeholder="Paste data here... (Name, RollNo, Email, Phone)" 
                            style="width: 100%; height: 100px; padding: 1rem; background: rgba(0,0,0,0.1); color: var(--text-primary); border: 1px solid var(--glass-border); border-radius: 12px; font-family: 'Courier New', Courier, monospace; font-size: 0.8rem;"></textarea>
                    </div>
                </div>
            </div>

            <div id="previewArea" style="display: none; margin-bottom: 2rem; animation: slideDown 0.3s ease;">
                <h3 style="margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
                    <span>Preview</span>
                    <span id="parsedCount" style="font-size: 0.8rem; background: var(--accent-color); color: white; padding: 2px 8px; border-radius: 10px;">0</span>
                </h3>
                <div style="overflow-x: auto; background: rgba(0,0,0,0.05); border-radius: 12px; border: 1px solid var(--glass-border);">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: rgba(255,255,255,0.03);">
                                <th style="padding: 12px; text-align: left; border-bottom: 1px solid var(--glass-border);">Name</th>
                                <th style="padding: 12px; text-align: left; border-bottom: 1px solid var(--glass-border);">Roll No / Username</th>
                                <th style="padding: 12px; text-align: left; border-bottom: 1px solid var(--glass-border);">Email</th>
                                <th style="padding: 12px; text-align: left; border-bottom: 1px solid var(--glass-border);">Phone</th>
                            </tr>
                        </thead>
                        <tbody id="previewBody"></tbody>
                    </table>
                </div>
            </div>

            <div style="border-top: 1px solid var(--glass-border); padding-top: 2rem; display: flex; justify-content: flex-end; gap: 1rem;">
                <button id="processBtn" class="glass-button" style="background: rgba(255,255,255,0.05); color: var(--text-primary);">Parse & Preview</button>
                <button id="submitBtn" class="glass-button" disabled>Register Batch</button>
            </div>
        `;

        /** @type {HTMLSelectElement} */
        const courseSelect = card.querySelector('#bulkCourse');
        /** @type {HTMLSelectElement} */
        const semSelect = card.querySelector('#bulkSem');
        /** @type {HTMLTextAreaElement} */
        const bulkData = card.querySelector('#bulkData');
        /** @type {HTMLElement} */
        const previewArea = card.querySelector('#previewArea');
        const previewBody = card.querySelector('#previewBody');
        /** @type {HTMLElement} */
        const parsedCount = card.querySelector('#parsedCount');
        /** @type {HTMLButtonElement} */
        const processBtn = card.querySelector('#processBtn');
        /** @type {HTMLButtonElement} */
        const submitBtn = card.querySelector('#submitBtn');
        /** @type {HTMLInputElement} */
        const fileInput = card.querySelector('#fileInput');
        /** @type {HTMLElement} */
        const fileStatus = card.querySelector('#fileStatus');

        const loadCourses = async () => {
            try {
                this.courses = await ApiService.getCourses();
                courseSelect.innerHTML = '<option value="">-- Select Course --</option>' +
                    this.courses.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
            } catch (err) {
                Toast.error('Failed to load courses');
                courseSelect.innerHTML = '<option value="">Error loading courses</option>';
            }
        };

        const updateSemesters = () => {
            const course = this.courses.find(c => c.name === courseSelect.value);
            semSelect.innerHTML = '<option value="">-- Select Semester --</option>';
            if (course) {
                semSelect.disabled = false;
                const maxSem = (course.duration || 4) * 2;
                for (let i = 1; i <= maxSem; i++) {
                    const opt = document.createElement('option');
                    opt.value = String(i);
                    opt.textContent = `Semester ${i}`;
                    semSelect.appendChild(opt);
                }
            } else {
                semSelect.disabled = true;
                semSelect.innerHTML = '<option value="">-- Select Course First --</option>';
            }
        };

        const renderPreview = (students) => {
            this.parsedStudents = students;
            previewBody.innerHTML = '';

            students.forEach(student => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid rgba(255,255,255,0.02)';
                tr.innerHTML = `
                    <td style="padding: 12px;">${student.name}</td>
                    <td style="padding: 12px;"><code style="color: var(--accent-color);">${student.rollNo}</code></td>
                    <td style="padding: 12px;">${student.email}</td>
                    <td style="padding: 12px; color: var(--text-secondary);">${student.phone}</td>
                `;
                previewBody.appendChild(tr);
            });

            if (this.parsedStudents.length > 0) {
                previewArea.style.display = 'block';
                parsedCount.textContent = String(this.parsedStudents.length);
                submitBtn.disabled = false;
                setTimeout(() => previewArea.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
            } else {
                previewArea.style.display = 'none';
                submitBtn.disabled = true;
            }
        };

        courseSelect.addEventListener('change', updateSemesters);

        fileInput.addEventListener('change', async (e) => {
            const input = /** @type {HTMLInputElement} */ (e.target);
            const file = input.files[0];
            if (!file) return;

            fileStatus.textContent = `Processing: ${file.name}...`;

            const reader = new FileReader();
            reader.onload = (evt) => {
                try {
                    const bstr = evt.target.result;
                    const wb = XLSX.read(bstr, { type: 'binary' });
                    const wsname = wb.SheetNames[0];
                    const ws = wb.Sheets[wsname];
                    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

                    // Map Excel columns to student object
                    // Assuming columns: Name, RollNo, Email, Phone
                    const students = data.slice(1) // Skip header
                        .filter(row => row.length >= 3 && row[0] && row[1] && row[2])
                        .map(row => ({
                            name: String(row[0]).trim(),
                            rollNo: String(row[1]).trim(),
                            email: String(row[2]).trim(),
                            phone: row[3] ? String(row[3]).trim() : 'N/A'
                        }));

                    if (students.length === 0) {
                        throw new Error('No valid student records found in file. Format should be: Name, RollNo, Email, Phone');
                    }

                    renderPreview(students);
                    fileStatus.textContent = `File Ready: ${file.name} (${students.length} students)`;
                } catch (err) {
                    Toast.error(err.message);
                    fileStatus.textContent = 'Error parsing file. Try again.';
                    fileInput.value = '';
                }
            };
            reader.readAsBinaryString(file);
        });

        processBtn.addEventListener('click', () => {
            const text = bulkData.value.trim();
            if (!text) return Toast.error('Please enter student data or upload a file first');

            const lines = text.split('\n');
            const students = [];

            lines.forEach(line => {
                const trimmedLine = line.trim();
                if (!trimmedLine) return;

                let parts = trimmedLine.split(/[,|\t]/).map(p => p.trim());
                if (parts.length >= 3) {
                    students.push({
                        name: parts[0],
                        rollNo: parts[1],
                        email: parts[2],
                        phone: parts[3] || 'N/A'
                    });
                }
            });

            if (students.length === 0) {
                return Toast.error('No valid records found in text. Format: Name, RollNo, Email');
            }

            renderPreview(students);
            fileStatus.textContent = 'Text parsed successfully';
            fileInput.value = ''; // Clear file input if text is used
        });

        submitBtn.addEventListener('click', async () => {
            if (!courseSelect.value || !semSelect.value) {
                return Toast.error('Please select both Course and Semester');
            }

            const confirmProceed = confirm(`Register ${this.parsedStudents.length} students to ${courseSelect.value} (Sem ${semSelect.value})?`);
            if (!confirmProceed) return;

            submitBtn.textContent = 'Registering...';
            submitBtn.disabled = true;

            try {
                const payload = {
                    students: this.parsedStudents.map(s => ({ ...s, phone: s.phone === 'N/A' ? '' : s.phone })),
                    course: courseSelect.value,
                    semester: parseInt(semSelect.value),
                    joinDate: new Date()
                };

                const response = await ApiService.addBulkStudents(payload);

                if (response.results.failed > 0) {
                    Toast.warning(`Registered ${response.results.success} students. ${response.results.failed} failed.`);

                    // Update preview with errors
                    previewBody.innerHTML = '';
                    response.results.errors.forEach(err => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `<td colspan="4" style="padding: 12px; color: #ef4444; font-size: 0.9rem; background: rgba(239, 68, 68, 0.05);">❌ ${err}</td>`;
                        previewBody.appendChild(tr);
                    });

                    // Re-enable parse button if they want to fix data
                    submitBtn.textContent = 'Register Batch';
                    submitBtn.disabled = false;
                } else {
                    Toast.success(`Registration complete! ${response.results.success} students added.`);
                    window.location.hash = ROUTES.STUDENTS_LIST;
                }
            } catch (err) {
                Toast.error(err.message);
                submitBtn.textContent = 'Register Batch';
                submitBtn.disabled = false;
            }
        });

        loadCourses();
        container.appendChild(card);
        return container;
    }
}
