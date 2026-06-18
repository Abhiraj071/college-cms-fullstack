import { ApiService } from '../../../services/ApiService.js';
import { ValidationService as VS } from '../../../services/ValidationService.js';
import { ROUTES } from '../../../services/Constants.js';
import { Toast } from '../../../services/Toast.js';

export class ExamForm {
    constructor(examId = null) {
        this.examId = examId;
        this.isEdit = !!examId;
        this.examData = null;
        this.step = 1; // 1 = course-level info, 2 = per-subject schedule
        this.courseSubjects = [];
        this.subjectSchedules = [];
        this.stepOneData = null;
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
            <div style="display: flex; align-items: center; gap: 1rem; cursor: pointer; color: var(--text-secondary);" onclick="window.location.hash='${ROUTES.EXAMS_LIST}'">
                <span>← Back to List</span>
            </div>
            <h2 style="margin-top: 1rem;">${this.isEdit ? 'Edit Exam Schedule' : 'Schedule New Exam'}</h2>
        `;
        container.appendChild(header);

        // Step Indicator
        const stepIndicator = document.createElement('div');
        stepIndicator.id = 'step-indicator';
        stepIndicator.style.cssText = `
            display: flex; align-items: center; margin-bottom: 2rem;
            background: var(--bg-secondary); border-radius: 12px; padding: 1rem 1.5rem;
            border: 1px solid var(--glass-border);
        `;
        stepIndicator.innerHTML = this._renderStepIndicator();
        container.appendChild(stepIndicator);

        // Step Content Area
        const stepContent = document.createElement('div');
        stepContent.id = 'step-content';
        container.appendChild(stepContent);

        this._initForm(stepIndicator, stepContent);

        return container;
    }

    _renderStepIndicator() {
        const steps = [
            { num: 1, label: 'Exam Details', desc: 'Course & title' },
            { num: 2, label: 'Subject Schedule', desc: 'Date, time & marks per subject' }
        ];
        return steps.map((s, i) => {
            const isActive = this.step === s.num;
            const isDone = this.step > s.num;
            const color = isActive ? 'var(--accent-color)' : isDone ? '#22c55e' : 'var(--text-secondary)';
            const bg = isActive ? 'var(--accent-glow)' : isDone ? 'rgba(34,197,94,0.15)' : 'rgba(0,0,0,0.1)';
            return `
                ${i > 0 ? `<div style="flex:1; height:2px; background: ${isDone ? '#22c55e' : 'var(--glass-border)'}; margin: 0 1rem;"></div>` : ''}
                <div style="display:flex; align-items:center; gap:0.75rem; flex-shrink:0;">
                    <div style="width:36px; height:36px; border-radius:50%; background:${bg}; border:2px solid ${color};
                        display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.9rem; color:${color};">
                        ${isDone ? '✓' : s.num}
                    </div>
                    <div>
                        <div style="font-weight:800; font-size:0.85rem; color:${isActive ? 'var(--text-primary)' : 'var(--text-secondary)'};">${s.label}</div>
                        <div style="font-size:0.7rem; color:var(--text-secondary); font-weight:600;">${s.desc}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    async _initForm(stepIndicator, stepContent) {
        if (this.isEdit) {
            try {
                const exams = await ApiService.getExams();
                this.examData = exams.find(e => e._id === this.examId);
                if (!this.examData) {
                    Toast.error('Exam record not found');
                    window.location.hash = ROUTES.EXAMS_LIST;
                    return;
                }
                this.stepOneData = {
                    title: this.examData.title,
                    course: this.examData.course,
                    semester: this.examData.semester || '',
                    venue: this.examData.venue || '',
                };
                this.subjectSchedules = this.examData.subjectSchedules || [];
            } catch (err) {
                Toast.error('Error loading exam: ' + err.message);
            }
        }
        this._renderStep1(stepIndicator, stepContent);
    }

    _renderStep1(stepIndicator, stepContent) {
        this.step = 1;
        stepIndicator.innerHTML = this._renderStepIndicator();
        stepContent.innerHTML = '';

        const card = document.createElement('div');
        card.className = 'glass-panel';
        card.style.padding = '2.5rem';

        const sectionTitle = document.createElement('div');
        sectionTitle.style.marginBottom = '1.5rem';
        sectionTitle.innerHTML = `
            <h3 style="margin:0 0 0.25rem; font-size:1.1rem;">Step 1: Exam Details</h3>
            <p style="margin:0; color:var(--text-secondary); font-size:0.85rem;">Choose the course and fill in the overall exam information.</p>
        `;
        card.appendChild(sectionTitle);

        const form = document.createElement('form');
        form.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
                <div style="grid-column: span 2;">
                    <label>Exam Title</label>
                    <input type="text" name="title" placeholder="e.g. Mid-Term Examination 2025" required
                        value="${this.stepOneData?.title || ''}">
                </div>
                <div>
                    <label>Course / Program</label>
                    <select name="course" id="courseSelect" required>
                        <option value="">-- Loading Courses --</option>
                    </select>
                </div>
                <div>
                    <label>Default Venue / Hall <span style="font-weight:400; color:var(--text-secondary);">(can be overridden)</span></label>
                    <input type="text" name="venue" placeholder="e.g. Exam Hall A"
                        value="${this.stepOneData?.venue || ''}">
                </div>
            </div>
            <div style="border-top: 1px solid var(--glass-border); padding-top: 2rem; display: flex; justify-content: flex-end; gap: 1rem;">
                <button type="button" class="glass-button" style="background: transparent;" onclick="window.history.back()">Cancel</button>
                <button type="submit" id="nextBtn" class="glass-button" style="background: var(--accent-color); color: white; border: none; font-weight: 700;">
                    Next: Schedule Subjects →
                </button>
            </div>
        `;

        const courseSelect = form.querySelector('#courseSelect');

        ApiService.getCourses().then(courses => {
            courseSelect.innerHTML = '<option value="">-- Select Course --</option>' +
                courses.map(c => `<option value="${c.name}" ${this.stepOneData?.course === c.name ? 'selected' : ''}>${c.name}</option>`).join('');
        }).catch(err => Toast.error('Could not load courses: ' + err.message));

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            VS.clearErrors(form);

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            let isValid = true;
            if (!VS.validateRequired(data.title)) { VS.highlightError(form.elements['title'], 'Exam title is required'); isValid = false; }
            if (!VS.validateRequired(data.course)) { VS.highlightError(form.elements['course'], 'Please select a course'); isValid = false; }
            if (!isValid) return;

            this.stepOneData = data;

            const nextBtn = form.querySelector('#nextBtn');
            nextBtn.textContent = 'Loading subjects...';
            nextBtn.disabled = true;

            try {
                // Fetch all subjects directly
                const allSubjects = await ApiService.getSubjects();

                const selectedCourseRaw = data.course || '';
                const selectedCourseLower = selectedCourseRaw.trim().toLowerCase();

                // 1. Current Subjects: Match subjects by course directly
                let matched = allSubjects.filter(s => s.course && s.course.trim().toLowerCase() === selectedCourseLower);

                // 2. Supplementary Subjects: Include subjects that students in this course have failed
                try {
                    const marks = await ApiService.request(`/exams/marks?course=${encodeURIComponent(data.course)}`);
                    const selectedCourse = data.course.trim().toLowerCase();
                    const studentsInCourse = await ApiService.getStudents().then(st => st.filter(s => s.course && s.course.trim().toLowerCase() === selectedCourse));
                    const studentIds = new Set(studentsInCourse.map(s => String(s._id)));
                    
                    const failedSubjectKeys = new Set(); // Stores subjectName or subjectId
                    const passedSubjectKeys = new Set();
                    
                    marks.forEach(m => {
                        const mSid = String(m.studentId?._id || m.studentId);
                        if (m.subjectMarks) {
                            m.subjectMarks.forEach(sm => {
                                const key = sm.subjectId || sm.subjectName || sm.subjectCode;
                                if (!key) return;

                                const max = sm.maxTotal || 100;
                                const passing = max * 0.4;
                                
                                if (sm.total >= passing) {
                                    passedSubjectKeys.add(key + '_' + mSid);
                                } else {
                                    failedSubjectKeys.add(key + '_' + mSid);
                                }
                            });
                        }
                    });

                    // A subject is a backlog if at least one student failed it and hasn't passed it yet
                    const subjectsNeedingBacklog = new Set();
                    const codesNeedingBacklog = new Set();
                    
                    failedSubjectKeys.forEach(fKey => {
                        if (!passedSubjectKeys.has(fKey)) {
                            const subjectKey = fKey.split('_')[0];
                            // Try to see if it looks like a code or ID
                            if (subjectKey.length > 15) subjectsNeedingBacklog.add(subjectKey);
                            else codesNeedingBacklog.add(subjectKey);
                            
                            // Always add the name as a fallback
                            subjectsNeedingBacklog.add(subjectKey);
                        }
                    });
                    
                    const backlogSubjects = allSubjects.filter(s => {
                        const sid = String(s._id);
                        const sName = (s.name || '').trim().toLowerCase();
                        const sCode = (s.code || '').trim().toLowerCase();
                        
                        const isBacklog = subjectsNeedingBacklog.has(sid) || 
                                          Array.from(subjectsNeedingBacklog).some(name => name.trim().toLowerCase() === sName) || 
                                          Array.from(codesNeedingBacklog).some(code => code.trim().toLowerCase() === sCode);
                        
                        const alreadyIn = matched.some(m => {
                            const mName = (m.name || '').trim().toLowerCase();
                            const mCode = (m.code || '').trim().toLowerCase();
                            return mName === sName || String(m._id) === sid || (sCode && mCode === sCode);
                        });
                        
                        return isBacklog && !alreadyIn;
                    }).map(s => ({ ...s, isBacklog: true }));
                    
                    matched = [...matched, ...backlogSubjects];
                } catch (e) { console.error('Failed to fetch backlog subjects', e); }

                // Final fallback: show all subjects if still empty
                if (matched.length === 0) {
                    matched = allSubjects;
                }

                // Sort by year then name
                matched.sort((a, b) => (a.year || 99) - (b.year || 99) || a.name.localeCompare(b.name));

                this.courseSubjects = matched;

                if (this.courseSubjects.length === 0) {
                    Toast.error('No subjects found. Please add subjects first.');
                    nextBtn.textContent = 'Next: Schedule Subjects →';
                    nextBtn.disabled = false;
                    return;
                }

                // Pre-populate schedules for subjects not already in the list
                this.courseSubjects.forEach(sub => {
                    const existing = this.subjectSchedules.find(s => s.subjectId === sub._id || s.name === sub.name);
                    if (!existing) {
                        this.subjectSchedules.push({
                            subjectId: sub._id,
                            name: sub.name,
                            code: sub.code || '',
                            semester: sub.semester || null,
                            isSupplementary: sub.isBacklog || false,
                            date: '',
                            time: '',
                            maxTotal: 100,
                            maxTheory: 70,
                            maxSessional: 30,
                            venue: ''
                        });
                    }
                });

                this._renderStep2(stepIndicator, stepContent);
            } catch (err) {
                Toast.error('Could not load subjects: ' + err.message);
                nextBtn.textContent = 'Next: Schedule Subjects →';
                nextBtn.disabled = false;
            }
        });

        card.appendChild(form);
        stepContent.appendChild(card);
    }

    _renderStep2(stepIndicator, stepContent) {
        this.step = 2;
        stepIndicator.innerHTML = this._renderStepIndicator();
        stepContent.innerHTML = '';

        const card = document.createElement('div');
        card.className = 'glass-panel';
        card.style.padding = '2.5rem';

        // Section title
        const sectionTitle = document.createElement('div');
        sectionTitle.style.marginBottom = '1.25rem';
        sectionTitle.innerHTML = `
            <h3 style="margin:0 0 0.25rem; font-size:1.1rem;">Step 2: Subject-wise Schedule</h3>
            <p style="margin:0; color:var(--text-secondary); font-size:0.85rem;">
                Set the date, time, and maximum marks for each subject in <strong>${this.stepOneData.course}</strong>.
                Theory + Sessional must equal Total Marks.
            </p>
        `;
        card.appendChild(sectionTitle);

        // Info bar
        const infoBar = document.createElement('div');
        infoBar.style.cssText = `
            background: var(--accent-glow); border: 1px solid var(--accent-color);
            border-radius: 10px; padding: 0.75rem 1.25rem; margin-bottom: 1.5rem;
            display: flex; flex-wrap:wrap; align-items: center; gap: 0.75rem;
        `;
        infoBar.innerHTML = `
            <span style="font-size:1.1rem;">🗓️</span>
            <span style="font-size:0.82rem; color:var(--text-primary); font-weight:600;">
                <strong>${this.stepOneData.title}</strong>
                &nbsp;·&nbsp; ${this.courseSubjects.length} subjects
            </span>
        `;
        card.appendChild(infoBar);

        // Subjects container
        const subjectsContainer = document.createElement('div');
        subjectsContainer.style.cssText = 'display:flex; flex-direction:column; gap:1.25rem;';

        this.courseSubjects.forEach((sub, idx) => {
            const schedule = this.subjectSchedules.find(s => s.subjectId === sub._id || s.name === sub.name) || {};

            // Insert year group header when year changes
            const prevSub = this.courseSubjects[idx - 1];
            if (sub.year && sub.year !== (prevSub?.year)) {
                const yearHeader = document.createElement('div');
                yearHeader.style.cssText = `
                    display: flex; align-items: center; gap: 0.75rem;
                    margin-top: ${idx === 0 ? '0' : '0.5rem'};
                `;
                yearHeader.innerHTML = `
                    <div style="background:var(--accent-color); color:white; font-size:0.72rem; font-weight:800;
                        padding:4px 12px; border-radius:20px; text-transform:uppercase; letter-spacing:0.5px; flex-shrink:0;">
                        Year ${sub.year}
                    </div>
                    <div style="flex:1; height:1px; background:var(--glass-border);"></div>
                `;
                subjectsContainer.appendChild(yearHeader);
            }

            const subCard = document.createElement('div');
            subCard.style.cssText = `
                border: 1px solid var(--glass-border); border-radius: 12px;
                overflow: hidden; background: var(--bg-secondary);
            `;

            subCard.innerHTML = `
                <div style="background:rgba(0,0,0,0.12); padding:0.85rem 1.25rem; display:flex; align-items:center; gap:0.75rem; border-bottom:1px solid var(--glass-border);">
                    <span style="width:28px; height:28px; border-radius:8px; background:var(--accent-glow); border:1px solid var(--accent-color);
                        display:inline-flex; align-items:center; justify-content:center; font-weight:800; font-size:0.75rem; color:var(--accent-color); flex-shrink:0;">
                        ${idx + 1}
                    </span>
                    <div>
                        <div style="font-weight:800; font-size:0.95rem;">${sub.name}</div>
                        <div style="font-size:0.7rem; color:var(--text-secondary); font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">
                            ${sub.code ? sub.code + ' &nbsp;·&nbsp; ' : ''}${sub.type || 'Theory'}${sub.year ? ' &nbsp;·&nbsp; Year ' + sub.year : ''}${sub.semester ? ' &nbsp;·&nbsp; Sem ' + sub.semester : ''}
                        </div>
                    </div>
                    <div id="vbadge-${idx}" style="margin-left:auto; font-size:0.75rem; font-weight:700;"></div>
                </div>
                <div style="padding:1.25rem; display:grid; grid-template-columns: ${['Practical','Project'].includes(sub.type) ? '1fr 1fr 1fr 1fr 1fr 1fr' : '1fr 1fr 1fr 1fr 1fr'}; gap:1rem; align-items:end;">
                    <div>
                        <label style="font-size:0.7rem; font-weight:800; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px; display:block;">📅 Exam Date</label>
                        <input type="date" class="sub-date" data-idx="${idx}"
                            value="${schedule.date ? schedule.date.split('T')[0] : ''}"
                            style="width:100%;">
                    </div>
                    <div>
                        <label style="font-size:0.7rem; font-weight:800; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px; display:block;">⏰ Exam Time</label>
                        <input type="time" class="sub-time" data-idx="${idx}"
                            value="${schedule.time || ''}"
                            style="width:100%;">
                    </div>
                    <div>
                        <label style="font-size:0.7rem; font-weight:800; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px; display:block;">📊 Max Total</label>
                        <input type="number" class="sub-maxTotal" data-idx="${idx}"
                            value="${schedule.maxTotal !== undefined ? schedule.maxTotal : 100}"
                            min="1" max="1000" style="width:100%;">
                    </div>
                    <div>
                        <label style="font-size:0.7rem; font-weight:800; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px; display:block;">📝 Max Theory</label>
                        <input type="number" class="sub-maxTheory" data-idx="${idx}"
                            value="${schedule.maxTheory !== undefined ? schedule.maxTheory : (['Practical','Project'].includes(sub.type) ? 50 : 70)}"
                            min="0" max="1000" style="width:100%;">
                    </div>
                    <div>
                        <label style="font-size:0.7rem; font-weight:800; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px; display:block;">🗒️ Max Sessional</label>
                        <input type="number" class="sub-maxSessional" data-idx="${idx}"
                            value="${schedule.maxSessional !== undefined ? schedule.maxSessional : (['Practical','Project'].includes(sub.type) ? 25 : 30)}"
                            min="0" max="1000" style="width:100%;">
                    </div>
                    ${['Practical','Project'].includes(sub.type) ? `
                    <div>
                        <label style="font-size:0.7rem; font-weight:800; color:#a855f7; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px; display:block;">🎤 Max Viva</label>
                        <input type="number" class="sub-maxViva" data-idx="${idx}"
                            value="${schedule.maxViva !== undefined ? schedule.maxViva : 25}"
                            min="0" max="1000"
                            style="width:100%; border-color: rgba(168,85,247,0.5); outline-color: #a855f7;">
                    </div>` : `<input type="hidden" class="sub-maxViva" data-idx="${idx}" value="0">`}
                </div>
                <div style="padding:0 1.25rem 1.25rem;">
                    <label style="font-size:0.7rem; font-weight:800; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px; display:block;">🏫 Venue (optional)</label>
                    <input type="text" class="sub-venue" data-idx="${idx}"
                        value="${schedule.venue || ''}"
                        placeholder="${this.stepOneData.venue ? 'Default: ' + this.stepOneData.venue : 'e.g. Room 101'}"
                        style="width:100%;">
                </div>
            `;

            subjectsContainer.appendChild(subCard);
        });

        // Live validation: Theory + Sessional = Total
        subjectsContainer.addEventListener('input', (e) => {
            const idx = e.target.dataset.idx;
            if (idx === undefined) return;
            this._updateMarksBadge(subjectsContainer, idx);
        });

        card.appendChild(subjectsContainer);

        // Button row
        const btnRow = document.createElement('div');
        btnRow.style.cssText = 'border-top:1px solid var(--glass-border); padding-top:2rem; margin-top:2rem; display:flex; justify-content:space-between; gap:1rem;';
        btnRow.innerHTML = `
            <button type="button" id="backBtn" class="glass-button" style="background:transparent;">← Back to Details</button>
            <button type="button" id="submitBtn" class="glass-button" style="background:var(--accent-color); color:white; border:none; font-weight:700; padding:12px 32px; font-size:1rem;">
                ${this.isEdit ? '💾 Save Changes' : '🗓️ Schedule Exam'}
            </button>
        `;
        card.appendChild(btnRow);

        stepContent.appendChild(card);

        btnRow.querySelector('#backBtn').addEventListener('click', () => {
            this._renderStep1(stepIndicator, stepContent);
        });

        btnRow.querySelector('#submitBtn').addEventListener('click', async () => {
            const schedules = [];
            let hasError = false;

            this.courseSubjects.forEach((sub, idx) => {
                if (hasError) return;
                const date = subjectsContainer.querySelector(`.sub-date[data-idx="${idx}"]`)?.value;
                const time = subjectsContainer.querySelector(`.sub-time[data-idx="${idx}"]`)?.value;
                const maxTotal = parseInt(subjectsContainer.querySelector(`.sub-maxTotal[data-idx="${idx}"]`)?.value || 0);
                const maxTheory = parseInt(subjectsContainer.querySelector(`.sub-maxTheory[data-idx="${idx}"]`)?.value || 0);
                const maxSessional = parseInt(subjectsContainer.querySelector(`.sub-maxSessional[data-idx="${idx}"]`)?.value || 0);
                const maxViva = parseInt(subjectsContainer.querySelector(`.sub-maxViva[data-idx="${idx}"]`)?.value || 0);
                const venue = subjectsContainer.querySelector(`.sub-venue[data-idx="${idx}"]`)?.value || '';
                const hasViva = ['Practical', 'Project'].includes(sub.type);

                if (!date || !time) {
                    Toast.error(`Date and time required for: ${sub.name}`);
                    hasError = true; return;
                }
                if (maxTotal < 1) {
                    Toast.error(`Max Total must be ≥ 1 for: ${sub.name}`);
                    hasError = true; return;
                }
                const sum = maxTheory + maxSessional + (hasViva ? maxViva : 0);
                if (sum !== maxTotal) {
                    const parts = hasViva
                        ? `Theory (${maxTheory}) + Sessional (${maxSessional}) + Viva (${maxViva})`
                        : `Theory (${maxTheory}) + Sessional (${maxSessional})`;
                    Toast.error(`${parts} ≠ Total (${maxTotal}) for: ${sub.name}`);
                    hasError = true; return;
                }

                const matchSchedule = this.subjectSchedules.find(s => s.subjectId === sub._id || s.name === sub.name);
                schedules.push({
                    subjectId: sub._id,
                    name: sub.name,
                    code: sub.code || '',
                    type: sub.type || 'Theory',
                    semester: matchSchedule?.semester || sub.semester || null,
                    isSupplementary: matchSchedule?.isSupplementary || sub.isBacklog || false,
                    date, time, maxTotal, maxTheory, maxSessional,
                    ...(hasViva ? { maxViva } : {}),
                    venue: venue || this.stepOneData.venue || ''
                });
            });

            if (hasError) return;

            const submitBtn = btnRow.querySelector('#submitBtn');
            submitBtn.textContent = this.isEdit ? 'Saving...' : 'Scheduling...';
            submitBtn.disabled = true;

            try {
                const examObj = {
                    title: this.stepOneData.title,
                    course: this.stepOneData.course,
                    semester: this.stepOneData.semester ? parseInt(this.stepOneData.semester) : null,
                    venue: this.stepOneData.venue || '',
                    subjectSchedules: schedules,
                    // Legacy compatibility fields
                    subject: schedules.map(s => s.name).join(', '),
                    date: schedules[0]?.date || '',
                    time: schedules[0]?.time || '',
                    totalMarks: schedules[0]?.maxTotal || 100,
                    room: schedules[0]?.venue || ''
                };

                if (this.isEdit) {
                    await ApiService.updateExam(this.examId, examObj);
                    Toast.success('Exam Schedule Updated Successfully!');
                } else {
                    await ApiService.addExam(examObj);
                    Toast.success('Exam Scheduled Successfully!');
                }
                window.location.hash = ROUTES.EXAMS_LIST;
            } catch (err) {
                Toast.error(err.message);
                submitBtn.textContent = this.isEdit ? '💾 Save Changes' : '🗓️ Schedule Exam';
                submitBtn.disabled = false;
            }
        });
    }

    _updateMarksBadge(container, idx) {
        const maxTotal = parseInt(container.querySelector(`.sub-maxTotal[data-idx="${idx}"]`)?.value || 0);
        const maxTheory = parseInt(container.querySelector(`.sub-maxTheory[data-idx="${idx}"]`)?.value || 0);
        const maxSessional = parseInt(container.querySelector(`.sub-maxSessional[data-idx="${idx}"]`)?.value || 0);
        const vivaInput = container.querySelector(`.sub-maxViva[data-idx="${idx}"]`);
        const maxViva = vivaInput && vivaInput.type !== 'hidden' ? parseInt(vivaInput.value || 0) : 0;
        const badge = container.querySelector(`#vbadge-${idx}`);
        if (!badge) return;
        const sum = maxTheory + maxSessional + maxViva;
        if (sum === maxTotal) {
            badge.innerHTML = `<span style="color:#22c55e; background:rgba(34,197,94,0.15); padding:3px 10px; border-radius:6px;">✓ Balanced</span>`;
        } else {
            const parts = maxViva > 0 ? `${maxTheory}+${maxSessional}+${maxViva}` : `${maxTheory}+${maxSessional}`;
            badge.innerHTML = `<span style="color:#f97316; background:rgba(249,115,22,0.15); padding:3px 10px; border-radius:6px;">⚠ ${parts}=${sum} ≠ ${maxTotal}</span>`;
        }
    }
}
