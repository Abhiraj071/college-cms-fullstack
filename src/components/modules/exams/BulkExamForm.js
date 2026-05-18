import { ApiService } from '../../../services/ApiService.js';
import { ROUTES } from '../../../services/Constants.js';
import { Toast } from '../../../services/Toast.js';

export class BulkExamForm {
    constructor() {
        this.examData = {
            title: '',
            course: '',
            venue: ''
        };
        this.parsedSchedules = [];
        this.courses = [];
    }

    render() {
        const container = document.createElement('div');
        container.className = 'fade-in';
        container.style.maxWidth = '1000px';
        container.style.margin = '0 auto';

        const header = document.createElement('div');
        header.style.marginBottom = '2.5rem';
        header.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem; cursor: pointer; color: var(--text-secondary); margin-bottom: 1rem;" onclick="window.location.hash='${ROUTES.EXAMS_LIST}'">
                <span>← Back to Examinations</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                <div>
                    <h2 style="font-size: 2.2rem; margin: 0; letter-spacing: -1px;">📤 Bulk Exam Scheduler</h2>
                    <p style="color: var(--text-secondary); margin-top: 0.5rem; font-weight: 500;">Import full examination schedules from Excel documents.</p>
                </div>
            </div>
        `;
        container.appendChild(header);

        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = '350px 1fr';
        grid.style.gap = '2rem';

        // Left Side: Config
        const leftSide = document.createElement('div');
        leftSide.className = 'glass-panel';
        leftSide.style.padding = '2rem';
        leftSide.innerHTML = `
            <h3 style="margin-top: 0; margin-bottom: 1.5rem; font-size: 1.1rem;">1. Configuration</h3>
            
            <div style="margin-bottom: 1.5rem;">
                <label>Exam Series Title</label>
                <input type="text" id="examTitle" placeholder="e.g. Semester Exam June 2025" style="width: 100%;">
            </div>

            <div style="margin-bottom: 1.5rem;">
                <label>Target Course</label>
                <select id="courseSelect" style="width: 100%;">
                    <option value="">-- Select Course --</option>
                </select>
            </div>

            <div style="margin-bottom: 2rem;">
                <label>Default Venue</label>
                <input type="text" id="defaultVenue" placeholder="e.g. MSME Exam Hall" style="width: 100%;">
            </div>

            <div style="padding: 1.25rem; background: var(--bg-secondary); border-radius: 12px; border: 1px dashed var(--glass-border);">
                <p style="margin: 0 0 1rem; font-size: 0.85rem; font-weight: 700; color: var(--accent-color);">📋 Expected Format</p>
                <p style="margin: 0; font-size: 0.75rem; color: var(--text-secondary); line-height: 1.6;">
                    The Excel sheet should have 7 columns:<br>
                    <strong>Date | Sub1 | Code1 | Time1 | Sub2 | Code2 | Time2</strong><br><br>
                    This allows for two sessions per day as shown in your schedule image.
                </p>
            </div>
        `;

        ApiService.getCourses().then(courses => {
            this.courses = courses;
            const select = leftSide.querySelector('#courseSelect');
            courses.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.name;
                opt.textContent = c.name;
                select.appendChild(opt);
            });
        });

        // Right Side: Upload & Preview
        const rightSide = document.createElement('div');
        rightSide.className = 'glass-panel';
        rightSide.style.padding = '2rem';
        rightSide.innerHTML = `
            <h3 style="margin-top: 0; margin-bottom: 1.5rem; font-size: 1.1rem;">2. Upload & Preview</h3>
            
            <div id="dropZone" style="border: 2px dashed var(--glass-border); border-radius: 16px; padding: 4rem 2rem; text-align: center; cursor: pointer; transition: all 0.3s ease; background: rgba(255,255,255,0.02);">
                <div style="font-size: 3rem; margin-bottom: 1rem;">📄</div>
                <h4 style="margin: 0; font-size: 1.2rem;">Drop Excel file here</h4>
                <p style="color: var(--text-secondary); margin: 0.5rem 0 0;">or click to browse from computer</p>
                <input type="file" id="fileInput" accept=".xlsx, .xls, .csv" style="display: none;">
            </div>

            <div id="previewArea" style="margin-top: 2rem; display: none;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h4 style="margin: 0;">Schedule Preview</h4>
                    <span id="rowCount" style="font-size: 0.8rem; font-weight: 700; background: var(--accent-glow); color: var(--accent-color); padding: 4px 12px; border-radius: 20px;">0 Exams Parsed</span>
                </div>
                <div style="max-height: 400px; overflow-y: auto; border: 1px solid var(--glass-border); border-radius: 12px;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                        <thead style="background: var(--bg-secondary); position: sticky; top: 0; z-index: 1;">
                            <tr>
                                <th style="padding: 12px; text-align: left; border-bottom: 1px solid var(--glass-border);">Date</th>
                                <th style="padding: 12px; text-align: left; border-bottom: 1px solid var(--glass-border);">Session</th>
                                <th style="padding: 12px; text-align: left; border-bottom: 1px solid var(--glass-border);">Subject</th>
                                <th style="padding: 12px; text-align: left; border-bottom: 1px solid var(--glass-border);">Code</th>
                                <th style="padding: 12px; text-align: left; border-bottom: 1px solid var(--glass-border);">Time</th>
                            </tr>
                        </thead>
                        <tbody id="previewBody"></tbody>
                    </table>
                </div>
                
                <div style="margin-top: 2rem; display: flex; justify-content: flex-end; gap: 1rem;">
                    <button id="clearBtn" class="glass-button" style="background: transparent;">Reset</button>
                    <button id="importBtn" class="glass-button" style="background: var(--accent-color); color: white; border: none; font-weight: 700; padding: 12px 30px;">🗓️ Schedule All Exams</button>
                </div>
            </div>
        `;

        const dropZone = rightSide.querySelector('#dropZone');
        const fileInput = rightSide.querySelector('#fileInput');
        const previewArea = rightSide.querySelector('#previewArea');
        const previewBody = rightSide.querySelector('#previewBody');
        const rowCount = rightSide.querySelector('#rowCount');

        dropZone.onclick = () => fileInput.click();
        
        dropZone.ondragover = (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'var(--accent-color)';
            dropZone.style.background = 'var(--accent-glow)';
        };

        dropZone.ondragleave = () => {
            dropZone.style.borderColor = 'var(--glass-border)';
            dropZone.style.background = 'rgba(255,255,255,0.02)';
        };

        dropZone.ondrop = (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'var(--glass-border)';
            dropZone.style.background = 'rgba(255,255,255,0.02)';
            const file = e.dataTransfer.files[0];
            if (file) this._handleFile(file, previewArea, previewBody, rowCount);
        };

        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) this._handleFile(file, previewArea, previewBody, rowCount);
        };

        rightSide.querySelector('#clearBtn').onclick = () => {
            previewArea.style.display = 'none';
            this.parsedSchedules = [];
            fileInput.value = '';
        };

        rightSide.querySelector('#importBtn').onclick = () => this._submitImport();

        grid.appendChild(leftSide);
        grid.appendChild(rightSide);
        container.appendChild(grid);

        return container;
    }

    _handleFile(file, previewArea, previewBody, rowCount) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                // Row format based on image:
                // Column 0: Date
                // Column 1: Sub 1, Column 2: Code 1, Column 3: Time 1
                // Column 4: Sub 2, Column 5: Code 2, Column 6: Time 2
                
                this.parsedSchedules = [];
                
                // Skip header rows (start from row 1 or 2)
                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i];
                    if (!row || row.length < 2) continue;

                    const dateVal = row[0];
                    if (!dateVal) continue;

                    // Parse Date (handles Excel serial numbers or strings)
                    let dateStr = '';
                    if (typeof dateVal === 'number') {
                        const dateObj = XLSX.utils.format_cell({ v: dateVal, t: 'd' });
                        dateStr = new Date(dateVal * 86400000 - (25567 + 1) * 86400000).toISOString().split('T')[0];
                    } else {
                        dateStr = String(dateVal);
                    }

                    // Session 1
                    if (row[1] && String(row[1]).trim().length > 1) {
                        this.parsedSchedules.push({
                            date: dateStr,
                            subject: String(row[1]).trim(),
                            code: String(row[2] || '').trim(),
                            time: String(row[3] || '').trim(),
                            session: 'Morning'
                        });
                    }

                    // Session 2
                    if (row[4] && String(row[4]).trim().length > 1) {
                        this.parsedSchedules.push({
                            date: dateStr,
                            subject: String(row[4]).trim(),
                            code: String(row[5] || '').trim(),
                            time: String(row[6] || '').trim(),
                            session: 'Afternoon'
                        });
                    }
                }

                this._renderPreview(previewArea, previewBody, rowCount);
            } catch (err) {
                console.error(err);
                Toast.error('Failed to parse Excel file. Ensure it follows the required format.');
            }
        };
        reader.readAsArrayBuffer(file);
    }

    _renderPreview(area, body, count) {
        area.style.display = 'block';
        count.textContent = `${this.parsedSchedules.length} Exams Parsed`;
        
        body.innerHTML = this.parsedSchedules.map(s => `
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid var(--glass-border); font-weight: 700;">${s.date}</td>
                <td style="padding: 12px; border-bottom: 1px solid var(--glass-border);">
                    <span style="font-size: 0.7rem; font-weight: 800; padding: 2px 8px; border-radius: 4px; background: ${s.session === 'Morning' ? 'rgba(99,102,241,0.1)' : 'rgba(245,158,11,0.1)'}; color: ${s.session === 'Morning' ? 'var(--accent-color)' : '#f59e0b'}; text-transform: uppercase;">
                        ${s.session}
                    </span>
                </td>
                <td style="padding: 12px; border-bottom: 1px solid var(--glass-border); font-weight: 600;">${s.subject}</td>
                <td style="padding: 12px; border-bottom: 1px solid var(--glass-border); color: var(--text-secondary);">${s.code}</td>
                <td style="padding: 12px; border-bottom: 1px solid var(--glass-border); font-weight: 700; color: var(--accent-color);">${s.time}</td>
            </tr>
        `).join('');
    }

    async _submitImport() {
        const title = document.getElementById('examTitle').value.trim();
        const course = document.getElementById('courseSelect').value;
        const venue = document.getElementById('defaultVenue').value.trim();

        if (!title || !course) {
            Toast.error('Please provide an Exam Title and select a Course.');
            return;
        }

        if (this.parsedSchedules.length === 0) {
            Toast.error('No schedules found to import.');
            return;
        }

        const importBtn = document.getElementById('importBtn');
        importBtn.disabled = true;
        importBtn.textContent = '⏳ Processing...';

        try {
            // First, try to match subjects to existing ones in the system to get IDs
            const allSubjects = await ApiService.getSubjects();
            
            const schedules = this.parsedSchedules.map(s => {
                // Find matching subject by name or code
                const matchedSubject = allSubjects.find(sub => 
                    sub.name.toLowerCase() === s.subject.toLowerCase() || 
                    (sub.code && sub.code.toLowerCase() === s.code.toLowerCase())
                );

                return {
                    subjectId: matchedSubject ? matchedSubject._id : null,
                    name: s.subject,
                    code: s.code,
                    date: s.date,
                    time: s.time,
                    venue: venue || 'TBA',
                    maxTotal: 100, // Default values
                    maxTheory: 70,
                    maxSessional: 30
                };
            });

            const examObj = {
                title,
                course,
                venue,
                subjectSchedules: schedules,
                // Legacy fields
                subject: schedules.map(s => s.name).join(', '),
                date: schedules[0]?.date || '',
                time: schedules[0]?.time || '',
                totalMarks: 100,
                room: venue || ''
            };

            await ApiService.addExam(examObj);
            Toast.success(`Successfully scheduled ${schedules.length} exams for ${course}`);
            window.location.hash = ROUTES.EXAMS_LIST;
        } catch (err) {
            console.error(err);
            Toast.error('Import failed: ' + err.message);
            importBtn.disabled = false;
            importBtn.textContent = '🗓️ Schedule All Exams';
        }
    }
}
