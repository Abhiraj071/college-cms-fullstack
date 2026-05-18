import { ApiService } from '../../../services/ApiService.js';
import { ValidationService as VS } from '../../../services/ValidationService.js';
import { ROUTES } from '../../../services/Constants.js';
import { Toast } from '../../../services/Toast.js';

export class MarkEntry {
    constructor() {
        const hash = window.location.hash;
        const urlParams = new URLSearchParams(hash.split('?')[1]);
        this.examId = urlParams.get('id');
        this.exam = null;
        this.students = [];
        this.existingMarks = [];
    }

    calculateGrade(marks, total) {
        const percentage = (marks / total) * 100;
        if (percentage >= 90) return 'A+';
        if (percentage >= 80) return 'A';
        if (percentage >= 70) return 'B';
        if (percentage >= 60) return 'C';
        if (percentage >= 50) return 'D';
        return 'F';
    }

    render() {
        const container = document.createElement('div');
        container.className = 'fade-in';

        if (!this.examId) {
            container.innerHTML = `<div class="glass-panel" style="padding: 2rem;">Error: No exam specified. 
                <button class="glass-button" onclick="window.location.hash='${ROUTES.EXAMS_LIST}'">Go Back</button></div>`;
            return container;
        }

        const loadContent = async () => {
            container.innerHTML = '<div style="padding: 4rem; text-align: center;">Loading student records and exam data...</div>';
            try {
                // 1. Fetch Exam Details
                const allExams = await ApiService.getExams();
                this.exam = allExams.find(e => e._id === this.examId);

                if (!this.exam) {
                    container.innerHTML = '<p>Exam not found.</p>';
                    return;
                }

                // 2. Fetch All Students (to filter by course)
                const allStudents = await ApiService.getStudents();
                this.students = allStudents.filter(s => s.course === this.exam.course);

                // 3. Fetch Existing Marks
                this.existingMarks = await ApiService.getMarksByExam(this.examId);

                this.renderForm(container);
            } catch (err) {
                Toast.error('Failed to load data: ' + err.message);
                container.innerHTML = '<p>Error loading content.</p>';
            }
        };

        loadContent();
        return container;
    }

