import { ApiService } from '../../../services/ApiService.js';
import { auth } from '../../../services/AuthService.js';

export class StudentResults {
    constructor() {
        this.activeSemester = 'all';
    }

    getGrade(perc) {
        if (perc >= 90) return { grade: 'A+', color: '#10b981' };
        if (perc >= 80) return { grade: 'A', color: '#3b82f6' };
        if (perc >= 70) return { grade: 'B', color: '#6366f1' };
        if (perc >= 60) return { grade: 'C', color: '#f59e0b' };
        if (perc >= 50) return { grade: 'D', color: '#f97316' };
        return { grade: 'F', color: '#ef4444' };
    }

    render() {
        const container = document.createElement('div');
        container.className = 'fade-in';
        const user = auth.getUser();

        const loadResults = async () => {
            container.innerHTML = `
                <div style="padding: 5rem; text-align: center;">
                    <div class="loader-spinner" style="width: 40px; height: 40px; border: 4px solid var(--accent-glow); border-top-color: var(--accent-color); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1.5rem;"></div>
                    <p style="color: var(--text-secondary); font-weight: 500;">Loading your results…</p>
                </div>`;

            try {
                const students = await ApiService.getStudents(user.id);
                const student = students[0];

                container.innerHTML = '';

                // Header
                const header = document.createElement('div');
                header.style.cssText = 'display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:2.5rem; flex-wrap:wrap; gap:1rem;';
                header.innerHTML = `
                    <div>
                        <div style="display:flex; align-items:center; gap:12px; margin-bottom:0.5rem;">
                            <span style="font-size:2rem;">🏆</span>
                            <h2 style="font-size:2rem; margin:0; letter-spacing:-1px;">My Results</h2>
                        </div>
                        <p style="color:var(--text-secondary); font-size:1rem; font-weight:500;">Your exam performances and academic grades</p>
                    </div>
                    <div style="display:flex; gap:0.75rem;">
                        <button id="exportPdfBtn" class="glass-button" style="display:flex; align-items:center; gap:0.5rem; padding:10px 20px; background:var(--bg-secondary); color:var(--text-primary); border:1px solid var(--glass-border);">
                            📄 Export Official PDF
                        </button>
                        <button id="printReportBtn" class="glass-button" style="display:flex; align-items:center; gap:0.5rem; padding:10px 20px;">
                            🖨️ Print Report
                        </button>
                    </div>`;
                container.appendChild(header);

                if (!student) {
                    container.innerHTML += `<div class="glass-panel" style="padding:2rem; color:#fca5a5;">Student record not found.</div>`;
                    return;
                }

                // Try new semester-wise API first, fall back to old
                let semesterData = null;
                try {
                    semesterData = await ApiService.getSemesterWiseResults(student._id);
                } catch (e) {
                    // Fall back to legacy
                }

                if (!semesterData || !semesterData.semesters || semesterData.semesters.length === 0) {
                    // Fall back to old API
                    const summary = await ApiService.getStudentResultSummary(student._id);
                    if (!summary || summary.totalExams === 0) {
                        container.innerHTML += `
                            <div class="glass-panel" style="padding:4rem; text-align:center; color:var(--text-secondary);">
                                <div style="font-size:3rem; margin-bottom:1.5rem; opacity:0.3;">📊</div>
                                <h3 style="opacity:0.7;">No Results Yet</h3>
                                <p>Your results haven't been uploaded by faculty yet. Check back after your exams.</p>
                            </div>`;
                        return;
                    }
                    // Render legacy results (old format)
                    this._renderLegacyResults(container, student, summary);
                    return;
                }

                // ── Semester Filter Bar ──
                const allSemesters = semesterData.semesters.map(s => s.semester);
                const filterBar = document.createElement('div');
                filterBar.className = 'glass-panel';
                filterBar.style.cssText = 'display:flex; gap:0.5rem; flex-wrap:wrap; align-items:center; margin-bottom:2rem; padding:1rem 1.5rem;';

                filterBar.innerHTML = `
                    <span style="font-weight:700; color:var(--text-secondary); font-size:0.85rem; margin-right:0.5rem;">Filter:</span>
                    <button class="sem-filter-btn glass-button ${this.activeSemester === 'all' ? 'active-filter' : ''}" data-sem="all" style="padding:6px 16px; font-size:0.8rem; font-weight:700;">All Semesters</button>
                    ${allSemesters.map(s => `
                        <button class="sem-filter-btn glass-button ${this.activeSemester == s ? 'active-filter' : ''}" data-sem="${s}" style="padding:6px 16px; font-size:0.8rem; font-weight:700;">Sem ${s}</button>
                    `).join('')}
                    <button class="sem-filter-btn glass-button ${this.activeSemester === 'supp' ? 'active-filter' : ''}" data-sem="supp" style="padding:6px 16px; font-size:0.8rem; font-weight:700; border-color: #f97316; color: #f97316;">Supplementary Only</button>
                `;
                container.appendChild(filterBar);

                // Style for active filter
                const style = document.createElement('style');
                style.textContent = `
                    .active-filter { background: var(--accent-color) !important; color: white !important; border-color: var(--accent-color) !important; }
                    @media print {
                        body * { visibility: hidden; }
                        .fade-in, .fade-in * { visibility: visible; }
                        .fade-in { position: absolute; left: 0; top: 0; width: 100%; }
                        #printReportBtn, .sem-filter-btn, .print-hide { display: none !important; }
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .glass-panel { page-break-inside: avoid; }
                    }
                `;
                container.appendChild(style);

                // Cards container
                const cardsContainer = document.createElement('div');
                cardsContainer.id = 'results-cards';
                container.appendChild(cardsContainer);

                // Render function
                const renderCards = (filterSem) => {
                    cardsContainer.innerHTML = '';
                    let filtered = [];
                    if (filterSem === 'all') {
                        filtered = semesterData.semesters;
                    } else if (filterSem === 'supp') {
                        // Extract only Supplementary cards from all semesters
                        filtered = semesterData.semesters.map(s => ({
                            ...s,
                            cards: s.cards.filter(c => c.type === 'Supplementary')
                        })).filter(s => s.cards.length > 0);
                    } else {
                        filtered = semesterData.semesters.filter(s => s.semester == filterSem);
                    }

                    if (filtered.length === 0) {
                        cardsContainer.innerHTML = `<div class="glass-panel" style="padding:3rem; text-align:center; color:var(--text-secondary);"><p>No results for this semester.</p></div>`;
                        return;
                    }

                    filtered.forEach(semGroup => {
                        semGroup.cards.forEach(card => {
                            const sheet = this._renderMarksheet(student, card, semGroup.semester);
                            cardsContainer.appendChild(sheet);
                        });
                    });

                    // Print button at bottom
                    const printDiv = document.createElement('div');
                    printDiv.className = 'print-hide';
                    printDiv.style.cssText = 'text-align:center; margin-top:2rem;';
                    printDiv.innerHTML = `<button class="glass-button" style="padding:10px 30px; font-size:1.1rem; background:var(--accent-color); color:white; border:none; font-weight:bold;" onclick="window.print()">🖨️ Print Marksheets</button>`;
                    cardsContainer.appendChild(printDiv);
                };

                renderCards(this.activeSemester);

                // Filter click handlers
                filterBar.addEventListener('click', (e) => {
                    const btn = e.target.closest('.sem-filter-btn');
                    if (!btn) return;
                    this.activeSemester = btn.dataset.sem;
                    filterBar.querySelectorAll('.sem-filter-btn').forEach(b => b.classList.remove('active-filter'));
                    btn.classList.add('active-filter');
                    renderCards(this.activeSemester);
                });

                // Print button in header
                container.querySelector('#printReportBtn')?.addEventListener('click', () => window.print());

                // PDF Export button
                container.querySelector('#exportPdfBtn')?.addEventListener('click', async () => {
                    const btn = container.querySelector('#exportPdfBtn');
                    const originalText = btn.innerHTML;
                    btn.disabled = true;
                    btn.innerHTML = '⏳ Generating PDF...';
                    
                    try {
                        const { jsPDF } = window.jspdf;
                        const doc = new jsPDF('p', 'mm', 'a4');
                        const cards = container.querySelectorAll('.marksheet-container');
                        
                        for (let i = 0; i < cards.length; i++) {
                            if (i > 0) doc.addPage();
                            const canvas = await html2canvas(cards[i], {
                                scale: 2,
                                useCORS: true,
                                backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-secondary').trim() || '#ffffff'
                            });
                            const imgData = canvas.toDataURL('image/png');
                            const imgProps = doc.getImageProperties(imgData);
                            const pdfWidth = doc.internal.pageSize.getWidth();
                            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                            doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                        }
                        
                        doc.save(`${student.name}_Results_${new Date().toISOString().split('T')[0]}.pdf`);
                        Toast.success('PDF generated successfully!');
                    } catch (err) {
                        console.error('PDF Export Error:', err);
                        Toast.error('Failed to generate PDF');
                    } finally {
                        btn.disabled = false;
                        btn.innerHTML = originalText;
                    }
                });

            } catch (err) {
                container.innerHTML = `<div class="glass-panel" style="padding:2rem; color:#fca5a5;">Error: ${err.message}</div>`;
            }
        };

        loadResults();
        return container;
    }

