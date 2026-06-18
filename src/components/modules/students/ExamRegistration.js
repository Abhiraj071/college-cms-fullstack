import { ApiService } from '../../../services/ApiService.js';
import { Toast } from '../../../services/Toast.js';
import { auth } from '../../../services/AuthService.js';

export class ExamRegistration {
    constructor(id, params) {
        this.step = 1; // 1: List, 2: Form, 3: Billing, 4: Admit Card
        this.eligibleExams = [];
        this.selectedExamId = null;
        this.formDetails = null;
        this.feeAmount = 0;
        this.queryParams = params;
        if (params && typeof params.get !== 'function') {
            this.queryParams = {
                get: (key) => params[key]
            };
        }
    }

    async render() {
        this.container = document.createElement('div');
        this.container.className = 'fade-in';
        
        if (this.queryParams && this.queryParams.get('success') === 'true' && this.queryParams.get('session_id')) {
            const sessionId = this.queryParams.get('session_id');
            const examId = this.queryParams.get('examId');
            await this.verifyStripePayment(sessionId, examId);
        } else if (this.queryParams && this.queryParams.get('canceled') === 'true') {
            Toast.error('Payment was canceled. Please try again.');
            window.location.hash = '#/exam-registration';
            await this.loadStep1();
        } else {
            await this.loadStep1();
        }
        
        return this.container;
    }

    async verifyStripePayment(sessionId, examId) {
        this.container.innerHTML = `
            <div class="glass-panel" style="max-width: 500px; margin: 6rem auto; padding: 4rem; text-align: center;">
                <div class="spinner" style="width:50px; height:50px; margin: 0 auto 2rem;"></div>
                <h2 style="font-family: 'Outfit', sans-serif; margin-bottom: 1rem;">Verifying Payment</h2>
                <p style="color: var(--text-secondary); line-height: 1.6;">Connecting to secure gateway to verify your exam fee. Please do not close or reload this page.</p>
            </div>
        `;

        try {
            const res = await ApiService.verifyExamPayment(sessionId, examId);
            if (res.success) {
                Toast.success('Exam fee paid successfully!');
                await new Promise(resolve => setTimeout(resolve, 1500));
                // Clear query params in address bar
                window.history.replaceState(null, '', window.location.pathname + '#/exam-registration');
                await this.loadStep4(examId);
            } else {
                throw new Error(res.message || 'Payment verification failed');
            }
        } catch (err) {
            Toast.error(err.message || 'Verification failed. Please contact admin.');
            window.location.hash = '#/exam-registration';
            await this.loadStep1();
        }
    }

    async loadStep1() {
        this.step = 1;
        this.container.innerHTML = `
            <div style="padding: 2rem; text-align: center;">
                <div class="spinner"></div><p>Checking eligible exams...</p>
            </div>
        `;

        try {
            const [exams, settings] = await Promise.all([
                ApiService.getEligibleExams(),
                ApiService.getSettings().catch(() => [])
            ]);
            this.eligibleExams = exams;
            this.settings = settings;

            // Enforce Exam Registration Portal switch toggle
            const toggles = settings.find(s => s.key === 'feature_toggles');
            if (toggles && toggles.value && toggles.value.examRegistration === false) {
                this.container.innerHTML = `
                    <div style="margin-bottom: 2.5rem; display: flex; align-items: center; gap: 1rem;">
                        <span style="font-size: 2.5rem;">🎓</span>
                        <div>
                            <h1 style="font-size: 2rem; margin: 0 0 0.25rem 0; letter-spacing: -0.5px;">Exam Registration</h1>
                            <p style="color: var(--text-secondary); margin: 0; font-size: 1.05rem;">The Exam Registration Portal is closed.</p>
                        </div>
                    </div>
                    <div class="glass-panel" style="text-align:center; padding: 5rem 2rem; border: 1px dashed var(--glass-border); border-radius: 16px;">
                        <div style="font-size: 3rem; margin-bottom: 1.5rem; opacity: 0.2;">🔒</div>
                        <h3 style="opacity: 0.8; color: var(--danger);">Portal Closed</h3>
                        <p style="color: var(--text-secondary); max-width: 420px; margin: 0 auto; line-height: 1.5;">
                            The online examination registration portal has been closed by the administrator. Please contact the Controller of Examinations for support.
                        </p>
                    </div>
                `;
                return;
            }

            this.renderStep1();
        } catch (err) {
            this.container.innerHTML = `<div class="glass-panel error">Failed to load exams: ${err.message}</div>`;
        }
    }

