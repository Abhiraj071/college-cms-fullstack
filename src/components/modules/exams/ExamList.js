import { ApiService } from '../../../services/ApiService.js';
import { Table } from '../../common/Table.js';
import { Toast } from '../../../services/Toast.js';
import { Modal } from '../../../services/Modal.js';
import { ROUTES } from '../../../services/Constants.js';
import { auth } from '../../../services/AuthService.js';

export class ExamList {
    constructor() {
        this.allExamsData = [];
        this.exams = [];
    }

    render() {
        const container = document.createElement('div');
        container.className = 'fade-in';
        const user = auth.getUser();
        const isAdmin = user.role === 'admin';
        const isStudent = user.role === 'student';

        // Header Section
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'flex-end';
        header.style.marginBottom = '2.5rem';
        header.style.flexWrap = 'wrap';
        header.style.gap = '1.5rem';

        const titleSection = document.createElement('div');
        titleSection.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 0.5rem;">
                <span style="font-size: 2rem;">📝</span>
                <h2 style="font-size: 2rem; margin: 0; letter-spacing: -1px;">Examinations</h2>
            </div>
            <p style="color: var(--text-secondary); font-size: 1rem; font-weight: 500;">Monitor assessment schedules, eligibility, and academic grading.</p>
        `;

        const actionGroup = document.createElement('div');
        actionGroup.style.display = 'flex';
        actionGroup.style.gap = '1rem';
        actionGroup.style.alignItems = 'center';

        let courseSelect = null;
        if (!isStudent) {
            courseSelect = document.createElement('select');
            courseSelect.className = 'glass-button';
            courseSelect.style.padding = '10px 16px';
            courseSelect.style.border = '1px solid var(--glass-border)';
            courseSelect.style.background = 'var(--bg-secondary)';
            courseSelect.style.color = 'var(--text-primary)';
            courseSelect.innerHTML = `<option value="">Select a Course...</option>`;
            
            ApiService.getCourses().then(courses => {
                courses.forEach(c => {
                    courseSelect.innerHTML += `<option value="${c.name}">${c.name}</option>`;
                });
            });

            courseSelect.onchange = () => this.renderTable(tableCard, isAdmin, isStudent, courseSelect.value);
            actionGroup.appendChild(courseSelect);
        }

        if (isAdmin) {
            const addBtn = document.createElement('button');
            addBtn.className = 'glass-button';
            addBtn.style.background = 'var(--accent-color)';
            addBtn.style.color = 'white';
            addBtn.style.border = 'none';
            addBtn.style.padding = '10px 24px';
            addBtn.style.fontWeight = '700';
            addBtn.textContent = '➕ Schedule New';
            addBtn.onclick = () => { window.location.hash = ROUTES.EXAMS_ADD; };
            actionGroup.appendChild(addBtn);

            const bulkBtn = document.createElement('button');
            bulkBtn.className = 'glass-button';
            bulkBtn.style.padding = '10px 20px';
            bulkBtn.style.fontWeight = '600';
            bulkBtn.textContent = '📤 Bulk Schedule';
            bulkBtn.onclick = () => { window.location.hash = ROUTES.EXAMS_BULK; };
            actionGroup.appendChild(bulkBtn);
        }

        header.appendChild(titleSection);
        header.appendChild(actionGroup);
        container.appendChild(header);

        const tableCard = document.createElement('div');
        tableCard.className = 'glass-panel';
        tableCard.style.padding = '0';
        tableCard.style.overflow = 'hidden';
        tableCard.style.minHeight = '300px';

        const loadData = async () => {
            tableCard.innerHTML = `
                <div style="padding: 5rem; text-align: center;">
                    <div class="loader-spinner" style="width: 40px; height: 40px; border: 4px solid var(--accent-glow); border-top-color: var(--accent-color); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1.5rem;"></div>
                    <p style="color: var(--text-secondary); font-weight: 500;">Retrieving evaluation cycles...</p>
                </div>
            `;
            try {
                let studentData = null;
                let failedSubjectKeys = new Set();

                if (isStudent) {
                    const students = await ApiService.getStudents(user.id);
                    if (students && students.length > 0) {
                        studentData = students[0];
                    }
                    // Fetch past marks to detect supplementary subjects
                    if (studentData) {
                        try {
                            const pastMarks = await ApiService.getStudentMarks(studentData._id);
                            pastMarks.forEach(m => {
                                if (m.subjectMarks) {
                                    m.subjectMarks.forEach(sm => {
                                        const max = sm.maxTotal || 100;
                                        const passing = max * 0.4;
                                        if (sm.total < passing && !sm.isSupplementary) {
                                            failedSubjectKeys.add(sm.subjectId || sm.subjectName);
                                        }
                                        if (sm.isSupplementary && sm.total >= passing) {
                                            failedSubjectKeys.delete(sm.subjectId || sm.subjectName);
                                        }
                                    });
                                }
                            });
                        } catch (e) { /* ignore */ }
                    }
                }

                const allExams = await ApiService.getExams();
                this.allExamsData = allExams;

                // Fetch subjects to resolve semester info
                let subjectSemesterMap = {};
                if (isStudent) {
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
                }

                this.renderTable(tableCard, isAdmin, isStudent, courseSelect ? courseSelect.value : null, studentData, failedSubjectKeys, subjectSemesterMap);
            } catch (err) { 
                console.error('ExamList Load Error:', err);
                Toast.error('Load Error: ' + err.message); 
                tableCard.innerHTML = `
                    <div style="padding: 5rem; text-align: center;">
                        <p style="color: var(--error);">Failed to retrieve evaluation cycles.</p>
                        <button class="glass-button" style="margin-top: 1rem;" onclick="location.reload()">Retry</button>
                    </div>
                `;
            }
        };

        loadData();
        container.appendChild(tableCard);
        return container;
    }

    renderTable(tableCard, isAdmin, isStudent, selectedCourse, studentData, failedSubjectKeys = new Set(), subjectSemesterMap = {}) {
        let displayExams = this.allExamsData;

        if (isStudent) {
            const studentCourse = studentData ? studentData.course : null;
            displayExams = this.allExamsData.filter(e => e.course === studentCourse);
        } else if (selectedCourse) {
            displayExams = this.allExamsData.filter(e => e.course === selectedCourse);
        } else {
            // If no course is selected yet by Admin, show empty state asking to select.
            tableCard.innerHTML = `
                <div style="text-align: center; padding: 5rem 2rem; border: 1px dashed var(--glass-border); border-radius: 16px;">
                    <div style="font-size: 3rem; margin-bottom: 1.5rem; opacity: 0.2;">📚</div>
                    <h3 style="opacity: 0.6;">Select a Course</h3>
                    <p style="color: var(--text-secondary); max-width: 320px; margin: 0 auto;">Please select a course from the dropdown above to view its exam schedule.</p>
                </div>
            `;
            return;
        }

        this.exams = displayExams;

        tableCard.innerHTML = '';
        if (this.exams.length === 0) {
                    tableCard.innerHTML = `
                        <div style="text-align: center; padding: 5rem 2rem; border: 1px dashed var(--glass-border); border-radius: 16px;">
                            <div style="font-size: 3rem; margin-bottom: 1.5rem; opacity: 0.2;">📄</div>
                            <h3 style="opacity: 0.6;">No Assessments Found</h3>
                            <p style="color: var(--text-secondary); max-width: 320px; margin: 0 auto;">There are no examination cycles scheduled for your current parameters.</p>
                        </div>
                    `;
                    return;
                }

                let tableData = [];
                let columns = [];
                
                if (isAdmin) {
                    tableData = this.exams.map(e => ({
                        ...e,
                        statusText: new Date(e.date) < new Date() ? 'Archived' : 'Active'
                    }));

                    columns = [
                        { key: 'title', label: 'Evaluation Title', render: (v, item) => `
                            <div style="font-weight: 800; color: var(--text-primary);">
                                ${v}
                            </div>
                            <div style="font-size: 0.7rem; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; margin-top:2px;">
                                ${item.course}
                            </div>` },
                        { key: 'subjectSchedules', label: 'Subjects', render: (v, item) => {
                            if (v && v.length > 0) {
                                return `<div style="font-weight:700; color:var(--accent-color);">${v.length} subject${v.length>1?'s':''}</div>
                                    <div style="font-size:0.7rem; color:var(--text-secondary); font-weight:600;">${v.slice(0,2).map(s=>s.name).join(', ')}${v.length>2?' …':''}</div>`;
                            }
                            return `<div style="font-weight:700;">${item.subject || '—'}</div>`;
                        }},
                        { key: 'subjectSchedules', label: 'Schedule', render: (v, item) => {
                            if (v && v.length > 0) {
                                const first = v[0];
                                const last = v[v.length - 1];
                                const fmt = d => d ? new Date(d).toLocaleDateString(undefined, { month:'short', day:'numeric' }) : '?';
                                if (v.length === 1) return `<div style="font-weight:700;">${fmt(first.date)}</div><div style="font-size:0.7rem; color:var(--text-secondary);">${first.time || ''}</div>`;
                                return `<div style="font-weight:700;">${fmt(first.date)} – ${fmt(last.date)}</div><div style="font-size:0.7rem; color:var(--text-secondary);">over ${v.length} dates</div>`;
                            }
                            const d = item.date;
                            return `<div style="font-weight:700;">${d ? new Date(d).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}) : '—'}</div>`;
                        }},
                        { key: 'subjectSchedules', label: 'Marks', render: (v, item) => {
                            if (v && v.length > 0) {
                                const first = v[0];
                                return `<div style="font-size:0.75rem; line-height:1.6;">
                                    <div><code style="font-weight:800; color:var(--accent-color);">${first.maxTotal}T</code></div>
                                    <div style="color:var(--text-secondary);">${first.maxTheory}Th + ${first.maxSessional}S</div>
                                </div>`;
                            }
                            return `<code style="font-weight:800; color:var(--accent-color);">${item.totalMarks || '—'}pts</code>`;
                        }},
                        { key: 'statusText', label: 'Status', render: (v) => {
                            const active = v === 'Active';
                            return `<span style="padding: 4px 10px; background: ${active ? 'var(--accent-glow)' : 'rgba(0,0,0,0.05)'}; border-radius: 20px; font-size: 0.7rem; font-weight: 800; color: ${active ? 'var(--accent-color)' : 'var(--text-secondary)'}; text-transform: uppercase;">${v}</span>`;
                        }},
                        { key: '_id', label: 'Actions', render: (v, item) => {
                            return `<button class="glass-button marks-entry-btn" data-id="${v}" style="padding: 6px 12px; font-size: 0.7rem; font-weight: 700;">📥 Assign Grades</button>`;
                        }}
                    ];
                } else {
                    const studentSemester = studentData ? parseInt(studentData.semester) || 1 : 1;

                    this.exams.forEach(e => {
                        if (e.subjectSchedules && e.subjectSchedules.length > 0) {
                            e.subjectSchedules.forEach((sub, idx) => {
                                // Resolve semester: from schedule first, then from Subject model
                                let subjSem = sub.semester ? parseInt(sub.semester) : null;
                                if (!subjSem) subjSem = subjectSemesterMap[sub.subjectId] || subjectSemesterMap[sub.name] || subjectSemesterMap[sub.code] || null;

                                const key = sub.subjectId || sub.name;

                                // Filter: only current semester subjects + previous failed subjects
                                if (isStudent) {
                                    if (!subjSem) return; // skip subjects with unknown semester
                                    
                                    const isCurrentSem = Number(subjSem) === Number(studentSemester);
                                    const isBacklog = Number(subjSem) < Number(studentSemester) && failedSubjectKeys.has(key);

                                    if (!isCurrentSem && !isBacklog) {
                                        return; // skip this subject
                                    }
                                }

                                const isSuppSubject = Number(subjSem) < Number(studentSemester) && failedSubjectKeys.has(key);

                                tableData.push({
                                    _id: e._id + '_' + idx,
                                    examId: e._id,
                                    examTitle: e.title,
                                    course: e.course,
                                    subjectName: sub.name,
                                    subjectCode: sub.code || '',
                                    semester: subjSem,
                                    isSupplementary: isSuppSubject || false,
                                    date: sub.date,
                                    time: sub.time || '',
                                    maxTotal: sub.maxTotal || 100,
                                    maxTheory: sub.maxTheory || 0,
                                    maxSessional: sub.maxSessional || 0,
                                    statusText: new Date(sub.date || e.date) < new Date() ? 'Archived' : 'Active'
                                });
                            });
                        } else {
                            tableData.push({
                                _id: e._id,
                                examId: e._id,
                                examTitle: e.title,
                                course: e.course,
                                subjectName: e.subject || '—',
                                subjectCode: '',
                                semester: null,
                                isSupplementary: false,
                                date: e.date,
                                time: e.time || '',
                                maxTotal: e.totalMarks || 100,
                                maxTheory: 0,
                                maxSessional: 0,
                                statusText: new Date(e.date) < new Date() ? 'Archived' : 'Active'
                            });
                        }
                    });

                    columns = [
                        { key: 'subjectName', label: 'Subject', render: (v, item) => `
                            <div style="font-weight: 800; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                                ${v}
                                ${item.isSupplementary ? '<span style="background: rgba(239, 68, 68, 0.15); color: #ef4444; padding: 2px 8px; border-radius: 4px; font-size: 0.6rem; text-transform: uppercase; font-weight: 800;">SUPP — Sem ' + item.semester + '</span>' : ''}
                            </div>
                            <div style="font-size: 0.7rem; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; margin-top:2px;">
                                ${item.subjectCode ? item.subjectCode + ' • ' : ''}${item.examTitle}${item.semester ? ' • Sem ' + item.semester : ''}
                            </div>` },
                        { key: 'date', label: 'Date & Time', render: (v, item) => {
                            const d = v ? new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
                            return `<div style="font-weight:700;">${d}</div><div style="font-size:0.75rem; color:var(--text-secondary);">${item.time || '—'}</div>`;
                        }},
                        { key: 'maxTotal', label: 'Marks', render: (v, item) => {
                            if (item.maxTheory > 0) {
                                return `<div style="font-size:0.75rem; line-height:1.6;">
                                    <div><code style="font-weight:800; color:var(--accent-color);">${v}T</code></div>
                                    <div style="color:var(--text-secondary);">${item.maxTheory}Th + ${item.maxSessional}S</div>
                                </div>`;
                            }
                            return `<code style="font-weight:800; color:var(--accent-color);">${v || '—'}pts</code>`;
                        }},
                        { key: 'statusText', label: 'Status', render: (v) => {
                            const active = v === 'Active';
                            return `<span style="padding: 4px 10px; background: ${active ? 'var(--accent-glow)' : 'rgba(0,0,0,0.05)'}; border-radius: 20px; font-size: 0.7rem; font-weight: 800; color: ${active ? 'var(--accent-color)' : 'var(--text-secondary)'}; text-transform: uppercase;">${v}</span>`;
                        }}
                    ];
                }

                if (isStudent) {
                    const grid = document.createElement('div');
                    grid.style.display = 'grid';
                    grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(320px, 1fr))';
                    grid.style.gap = '1.5rem';
                    grid.style.padding = '1.5rem';
                    grid.style.background = 'transparent';

                    tableData.sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(item => {
                        const isUpcoming = item.statusText === 'Active';
                        const d = item.date ? new Date(item.date) : null;
                        const month = d ? d.toLocaleString('en-US', { month: 'short' }) : 'TBA';
                        const day = d ? d.getDate() : '-';
                        const year = d ? d.getFullYear() : '';
                        
                        const card = document.createElement('div');
                        card.className = 'glass-panel';
                        card.style.padding = '1.5rem';
                        card.style.borderTop = isUpcoming ? '4px solid #8b5cf6' : '4px solid #94a3b8';
                        card.style.position = 'relative';
                        card.style.overflow = 'hidden';
                        card.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
                        card.style.cursor = 'default';
                        
                        card.onmouseenter = () => { card.style.transform = 'translateY(-4px)'; card.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)'; };
                        card.onmouseleave = () => { card.style.transform = 'none'; card.style.boxShadow = 'none'; };
                        
                        card.innerHTML = `
                            <div style="display: flex; gap: 1.25rem; align-items: flex-start; margin-bottom: 1.5rem;">
                                <div style="min-width: 65px; height: 65px; background: ${isUpcoming ? 'linear-gradient(135deg, #f3e8ff, #e0e7ff)' : 'rgba(0,0,0,0.05)'}; border-radius: 14px; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.05); border: 1px solid rgba(255,255,255,0.5);">
                                    <span style="font-size: 0.75rem; font-weight: 800; color: ${isUpcoming ? '#8b5cf6' : '#64748b'}; text-transform: uppercase; letter-spacing: 1px;">${month}</span>
                                    <span style="font-size: 1.6rem; font-weight: 800; color: ${isUpcoming ? '#4338ca' : '#475569'}; line-height: 1; margin-top: 2px;">${day}</span>
                                </div>
                                <div style="flex: 1;">
                                    <h4 style="margin: 0 0 6px 0; font-size: 1.15rem; font-weight: 800; color: var(--text-primary); line-height: 1.3;">${item.subjectName}</h4>
                                    <div style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">
                                        ${item.examTitle} ${item.subjectCode ? `• ${item.subjectCode}` : ''}
                                    </div>
                                    <div style="display: inline-flex; align-items: center; padding: 4px 10px; background: ${isUpcoming ? 'rgba(139, 92, 246, 0.1)' : 'rgba(0,0,0,0.04)'}; border-radius: 8px; font-size: 0.75rem; font-weight: 700; color: ${isUpcoming ? '#8b5cf6' : 'var(--text-secondary)'};">
                                        <span style="margin-right: 6px;">🕒</span> ${item.time || 'Time TBA'}
                                    </div>
                                </div>
                            </div>
                            
                            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 1.25rem; border-top: 1px dashed var(--glass-border);">
                                <div>
                                    <div style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 2px;">Total Marks</div>
                                    <div style="font-weight: 800; font-size: 1.1rem; color: var(--accent-color);">${item.maxTotal}</div>
                                </div>
                                ${item.isSupplementary ? '<span style="background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 6px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 800; letter-spacing: 0.5px;">SUPPLEMENTARY</span>' : ''}
                                ${!item.isSupplementary ? `<span style="background: ${isUpcoming ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0,0,0,0.05)'}; color: ${isUpcoming ? '#10b981' : '#64748b'}; padding: 6px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 800; letter-spacing: 0.5px;">SEMESTER ${item.semester}</span>` : ''}
                            </div>
                            ${!isUpcoming ? '<div style="position:absolute; inset:0; background:rgba(255,255,255,0.4); pointer-events:none;"></div>' : ''}
                        `;
                        grid.appendChild(card);
                    });
                    
                    tableCard.appendChild(grid);
                    tableCard.style.background = 'transparent';
                    tableCard.style.border = 'none';
                    tableCard.style.boxShadow = 'none';
                } else {
                    const table = new Table({
                        columns: columns,
                        data: tableData,
                        onEdit: isAdmin ? (id) => {
                            window.location.hash = ROUTES.EXAMS_EDIT.replace(':id', id);
                        } : null,
                        onDelete: !isAdmin ? null : (id) => {
                            const e = this.exams.find(x => x._id === id);
                            if (!e) return;
                            Modal.confirm('Purge Exam Schedule?', `Remove the assessment cycle for ${e.title}? This action cleans all associated results.`, async () => {
                                try { 
                                    await ApiService.deleteExam(id); 
                                    // Re-fetch data
                                    const allExams = await ApiService.getExams();
                                    this.allExamsData = allExams;
                                    this.renderTable(tableCard, isAdmin, isStudent, selectedCourse);
                                    Toast.success('Purged.'); 
                                }
                                catch (err) { Toast.error(err.message); }
                            });
                        }
                    });

                    const tableNode = table.render();
                    tableNode.onclick = (e) => {
                        const btn = e.target.closest('.marks-entry-btn');
                        if (btn) {
                            const id = btn.dataset.id;
                            window.location.hash = ROUTES.EXAMS_MARKS.replace(':id', id) + `?id=${id}`;
                        }
                    };
                    tableCard.appendChild(tableNode);
                }

                if (isAdmin) {
                    const tip = document.createElement('div');
                    tip.style.padding = '1.25rem 2rem';
                    tip.style.background = 'var(--bg-secondary)';
                    tip.style.borderTop = '1px solid var(--glass-border)';
                    tip.innerHTML = `<p style="margin:0; font-size:0.8rem; color:var(--text-secondary); font-weight:600;">💡 Tip: Use the <strong>Assign Grades</strong> button to sync student performances or the pencil icon to modify schedule details.</p>`;
                    tableCard.appendChild(tip);
                }
    }
}