    _renderMarksheet(student, card, semester) {
        const isSupp = card.type === 'Supplementary';
        const borderColor = isSupp ? '#f97316' : 'var(--accent-color)';
        const theorySubjects = card.subjects.filter(s => s.subjectType === 'Theory');
        const practicalSubjects = card.subjects.filter(s => s.subjectType !== 'Theory');
        const monthYear = card.date ? new Date(card.date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : '—';

        const sheet = document.createElement('div');
        sheet.className = 'glass-panel marksheet-container';
        sheet.style.cssText = `
            margin-bottom: 3rem; padding: 2.5rem; position: relative;
            border-top: 4px solid ${borderColor};
        `;

        let html = `
            <div style="text-align: center; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; margin-bottom: 1.5rem;">
                <h1 style="margin:0; font-size: 1.8rem; letter-spacing: 1px; color:${borderColor}; font-weight:800; text-transform:uppercase;">Record of Marks</h1>
                ${isSupp ? `<div style="display:inline-block; margin-top:6px; background:rgba(249,115,22,0.15); color:#f97316; padding:4px 14px; border-radius:20px; font-size:0.75rem; font-weight:800; text-transform:uppercase; letter-spacing:1px;">Supplementary Attempt</div>` : ''}
                <div style="color:var(--text-secondary); margin-top: 4px; font-size: 0.9rem;">for</div>
                <h2 style="margin: 4px 0 0; font-size: 1.3rem; color:var(--text-primary); font-weight:700;">${card.examTitle}</h2>
                <div style="color:var(--text-secondary); margin-top: 4px; font-weight:500; font-size: 0.9rem;">${student.course}</div>
            </div>
            
            <div style="display:flex; justify-content:space-between; flex-wrap:wrap; margin-bottom:1.5rem; font-size:0.95rem; color:var(--text-primary); border-bottom: 1px solid var(--border-color); padding-bottom: 1rem;">
                <div style="width:100%; margin-bottom:8px; font-weight:700;">NAME OF THE TRAINEE: <span style="font-weight:normal; text-transform:uppercase; color:var(--text-secondary); margin-left:8px;">${student.name}</span></div>
                <div style="font-weight:700;">ROLL NO.: <span style="font-weight:normal; color:var(--text-secondary); margin-left:8px;">${student.rollNo}</span></div>
                <div style="font-weight:700;">SEMESTER: <span style="font-weight:normal; color:var(--text-secondary); margin-left:8px;">${semester}</span></div>
                <div style="font-weight:700;">MTH/YEAR: <span style="font-weight:normal; color:var(--text-secondary); margin-left:8px;">${monthYear}</span></div>
            </div>
        `;

        const renderTable = (title, subjects) => {
            if (subjects.length === 0) return '';

            let thHTML = '<th style="text-align:left; padding:10px 14px; color:var(--text-secondary); font-weight:600; border-bottom:1px solid var(--border-color);">Subject Code</th>';
            let maxExamHTML = '<td style="padding:10px 14px; color:var(--text-secondary); font-weight:500; border-bottom:1px solid var(--border-color);">Max. Marks (Exam)</td>';
            let maxSessHTML = '<td style="padding:10px 14px; color:var(--text-secondary); font-weight:500; border-bottom:1px solid var(--border-color);">Max. Marks (Sessional)</td>';
            let passHTML = '<td style="padding:10px 14px; color:var(--text-secondary); font-weight:500; border-bottom:1px solid var(--border-color);">Pass Marks</td>';
            let obtExamHTML = '<td style="padding:10px 14px; color:var(--text-primary); font-weight:600; border-bottom:1px solid var(--border-color);">Marks Obtained (Exam)</td>';
            let obtSessHTML = '<td style="padding:10px 14px; color:var(--text-primary); font-weight:600; border-bottom:1px solid var(--border-color);">Marks Obtained (Sess)</td>';
            let obtTotalHTML = '<td style="padding:10px 14px; color:var(--accent-color); font-weight:800;">Total Marks Obtained</td>';

            subjects.forEach(s => {
                const wasUpdated = s.wasUpdated;
                const highlightBg = wasUpdated ? 'background:rgba(249,115,22,0.08);' : '';
                const highlightBorder = wasUpdated ? 'border-left:3px solid #f97316;' : '';

                thHTML += `<th style="text-align:center; padding:10px 14px; font-weight:600; border-bottom:1px solid var(--border-color); ${highlightBg}">${s.subjectCode || '-'}${wasUpdated ? ' <span style="color:#f97316; font-size:0.6rem;">★</span>' : ''}</th>`;
                maxExamHTML += `<td style="text-align:center; padding:10px 14px; color:var(--text-secondary); border-bottom:1px solid var(--border-color); ${highlightBg}">${s.maxTheory}</td>`;
                maxSessHTML += `<td style="text-align:center; padding:10px 14px; color:var(--text-secondary); border-bottom:1px solid var(--border-color); ${highlightBg}">${s.maxSessional}</td>`;
                passHTML += `<td style="text-align:center; padding:10px 14px; color:var(--text-secondary); border-bottom:1px solid var(--border-color); ${highlightBg}">${Math.ceil((s.maxTheory + s.maxSessional) * 0.4)}</td>`;
                obtExamHTML += `<td style="text-align:center; padding:10px 14px; font-weight:600; border-bottom:1px solid var(--border-color); ${highlightBg} ${highlightBorder}">${s.theory}</td>`;
                obtSessHTML += `<td style="text-align:center; padding:10px 14px; font-weight:600; border-bottom:1px solid var(--border-color); ${highlightBg}">${s.sessional}</td>`;

                const isFail = (s.theory + s.sessional) < 40;
                const totalColor = isFail ? '#ef4444' : 'var(--accent-color)';
                obtTotalHTML += `<td style="text-align:center; padding:10px 14px; font-weight:800; font-size:1rem; color:${totalColor}; ${highlightBg}">${s.theory + s.sessional}</td>`;
            });

            return `
                <div class="glass-panel" style="flex:1; overflow:hidden;">
                    <div style="text-align:center; font-weight:700; letter-spacing:2px; background:rgba(0,0,0,0.2); padding:10px; text-transform:uppercase; color:var(--text-primary); border-bottom:1px solid var(--border-color);">${title}</div>
                    <div style="overflow-x:auto;">
                        <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
                            <tr style="background:rgba(0,0,0,0.1);">${thHTML}</tr>
                            <tr>${maxExamHTML}</tr>
                            <tr>${maxSessHTML}</tr>
                            <tr>${passHTML}</tr>
                            <tr>${obtExamHTML}</tr>
                            <tr>${obtSessHTML}</tr>
                            <tr style="background:rgba(255,255,255,0.03);">${obtTotalHTML}</tr>
                        </table>
                    </div>
                </div>
            `;
        };

        html += `<div style="display:flex; flex-direction:column; gap:1.5rem; margin-bottom:2rem;">
            ${renderTable('THEORY', theorySubjects)}
            ${renderTable('PRACTICALS', practicalSubjects)}
        </div>`;

        // Footer
        html += `
            <div style="display:flex; flex-direction:column; gap: 0.75rem; margin-top: 1.5rem; margin-bottom: 1.5rem; font-size:0.95rem; color:var(--text-primary); border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color); padding: 1.5rem 0;">
                <div><strong style="text-transform:uppercase;">Professional Activity Grade:</strong> <span style="font-weight:800; color:var(--accent-color); margin-left:8px;">${card.isPassed ? 'A' : 'C'}</span></div>
                <div><strong style="text-transform:uppercase;">Final Result:</strong> <span style="font-weight:800; color:${card.isPassed ? '#10b981' : '#ef4444'}; margin-left:8px;">${card.isPassed ? 'PROMOTED' : 'SUPPLEMENTARY'}</span></div>
                <div>
                    <strong style="text-transform:uppercase;">Marks:</strong> 
                    <span style="font-weight:800; color:var(--text-primary); margin-left:8px;">${card.totalObtained} / ${card.totalMax}</span>
                    <span style="font-weight:normal; color:var(--text-secondary); margin-left:8px;">(Obtained: ${card.totalObtained}, Max: ${card.totalMax})</span>
                </div>
            </div>

            ${isSupp ? `<div style="background:rgba(249,115,22,0.08); border:1px solid rgba(249,115,22,0.3); border-radius:8px; padding:1rem 1.25rem; margin-bottom:1.5rem; font-size:0.85rem; color:#f97316; font-weight:600;">
                <span style="font-size:1rem; margin-right:6px;">★</span> Highlighted columns indicate subjects where supplementary marks have been updated.
            </div>` : ''}

            <div style="margin-top: 1.5rem; border: 1px solid var(--border-color); padding: 1.5rem; border-radius: 8px; background: rgba(0,0,0,0.05);">
                <h3 style="font-size: 1.1rem; color:var(--text-primary); margin-top: 0; margin-bottom: 1rem; text-transform:uppercase; font-weight:800; letter-spacing: 1px;">Notes</h3>
                <div style="display:flex; flex-direction:column; gap: 0.5rem; font-size:0.95rem;">
                    ${card.subjects.map(s => {
                        const isFailSubject = (s.theory + s.sessional) < 40;
                        return `<div><strong style="color:var(--text-primary);">${s.subjectCode || '-'}</strong>: <span style="color:var(--text-secondary);">${s.subjectName || 'Unknown Subject'}</span> ${isFailSubject ? '<span style="color:#ef4444; font-weight:bold; font-size:0.8rem; margin-left:8px;">(SUPPLEMENTARY)</span>' : ''}${s.wasUpdated ? '<span style="color:#f97316; font-weight:bold; font-size:0.8rem; margin-left:8px;">(UPDATED)</span>' : ''}</div>`;
                    }).join('')}
                </div>
            </div>
            
            <div style="display:flex; justify-content:space-between; margin-top:3rem; padding-top:2rem; border-top:1px solid var(--border-color); text-align:center; font-weight:600; font-size:0.85rem; color:var(--text-secondary);">
                <div style="width:200px;">
                    <div style="border-bottom:1px dashed var(--border-color); height:40px; margin-bottom:8px;"></div>
                    (EXAM CO-ORDINATOR)
                </div>
                <div style="width:250px;">
                    <div style="border-bottom:1px dashed var(--border-color); height:40px; margin-bottom:8px;"></div>
                    (EXAM CONTROLLER)
                </div>
                <div style="width:200px;">
                    <div style="border-bottom:1px dashed var(--border-color); height:40px; margin-bottom:8px;"></div>
                    (GENERAL MANAGER)
                </div>
            </div>
            <div style="text-align:center; margin-top:2rem; font-size:0.75rem; color:var(--text-secondary); opacity:0.6;">
                NOTE: GENERATED BY COLLEGE OS. NOT VALID WITHOUT SIGNATURES.
            </div>
        `;

        sheet.innerHTML = html;
        return sheet;
    }

    // Legacy fallback for old data without semester info
    _renderLegacyResults(container, student, summary) {
        const examsMap = new Map();
        summary.results.forEach(r => {
            const examId = r.examId || 'unknown';
            if (!examsMap.has(examId)) {
                examsMap.set(examId, {
                    title: r.examTitle,
                    date: r.date,
                    subjects: [],
                    totalMax: 0,
                    totalObtained: 0,
                    isPassed: true
                });
            }
            const examData = examsMap.get(examId);
            examData.subjects.push(r);
            examData.totalMax += r.maxTotal || 0;
            examData.totalObtained += r.marksObtained || 0;
            if (!r.isPassed) examData.isPassed = false;
        });

        examsMap.forEach((examData) => {
            const card = {
                type: 'Regular',
                label: examData.title,
                examTitle: examData.title,
                subjects: examData.subjects.map(s => ({
                    ...s,
                    subjectType: s.subjectType || 'Theory',
                    wasUpdated: false
                })),
                totalObtained: examData.totalObtained,
                totalMax: examData.totalMax,
                isPassed: examData.isPassed,
                date: examData.date
            };
            const sheet = this._renderMarksheet(student, card, student.semester);
            container.appendChild(sheet);
        });
    }
}
