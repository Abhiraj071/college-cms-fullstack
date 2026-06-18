import { ApiService } from '../../../services/ApiService.js';
import { Toast } from '../../../services/Toast.js';

export class AdmitCardManager {
    constructor() {
        this.students = [];
        this.exams = [];
        this.selectedCourse = '';
        this.selectedSemester = '';
        this.selectedExamId = '';
        this.examData = null;
        this.isGenerating = false;
    }

    async render() {
        this.container = document.createElement('div');
        this.container.className = 'fade-in';
        this.container.style.padding = '1.5rem';

        const header = document.createElement('div');
        header.style.marginBottom = '2rem';
        header.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 1rem;">
                <div>
                    <h1 style="font-size: 2rem; font-weight: 800; margin-bottom: 0.5rem; letter-spacing: -0.5px;">🎫 Admit Card Generator</h1>
                    <p style="color: var(--text-secondary); font-size: 1.1rem; margin: 0;">Generate secure, QR-verifiable hall tickets for examinations.</p>
                </div>
            </div>
        `;
        this.container.appendChild(header);

        this.filtersArea = document.createElement('div');
        this.filtersArea.className = 'glass-panel';
        this.filtersArea.style.marginBottom = '2rem';
        this.filtersArea.style.display = 'grid';
        this.filtersArea.style.gridTemplateColumns = 'repeat(auto-fit, minmax(200px, 1fr))';
        this.filtersArea.style.gap = '1.5rem';
        this.container.appendChild(this.filtersArea);

        this.contentArea = document.createElement('div');
        this.contentArea.className = 'glass-panel';
        this.contentArea.style.minHeight = '300px';
        this.container.appendChild(this.contentArea);

        // Hidden container for rendering the PDF HTML
        this.pdfContainer = document.createElement('div');
        this.pdfContainer.style.position = 'fixed';
        this.pdfContainer.style.top = '-9999px';
        this.pdfContainer.style.left = '-9999px';
        this.pdfContainer.style.zIndex = '-1000';
        document.body.appendChild(this.pdfContainer);

        await this.loadInitialData();

        return this.container;
    }

    async loadInitialData() {
        try {
            const [courses, exams] = await Promise.all([
                ApiService.getCourses(),
                ApiService.getExams()
            ]);
            
            this.allCourses = courses;
            this.allExams = exams;

            this.renderFilters();
            this.updateContentArea();
        } catch (err) {
            Toast.error('Failed to load initial data');
            console.error(err);
        }
    }

    renderFilters() {
        this.filtersArea.innerHTML = `
            <div>
                <label style="display: block; font-size: 0.85rem; font-weight: 700; margin-bottom: 8px; color: var(--text-secondary);">Course Program</label>
                <select id="ac-course" class="glass-button" style="width: 100%; text-align: left; background: var(--bg-primary);">
                    <option value="">Select Course...</option>
                    ${this.allCourses.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
                </select>
            </div>
            <div>
                <label style="display: block; font-size: 0.85rem; font-weight: 700; margin-bottom: 8px; color: var(--text-secondary);">Semester</label>
                <select id="ac-semester" class="glass-button" style="width: 100%; text-align: left; background: var(--bg-primary);">
                    <option value="">Select Semester...</option>
                    ${[1,2,3,4,5,6,7,8].map(s => `<option value="${s}">Semester ${s}</option>`).join('')}
                </select>
            </div>
            <div>
                <label style="display: block; font-size: 0.85rem; font-weight: 700; margin-bottom: 8px; color: var(--text-secondary);">Examination Cycle</label>
                <select id="ac-exam" class="glass-button" style="width: 100%; text-align: left; background: var(--bg-primary);" disabled>
                    <option value="">Select Exam...</option>
                </select>
            </div>
            <div style="display: flex; align-items: flex-end;">
                <button id="ac-search-btn" class="glass-button" style="width: 100%; background: var(--accent-color); color: white; font-weight: 700; border: none;">🔍 Find Students</button>
            </div>
        `;

        const courseSelect = this.filtersArea.querySelector('#ac-course');
        const semSelect = this.filtersArea.querySelector('#ac-semester');
        const examSelect = this.filtersArea.querySelector('#ac-exam');
        const searchBtn = this.filtersArea.querySelector('#ac-search-btn');

        const updateExamsDropdown = () => {
            const course = courseSelect.value;
            const sem = semSelect.value;
            if (!course || !sem) {
                examSelect.disabled = true;
                examSelect.innerHTML = '<option value="">Select Exam...</option>';
                return;
            }

            const filteredExams = this.allExams.filter(e => e.course === course);
            if (filteredExams.length === 0) {
                examSelect.disabled = true;
                examSelect.innerHTML = '<option value="">No Exams Found</option>';
            } else {
                examSelect.disabled = false;
                examSelect.innerHTML = '<option value="">Select Exam...</option>' + 
                    filteredExams.map(e => `<option value="${e._id}">${e.title}</option>`).join('');
            }
        };

        courseSelect.onchange = () => {
            this.selectedCourse = courseSelect.value;
            updateExamsDropdown();
        };

        semSelect.onchange = () => {
            this.selectedSemester = semSelect.value;
            updateExamsDropdown();
        };

        examSelect.onchange = () => {
            this.selectedExamId = examSelect.value;
            this.examData = this.allExams.find(e => e._id === this.selectedExamId);
        };

        searchBtn.onclick = () => {
            if (!this.selectedCourse || !this.selectedSemester || !this.selectedExamId) {
                Toast.error('Please select Course, Semester, and Exam.');
                return;
            }
            this.fetchStudents();
        };
    }

    async fetchStudents() {
        this.contentArea.innerHTML = `
            <div style="text-align: center; padding: 4rem;">
                <div class="spinner"></div>
                <p style="color: var(--text-secondary); margin-top: 1rem;">Retrieving student records...</p>
            </div>
        `;

        try {
            const students = await ApiService.getStudents();
            this.students = students.filter(s => s.course === this.selectedCourse && parseInt(s.semester) === parseInt(this.selectedSemester));
            this.updateContentArea();
        } catch (err) {
            Toast.error('Failed to load students');
            this.contentArea.innerHTML = `<p style="color: red; text-align: center;">Error loading students.</p>`;
        }
    }

    updateContentArea() {
        if (!this.students || this.students.length === 0) {
            this.contentArea.innerHTML = `
                <div style="text-align: center; padding: 4rem 2rem; border: 1px dashed var(--glass-border); border-radius: 16px;">
                    <div style="font-size: 3rem; margin-bottom: 1.5rem; opacity: 0.2;">🎓</div>
                    <h3 style="opacity: 0.6;">No Students Found</h3>
                    <p style="color: var(--text-secondary); max-width: 320px; margin: 0 auto;">Select filters above and click Find Students.</p>
                </div>
            `;
            return;
        }

        let html = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h3 style="margin: 0;">Found ${this.students.length} Eligible Student(s)</h3>
                <button id="bulk-generate-btn" class="glass-button" style="background: var(--text-primary); color: var(--bg-primary); font-weight: 700;">📑 Generate All</button>
            </div>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead>
                        <tr style="border-bottom: 2px solid var(--glass-border); color: var(--text-secondary);">
                            <th style="padding: 1rem; font-weight: 600;">Roll No</th>
                            <th style="padding: 1rem; font-weight: 600;">Student Name</th>
                            <th style="padding: 1rem; font-weight: 600;">Attendance</th>
                            <th style="padding: 1rem; font-weight: 600; text-align: right;">Action</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        this.students.forEach(s => {
            const isLowAttendance = parseInt(s.attendancePercentage) < 75;
            html += `
                <tr style="border-bottom: 1px solid var(--glass-border);">
                    <td style="padding: 1rem; font-weight: 700; color: var(--accent-color);">${s.rollNo}</td>
                    <td style="padding: 1rem; font-weight: 600;">${s.name}</td>
                    <td style="padding: 1rem;">
                        <span style="padding: 4px 8px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; background: ${isLowAttendance ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)'}; color: ${isLowAttendance ? '#ef4444' : '#10b981'};">
                            ${s.attendancePercentage || '0%'}
                        </span>
                    </td>
                    <td style="padding: 1rem; text-align: right;">
                        <button class="glass-button generate-btn" data-id="${s._id}" style="padding: 6px 16px; font-size: 0.85rem; font-weight: 600;">📥 Download</button>
                    </td>
                </tr>
            `;
        });

        html += `</tbody></table></div>`;
        this.contentArea.innerHTML = html;

        this.contentArea.querySelectorAll('.generate-btn').forEach(btn => {
            btn.onclick = () => this.generateSingleAdmitCard(btn.dataset.id);
        });

        this.contentArea.querySelector('#bulk-generate-btn').onclick = () => this.generateBulkAdmitCards();
    }

    async generateSingleAdmitCard(studentId) {
        if (this.isGenerating) return Toast.error('Currently generating an admit card...');
        const student = this.students.find(s => s._id === studentId);
        if (!student) return;

        this.isGenerating = true;
        Toast.success(`Preparing Admit Card for ${student.name}...`);
        
        try {
            await this.renderAdmitCardHTML(student, this.examData);
            await this.exportPDF(student.rollNo);
            Toast.success('Admit Card Downloaded!');
        } catch (err) {
            console.error('PDF Generation Error:', err);
            Toast.error('Failed to generate PDF');
        } finally {
            this.isGenerating = false;
        }
    }

    async generateBulkAdmitCards() {
        if (this.isGenerating) return;
        this.isGenerating = true;
        
        Toast.success(`Starting bulk generation for ${this.students.length} students...`);
        
        try {
            for (let student of this.students) {
                await this.renderAdmitCardHTML(student, this.examData);
                await this.exportPDF(student.rollNo);
                await new Promise(r => setTimeout(r, 500)); // Small delay
            }
            Toast.success('Bulk Generation Complete!');
        } catch (err) {
            console.error('Bulk PDF Error:', err);
            Toast.error('Error during bulk generation');
        } finally {
            this.isGenerating = false;
        }
    }

    async renderAdmitCardHTML(student, exam) {
        return new Promise((resolve) => {
            const issueDate = new Date().toLocaleDateString('en-GB');
            const subjects = exam.subjectSchedules || [];
            
            // Only keep subjects for this semester (simplified for display)
            const filteredSubjects = subjects.filter(s => !s.semester || parseInt(s.semester) === parseInt(student.semester));

            let subjectsRows = '';
            if (filteredSubjects.length === 0) {
                subjectsRows = '<tr><td colspan="4" style="text-align: center; padding: 10px;">No specific subject schedule attached</td></tr>';
            } else {
                filteredSubjects.forEach(sub => {
                    subjectsRows += `
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">${sub.code || 'N/A'}</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${sub.name}</td>
                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${sub.date ? new Date(sub.date).toLocaleDateString('en-GB') : 'TBA'}</td>
                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${sub.time || 'TBA'}</td>
                        </tr>
                    `;
                });
            }

            const html = `
                <div id="admit-card-view" style="width: 800px; padding: 40px; background: white; font-family: 'Arial', sans-serif; color: #000; position: relative;">
                    <!-- Border Wrapper -->
                    <div style="border: 3px double #000; padding: 20px; position: relative;">
                        <!-- Header -->
                        <div style="display: flex; align-items: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px;">
                            <div style="flex: 1; text-align: center;">
                                <h1 style="margin: 0; font-size: 24px; text-transform: uppercase; font-weight: 900; letter-spacing: 1px;">Global Institute of Technology</h1>
                                <p style="margin: 5px 0 0 0; font-size: 14px;">(Affiliated to Technical University & Approved by AICTE)</p>
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
                                    <span style="font-family: 'Brush Script MT', cursive; font-size: 20px;">Prof. R. Sharma</span>
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
                            Issue Date: ${issueDate}
                        </div>
                    </div>
                </div>
            `;

            this.pdfContainer.innerHTML = html;

            // Generate QR Code
            setTimeout(() => {
                try {
                    const qrContainer = this.pdfContainer.querySelector('#qr-container');
                    qrContainer.innerHTML = ''; // clear previous
                    new QRCode(qrContainer, {
                        text: `VERIFY: GIT-${exam._id.slice(-6)}-${student.rollNo}`,
                        width: 80,
                        height: 80,
                        colorDark : "#000000",
                        colorLight : "#ffffff",
                        correctLevel : QRCode.CorrectLevel.L
                    });
                    setTimeout(resolve, 300); // Wait for QR render
                } catch (e) {
                    console.error('QR Gen error', e);
                    resolve();
                }
            }, 100);
        });
    }

    async exportPDF(rollNo) {
        return new Promise((resolve, reject) => {
            const element = this.pdfContainer.querySelector('#admit-card-view');
            if (!element) return reject('No element');

            window.html2canvas(element, {
                scale: 2, // High quality
                useCORS: true
            }).then(canvas => {
                const imgData = canvas.toDataURL('image/jpeg', 1.0);
                const pdf = new window.jspdf.jsPDF('p', 'mm', 'a4');
                
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                
                // Margin
                const margin = 10;
                pdf.addImage(imgData, 'JPEG', margin, margin, pdfWidth - (margin*2), (pdfHeight * (pdfWidth - (margin*2))) / pdfWidth);
                
                pdf.save(`Admit_Card_${rollNo}.pdf`);
                resolve();
            }).catch(reject);
        });
    }
}