    renderForm(container) {
        container.innerHTML = '';
        const exam = this.exam;
        const students = this.students;
        const max = exam.totalMarks || 100;

        // Header
        const header = document.createElement('div');
        header.style.marginBottom = '2rem';
        header.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem; cursor: pointer; color: var(--text-secondary);" onclick="window.location.hash='${ROUTES.EXAMS_LIST}'">
                <span>← Back to Exams</span>
            </div>
            <h2 style="margin-top: 1rem;">Enter Marks: <span style="color: var(--accent-color);">${exam.title}</span></h2>
            <p style="color: var(--text-secondary);">Subject: ${exam.subject} (${exam.course}) • Max Marks: ${max}</p>
        `;
        container.appendChild(header);

        // Stats Summary
        const statsRow = document.createElement('div');
        statsRow.style.display = 'grid';
        statsRow.style.gridTemplateColumns = 'repeat(auto-fit, minmax(150px, 1fr))';
        statsRow.style.gap = '1rem';
        statsRow.style.marginBottom = '2rem';
        container.appendChild(statsRow);

        const card = document.createElement('div');
        card.className = 'glass-panel';
        card.style.padding = '0';
        card.style.overflow = 'hidden';

        const form = document.createElement('form');
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';

        if (students.length === 0) {
            table.innerHTML = `<tr><td style="padding: 2rem; text-align: center;">No students enrolled in "${exam.course}"</td></tr>`;
        } else {
            table.innerHTML = `
                <thead>
                    <tr style="background: rgba(0,0,0,0.02); border-bottom: 1px solid var(--glass-border);">
                        <th style="text-align: left; padding: 1.2rem;">Roll No</th>
                        <th style="text-align: left; padding: 1.2rem;">Student</th>
                        <th style="text-align: center; padding: 1.2rem; width: 150px;">Marks / ${max}</th>
                        <th style="text-align: center; padding: 1.2rem; width: 100px;">Grade</th>
                    </tr>
                </thead>
                <tbody>
                    ${students.map(s => {
                const markEntry = this.existingMarks.find(m => m.studentId?._id === s._id || m.studentId === s._id);
                const marks = markEntry ? markEntry.marksObtained : '';
                const grade = marks !== '' ? this.calculateGrade(marks, max) : '-';

                return `
                        <tr style="border-bottom: 1px solid var(--glass-border);">
                            <td style="padding: 1rem;">${s.rollNo}</td>
                            <td style="padding: 1rem;">
                                <div style="font-weight: 500;">${s.name}</div>
                                <div style="font-size: 0.75rem; color: var(--text-secondary);">${s.semester} Semester</div>
                            </td>
                            <td style="padding: 1rem; text-align: center;">
                                <input type="number" name="marks_${s._id}" value="${marks}" step="0.5"
                                    class="mark-input" data-student="${s._id}"
                                    style="width: 80px; padding: 8px; text-align: center; border-radius: 6px; background: rgba(0,0,0,0.03); border: 1px solid var(--glass-border);">
                            </td>
                            <td style="padding: 1rem; text-align: center;">
                                <span id="grade_${s._id}" style="font-weight: bold; color: var(--accent-color);">${grade}</span>
                            </td>
                        </tr>
                        `;
            }).join('')}
                </tbody>
            `;
        }

        const updateStats = () => {
            const values = Array.from(form.querySelectorAll('.mark-input'))
                .map(i => parseFloat(/** @type {HTMLInputElement} */(i).value))
                .filter(v => !isNaN(v));

            const count = values.length;
            const avg = count ? (values.reduce((a, b) => a + b, 0) / count).toFixed(1) : 0;
            const high = count ? Math.max(...values) : 0;

            statsRow.innerHTML = `
                <div class="glass-panel" style="padding: 1rem; text-align: center;">
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">Avg. Marks</div>
                    <div style="font-size: 1.5rem; font-weight: bold;">${avg}</div>
                </div>
                <div class="glass-panel" style="padding: 1rem; text-align: center;">
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">Highest</div>
                    <div style="font-size: 1.5rem; font-weight: bold; color: var(--success);">${high}</div>
                </div>
                <div class="glass-panel" style="padding: 1rem; text-align: center;">
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">Submissions</div>
                    <div style="font-size: 1.5rem; font-weight: bold;">${count} / ${students.length}</div>
                </div>
            `;
        };

        table.addEventListener('input', (e) => {
            const target = /** @type {HTMLInputElement} */ (e.target);
            if (target.classList.contains('mark-input')) {
                const val = target.value;
                const sId = target.dataset.student;
                const gradeSpan = table.querySelector(`#grade_${sId}`);

                if (val !== '' && !isNaN(parseFloat(val))) {
                    if (parseFloat(val) > max) {
                        VS.highlightError(target, `Max: ${max}`);
                        gradeSpan.textContent = '!';
                    } else {
                        const grade = this.calculateGrade(parseFloat(val), max);
                        gradeSpan.textContent = grade;
                    }
                } else {
                    gradeSpan.textContent = '-';
                }
                updateStats();
            }
        });

        form.appendChild(table);

        const footer = document.createElement('div');
        footer.style.padding = '1.5rem';
        footer.style.display = 'flex';
        footer.style.justifyContent = 'flex-end';
        footer.style.background = 'rgba(0,0,0,0.02)';

        if (students.length > 0) {
            const saveBtn = document.createElement('button');
            saveBtn.className = 'glass-button';
            saveBtn.id = 'saveBtn';
            saveBtn.textContent = 'Capture Final Grades';
            footer.appendChild(saveBtn);
        }

        form.appendChild(footer);
        card.appendChild(form);
        container.appendChild(card);

        updateStats();

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            VS.clearErrors(form);

            const saveBtn = form.querySelector('#saveBtn');
            if (!(saveBtn instanceof HTMLButtonElement)) return;

            saveBtn.textContent = 'Saving Records...';
            saveBtn.disabled = true;

            const formData = new FormData(form);
            let errors = 0;
            let count = 0;

            try {
                for (const [key, value] of formData.entries()) {
                    if (key.startsWith('marks_') && value !== '') {
                        const sId = key.replace('marks_', '');

                        const marks = parseFloat(value.toString());
                        const inputElement = /** @type {HTMLInputElement} */ (form.querySelector(`input[name="${key}"]`));

                        if (!VS.validateMarks(marks, max)) {
                            VS.highlightError(inputElement, `0-${max}`);
                            errors++;
                            continue;
                        }

                        // Save individually (or we could Batch if backend supported)
                        await ApiService.updateMarks({
                            examId: this.examId,
                            studentId: sId,
                            marksObtained: marks
                        });
                        count++;
                    }
                }

                if (errors > 0) {
                    Toast.warning(`Marks saved for ${count} students, but ${errors} entries had errors.`);
                    if (saveBtn instanceof HTMLButtonElement) {
                        saveBtn.textContent = 'Capture Final Grades';
                        saveBtn.disabled = false;
                    }
                } else {
                    Toast.success(`Academic performance records updated for ${count} students!`);
                    window.location.hash = ROUTES.EXAMS_LIST;
                }
            } catch (err) {
                Toast.error(err.message);
                if (saveBtn instanceof HTMLButtonElement) {
                    saveBtn.textContent = 'Capture Final Grades';
                    saveBtn.disabled = false;
                }
            }
        });
    }
}
