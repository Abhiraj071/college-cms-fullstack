import { ApiService } from '../../../services/ApiService.js';
import { ROUTES } from '../../../services/Constants.js';
import { Toast } from '../../../services/Toast.js';

export class BulkSubjectForm {
    constructor() {
        this.parsedSubjects = [];
    }

    render() {
        const container = document.createElement('div');
        container.className = 'fade-in';
        container.style.maxWidth = '1000px';
        container.style.margin = '0 auto';

        const header = document.createElement('div');
        header.style.marginBottom = '2.5rem';
        header.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem; cursor: pointer; color: var(--text-secondary); margin-bottom: 1rem;" onclick="window.location.hash='${ROUTES.SUBJECTS_LIST}'">
                <span>← Back to Subjects</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                <div>
                    <h2 style="font-size: 2.2rem; margin: 0; letter-spacing: -1px;">📚 Bulk Subject Importer</h2>
                    <p style="color: var(--text-secondary); margin-top: 0.5rem; font-weight: 500;">Batch upload the institutional subject repository via Excel.</p>
                </div>
            </div>
        `;
        container.appendChild(header);

        const card = document.createElement('div');
        card.className = 'glass-panel';
        card.style.padding = '2.5rem';
        card.innerHTML = `
            <div id="dropZone" style="border: 2px dashed var(--glass-border); border-radius: 20px; padding: 5rem 2rem; text-align: center; cursor: pointer; transition: all 0.3s ease; background: rgba(255,255,255,0.02); margin-bottom: 2rem;">
                <div style="font-size: 3.5rem; margin-bottom: 1.5rem;">📊</div>
                <h3 style="margin: 0; font-size: 1.5rem; letter-spacing: -0.5px;">Select Excel Catalog</h3>
                <p style="color: var(--text-secondary); margin: 0.75rem 0 0; font-weight: 500;">Supported: .xlsx, .xls, .csv</p>
                <input type="file" id="fileInput" accept=".xlsx, .xls, .csv" style="display: none;">
            </div>

            <div style="background: var(--bg-secondary); border-radius: 12px; padding: 1.25rem; border: 1px solid var(--glass-border); margin-bottom: 2rem;">
                <h4 style="margin: 0 0 0.75rem; font-size: 0.9rem; color: var(--accent-color); text-transform: uppercase; letter-spacing: 0.5px;">📋 Expected Columns</h4>
                <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                    <code style="background: var(--bg-primary); padding: 4px 8px; border-radius: 4px; border: 1px solid var(--glass-border);">name*</code>
                    <code style="background: var(--bg-primary); padding: 4px 8px; border-radius: 4px; border: 1px solid var(--glass-border);">code</code>
                    <code style="background: var(--bg-primary); padding: 4px 8px; border-radius: 4px; border: 1px solid var(--glass-border);">type (Theory/Practical)</code>
                    <code style="background: var(--bg-primary); padding: 4px 8px; border-radius: 4px; border: 1px solid var(--glass-border);">description</code>
                </div>
            </div>

            <div id="previewArea" style="display: none;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h4 style="margin: 0;">Subjects Found (<span id="count">0</span>)</h4>
                </div>
                <div style="max-height: 400px; overflow-y: auto; border: 1px solid var(--glass-border); border-radius: 12px;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                        <thead style="background: var(--bg-secondary); position: sticky; top: 0; z-index: 1;">
                            <tr>
                                <th style="padding: 14px; text-align: left; border-bottom: 1px solid var(--glass-border);">Name</th>
                                <th style="padding: 14px; text-align: left; border-bottom: 1px solid var(--glass-border);">Code</th>
                                <th style="padding: 14px; text-align: left; border-bottom: 1px solid var(--glass-border);">Type</th>
                            </tr>
                        </thead>
                        <tbody id="previewBody"></tbody>
                    </table>
                </div>
                <div style="margin-top: 2.5rem; display: flex; justify-content: flex-end; gap: 1rem;">
                    <button id="importBtn" class="glass-button" style="background: var(--accent-color); color: white; border: none; font-weight: 700; padding: 12px 32px;">📥 Commit Import</button>
                </div>
            </div>
        `;

        const fileInput = card.querySelector('#fileInput');
        const dropZone = card.querySelector('#dropZone');
        const previewArea = card.querySelector('#previewArea');
        const previewBody = card.querySelector('#previewBody');
        const countSpan = card.querySelector('#count');
        const importBtn = card.querySelector('#importBtn');

        dropZone.onclick = () => fileInput.click();
        fileInput.onchange = (e) => this._handleFile(e.target.files[0], previewArea, previewBody, countSpan);

        importBtn.onclick = () => this._submitImport();

        container.appendChild(card);
        return container;
    }

    _handleFile(file, area, body, count) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(sheet);

                this.parsedSubjects = rows.filter(r => r.name).map(r => ({
                    name: String(r.name).trim(),
                    code: String(r.code || '').trim(),
                    type: String(r.type || 'Theory').trim(),
                    description: String(r.description || '').trim()
                }));

                if (this.parsedSubjects.length === 0) {
                    Toast.error('No subjects found in file. Ensure the sheet has a "name" column.');
                    return;
                }

                area.style.display = 'block';
                count.textContent = this.parsedSubjects.length;
                body.innerHTML = this.parsedSubjects.map(s => `
                    <tr>
                        <td style="padding: 14px; border-bottom: 1px solid var(--glass-border); font-weight: 700;">${s.name}</td>
                        <td style="padding: 14px; border-bottom: 1px solid var(--glass-border); color: var(--text-secondary); font-family: monospace;">${s.code}</td>
                        <td style="padding: 14px; border-bottom: 1px solid var(--glass-border); font-weight: 600;">${s.type}</td>
                    </tr>
                `).join('');
            } catch (err) {
                Toast.error('Format Error: ' + err.message);
            }
        };
        reader.readAsArrayBuffer(file);
    }

    async _submitImport() {
        const btn = document.getElementById('importBtn');
        btn.disabled = true;
        btn.textContent = '⏳ Processing...';

        try {
            // Backend probably doesn't have a bulk subject endpoint yet, let's check
            // If not, we'll loop or add it.
            let success = 0;
            for (const sub of this.parsedSubjects) {
                try {
                    await ApiService.addSubject(sub);
                    success++;
                } catch (e) { console.error('Failed to add subject:', sub.name, e); }
            }
            Toast.success(`Successfully imported ${success} subjects!`);
            window.location.hash = ROUTES.SUBJECTS_LIST;
        } catch (err) {
            Toast.error(err.message);
            btn.disabled = false;
            btn.textContent = '📥 Commit Import';
        }
    }
}
