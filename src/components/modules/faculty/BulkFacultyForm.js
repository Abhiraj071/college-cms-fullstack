/* global XLSX */
import { ApiService } from '../../../services/ApiService.js';
import { ROUTES } from '../../../services/Constants.js';
import { Toast } from '../../../services/Toast.js';

export class BulkFacultyForm {
    constructor() {
        this.parsedFaculty = [];
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
            <div style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; color: var(--text-secondary);" onclick="window.location.hash='${ROUTES.FACULTY_LIST}'">
                <span>← Back to List</span>
            </div>
            <h2 style="margin-top: 1rem; margin-bottom: 0.5rem;">Batch Faculty Import</h2>
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
                        <label>Department</label>
                        <input type="text" id="bulkDept" placeholder="e.g. Computer Science">
                    </div>
                    <div>
                        <label>Designation</label>
                        <input type="text" id="bulkDesignation" placeholder="e.g. Assistant Professor">
                    </div>
                    <div>
                        <label>Qualification</label>
                        <input type="text" id="bulkQual" placeholder="e.g. PhD, M.Tech">
                    </div>
                </div>
            </div>

            <div style="margin-bottom: 2rem;">
                <h3 style="margin-bottom: 1rem; font-size: 1.1rem;">Faculty List</h3>
                
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
                            <strong>Option 2:</strong> Paste from Excel
                        </p>
                        <textarea id="bulkData" placeholder="Paste data here... (Name, Email, Phone)" 
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

        /** @type {HTMLInputElement} */
        const deptInput = card.querySelector('#bulkDept');
        /** @type {HTMLInputElement} */
        const designationInput = card.querySelector('#bulkDesignation');
        /** @type {HTMLInputElement} */
        const qualInput = card.querySelector('#bulkQual');
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

        const renderPreview = (faculty) => {
            this.parsedFaculty = faculty;
            previewBody.innerHTML = '';

            faculty.forEach(f => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid rgba(255,255,255,0.02)';
                tr.innerHTML = `
                    <td style="padding: 12px;">${f.name}</td>
                    <td style="padding: 12px;">${f.email}</td>
                    <td style="padding: 12px; color: var(--text-secondary);">${f.phone}</td>
                `;
                previewBody.appendChild(tr);
            });

            if (this.parsedFaculty.length > 0) {
                previewArea.style.display = 'block';
                parsedCount.textContent = String(this.parsedFaculty.length);
                submitBtn.disabled = false;
                setTimeout(() => previewArea.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
            } else {
                previewArea.style.display = 'none';
                submitBtn.disabled = true;
            }
        };

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

                    // Expect columns: Name, Email, Phone
                    const faculty = data.slice(1)
                        .filter(row => row.length >= 2 && row[0] && row[1])
                        .map(row => ({
                            name: String(row[0]).trim(),
                            email: String(row[1]).trim(),
                            phone: row[2] ? String(row[2]).trim() : 'N/A'
                        }));

                    if (faculty.length === 0) {
                        throw new Error('No valid records found. Format: Name, Email, Phone');
                    }

                    renderPreview(faculty);
                    fileStatus.textContent = `File Ready: ${file.name} (${faculty.length} members)`;
                } catch (err) {
                    Toast.error(err.message);
                    fileStatus.textContent = 'Error parsing file.';
                    fileInput.value = '';
                }
            };
            reader.readAsBinaryString(file);
        });

        processBtn.addEventListener('click', () => {
            const text = bulkData.value.trim();
            if (!text) return Toast.error('Please enter data or upload a file');

            const lines = text.split('\n');
            const faculty = [];

            lines.forEach(line => {
                const trimmedLine = line.trim();
                if (!trimmedLine) return;

                let parts = trimmedLine.split(/[,|\t]/).map(p => p.trim());
                if (parts.length >= 2) {
                    faculty.push({
                        name: parts[0],
                        email: parts[1],
                        phone: parts[2] || 'N/A'
                    });
                }
            });

            if (faculty.length === 0) {
                return Toast.error('No valid records found in text.');
            }

            renderPreview(faculty);
            fileStatus.textContent = 'Text parsed successfully';
            fileInput.value = '';
        });

        submitBtn.addEventListener('click', async () => {
            if (!deptInput.value || !designationInput.value) {
                return Toast.error('Please provide default Department and Designation');
            }

            const confirmProceed = confirm(`Register ${this.parsedFaculty.length} faculty members?`);
            if (!confirmProceed) return;

            submitBtn.textContent = 'Registering...';
            submitBtn.disabled = true;

            try {
                const payload = {
                    facultyMembers: this.parsedFaculty,
                    department: deptInput.value,
                    designation: designationInput.value,
                    qualification: qualInput.value,
                    joinDate: new Date()
                };

                const response = await ApiService.addBulkFaculty(payload);

                if (response.results.failed > 0) {
                    Toast.warning(`Registered ${response.results.success}. ${response.results.failed} failed.`);
                    previewBody.innerHTML = '';
                    response.results.errors.forEach(err => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `<td colspan="3" style="padding: 12px; color: #ef4444; font-size: 0.9rem;">❌ ${err}</td>`;
                        previewBody.appendChild(tr);
                    });
                    submitBtn.textContent = 'Register Batch';
                    submitBtn.disabled = false;
                } else {
                    Toast.success(`Successfully registered ${response.results.success} members. Default Password: faculty123`);
                    window.location.hash = ROUTES.FACULTY_LIST;
                }
            } catch (err) {
                Toast.error(err.message);
                submitBtn.textContent = 'Register Batch';
                submitBtn.disabled = false;
            }
        });

        container.appendChild(card);
        return container;
    }
}