    renderStep1() {
        let html = `
            <div style="margin-bottom: 2.5rem; display: flex; align-items: center; gap: 1rem;">
                <span style="font-size: 2.5rem;">🎓</span>
                <div>
                    <h1 style="font-size: 2rem; margin: 0 0 0.25rem 0; letter-spacing: -0.5px;">Exam Registration</h1>
                    <p style="color: var(--text-secondary); margin: 0; font-size: 1.05rem;">Select an active examination to register and generate your admit card.</p>
                </div>
            </div>
        `;

        if (this.eligibleExams.length === 0) {
            html += `<div class="glass-panel" style="text-align:center; padding: 5rem 2rem; border: 1px dashed var(--glass-border); border-radius: 16px;">
                        <div style="font-size: 3rem; margin-bottom: 1.5rem; opacity: 0.2;">📄</div>
                        <h3 style="opacity: 0.6;">No Upcoming Exams</h3>
                        <p style="color: var(--text-secondary); max-width: 320px; margin: 0 auto;">There are no examination cycles open for registration at this time.</p>
                    </div>`;
            this.container.innerHTML = html;
            return;
        }

        html += `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem;">`;
        this.eligibleExams.forEach(exam => {
            const isApplied = exam.isApplied;
            const d = new Date(exam.date);
            const month = d.toLocaleString('en-US', { month: 'short' });
            const day = d.getDate();
            
            html += `
                <div class="glass-panel hover-lift" style="padding: 1.5rem; border-top: 4px solid ${isApplied ? '#10b981' : '#8b5cf6'}; position: relative; overflow: hidden; transition: transform 0.3s ease, box-shadow 0.3s ease; cursor: default;"
                     onmouseenter="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 12px 24px rgba(0,0,0,0.1)';"
                     onmouseleave="this.style.transform='none'; this.style.boxShadow='none';">
                     
                    <div style="display: flex; gap: 1.25rem; align-items: flex-start; margin-bottom: 1.5rem;">
                        <div style="min-width: 65px; height: 65px; background: ${isApplied ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)' : 'linear-gradient(135deg, #f3e8ff, #e0e7ff)'}; border-radius: 14px; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.05); border: 1px solid rgba(255,255,255,0.5);">
                             <span style="font-size: 0.75rem; font-weight: 800; color: ${isApplied ? '#059669' : '#8b5cf6'}; text-transform: uppercase; letter-spacing: 1px;">${month}</span>
                            <span style="font-size: 1.6rem; font-weight: 800; color: ${isApplied ? '#047857' : '#4338ca'}; line-height: 1; margin-top: 2px;">${day}</span>
                        </div>
                        <div style="flex: 1;">
                            <h3 style="margin: 0 0 6px 0; font-size: 1.15rem; font-weight: 800; color: var(--text-primary); line-height: 1.3;">${exam.title}</h3>
                            <div style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; margin-bottom: 8px;">
                                ${exam.course}
                            </div>
                            ${isApplied 
                                ? `<span style="background: rgba(16, 185, 129, 0.1); color: #10b981; padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 800; letter-spacing: 0.5px;">✓ REGISTERED</span>` 
                                : `<span style="background: rgba(245, 158, 11, 0.1); color: #f59e0b; padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; font-weight: 800; letter-spacing: 0.5px;">ACTION REQUIRED</span>`
                            }
                        </div>
                    </div>
                    
                    <div style="display: flex; justify-content: flex-end; padding-top: 1.25rem; border-top: 1px dashed var(--glass-border);">
                        ${isApplied 
                            ? `<button class="glass-button view-admit-btn" data-id="${exam._id}" style="background: var(--accent-color); color: white; border: none; padding: 10px 20px; font-weight: 700; border-radius: 8px; width: 100%;">🎫 View Admit Card</button>`
                            : `<button class="glass-button apply-btn" data-id="${exam._id}" style="background: #10b981; color: white; border: none; padding: 10px 20px; font-weight: 700; border-radius: 8px; width: 100%;">Register Now ➔</button>`
                        }
                    </div>
                </div>
            `;
        });
        html += `</div>`;

        this.container.innerHTML = html;

        this.container.querySelectorAll('.apply-btn').forEach(btn => {
            btn.onclick = () => this.loadStep2(btn.dataset.id);
        });
        this.container.querySelectorAll('.view-admit-btn').forEach(btn => {
            btn.onclick = () => this.loadStep4(btn.dataset.id);
        });
    }

