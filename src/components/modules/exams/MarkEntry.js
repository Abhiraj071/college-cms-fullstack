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
        this.allStudents = [];
        this.filteredStudents = [];
        this.existingMarks = [];
        
        // Filter state
        this.selectedYear = '';
        this.selectedSemester = '';
        
        // Modal state
        this.activeStudent = null;
    }

    render() {
        this.container = document.createElement('div');
        this.container.className = 'fade-in';

        if (!this.examId) {
            this.container.innerHTML = `<div class="glass-panel" style="padding: 2rem;">Error: No exam specified. 
                <button class="glass-button" onclick="window.location.hash='${ROUTES.EXAMS_LIST}'">Go Back</button></div>`;
            return this.container;
        }

        const loadContent = async () => {
            this.container.innerHTML = '<div style="padding: 4rem; text-align: center;">Loading exam data...</div>';
            try {
            const allExams = await ApiService.getExams();
            this.exam = allExams.find(e => e._id === this.examId);

            if (!this.exam) {
                this.container.innerHTML = '<div class="glass-panel" style="padding: 2rem; text-align: center;"><p>Exam not found.</p><button class="glass-button" onclick="window.location.hash=\'${ROUTES.EXAMS_LIST}\'">Go Back</button></div>';
                return;
            }

            const [students, marks] = await Promise.all([
                ApiService.getStudents(),
                ApiService.getMarksByExam(this.examId)
            ]);
            
            const examCourse = (this.exam.course || '').trim().toLowerCase();
            this.allStudents = students.filter(s => s.course && s.course.trim().toLowerCase() === examCourse);
            this.existingMarks = marks;

            // Auto-select semester based on exam if defined
            if (this.exam.semester) {
                this.selectedSemester = this.exam.semester;
                this.selectedYear = Math.ceil(this.exam.semester / 2);
            }

            this.renderMain();
        } catch (err) {
            console.error('MarkEntry Load Error:', err);
            Toast.error('Failed to load data: ' + err.message);
            this.container.innerHTML = `<div class="glass-panel" style="padding: 2rem; text-align: center;">
                <p style="color: var(--error);">Error: ${err.message}</p>
                <button class="glass-button" onclick="location.reload()">Retry</button>
            </div>`;
        }
    };

        loadContent();
        return this.container;
    }

    renderMain() {
        this.container.innerHTML = '';
        
        const header = document.createElement('div');
        header.style.marginBottom = '2rem';
        header.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem; cursor: pointer; color: var(--text-secondary);" onclick="window.location.hash='${ROUTES.EXAMS_LIST}'">
                <span>← Back to Exams</span>
            </div>
            <h2 style="margin-top: 1rem;">Enter Marks: <span style="color: var(--accent-color);">${this.exam.title}</span></h2>
            <p style="color: var(--text-secondary);">Course: ${this.exam.course}</p>
        `;
        this.container.appendChild(header);

        // Filter Bar
        const filterBar = document.createElement('div');
        filterBar.className = 'glass-panel';
        filterBar.style.marginBottom = '2rem';
        filterBar.style.display = 'flex';
        filterBar.style.gap = '1rem';
        filterBar.style.alignItems = 'center';

        filterBar.innerHTML = `
            <div>
                <label style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 0.3rem;">Course</label>
                <input type="text" value="${this.exam.course}" disabled style="padding: 0.5rem; border-radius: 6px; background: rgba(0,0,0,0.05); border: 1px solid var(--glass-border); width: 250px;">
            </div>
            <div>
                <label style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 0.3rem;">Year</label>
                <select id="yearFilter" style="padding: 0.5rem; border-radius: 6px; background: var(--bg-color); border: 1px solid var(--glass-border); min-width: 120px;">
                    <option value="">-- Select --</option>
                    <option value="1">Year 1</option>
                    <option value="2">Year 2</option>
                    <option value="3">Year 3</option>
                    <option value="4">Year 4</option>
                </select>
            </div>
            <div>
                <label style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 0.3rem;">Semester</label>
                <select id="semFilter" style="padding: 0.5rem; border-radius: 6px; background: var(--bg-color); border: 1px solid var(--glass-border); min-width: 120px;" disabled>
                    <option value="">-- Select --</option>
                </select>
            </div>
            <div style="margin-left: auto; align-self: flex-end; padding-bottom: 2px; display: flex; gap: 0.5rem;">
                <button id="exportExcelBtn" class="glass-button" style="padding: 10px 16px; background: rgba(16, 185, 129, 0.1); color: #10b981; border-color: rgba(16, 185, 129, 0.2);">
                    Export Excel
                </button>
                <button id="importExcelBtn" class="glass-button" style="padding: 10px 16px; background: rgba(99, 102, 241, 0.1); color: #6366f1; border-color: rgba(99, 102, 241, 0.2);">
                    Import Excel
                </button>
                <button id="filterBtn" class="glass-button" disabled style="padding: 10px 24px;">Load Students</button>
                <input type="file" id="excelInput" style="display: none;" accept=".xlsx, .xls">
            </div>
        `;
        this.container.appendChild(filterBar);

        const yearSelect = filterBar.querySelector('#yearFilter');
        const semSelect = filterBar.querySelector('#semFilter');
        const filterBtn = filterBar.querySelector('#filterBtn');

        yearSelect.addEventListener('change', (e) => {
            this.selectedYear = e.target.value;
            this.selectedSemester = '';
            semSelect.innerHTML = '<option value="">-- Select --</option>';
            if (this.selectedYear) {
                semSelect.disabled = false;
                const startSem = (parseInt(this.selectedYear) - 1) * 2 + 1;
                semSelect.innerHTML += `<option value="${startSem}">Semester ${startSem}</option>`;
                semSelect.innerHTML += `<option value="${startSem + 1}">Semester ${startSem + 1}</option>`;
            } else {
                semSelect.disabled = true;
            }
            filterBtn.disabled = true;
            this.studentListContainer.innerHTML = '';
        });

        semSelect.addEventListener('change', (e) => {
            this.selectedSemester = e.target.value;
            filterBtn.disabled = !this.selectedSemester;
        });

        // Set initial values for filters if pre-selected
        if (this.selectedYear) {
            yearSelect.value = this.selectedYear;
            semSelect.disabled = false;
            const startSem = (parseInt(this.selectedYear) - 1) * 2 + 1;
            semSelect.innerHTML = '<option value="">-- Select --</option>';
            semSelect.innerHTML += `<option value="${startSem}" ${this.selectedSemester == startSem ? 'selected' : ''}>Semester ${startSem}</option>`;
            semSelect.innerHTML += `<option value="${startSem + 1}" ${this.selectedSemester == startSem + 1 ? 'selected' : ''}>Semester ${startSem + 1}</option>`;
            filterBtn.disabled = !this.selectedSemester;
        }

        filterBtn.addEventListener('click', () => {
            const yearSelect = filterBar.querySelector('#yearFilter');
            const semSelect = filterBar.querySelector('#semFilter');
            
            this.selectedYear = yearSelect.value;
            this.selectedSemester = semSelect.value;

            this.filteredStudents = this.allStudents.filter(s => {
                const studentCurrentSem = Number(s.semester);
                const filterSem = Number(this.selectedSemester);
                
                // 1. Course-wide check: Does the exam schedule even have subjects for the selected semester?
                const subjectsInExamForFilterSem = (this.exam.subjectSchedules || []).filter(sub => {
                    // Try to get semester from schedule, otherwise it might be in the Subject model (not available here easily)
                    // but most schedules should have it if created correctly.
                    return Number(sub.semester) === filterSem;
                });

                if (subjectsInExamForFilterSem.length === 0) {
                    // If this exam has no subjects for the chosen semester, nobody should show up here.
                    return false;
                }

                // 2. If it has subjects for this semester, show students who are currently in it 
                // OR have been promoted past it (allowing backlog entry).
                return studentCurrentSem >= filterSem;
            });
            this.renderStudentList();
        });

        const exportBtn = filterBar.querySelector('#exportExcelBtn');
        const importBtn = filterBar.querySelector('#importExcelBtn');
        const excelInput = filterBar.querySelector('#excelInput');

        exportBtn.addEventListener('click', () => this.exportToExcel());
        importBtn.addEventListener('click', () => excelInput.click());
        excelInput.addEventListener('change', (e) => this.importFromExcel(e));

        this.studentListContainer = document.createElement('div');
        this.container.appendChild(this.studentListContainer);

        // Modal Container attached to component so it doesn't leak
        this.modalContainer = document.createElement('div');
        this.container.appendChild(this.modalContainer);
    }

    renderStudentList() {
        this.studentListContainer.innerHTML = '';
        
        const card = document.createElement('div');
        card.className = 'glass-panel';
        card.style.padding = '0';
        card.style.overflow = 'hidden';

        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';

        if (this.filteredStudents.length === 0) {
            table.innerHTML = `<tr><td style="padding: 2rem; text-align: center;">No students found for Semester ${this.selectedSemester}.</td></tr>`;
        } else {
            table.innerHTML = `
                <thead>
                    <tr style="background: rgba(0,0,0,0.02); border-bottom: 1px solid var(--glass-border);">
                        <th style="text-align: left; padding: 1.2rem;">Roll No</th>
                        <th style="text-align: left; padding: 1.2rem;">Student Name</th>
                        <th style="text-align: center; padding: 1.2rem;">Semester</th>
                        <th style="text-align: center; padding: 1.2rem;">Status</th>
                        <th style="text-align: right; padding: 1.2rem;">Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.filteredStudents.map(s => {
                        const existingMark = this.existingMarks.find(m => m.studentId?._id === s._id || m.studentId === s._id);
                        const statusColor = existingMark ? 'var(--success)' : 'var(--text-secondary)';
                        const statusText = existingMark ? 'Marks Entered' : 'Pending';

                        return `
                        <tr style="border-bottom: 1px solid var(--glass-border);">
                            <td style="padding: 1rem;">${s.rollNo}</td>
                            <td style="padding: 1rem; font-weight: 500;">${s.name}</td>
                            <td style="padding: 1rem; text-align: center; color: var(--text-secondary); font-size: 0.9rem;">
                                Sem ${existingMark && existingMark.studentSemester ? existingMark.studentSemester : this.selectedSemester}
                            </td>
                            <td style="padding: 1rem; text-align: center; color: ${statusColor}; font-size: 0.9rem;">
                                • ${statusText}
                            </td>
                            <td style="padding: 1rem; text-align: right;">
                                <button class="glass-button" style="padding: 0.4rem 1rem; font-size: 0.85rem;" data-id="${s._id}">
                                    Fill Marks
                                </button>
                            </td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            `;
            
            table.querySelectorAll('button[data-id]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const studentId = e.currentTarget.dataset.id;
                    const student = this.filteredStudents.find(s => s._id === studentId);
                    this.openMarksModal(student);
                });
            });
        }

        card.appendChild(table);
        this.studentListContainer.appendChild(card);
    }

    async openMarksModal(student) {
        this.activeStudent = student;
        const existingMark = this.existingMarks.find(m => m.studentId?._id === student._id || m.studentId === student._id);
        const subjectMarks = existingMark && existingMark.subjectMarks ? existingMark.subjectMarks : [];

        // Fetch student's past results to detect supplementary subjects and carry over sessional marks
        let failedSubjectKeys = new Set();
        let passedSubjectKeys = new Set();
        let existingSessionalMap = {};
        
        try {
            const pastMarks = await ApiService.getStudentMarks(student._id);
            pastMarks.forEach(m => {
                if (m.subjectMarks) {
                    m.subjectMarks.forEach(sm => {
                        const key = sm.subjectId || sm.subjectName;
                        
                        // Carry over sessional marks
                        if (sm.sessional !== undefined && sm.sessional !== null && sm.sessional !== '') {
                            existingSessionalMap[key] = sm.sessional;
                        }

                        const max = sm.maxTotal || 100;
                        const passing = max * 0.4;
                        
                        if (sm.total >= passing) {
                            passedSubjectKeys.add(key);
                        } else {
                            failedSubjectKeys.add(key);
                        }
                    });
                }
            });
            // Final failed list: failed at least once AND never passed
            passedSubjectKeys.forEach(key => failedSubjectKeys.delete(key));
        } catch (e) { console.error('Error calculating failed subjects and sessionals', e); }

        // Fetch all subjects to resolve semester info when missing from schedule
        let subjectSemesterMap = {};
        try {
            const allSubjects = await ApiService.getSubjects();
            allSubjects.forEach(s => {
                if (s.semester) {
                    if (s._id) subjectSemesterMap[s._id] = parseInt(s.semester);
                    if (s.name) subjectSemesterMap[s.name] = parseInt(s.semester);
                    if (s.code) subjectSemesterMap[s.code] = parseInt(s.semester);
                }
            });
        } catch (e) { /* ignore */ }

        let subjectsHtml = '';
        const schedules = this.exam.subjectSchedules || [];
        
        // Resolve student semester for this exam session:
        // Since exams are course-wide, we use the semester from the UI filter (selectedSemester)
        // to categorize the marks being entered for this session.
        const studentSemester = parseInt(this.selectedSemester) || parseInt(student.semester) || 1;

        // Resolve semester for each subject (from schedule, then from Subject model)
        const resolvedSchedules = schedules.map(subj => {
            let sem = subj.semester ? parseInt(subj.semester) : null;
            if (!sem) sem = subjectSemesterMap[subj.subjectId] || subjectSemesterMap[subj.name] || subjectSemesterMap[subj.code] || null;
            return { ...subj, _resolvedSemester: sem };
        });

        // Filter subjects: current semester (regular) + previous semester failed (supplementary)
        const enrichedSchedules = resolvedSchedules
            .filter(subj => {
                const subjSem = subj._resolvedSemester;
                
                // If we can't determine subject semester, hide it to avoid showing unrelated subjects
                if (!subjSem) return false;

                // 1. Current semester subjects (Regular)
                if (Number(subjSem) === Number(studentSemester)) return true;

                // 2. Previous semester subjects only if student failed them (Supplementary/Backlog)
                const key = subj.subjectId || subj.name;
                const isBacklogForStudent = failedSubjectKeys.has(key);
                
                if (subj.isSupplementary || (subjSem && Number(subjSem) < Number(studentSemester) && isBacklogForStudent)) return true;

                return false;
            })
            .map(subj => {
                const subjSem = subj._resolvedSemester;
                const key = subj.subjectId || subj.name;
                const isSuppForStudent = subjSem && subjSem < studentSemester && failedSubjectKeys.has(key);
                return { ...subj, semester: subjSem, isSupplementary: isSuppForStudent || false };
            });

        const hasTheory = enrichedSchedules.some(s => (s.maxTheory || 0) > 0);
        const hasSessional = enrichedSchedules.some(s => (s.maxSessional || 0) > 0);
        const hasViva = enrichedSchedules.some(s => (s.maxViva || 0) > 0);

        if (enrichedSchedules.length === 0) {
            subjectsHtml = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">No subjects scheduled for this exam yet. Please update the exam schedule.</p>';
        } else {
            subjectsHtml = `
                <table style="width: 100%; border-collapse: collapse; margin-top: 1rem;">
                    <thead>
                        <tr style="border-bottom: 1px solid var(--glass-border); text-align: left;">
                            <th style="padding: 0.5rem; color: var(--text-secondary); font-size: 0.85rem;">Subject Name</th>
                            ${hasTheory ? `<th style="padding: 0.5rem; text-align: center; color: var(--text-secondary); font-size: 0.85rem;">Theory</th>` : ''}
                            ${hasSessional ? `<th style="padding: 0.5rem; text-align: center; color: var(--text-secondary); font-size: 0.85rem;">Sessional</th>` : ''}
                            ${hasViva ? `<th style="padding: 0.5rem; text-align: center; color: var(--text-secondary); font-size: 0.85rem;">Viva</th>` : ''}
                            <th style="padding: 0.5rem; text-align: center; color: var(--text-secondary); font-size: 0.85rem;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${enrichedSchedules.map((subj) => {
                            const subMark = subjectMarks.find(sm => sm.subjectId === subj.subjectId || sm.subjectName === subj.name);
                            const thVal = subMark && subMark.theory !== undefined ? subMark.theory : '';
                            const seVal = subMark && subMark.sessional !== undefined ? subMark.sessional : '';
                            const viVal = subMark && subMark.viva !== undefined ? subMark.viva : '';
                            
                            const maxTh = subj.maxTheory || 0;
                            const maxSe = subj.maxSessional || 0;
                            const maxVi = subj.maxViva || 0;
                            const maxTot = subj.maxTotal || 100;
                            
                            return `
                                <tr class="subject-row" data-subject-id="${subj.subjectId || ''}" data-subject-name="${subj.name}" data-subject-code="${subj.code || ''}" data-semester="${subj.semester || ''}" data-is-supplementary="${subj.isSupplementary || false}">
                                    <td style="padding: 1rem 0.5rem; font-weight: 500;">
                                        ${subj.name}
                                        ${subj.isSupplementary ? '<span style="background:rgba(239,68,68,0.15); color:#ef4444; padding:2px 6px; border-radius:4px; font-size:0.6rem; text-transform:uppercase; font-weight:800; margin-left:6px;">SUPP</span>' : ''}
                                        <div style="font-size: 0.75rem; color: var(--text-secondary); font-weight: normal;">Code: ${subj.code || 'N/A'}${subj.semester ? ' · Sem ' + subj.semester : ''}</div>
                                    </td>
                                    ${hasTheory ? `
                                    <td style="padding: 1rem 0.5rem; text-align: center;">
                                        ${maxTh > 0 ? `
                                            <input type="number" class="th-input" data-max="${maxTh}" value="${thVal}" step="0.5" style="width: 60px; padding: 0.5rem; text-align: center; border: 1px solid var(--glass-border); border-radius: 4px; background: rgba(0,0,0,0.02); font-weight: 500;">
                                            <div style="font-size: 0.7rem; color: var(--text-secondary); margin-top: 2px;">/ ${maxTh}</div>
                                        ` : '<span style="color: var(--glass-border); font-weight: bold;">-</span>'}
                                    </td>
                                    ` : ''}
                                    ${hasSessional ? `
                                    <td style="padding: 1rem 0.5rem; text-align: center;">
                                        ${maxSe > 0 ? `
                                            <input type="number" class="se-input" data-max="${maxSe}" 
                                                value="${seVal !== '' ? seVal : (existingSessionalMap[subj.subjectId] || existingSessionalMap[subj.name] || '')}" 
                                                step="0.5" 
                                                ${(seVal !== '' || existingSessionalMap[subj.subjectId] !== undefined || existingSessionalMap[subj.name] !== undefined) ? 'readonly style="width: 60px; padding: 0.5rem; text-align: center; border: 1px solid var(--glass-border); border-radius: 4px; background: rgba(0,0,0,0.08); font-weight: 500; cursor: not-allowed; opacity: 0.7;"' : 'style="width: 60px; padding: 0.5rem; text-align: center; border: 1px solid var(--glass-border); border-radius: 4px; background: rgba(0,0,0,0.02); font-weight: 500;"'}>
                                            <div style="font-size: 0.7rem; color: var(--text-secondary); margin-top: 2px;">/ ${maxSe}</div>
                                        ` : '<span style="color: var(--glass-border); font-weight: bold;">-</span>'}
                                    </td>
                                    ` : ''}
                                    ${hasViva ? `
                                    <td style="padding: 1rem 0.5rem; text-align: center;">
                                        ${maxVi > 0 ? `
                                            <input type="number" class="vi-input" data-max="${maxVi}" value="${viVal}" step="0.5" style="width: 60px; padding: 0.5rem; text-align: center; border: 1px solid var(--glass-border); border-radius: 4px; background: rgba(0,0,0,0.02); font-weight: 500;">
                                            <div style="font-size: 0.7rem; color: var(--text-secondary); margin-top: 2px;">/ ${maxVi}</div>
                                        ` : '<span style="color: var(--glass-border); font-weight: bold;">-</span>'}
                                    </td>
                                    ` : ''}
                                    <td style="padding: 1rem 0.5rem; text-align: center; font-weight: bold;">
                                        <span class="sub-total" data-maxtot="${maxTot}">0</span>
                                        <div style="font-size: 0.7rem; color: var(--text-secondary); margin-top: 2px;">/ ${maxTot}</div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            `;
        }

        const modalHtml = `
            <div id="markModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; opacity: 0; transition: opacity 0.2s;">
                <div class="glass-panel" style="width: 100%; max-width: 800px; max-height: 90vh; overflow-y: auto; padding: 2.5rem; position: relative; transform: translateY(20px); transition: transform 0.2s; box-shadow: 0 20px 40px rgba(0,0,0,0.2);">
                    <button id="closeModalBtn" style="position: absolute; top: 1.5rem; right: 1.5rem; background: var(--glass-bg); border: 1px solid var(--glass-border); font-size: 1.2rem; cursor: pointer; color: var(--text-primary); border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">&times;</button>
                    
                    <h3 style="margin-bottom: 0.2rem; color: var(--text-primary);">Enter Detailed Marks</h3>
                    <p style="color: var(--text-secondary); font-size: 0.95rem; margin-bottom: 1.5rem;">Student: <strong>${student.name}</strong> (${student.rollNo})</p>
                    
                    <form id="marksForm">
                        ${subjectsHtml}
                        
                        <div style="margin-top: 2.5rem; display: flex; justify-content: flex-end; gap: 1rem; border-top: 1px solid var(--glass-border); padding-top: 1.5rem;">
                            <button type="button" class="glass-button" style="background: transparent;" id="cancelModalBtn">Cancel</button>
                            <button type="submit" class="glass-button" id="saveMarksBtn" ${enrichedSchedules.length === 0 ? 'disabled' : ''}>Save Marks</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        this.modalContainer.innerHTML = modalHtml;
        
        // Auto-calculate Totals dynamically
        const calcTotals = () => {
            document.querySelectorAll('.subject-row').forEach(row => {
                const thInput = row.querySelector('.th-input');
                const seInput = row.querySelector('.se-input');
                const viInput = row.querySelector('.vi-input');
                const totSpan = row.querySelector('.sub-total');
                
                const thVal = thInput ? (parseFloat(thInput.value) || 0) : 0;
                const seVal = seInput ? (parseFloat(seInput.value) || 0) : 0;
                const viVal = viInput ? (parseFloat(viInput.value) || 0) : 0;
                
                totSpan.textContent = thVal + seVal + viVal;
            });
        };
        
        calcTotals();
        document.getElementById('marksForm').addEventListener('input', calcTotals);
        
        // Animations
        setTimeout(() => {
            const modal = document.getElementById('markModal');
            if(modal) {
                modal.style.opacity = '1';
                modal.children[0].style.transform = 'translateY(0)';
            }
        }, 10);

        const closeFunc = () => {
            const modal = document.getElementById('markModal');
            if(modal) {
                modal.style.opacity = '0';
                modal.children[0].style.transform = 'translateY(10px)';
            }
            setTimeout(() => this.modalContainer.innerHTML = '', 200);
        };

        document.getElementById('closeModalBtn').addEventListener('click', closeFunc);
        document.getElementById('cancelModalBtn').addEventListener('click', closeFunc);

        const form = document.getElementById('marksForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            let totalObtainedInModal = 0;
            const marksData = [];
            let isValid = true;

            form.querySelectorAll('.subject-row').forEach(row => {
                const thInput = row.querySelector('.th-input');
                const seInput = row.querySelector('.se-input');
                const viInput = row.querySelector('.vi-input');

                const maxTh = thInput ? (parseFloat(thInput.dataset.max) || 0) : 0;
                const maxSe = seInput ? (parseFloat(seInput.dataset.max) || 0) : 0;
                const maxVi = viInput ? (parseFloat(viInput.dataset.max) || 0) : 0;
                
                let thVal = thInput ? parseFloat(thInput.value) : 0;
                let seVal = seInput ? parseFloat(seInput.value) : 0;
                let viVal = viInput ? parseFloat(viInput.value) : 0;
                
                if (isNaN(thVal)) thVal = 0;
                if (isNaN(seVal)) seVal = 0;
                if (isNaN(viVal)) viVal = 0;
                
                if (thInput) { if (thVal < 0 || thVal > maxTh) { VS.highlightError(thInput, `0-${maxTh}`); isValid = false; } else { VS.clearErrors(thInput); } }
                if (seInput) { if (seVal < 0 || seVal > maxSe) { VS.highlightError(seInput, `0-${maxSe}`); isValid = false; } else { VS.clearErrors(seInput); } }
                if (viInput) { if (viVal < 0 || viVal > maxVi) { VS.highlightError(viInput, `0-${maxVi}`); isValid = false; } else { VS.clearErrors(viInput); } }

                const subjectTot = thVal + seVal + viVal;
                
                marksData.push({
                    subjectId: row.dataset.subjectId,
                    subjectName: row.dataset.subjectName,
                    subjectCode: row.dataset.subjectCode || '',
                    semester: row.dataset.semester ? parseInt(row.dataset.semester) : undefined,
                    isSupplementary: row.dataset.isSupplementary === 'true',
                    theory: thVal,
                    sessional: seVal,
                    viva: viVal,
                    total: subjectTot,
                    maxTheory: maxTh,
                    maxSessional: maxSe,
                    maxViva: maxVi,
                    maxTotal: parseFloat(row.querySelector('.sub-total').dataset.maxtot) || 100
                });
                
                totalObtainedInModal += subjectTot;
            });

            // Merge with existing marks for subjects not shown in this modal
            const existingMark = this.existingMarks.find(m => m.studentId?._id === student._id || m.studentId === student._id);
            const mergedMarksData = [...marksData];
            
            if (existingMark && existingMark.subjectMarks) {
                existingMark.subjectMarks.forEach(oldSubMark => {
                    const isShownInModal = marksData.some(newSub => 
                        newSub.subjectId === oldSubMark.subjectId || 
                        newSub.subjectName === oldSubMark.subjectName
                    );
                    if (!isShownInModal) {
                        mergedMarksData.push(oldSubMark);
                    }
                });
            }

            if (!isValid) return;

            const saveBtn = document.getElementById('saveMarksBtn');
            saveBtn.textContent = 'Saving...';
            saveBtn.disabled = true;

            try {
                await ApiService.updateMarks({
                    examId: this.examId,
                    studentId: student._id,
                    studentSemester: studentSemester,
                    marksObtained: mergedMarksData.reduce((acc, m) => acc + (m.total || 0), 0),
                    subjectMarks: mergedMarksData
                });
                
                Toast.success(`Marks saved successfully for ${student.name}`);
                
                // Refresh marks list silently
                this.existingMarks = await ApiService.getMarksByExam(this.examId);
                this.renderStudentList();
                
                closeFunc();
            } catch (err) {
                Toast.error('Failed to save marks: ' + err.message);
                saveBtn.textContent = 'Save Marks';
                saveBtn.disabled = false;
            }
        });
    }

    async exportToExcel() {
        if (!this.filteredStudents.length) {
            Toast.error('Please load students first');
            return;
        }

        const subjects = (this.exam.subjectSchedules || []).filter(s => 
            !s.semester || Number(s.semester) === Number(this.selectedSemester)
        );

        if (!subjects.length) {
            Toast.error('No subjects found for this semester in the exam schedule');
            return;
        }

        // Prepare data for SheetJS
        // Meta Rows
        const metaRow1 = ['SEMESTER EXAMINATION RESULT', '', '', '', '', '', '', '', '', 'Trg. Deptt.'];
        const metaRow2 = [`FOR: ${this.exam.title}`, '', '', '', '', '', '', '', '', `Batch No: ${this.exam.course}`];
        const metaRow3 = [`COURSE: ${this.exam.course}`, '', '', '', '', `Semester: ${this.selectedSemester}`, '', '', '', `Date: ${new Date().toLocaleDateString()}`];
        const emptyRow = [];

        // Row 5: Headers
        const headerRow1 = ['SN', 'Roll No', 'Student Name'];
        const headerRow2 = ['', '', '']; // Sub-headers (Ses, Ex, Tot)
        
        subjects.forEach(sub => {
            headerRow1.push(sub.name, '', '');
            headerRow2.push('Ses', 'Ex', 'Tot');
        });
        headerRow1.push('Grand Total', '% Marks', 'Result');
        headerRow2.push('', '', '');

        const data = [metaRow1, metaRow2, metaRow3, emptyRow, headerRow1, headerRow2];

        this.filteredStudents.forEach((student, index) => {
            const existingMark = this.existingMarks.find(m => m.studentId?._id === student._id || m.studentId === student._id);
            const row = [index + 1, student.rollNo, student.name];
            
            let grandTotal = 0;
            let grandMax = 0;
            let allPassed = true;

            subjects.forEach(sub => {
                const sm = existingMark?.subjectMarks?.find(m => m.subjectId === sub.subjectId || m.subjectName === sub.name);
                row.push(sm?.sessional || '', sm?.theory || '', sm?.total || '');
                
                grandTotal += (sm?.total || 0);
                grandMax += (sub.maxTotal || 100);
                if (sm && sm.total < (sub.maxTotal || 100) * 0.4) allPassed = false;
            });

            const percentage = grandMax > 0 ? ((grandTotal / grandMax) * 100).toFixed(1) : 0;
            row.push(grandTotal, percentage, allPassed ? 'P' : 'F');
            data.push(row);
        });

        // Create workbook
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(data);

        // Define Styles
        const headerStyle = {
            font: { bold: true, color: { rgb: "000000" }, name: 'Arial', sz: 10 },
            fill: { fgColor: { rgb: "E9ECEF" } },
            alignment: { horizontal: "center", vertical: "center", wrapText: true },
            border: {
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } }
            }
        };

        const cellStyle = {
            font: { name: 'Arial', sz: 10 },
            alignment: { horizontal: "center", vertical: "center" },
            border: {
                top: { style: "thin", color: { rgb: "CCCCCC" } },
                bottom: { style: "thin", color: { rgb: "CCCCCC" } },
                left: { style: "thin", color: { rgb: "CCCCCC" } },
                right: { style: "thin", color: { rgb: "CCCCCC" } }
            }
        };

        const titleStyle = {
            font: { bold: true, sz: 16, color: { rgb: "4338CA" } },
            alignment: { horizontal: "center" }
        };

        const metaLabelStyle = {
            font: { bold: true, sz: 10 },
            alignment: { horizontal: "left" }
        };

        // Apply Styles to Cells
        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cell_address = { c: C, r: R };
                const cell_ref = XLSX.utils.encode_cell(cell_address);
                if (!ws[cell_ref]) ws[cell_ref] = { t: 's', v: '' };
                
                // Default cell style
                ws[cell_ref].s = cellStyle;

                // Title row
                if (R === 0) ws[cell_ref].s = titleStyle;
                // Meta rows
                else if (R > 0 && R < 3) ws[cell_ref].s = metaLabelStyle;
                // Header rows
                else if (R === 4 || R === 5) ws[cell_ref].s = headerStyle;
                
                // Result highlighting (P/F)
                if (R > 5 && C === range.e.c) {
                    const val = ws[cell_ref].v;
                    if (val === 'P') {
                        ws[cell_ref].s = { ...cellStyle, font: { ...cellStyle.font, color: { rgb: "059669" }, bold: true } };
                    } else if (val === 'F') {
                        ws[cell_ref].s = { ...cellStyle, font: { ...cellStyle.font, color: { rgb: "DC2626" }, bold: true } };
                    }
                }
            }
        }

        // Column Widths
        const colWidths = [
            { wch: 5 },  // SN
            { wch: 15 }, // Roll No
            { wch: 25 }, // Name
        ];
        subjects.forEach(() => {
            colWidths.push({ wch: 6 }, { wch: 6 }, { wch: 8 }); // Ses, Ex, Tot
        });
        colWidths.push({ wch: 12 }, { wch: 10 }, { wch: 8 }); // Grand Tot, %, Result
        ws['!cols'] = colWidths;

        // Add some styling (merging subject cells)
        const merges = [];
        // Meta merges
        merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }); // Title
        merges.push({ s: { r: 1, c: 0 }, e: { r: 1, c: 8 } }); // For
        merges.push({ s: { r: 2, c: 0 }, e: { r: 2, c: 4 } }); // Course

        let colIndex = 3; // Start after SN, Roll No and Name
        subjects.forEach(() => {
            merges.push({ s: { r: 4, c: colIndex }, e: { r: 4, c: colIndex + 2 } });
            colIndex += 3;
        });
        // Merge SN, Roll No and Name vertically
        merges.push({ s: { r: 4, c: 0 }, e: { r: 5, c: 0 } });
        merges.push({ s: { r: 4, c: 1 }, e: { r: 5, c: 1 } });
        merges.push({ s: { r: 4, c: 2 }, e: { r: 5, c: 2 } });
        // Merge Grand Total, % Marks, Result vertically
        merges.push({ s: { r: 4, c: colIndex }, e: { r: 5, c: colIndex } });
        merges.push({ s: { r: 4, c: colIndex + 1 }, e: { r: 5, c: colIndex + 1 } });
        merges.push({ s: { r: 4, c: colIndex + 2 }, e: { r: 5, c: colIndex + 2 } });

        ws['!merges'] = merges;

        XLSX.utils.book_append_sheet(wb, ws, "Exam Results");
        XLSX.writeFile(wb, `${this.exam.title}_Sem_${this.selectedSemester}_Results.xlsx`);
    }

    async importFromExcel(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // Read as array of arrays to handle our header structure
                const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                if (rows.length < 6) throw new Error('Invalid file format. Template must have metadata and 2 header rows.');

                const header1 = rows[4]; // Header row 1 (Subjects)
                const header2 = rows[5]; // Header row 2 (Ses, Ex, Tot)
                const dataRows = rows.slice(6); // Data starts from row 7

                const subjects = (this.exam.subjectSchedules || []).filter(s => 
                    !s.semester || Number(s.semester) === Number(this.selectedSemester)
                );

                const bulkMarks = [];
                let successCount = 0;

                for (const row of dataRows) {
                    if (!row || row.length < 2) continue;
                    const rollNo = row[1]; // Roll No is at index 1
                    const student = this.allStudents.find(s => String(s.rollNo) === String(rollNo));
                    if (!student) continue;

                    const subjectMarks = [];
                    let colIndex = 3; // Data starts from index 3 (after SN, Roll No, Name)

                    subjects.forEach(sub => {
                        const sessional = parseFloat(row[colIndex]) || 0;
                        const theory = parseFloat(row[colIndex + 1]) || 0;
                        const viva = 0; // Not explicitly in the template columns yet, can be added if needed
                        const total = sessional + theory + viva;

                        subjectMarks.push({
                            subjectId: sub.subjectId,
                            subjectName: sub.name,
                            subjectCode: sub.code || '',
                            semester: sub.semester ? parseInt(sub.semester) : parseInt(this.selectedSemester),
                            theory,
                            sessional,
                            viva,
                            total,
                            maxTheory: sub.maxTheory || 0,
                            maxSessional: sub.maxSessional || 0,
                            maxViva: sub.maxViva || 0,
                            maxTotal: sub.maxTotal || 100
                        });
                        colIndex += 3;
                    });

                    bulkMarks.push({
                        examId: this.examId,
                        studentId: student._id,
                        studentSemester: parseInt(this.selectedSemester),
                        marksObtained: subjectMarks.reduce((acc, m) => acc + m.total, 0),
                        subjectMarks
                    });
                    successCount++;
                }

                if (bulkMarks.length === 0) {
                    throw new Error('No matching students found in the file.');
                }

                if (confirm(`Found ${successCount} student records. Do you want to import them?`)) {
                    await ApiService.bulkUpdateMarks(bulkMarks);
                    Toast.success(`Successfully imported ${successCount} records`);
                    // Refresh data
                    this.existingMarks = await ApiService.getMarksByExam(this.examId);
                    this.renderStudentList();
                }
            } catch (err) {
                console.error('Import Error:', err);
                Toast.error('Import failed: ' + err.message);
            } finally {
                event.target.value = ''; // Reset input
            }
        };
        reader.readAsArrayBuffer(file);
    }
}
