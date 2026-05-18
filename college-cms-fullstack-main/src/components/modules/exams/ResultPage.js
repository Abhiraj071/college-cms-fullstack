import { ApiService } from '../../../services/ApiService.js';
import { auth } from '../../../services/AuthService.js';
import { Toast } from '../../../services/Toast.js';
import { Modal } from '../../../services/Modal.js';
import { ROUTES } from '../../../services/Constants.js';

export class ResultPage {
    constructor(id) {
        this.examId = id;
        this.results = [];
        this.students = [];
        this.subjects = [];
        this.exam = null;
    }

    render() {
        const user = auth.getUser();
        this.container = document.createElement('div');
        this.container.className = 'fade-in';
        
        this.init();
        return this.container;
    }

    async init() {
        this.container.innerHTML = `
            <div style="padding: 5rem; text-align: center;">
                <div class="loader-spinner" style="width: 40px; height: 40px; border: 4px solid var(--accent-glow); border-top-color: var(--accent-color); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1.5rem;"></div>
                <p>Loading Results...</p>
            </div>
        `;

        try {
            const exams = await ApiService.getExams();
            this.exam = exams.find(e => e._id === this.examId);
            if (!this.exam) throw new Error('Exam not found');

            this.results = await ApiService.getMarksByExam(this.examId);
            const user = auth.getUser();

            let filteredResults = this.results;

            if (user.role === 'student') {
                // If student, find their profile and filter to only show their result
                const students = await ApiService.getStudents();
                const myProfile = students.find(s => String(s.userId?._id || s.userId || s.userId?.id) === String(user.id || user._id));
                
                if (myProfile) {
                    filteredResults = this.results.filter(r => String(r.student?._id || r.student) === String(myProfile._id));
                } else {
                    filteredResults = [];
                }
            }

            this.renderPage(filteredResults);

        } catch (err) {
            Toast.error(err.message);
            this.container.innerHTML = `<div class="glass-panel"><p style="color:red; text-align:center;">Failed to load results.</p></div>`;
        }
    }

    renderPage(resultsData) {
        const user = auth.getUser();
        let html = `
            <div style="margin-bottom: 2.5rem; display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 1.5rem;">
                <div>
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 0.5rem;" onclick="window.location.hash='${ROUTES.EXAMS}'" class="nav-back">
                        <span style="font-size: 1.5rem; cursor: pointer;">⬅️</span>
                        <h2 style="font-size: 2rem; margin: 0; letter-spacing: -1px; cursor: pointer;">${this.exam?.title} Results</h2>
                    </div>
                    <p style="color: var(--text-secondary); font-size: 1rem; font-weight: 500;">
                        ${this.exam?.course} - Semester ${this.exam?.semester}
                    </p>
                </div>
                ${user.role === 'admin' ? `
                <div style="display:flex; gap: 1rem;">
                    <button class="glass-button" id="import-btn" style="padding: 10px 20px;">📥 Import Results (Excel)</button>
                    <!-- <button class="glass-button" id="add-manual" style="background:var(--accent-color); color:white;">➕ Add Details</button> -->
                </div>` : ''}
            </div>

            <div class="glass-panel" style="padding:0; overflow:hidden;">
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; text-align: left;">
                        <thead style="background: var(--bg-secondary); font-size: 0.75rem; text-transform: uppercase;">
                            <tr>
                                <th style="padding: 1rem;">Student Name</th>
                                <th style="padding: 1rem;">Enrolment No</th>
                                <th style="padding: 1rem;">Score</th>
                                <th style="padding: 1rem;">Percentage</th>
                                <th style="padding: 1rem;">Status</th>
                                <th style="padding: 1rem; text-align:center;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${resultsData.length === 0 ? `<tr><td colspan="6" style="padding: 2rem; text-align:center; color:var(--text-secondary);">No results published.</td></tr>` : 
                            resultsData.map(r => `
                                <tr style="border-bottom: 1px solid var(--glass-border);">
                                    <td style="padding: 1rem; font-weight:600;">${r.student?.name || 'Unknown'}</td>
                                    <td style="padding: 1rem; color:var(--text-secondary); font-size:0.85rem;">${r.student?.enrollNo || 'N/A'}</td>
                                    <td style="padding: 1rem; font-weight:800;">${r.totalScore}</td>
                                    <td style="padding: 1rem; font-weight:800;">${r.percentage}%</td>
                                    <td style="padding: 1rem;">
                                        <span style="padding:4px 8px; border-radius:4px; font-size:0.7rem; font-weight:800; background: ${r.overallStatus==='Pass' ? 'var(--success)' : 'var(--danger)'}; color:white;">${r.overallStatus}</span>
                                    </td>
                                    <td style="padding: 1rem; text-align:center;">
                                        <button class="glass-button view-mark-btn" data-id="${r._id}" style="padding: 6px 12px; font-size:0.75rem;">Marksheet</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        this.container.innerHTML = html;

        this.container.querySelectorAll('.view-mark-btn').forEach(btn => {
            btn.onclick = () => this.showMarksheet(resultsData.find(x => x._id === btn.dataset.id));
        });

        if (user.role === 'admin') {
            this.container.querySelector('#import-btn').onclick = () => this.showImportModal();
        }
    }