    async loadStep2(examId) {
        this.selectedExamId = examId;
        this.step = 2;
        this.container.innerHTML = `<div style="text-align: center; padding: 4rem;"><div class="spinner"></div><p>Loading application form...</p></div>`;

        try {
            this.formDetails = await ApiService.getExamFormDetails(examId);
            
            // Fetch fee settings from active configuration
            if (!this.settings) {
                this.settings = await ApiService.getSettings().catch(() => []);
            }
            const feeSettings = this.settings.find(s => s.key === 'fee_settings');
            const baseFee = feeSettings && feeSettings.value && feeSettings.value.baseFee !== undefined ? feeSettings.value.baseFee : 1250;
            const suppFee = feeSettings && feeSettings.value && feeSettings.value.supplementaryFee !== undefined ? feeSettings.value.supplementaryFee : 350;

            // Calculate dynamic fee
            this.feeAmount = baseFee + (this.formDetails.supplementarySubjects.length * suppFee);
            
            this.renderStep2();
        } catch (err) {
            Toast.error(err.message);
            this.loadStep1();
        }
    }

    renderStep2() {
        const { student, exam, regularSubjects, supplementarySubjects } = this.formDetails;
        
        let html = `
            <button class="glass-button" id="back-btn" style="margin-bottom: 1rem;">⬅ Back</button>
            <div class="glass-panel" style="max-width: 800px; margin: 0 auto; padding: 2.5rem;">
                <h2 style="margin-top: 0; text-align: center; text-transform: uppercase; letter-spacing: 1px;">Examination Form</h2>
                <p style="text-align: center; color: var(--text-secondary); margin-bottom: 2rem;">${exam.title}</p>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem; background: rgba(0,0,0,0.05); padding: 1.5rem; border-radius: 8px;">
                    <div><span style="color: var(--text-secondary); font-size: 0.85rem;">Student Name</span><br><strong>${student.name}</strong></div>
                    <div><span style="color: var(--text-secondary); font-size: 0.85rem;">Roll Number</span><br><strong>${student.rollNo}</strong></div>
                    <div><span style="color: var(--text-secondary); font-size: 0.85rem;">Course / Branch</span><br><strong>${student.course}</strong></div>
                    <div><span style="color: var(--text-secondary); font-size: 0.85rem;">Current Semester</span><br><strong>Semester ${student.semester}</strong></div>
                </div>

                <h3 style="border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">Regular Subjects</h3>
        `;

        if (regularSubjects.length === 0) {
            html += `<p style="color: var(--text-secondary);">No regular subjects scheduled.</p>`;
        } else {
            html += `<ul style="list-style: none; padding: 0; margin-bottom: 2rem;">`;
            regularSubjects.forEach(s => {
                html += `<li style="padding: 0.75rem 0; border-bottom: 1px solid rgba(255,255,255,0.05);">✓ <strong>${s.code || ''}</strong> ${s.name}</li>`;
            });
            html += `</ul>`;
        }

        if (supplementarySubjects.length > 0) {
            html += `
                <h3 style="border-bottom: 1px solid #f97316; padding-bottom: 0.5rem; color: #f97316;">Supplementary Subjects (Backlogs)</h3>
                <ul style="list-style: none; padding: 0; margin-bottom: 2rem;">
            `;
            supplementarySubjects.forEach(s => {
                html += `<li style="padding: 0.75rem 0; border-bottom: 1px solid rgba(249,115,22,0.1); color: #fdba74;">
                    <span style="background: rgba(249,115,22,0.2); color: #f97316; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; margin-right: 8px;">SEM ${s.semester}</span> 
                    <strong>${s.code || ''}</strong> ${s.name}
                </li>`;
            });
            html += `</ul>`;
        }

        html += `
                <div style="margin-bottom: 2rem; padding: 1rem; background: rgba(0,0,0,0.02); border-radius: 8px; border: 1px solid var(--glass-border);">
                    <label style="display: flex; align-items: center; justify-content: center; gap: 12px; cursor: pointer; margin: 0;">
                        <input type="checkbox" id="declaration-chk" style="width: 18px; height: 18px; cursor: pointer; accent-color: var(--accent-color); flex-shrink: 0; margin: 0; padding: 0; background: transparent; border: 2px solid var(--accent-color); -webkit-appearance: auto; appearance: auto;">
                        <span style="font-size: 0.95rem; color: var(--text-primary); font-weight: 500;">I hereby declare that the information provided above is correct. I have verified my current subjects and backlogs.</span>
                    </label>
                </div>

                <button id="proceed-btn" class="glass-button" style="width: 100%; background: var(--accent-color); color: white; border: none; padding: 15px; font-size: 1.1rem; font-weight: 700; opacity: 0.5; pointer-events: none; transition: opacity 0.3s ease;">Proceed to Billing</button>
            </div>
        `;

        this.container.innerHTML = html;

        this.container.querySelector('#back-btn').onclick = () => this.loadStep1();
        
        const chk = this.container.querySelector('#declaration-chk');
        const proceedBtn = this.container.querySelector('#proceed-btn');

        chk.onchange = () => {
            if (chk.checked) {
                proceedBtn.style.opacity = '1';
                proceedBtn.style.pointerEvents = 'auto';
            } else {
                proceedBtn.style.opacity = '0.5';
                proceedBtn.style.pointerEvents = 'none';
            }
        };

        proceedBtn.onclick = () => this.renderBillingStep();
    }

