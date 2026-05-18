import { ApiService } from '../../../services/ApiService.js';
import { Table } from '../../common/Table.js';
import { auth } from '../../../services/AuthService.js';

export class StudentResults {
    constructor() {
    }

    render() {
        const container = document.createElement('div');
        container.className = 'fade-in';

        const user = auth.getUser();

        const loadResults = async () => {
            try {
                const students = await ApiService.getStudents(user._id);
                const student = students[0];

                // Header Section
                const header = document.createElement('div');
                header.style.display = 'flex';
                header.style.justifyContent = 'space-between';
                header.style.alignItems = 'center';
                header.style.marginBottom = '2rem';
                header.innerHTML = `
            <div>
                <h2>Academic Results</h2>
                <p style="color: var(--text-secondary);">Your semester performance and grades</p>
            </div>
            <button id="printReportBtn" class="glass-button" style="display: flex; align-items: center; gap: 0.5rem;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                Print Report
            </button>
        `;
                container.appendChild(header);

                if (!student) {
                    container.innerHTML += `<div class="glass-panel" style="padding: 2rem; color: #fca5a5;">Student record not found.</div>`;
                    return container;
                }

                const [exams, courses, studentGrades] = await Promise.all([
                    ApiService.getExams(),
                    ApiService.getCourses(),
                    ApiService.getStudentMarks(student._id)
                ]);

                if (studentGrades.length === 0) {
                    container.innerHTML += `
                <div class="glass-panel" style="padding: 4rem; text-align: center; color: var(--text-secondary);">
                    <div style="font-size: 3rem; margin-bottom: 1.5rem;">📊</div>
                    <h3>No Results Available</h3>
                    <p>Your results haven't been uploaded by faculty yet.</p>
                </div>
            `;
                    return container;
                }

                // Summary Stats
                const stats = document.createElement('div');
                stats.style.display = 'grid';
                stats.style.gridTemplateColumns = 'repeat(auto-fit, minmax(200px, 1fr))';
                stats.style.gap = '1.5rem';
                stats.style.marginBottom = '2.5rem';

                const totalExams = studentGrades.length;
                const totalMarks = studentGrades.reduce((acc, curr) => acc + (parseInt(curr.marksObtained) || 0), 0);

                // Find exam totals (fallback to 100 if not found)
                const totalPossible = studentGrades.reduce((acc, curr) => {
                    return acc + (curr.examId.totalMarks || 100);
                }, 0);

                const avg = totalPossible ? ((totalMarks / totalPossible) * 100).toFixed(1) : 0;

                stats.innerHTML = `
            <div class="glass-panel" style="padding: 1.5rem; text-align: center;">
                <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem;">Exams Done</div>
                <div style="font-size: 2rem; font-weight: bold; color: var(--accent-color);">${totalExams}</div>
            </div>
            <div class="glass-panel" style="padding: 1.5rem; text-align: center;">
                <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem;">Overall Percentage</div>
                <div style="font-size: 2rem; font-weight: bold; color: var(--success);">${avg}%</div>
            </div>
            <div class="glass-panel" style="padding: 1.5rem; text-align: center;">
                <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem;">Grade Scale</div>
                <div style="font-size: 2rem; font-weight: bold; color: var(--warning);">${this.getOverallGrade(avg)}</div>
            </div>
        `;
                container.appendChild(stats);

                // Result Table
                const tableCard = document.createElement('div');
                tableCard.className = 'glass-panel';
                tableCard.style.padding = '0';
                tableCard.style.overflow = 'hidden';

                const tableData = studentGrades.map(g => {
                    const exam = g.examId || { title: 'Unknown Exam', totalMarks: 100 };
                    const max = exam.totalMarks || 100;
                    const perc = ((g.marksObtained / max) * 100).toFixed(1);

                    return {
                        exam: exam.title,
                        subject: exam.subject,
                        marks: `${g.marksObtained} / ${max}`,
                        perc: `${perc}%`,
                        grade: this.getOverallGrade((g.marksObtained / max) * 100),
                        result: g.marksObtained >= (max * 0.4) ? 'PASS' : 'FAIL'
                    };
                });

                const table = new Table({
                    columns: [
                        { key: 'exam', label: 'Exam Name' },
                        { key: 'subject', label: 'Subject' },
                        { key: 'marks', label: 'Marks' },
                        { key: 'perc', label: '%' },
                        { key: 'grade', label: 'Grade', render: (v) => `<strong style="color: var(--accent-color);">${v}</strong>` },
                        {
                            key: 'result', label: 'Status', render: (v) => {
                                const color = v === 'PASS' ? 'var(--success)' : 'var(--danger)';
                                return `<span style="font-weight: bold; color: ${color};">${v}</span>`;
                            }
                        }
                    ],
                    data: tableData
                });

                tableCard.appendChild(table.render());
                container.appendChild(tableCard);

                const printBtn = container.querySelector('#printReportBtn');
                if (printBtn) {
                    printBtn.addEventListener('click', () => window.print());
                }

            } catch (err) {
                container.innerHTML = `<div class="glass-panel" style="padding: 2rem; color: #fca5a5;">${err.message}</div>`;
            }
        };

        loadResults();

        return container;
    }

    getOverallGrade(perc) {
        if (perc >= 90) return 'A+';
        if (perc >= 80) return 'A';
        if (perc >= 70) return 'B';
        if (perc >= 60) return 'C';
        if (perc >= 50) return 'D';
        return 'F';
    }
}
