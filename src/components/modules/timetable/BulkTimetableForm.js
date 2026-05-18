import { ApiService } from '../../../services/ApiService.js';
import { ROUTES } from '../../../services/Constants.js';
import { Toast } from '../../../services/Toast.js';

export class BulkTimetableForm {
    constructor() {
        this.selectedCourse = '';
        this.selectedYear = '';
        this.selectedSemester = '';
        this.courses = [];
        this.parsedGrid = {};
        this.days = [];
        this.timeSlots = [];
    }

    render() {
        const container = document.createElement('div');
        container.className = 'fade-in';
        container.style.maxWidth = '1100px';
        container.style.margin = '0 auto';

        const header = document.createElement('div');
        header.style.marginBottom = '2.5rem';
        header.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem; cursor: pointer; color: var(--text-secondary); margin-bottom: 1rem;" onclick="window.location.hash='${ROUTES.TIMETABLE}'">
                <span>← Back to Timetable</span>
            </div>
            <h2 style="font-size: 2.2rem; margin: 0; letter-spacing: -1px;">📅 Bulk Timetable Importer</h2>
            <p style="color: var(--text-secondary); margin-top: 0.5rem; font-weight: 500;">Import a full weekly schedule grid from Excel.</p>
        `;
        container.appendChild(header);

        const configGrid = document.createElement('div');
        configGrid.className = 'glass-panel';
        configGrid.style.padding = '2rem';
        configGrid.style.marginBottom = '2rem';
        configGrid.style.display = 'grid';
        configGrid.style.gridTemplateColumns = '1.5fr 1fr 1fr';
        configGrid.style.gap = '1.5rem';
        configGrid.innerHTML = `
            <div>
                <label>Program / Course</label>
                <select id="courseSelect" style="width: 100%;"><option value="">-- Select Course --</option></select>
            </div>
            <div>
                <label>Year</label>
                <select id="yearSelect" style="width: 100%;"><option value="">-- Year --</option></select>
            </div>
            <div>
                <label>Semester</label>
                <select id="semesterSelect" style="width: 100%;" disabled><option value="">-- Sem --</option></select>
            </div>
        `;
        container.appendChild(configGrid);

        const courseSelect = configGrid.querySelector('#courseSelect');
        const yearSelect = configGrid.querySelector('#yearSelect');
        const semesterSelect = configGrid.querySelector('#semesterSelect');

        ApiService.getCourses().then(courses => {
            this.courses = courses;
            courseSelect.innerHTML = '<option value="">-- Select Course --</option>' + courses.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
        });

        courseSelect.onchange = () => {
            this.selectedCourse = courseSelect.value;
            const course = this.courses.find(c => c.name === this.selectedCourse);
            yearSelect.innerHTML = '<option value="">-- Year --</option>';
            if (course) {
                for (let i = 1; i <= (course.duration || 4); i++) {
                    const opt = document.createElement('option');
                    opt.value = i; opt.textContent = `Year ${i}`;
                    yearSelect.appendChild(opt);
                }
            }
        };

        yearSelect.onchange = () => {
            this.selectedYear = yearSelect.value;
            semesterSelect.innerHTML = '<option value="">-- Sem --</option>';
            if (this.selectedYear) {
                semesterSelect.disabled = false;
                const y = parseInt(this.selectedYear);
                [ (y-1)*2 + 1, (y-1)*2 + 2 ].forEach(sem => {
                    const opt = document.createElement('option');
                    opt.value = sem; opt.textContent = `Sem ${sem}`;
                    semesterSelect.appendChild(opt);
                });
            } else { semesterSelect.disabled = true; }
        };

        semesterSelect.onchange = () => { this.selectedSemester = semesterSelect.value; };

        const uploadCard = document.createElement('div');
        uploadCard.className = 'glass-panel';
        uploadCard.style.padding = '2.5rem';
        uploadCard.innerHTML = `
            <div id="dropZone" style="border: 2px dashed var(--glass-border); border-radius: 20px; padding: 4rem 2rem; text-align: center; cursor: pointer; transition: all 0.3s ease; background: rgba(255,255,255,0.02); margin-bottom: 2rem;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">📑</div>
                <h3 style="margin: 0; font-size: 1.3rem;">Upload Timetable Spreadsheet</h3>
                <p style="color: var(--text-secondary); margin: 0.5rem 0 0;">Excel file with days as columns and time as rows.</p>
                <input type="file" id="fileInput" accept=".xlsx, .xls" style="display: none;">
            </div>

            <div id="previewArea" style="display: none;">
                <h4 style="margin: 0 0 1.5rem;">Grid Preview</h4>
                <div id="gridPreview" style="overflow-x: auto; border: 1px solid var(--glass-border); border-radius: 12px; background: var(--bg-secondary);"></div>
                <div style="margin-top: 2rem; display: flex; justify-content: flex-end; gap: 1rem;">
                    <button id="importBtn" class="glass-button" style="background: var(--accent-color); color: white; border: none; font-weight: 700; padding: 12px 32px;">💾 Save Timetable</button>
                </div>
            </div>
        `;
        container.appendChild(uploadCard);

        const fileInput = uploadCard.querySelector('#fileInput');
        const dropZone = uploadCard.querySelector('#dropZone');
        const previewArea = uploadCard.querySelector('#previewArea');
        const gridPreview = uploadCard.querySelector('#gridPreview');
        const importBtn = uploadCard.querySelector('#importBtn');

        dropZone.onclick = () => fileInput.click();
        fileInput.onchange = (e) => this._handleFile(e.target.files[0], previewArea, gridPreview);

        importBtn.onclick = () => this._submitImport();

        return container;
    }

    _handleFile(file, area, grid) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                // Find header row (the one that has DAYS/TIMINGS or Monday...)
                let headerIdx = -1;
                for(let i=0; i<rows.length; i++) {
                    if (rows[i] && rows[i].some(c => String(c).match(/monday|days|timings/i))) {
                        headerIdx = i;
                        break;
                    }
                }

                if (headerIdx === -1) {
                    Toast.error('Could not find header row in Excel. Ensure "Monday" or "DAYS" exists.');
                    return;
                }

                const headerRow = rows[headerIdx];
                this.days = headerRow.slice(1).filter(d => d).map(d => String(d).trim());
                this.timeSlots = [];
                this.parsedGrid = {};

                for (let i = headerIdx + 1; i < rows.length; i++) {
                    const row = rows[i];
                    if (!row || !row[0]) continue;

                    const time = String(row[0]).trim();
                    this.timeSlots.push(time);

                    for (let j = 1; j < row.length; j++) {
                        const day = this.days[j-1];
                        if (!day) continue;

                        const content = String(row[j] || '').trim();
                        if (!content) continue;

                        if (content.match(/lunch|break/i)) {
                            this.parsedGrid[`${day}::${time}`] = { subject: 'Lunch Break' };
                        } else {
                            // Format from image:
                            // C 1.6 (Code)
                            // Computer Fundamental... (Subject)
                            // Ms. Pooja Pal (Teacher)
                            const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l);
                            
                            let code = '', subject = '', teacher = '';
                            if (lines.length >= 3) {
                                code = lines[0];
                                teacher = lines[lines.length - 1]; // Last line is usually the faculty
                                subject = lines.slice(1, -1).join(' '); // Middle lines are the subject
                            } else if (lines.length === 2) {
                                subject = lines[0];
                                teacher = lines[1];
                            } else {
                                subject = lines[0];
                            }

                            this.parsedGrid[`${day}::${time}`] = { subject, teacher, code, room: '' };
                        }
                    }
                }

                this._renderPreview(area, grid);
            } catch (err) {
                Toast.error('Parse Error: ' + err.message);
            }
        };
        reader.readAsArrayBuffer(file);
    }

    _renderPreview(area, grid) {
        area.style.display = 'block';
        let html = '<table style="width:100%; border-collapse:collapse; font-size:0.75rem;">';
        html += `<tr style="background:var(--bg-primary);"><th style="padding:10px; border:1px solid var(--glass-border);">Time / Day</th>`;
        this.days.forEach(d => { html += `<th style="padding:10px; border:1px solid var(--glass-border);">${d}</th>`; });
        html += '</tr>';

        this.timeSlots.forEach(slot => {
            html += `<tr><td style="padding:10px; border:1px solid var(--glass-border); font-weight:700; background:var(--bg-primary);">${slot}</td>`;
            this.days.forEach(day => {
                const data = this.parsedGrid[`${day}::${slot}`];
                if (data) {
                    if (data.subject === 'Lunch Break') {
                        html += `<td style="padding:10px; border:1px solid var(--glass-border); text-align:center; background:rgba(0,0,0,0.05); color:var(--text-secondary); font-weight:800;">LUNCH</td>`;
                    } else {
                        html += `<td style="padding:10px; border:1px solid var(--glass-border);">
                            <div style="font-weight:800; color:var(--text-primary);">${data.subject}</div>
                            <div style="color:var(--text-secondary); font-size:0.7rem;">${data.teacher}</div>
                            <div style="color:var(--accent-color); font-size:0.65rem; font-weight:700;">${data.code}</div>
                        </td>`;
                    }
                } else {
                    html += `<td style="padding:10px; border:1px solid var(--glass-border); opacity:0.3;">—</td>`;
                }
            });
            html += '</tr>';
        });
        html += '</table>';
        grid.innerHTML = html;
    }

    async _submitImport() {
        if (!this.selectedCourse || !this.selectedYear || !this.selectedSemester) {
            Toast.error('Please select Course, Year, and Semester first.');
            return;
        }

        const btn = document.getElementById('importBtn');
        btn.disabled = true;
        btn.textContent = '⏳ Saving...';

        try {
            await ApiService.updateTimetable({
                course: this.selectedCourse,
                year: parseInt(this.selectedYear),
                semester: parseInt(this.selectedSemester),
                days: this.days,
                timeSlots: this.timeSlots,
                grid: this.parsedGrid
            });
            Toast.success('Timetable saved successfully!');
            window.location.hash = ROUTES.TIMETABLE;
        } catch (err) {
            Toast.error(err.message);
            btn.disabled = false;
            btn.textContent = '💾 Save Timetable';
        }
    }
}