    renderBillingStep() {
        this.step = 3;
        const baseFee = 1250;
        const suppCount = this.formDetails.supplementarySubjects.length;
        const suppFee = suppCount * 350;
        const total = baseFee + suppFee;
        const student = this.formDetails.student;

        let html = `
            <div class="glass-panel fade-in" style="max-width: 800px; margin: 0 auto; padding: 2rem; background: #ffffff; color: #333333;">
                <h2 style="text-align: center; margin-bottom: 2rem; font-family: sans-serif; font-weight: normal; color: #222;">Online Exam Fees</h2>
                
                <div style="overflow-x: auto; margin-bottom: 3rem;">
                    <table style="width: 100%; border-collapse: collapse; text-align: left; font-family: sans-serif; border: 1px solid #e0e0e0;">
                        <thead>
                            <tr style="background-color: #f5f5f5;">
                                <th style="padding: 12px; border: 1px solid #e0e0e0; font-weight: 600;">Name</th>
                                <th style="padding: 12px; border: 1px solid #e0e0e0; font-weight: 600;">Enrollment No.</th>
                                <th style="padding: 12px; border: 1px solid #e0e0e0; font-weight: 600;">Class</th>
                                <th style="padding: 12px; border: 1px solid #e0e0e0; font-weight: 600;">Father's Name</th>
                                <th style="padding: 12px; border: 1px solid #e0e0e0; font-weight: 600;">Contact</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="padding: 12px; border: 1px solid #e0e0e0; text-transform: uppercase;">${student.name}</td>
                                <td style="padding: 12px; border: 1px solid #e0e0e0;">${student.rollNo}</td>
                                <td style="padding: 12px; border: 1px solid #e0e0e0;">${student.course}</td>
                                <td style="padding: 12px; border: 1px solid #e0e0e0; text-transform: uppercase;">${student.fatherName || 'N/A'}</td>
                                <td style="padding: 12px; border: 1px solid #e0e0e0;">${student.phone || 'N/A'}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div style="overflow-x: auto; margin-bottom: 2rem;">
                    <table style="width: 100%; max-width: 450px; border-collapse: collapse; text-align: left; font-family: sans-serif; border: 1px solid #e0e0e0;">
                        <thead>
                            <tr>
                                <th colspan="3" style="padding: 12px; border: 1px solid #e0e0e0; background-color: #f5f5f5; text-align: center; font-weight: bold;">Fee Structure</th>
                            </tr>
                            <tr>
                                <th style="padding: 12px; border: 1px solid #e0e0e0; font-weight: bold;">Sr.No.</th>
                                <th style="padding: 12px; border: 1px solid #e0e0e0; font-weight: bold;">Head Name</th>
                                <th style="padding: 12px; border: 1px solid #e0e0e0; font-weight: bold;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="padding: 12px; border: 1px solid #e0e0e0;">1</td>
                                <td style="padding: 12px; border: 1px solid #e0e0e0;">EXAM FEE</td>
                                <td style="padding: 12px; border: 1px solid #e0e0e0;">₹ 1250</td>
                            </tr>
                            <tr>
                                <td style="padding: 12px; border: 1px solid #e0e0e0;">2</td>
                                <td style="padding: 12px; border: 1px solid #e0e0e0;">Supplementary Fee</td>
                                <td style="padding: 12px; border: 1px solid #e0e0e0;">₹ ${suppFee > 0 ? suppFee : ''}</td>
                            </tr>
                            <tr>
                                <th colspan="2" style="padding: 12px; border: 1px solid #e0e0e0; text-align: left; background-color: #f9f9f9; font-weight: bold;">Total Fees</th>
                                <th style="padding: 12px; border: 1px solid #e0e0e0; background-color: #f9f9f9; font-weight: bold;">₹ ${total}.00</th>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div style="display: flex; gap: 10px; margin-left: auto;">
                    <button id="proceed-pay-btn" style="background-color: #d93845; color: white; border: none; padding: 10px 24px; font-weight: normal; border-radius: 4px; cursor: pointer; font-size: 14px;">PAY NOW</button>
                    <button id="back-btn-billing" style="background-color: #d93845; color: white; border: none; padding: 10px 24px; font-weight: normal; border-radius: 4px; cursor: pointer; font-size: 14px;">CANCEL</button>
                </div>
            </div>
        `;

        this.container.innerHTML = html;
        this.container.querySelector('#back-btn-billing').onclick = () => this.renderStep2();
        
        this.container.querySelector('#proceed-pay-btn').onclick = async (e) => {
            const btn = e.target;
            const originalText = btn.innerHTML;
            btn.innerHTML = '<div class="spinner" style="width:16px; height:16px; border-width:2px; display:inline-block; vertical-align:middle;"></div> Redirecting to secure gateway...';
            btn.style.pointerEvents = 'none';

            try {
                const payload = {
                    examId: this.selectedExamId,
                    regularSubjects: this.formDetails.regularSubjects,
                    supplementarySubjects: this.formDetails.supplementarySubjects,
                    feeAmount: total
                };
                const res = await ApiService.submitExamApplication(payload);
                if (res.checkoutUrl) {
                    window.location.href = res.checkoutUrl;
                } else {
                    throw new Error('Payment gateway failed to initialize.');
                }
            } catch (err) {
                Toast.error(err.message || 'Redirect failed');
                btn.innerHTML = originalText;
                btn.style.pointerEvents = 'auto';
            }
        };
    }