    showMarksheet(result) {
        const student = result.student;
        
        let html = `
            <div style="font-family: Arial, sans-serif; padding: 20px; background: white; color: #333; border: 2px solid #ccc;" id="print-area">
                <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px;">
                    <h2 style="margin: 0;">COLLEGE RESULT SYSTEM</h2>
                    <h3>${this.exam.title} - Result</h3>
                </div>
                <div style="display:flex; justify-content: space-between; margin-bottom: 20px;">
                    <div>
                        <p><strong>Name:</strong> ${student.name}</p>
                        <p><strong>Enrollment:</strong> ${student.enrollNo}</p>
                    </div>
                    <div style="text-align: right;">
                        <p><strong>Course:</strong> ${this.exam.course}</p>
                        <p><strong>Semester:</strong> ${this.exam.semester}</p>
                    </div>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;" border="1">
                    <thead>
                        <tr style="background:#f0f0f0;">
                            <th style="padding:8px; text-align:left;">Subject Code</th>
                            <th style="padding:8px; text-align:left;">Subject Name</th>
                            <th style="padding:8px; text-align:center;">Theory</th>
                            <th style="padding:8px; text-align:center;">Sessional</th>
                            <th style="padding:8px; text-align:center;">Total</th>
                            <th style="padding:8px; text-align:center;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${result.subjects.map(s => `
                            <tr>
                                <td style="padding:8px;">${s.subjectCode || (s.subject && s.subject.code) || 'N/A'}</td>
                                <td style="padding:8px;">${s.subjectName || (s.subject && s.subject.name) || 'N/A'}</td>
                                <td style="padding:8px; text-align:center;">${s.theoryMarks}</td>
                                <td style="padding:8px; text-align:center;">${s.sessionalMarks}</td>
                                <td style="padding:8px; text-align:center; font-weight:bold;">${s.totalMarks}</td>
                                <td style="padding:8px; text-align:center; color:${s.isSupplementary ? 'red' : 'green'};">${s.isSupplementary ? 'Supp.' : 'Pass'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div style="display:flex; justify-content: space-between; font-size: 1.1em; border-top: 2px solid #333; padding-top: 15px;">
                    <div><strong>Total Score:</strong> ${result.totalScore}</div>
                    <div><strong>Percentage:</strong> ${result.percentage}%</div>
                    <div><strong>Final Result:</strong> <span style="color:${result.overallStatus==='Pass'?'green':'red'}; font-weight:bold;">${result.overallStatus}</span></div>
                </div>
            </div>
            <div style="text-align:center; margin-top:20px;">
                <button class="glass-button" onclick="printMarksheet()" style="background:var(--accent-color); color:white;">🖨️ Print Marksheet</button>
            </div>
            <script>
                function printMarksheet() {
                    const printContent = document.getElementById('print-area').innerHTML;
                    const originalContent = document.body.innerHTML;
                    document.body.innerHTML = printContent;
                    window.print();
                    document.body.innerHTML = originalContent;
                    window.location.reload();
                }
            </script>
        `;

        const div = document.createElement('div');
        div.innerHTML = html;
        Modal.show({ title: 'Student Marksheet', content: div, showCancel: false, confirmText: 'Close' });
    }

    showImportModal() {
        const div = document.createElement('div');
        div.innerHTML = `
            <p style="margin-bottom: 1rem; color: var(--text-secondary); font-size: 0.9rem;">
                Upload an Excel file to bulk import results. The system expects columns: Student ID (MongoDB Object ID), Subject ID, Theory Marks, Sessional Marks.
            </p>
            <input type="file" id="excel-file" accept=".xlsx, .xls">
            <div id="import-preview" style="margin-top:1rem; max-height:200px; overflow:auto;"></div>
        `;
        
        let parsedData = null;

        div.querySelector('#excel-file').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (evt) => {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);
                
                // Group by student
                const studentMap = {};
                data.forEach(row => {
                    const sId = row['Student ID'];
                    if(!sId) return;
                    if(!studentMap[sId]) {
                        studentMap[sId] = {
                            student: sId,
                            course: this.exam.course,
                            semester: this.exam.semester,
                            subjects: []
                        };
                    }
                    studentMap[sId].subjects.push({
                        subject: row['Subject ID'],
                        theoryMarks: row['Theory'] || 0,
                        sessionalMarks: row['Sessional'] || 0
                    });
                });

                parsedData = Object.values(studentMap);
                div.querySelector('#import-preview').innerHTML = `<p style="color:var(--success);">Will import results for ${parsedData.length} students.</p>`;
            };
            reader.readAsBinaryString(file);
        });

        Modal.show({
            title: 'Bulk Import Results',
            content: div,
            confirmText: 'Import Data',
            onConfirm: async () => {
                if (!parsedData) {
                    Toast.error('Please select a valid excel file first.');
                    return false;
                }
                try {
                    await ApiService.bulkImportResults(this.examId, parsedData);
                    Toast.success('Import Successful!');
                    this.init();
                    return true;
                } catch(err) {
                    Toast.error(err.message);
                    return false;
                }
            }
        });
    }

}