    async loadStep4(examId) {
        this.step = 5;
        this.container.innerHTML = `<div style="text-align: center; padding: 4rem;"><div class="spinner"></div><p>Generating Admit Card...</p></div>`;

        try {
            const [data, settings] = await Promise.all([
                ApiService.getAdmitCard(examId),
                ApiService.getSettings().catch(() => [])
            ]);

            // Enforce Admit Card Download toggle
            const toggles = settings.find(s => s.key === 'feature_toggles');
            if (toggles && toggles.value && toggles.value.admitCardDownload === false) {
                this.container.innerHTML = `
                    <div style="margin-bottom: 1.5rem;">
                        <button id="back-list-btn" class="glass-button">⬅ My Exams</button>
                    </div>
                    <div class="glass-panel" style="text-align:center; padding: 5rem 2rem; border: 1px dashed var(--glass-border); border-radius: 16px;">
                        <div style="font-size: 3rem; margin-bottom: 1.5rem; opacity: 0.2;">🎫</div>
                        <h3 style="opacity: 0.8; color: var(--warning);">Downloads Unavailable</h3>
                        <p style="color: var(--text-secondary); max-width: 420px; margin: 0 auto; line-height: 1.5;">
                            Admit card downloading is currently suspended by the administration. Please contact the Controller of Examinations for further updates.
                        </p>
                    </div>
                `;
                this.container.querySelector('#back-list-btn').onclick = () => this.loadStep1();
                return;
            }

            // Load branding configuration
            const instProfile = settings.find(s => s.key === 'institution_profile');
            const branding = instProfile ? instProfile.value : {
                name: 'Global Institute of Technology',
                subheading: '(Affiliated to Technical University & Approved by AICTE)',
                controllerName: 'Prof. R. Sharma'
            };

            this.renderStep4(data, branding);
        } catch (err) {
            Toast.error(err.message);
            this.loadStep1();
        }
    }

    renderStep4(data, branding) {
        const { student, application, exam } = data;
        const issueDate = new Date(application.paymentDate || application.createdAt).toLocaleDateString('en-GB');
        
        let subjectsRows = '';
        const allSubs = [...application.regularSubjects, ...application.supplementarySubjects];
        
        if (allSubs.length === 0) {
            subjectsRows = '<tr><td colspan="4" style="text-align: center; padding: 10px;">No subjects found</td></tr>';
        } else {
            allSubs.forEach(sub => {
                // Find matching schedule for date/time
                const sched = (exam.subjectSchedules || []).find(s => s.subjectId === sub.subjectId || s.name === sub.name);
                subjectsRows += `
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">${sub.code || 'N/A'}</td>
                        <td style="padding: 8px; border: 1px solid #ddd;">${sub.name} ${sub.semester ? `<span style="font-size:10px; color:red;">(SUPP)</span>` : ''}</td>
                        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${sched && sched.date ? new Date(sched.date).toLocaleDateString('en-GB') : 'TBA'}</td>
                        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${sched && sched.time ? sched.time : 'TBA'}</td>
                    </tr>
                `;
            });
        }

        const html = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <button id="back-list-btn" class="glass-button">⬅ My Exams</button>
                <button id="download-pdf-btn" class="glass-button" style="background: var(--accent-color); color: white; border: none; padding: 10px 20px; font-weight: 700;">
                    📥 Download PDF
                </button>
            </div>

            <div style="overflow-x: auto; display: flex; justify-content: center;">
                <div id="admit-card-view" style="width: 800px; padding: 40px; background: white; font-family: 'Arial', sans-serif; color: #000; position: relative;">
                    <!-- Border Wrapper -->
                    <div style="border: 3px double #000; padding: 20px; position: relative;">
                        <!-- Header -->
                        <div style="display: flex; align-items: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px;">
                            <div style="flex: 1; text-align: center;">
                                <h1 style="margin: 0; font-size: 24px; text-transform: uppercase; font-weight: 900; letter-spacing: 1px;">${branding.name || 'Global Institute of Technology'}</h1>
                                <p style="margin: 5px 0 0 0; font-size: 14px;">${branding.subheading || '(Affiliated to Technical University & Approved by AICTE)'}</p>
                                <p style="margin: 5px 0 0 0; font-size: 12px; font-weight: bold;">ADMIT CARD / HALL TICKET</p>
                                <p style="margin: 5px 0 0 0; font-size: 14px; background: #000; color: #fff; display: inline-block; padding: 4px 15px; border-radius: 20px; font-weight: bold; margin-top: 10px;">${exam.title.toUpperCase()}</p>
                            </div>
                        </div>

                        <!-- Details & Photo -->
                        <div style="display: flex; gap: 20px; margin-bottom: 20px;">
                            <!-- Info -->
                            <div style="flex: 1;">
                                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                                    <tr>
                                        <td style="padding: 6px; font-weight: bold; width: 140px;">Roll Number:</td>
                                        <td style="padding: 6px; border-bottom: 1px dotted #000; font-weight: bold;">${student.rollNo}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 6px; font-weight: bold;">Student Name:</td>
                                        <td style="padding: 6px; border-bottom: 1px dotted #000; font-weight: bold; text-transform: uppercase;">${student.name}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 6px; font-weight: bold;">Course / Branch:</td>
                                        <td style="padding: 6px; border-bottom: 1px dotted #000;">${student.course}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 6px; font-weight: bold;">Semester:</td>
                                        <td style="padding: 6px; border-bottom: 1px dotted #000;">Semester ${student.semester}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 6px; font-weight: bold;">Exam Center:</td>
                                        <td style="padding: 6px; border-bottom: 1px dotted #000;">${exam.venue || 'Main Campus'}</td>
                                    </tr>
                                </table>
                            </div>
                            <!-- Photo Box & QR -->
                            <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
                                <div style="width: 120px; height: 150px; border: 1px solid #000; display: flex; align-items: center; justify-content: center; background: #f9f9f9;">
                                    <span style="color: #ccc; font-size: 12px; text-align: center;">Affix<br>Passport Size<br>Photo</span>
                                </div>
                                <div id="qr-container" style="width: 80px; height: 80px;"></div>
                            </div>
                        </div>

                        <!-- Subjects Table -->
                        <div style="margin-bottom: 30px;">
                            <h3 style="margin: 0 0 10px 0; font-size: 14px; text-decoration: underline;">Subject Schedule</h3>
                            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                                <thead>
                                    <tr style="background: #f0f0f0;">
                                        <th style="padding: 8px; border: 1px solid #000; text-align: left;">Sub Code</th>
                                        <th style="padding: 8px; border: 1px solid #000; text-align: left;">Subject Name</th>
                                        <th style="padding: 8px; border: 1px solid #000; text-align: center;">Date</th>
                                        <th style="padding: 8px; border: 1px solid #000; text-align: center;">Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${subjectsRows}
                                </tbody>
                            </table>
                        </div>

                        <!-- Signatures -->
                        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 50px;">
                            <div style="text-align: center;">
                                <div style="width: 150px; border-bottom: 1px solid #000; margin-bottom: 5px;"></div>
                                <p style="margin: 0; font-size: 12px; font-weight: bold;">Candidate's Signature</p>
                            </div>
                            <div style="text-align: center;">
                                <div style="width: 150px; border-bottom: 1px solid #000; margin-bottom: 5px;"></div>
                                <p style="margin: 0; font-size: 12px; font-weight: bold;">Invigilator's Signature</p>
                            </div>
                            <div style="text-align: center;">
                                <div style="width: 150px; border-bottom: 1px solid #000; margin-bottom: 5px;">
                                    <span style="font-family: 'Brush Script MT', cursive; font-size: 20px;">${branding.controllerName || 'Prof. R. Sharma'}</span>
                                </div>
                                <p style="margin: 0; font-size: 12px; font-weight: bold;">Controller of Examinations</p>
                            </div>
                        </div>

                        <!-- Footer Rules -->
                        <div style="margin-top: 30px; font-size: 10px; color: #444; border-top: 1px dashed #ccc; padding-top: 10px;">
                            <p style="margin: 0 0 5px 0; font-weight: bold;">Instructions to Candidates:</p>
                            <ol style="margin: 0; padding-left: 20px;">
                                <li>The candidate must carry this admit card to the examination hall.</li>
                                <li>Electronic devices, including mobile phones and smartwatches, are strictly prohibited.</li>
                                <li>Candidates must report to the examination center at least 30 minutes before the commencement of the exam.</li>
                                <li>Verify this admit card authenticity using the QR code.</li>
                            </ol>
                        </div>
                        
                        <div style="position: absolute; top: 10px; right: 15px; font-size: 10px; font-weight: bold;">
                            Issue Date: ${issueDate}<br>
                            TXN: ${application.transactionId}
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.container.innerHTML = html;

        this.container.querySelector('#back-list-btn').onclick = () => this.loadStep1();
        
        // Render QR Code safely
        setTimeout(() => {
            try {
                if (window.QRCode) {
                    new QRCode(this.container.querySelector('#qr-container'), {
                        text: `VERIFY: ${branding.name || 'GIT'}-${application.transactionId}-${student.rollNo}`,
                        width: 80,
                        height: 80,
                        colorDark : "#000000",
                        colorLight : "#ffffff",
                        correctLevel : QRCode.CorrectLevel.L
                    });
                }
            } catch (e) {
                console.warn('QR Code generation failed', e);
            }
        }, 200);

        // PDF Download Logic
        this.container.querySelector('#download-pdf-btn').onclick = async (e) => {
            const btn = e.target;
            const originalText = btn.innerHTML;
            btn.innerHTML = '⏳ Generating...';
            btn.disabled = true;

            try {
                const element = this.container.querySelector('#admit-card-view');
                if (window.html2canvas && window.jspdf) {
                    const canvas = await window.html2canvas(element, { scale: 2, useCORS: true });
                    const imgData = canvas.toDataURL('image/jpeg', 1.0);
                    const pdf = new window.jspdf.jsPDF('p', 'mm', 'a4');
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                    const margin = 10;
                    pdf.addImage(imgData, 'JPEG', margin, margin, pdfWidth - (margin*2), (pdfHeight * (pdfWidth - (margin*2))) / pdfWidth);
                    pdf.save(`Admit_Card_${student.rollNo}.pdf`);
                } else {
                    Toast.error('PDF library not loaded');
                }
            } catch (err) {
                Toast.error('Failed to generate PDF');
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        };
    }
}
