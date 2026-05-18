import { ApiService } from '../../../services/ApiService.js';
import { auth } from '../../../services/AuthService.js';
import { Toast } from '../../../services/Toast.js';

export class QRAttendance {
    constructor(role) {
        this.role = role; // 'teacher' or 'student'
        this.activeSession = null;
        this.scanner = null;
    }

    render() {
        const container = document.createElement('div');
        container.className = 'fade-in';
        
        if (this.role === 'teacher') {
            this.renderTeacherView(container);
        } else {
            this.renderStudentView(container);
        }

        return container;
    }

    async renderTeacherView(container) {
        container.innerHTML = `
            <div class="glass-panel" style="padding: 2.5rem; text-align: center; max-width: 600px; margin: 0 auto;">
                <h3 style="font-size: 1.5rem; margin-bottom: 1rem;">🚀 Generate Attendance QR</h3>
                <p style="color: var(--text-secondary); margin-bottom: 2rem;">Select your current class to start a touchless attendance session.</p>
                
                <div style="display: flex; flex-direction: column; gap: 1rem; text-align: left;">
                    <div>
                        <label style="display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 5px;">Subject</label>
                        <select id="qr-subject" style="width: 100%; padding: 12px; border-radius: 8px; background: var(--bg-primary); border: 1px solid var(--glass-border); color: var(--text-primary);">
                            <option value="">Loading assigned subjects...</option>
                        </select>
                    </div>
                    <button class="glass-button" id="start-qr-btn" style="width: 100%; padding: 14px; margin-top: 1rem;">Start Live Session</button>
                </div>

                <div id="qr-display-area" style="display: none; margin-top: 2.5rem; animation: slideDown 0.4s ease;">
                    <div style="background: white; padding: 2rem; border-radius: 16px; display: inline-block; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
                        <img id="qr-code-img" src="" style="width: 250px; height: 250px;" />
                    </div>
                    <div style="margin-top: 1.5rem;">
                        <div id="qr-timer" style="font-size: 1.5rem; font-weight: 800; color: var(--accent-color);">15:00</div>
                        <p style="color: var(--text-secondary); font-size: 0.9rem;">Students can scan this code to mark attendance.</p>
                        <button class="glass-button" id="stop-qr-btn" style="background: var(--danger); color: white; border: none; padding: 10px 20px; margin-top: 1rem;">End Session</button>
                    </div>
                </div>
            </div>
        `;

        const subjectSelect = container.querySelector('#qr-subject');
        const startBtn = container.querySelector('#start-qr-btn');
        const qrArea = container.querySelector('#qr-display-area');
        const qrImg = container.querySelector('#qr-code-img');
        const timerText = container.querySelector('#qr-timer');

        try {
            const user = auth.getUser();
            const subjects = await ApiService.getSubjects();
            const mySubjects = subjects.filter(s => {
                // If admin, show all subjects. If teacher, show only theirs.
                if (user.role === 'admin') return true;

                const sFacultyId = String(s.faculty?._id || s.faculty || '');
                const uFacultyId = String(user.facultyId || '');
                const uUserId = String(user.id || user._id || '');
                const sFacultyName = s.faculty?.name || '';
                const uName = user.name || '';
                
                return sFacultyId === uFacultyId || sFacultyId === uUserId || (sFacultyName && sFacultyName === uName);
            });

            subjectSelect.innerHTML = mySubjects.length > 0 
                ? mySubjects.map(s => `<option value="${s.name}" data-course="${s.course}" data-year="${s.year}" data-sem="${s.semester}">${s.name} (${s.course})</option>`).join('')
                : '<option value="">No assigned subjects found</option>';

            startBtn.onclick = async () => {
                const selectedOpt = subjectSelect.selectedOptions[0];
                if (!selectedOpt || !selectedOpt.value) return Toast.error('Please select a subject');

                startBtn.disabled = true;
                startBtn.textContent = 'Generating...';

                try {
                    const session = await ApiService.createAttendanceSession({
                        course: selectedOpt.dataset.course,
                        year: selectedOpt.dataset.year,
                        semester: selectedOpt.dataset.sem,
                        subject: selectedOpt.value
                    });

                    this.activeSession = session;
                    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${session.token}`;
                    qrArea.style.display = 'block';
                    startBtn.parentElement.style.display = 'none';

                    // Start Countdown
                    let timeLeft = 15 * 60;
                    const interval = setInterval(() => {
                        timeLeft--;
                        const mins = Math.floor(timeLeft / 60);
                        const secs = timeLeft % 60;
                        timerText.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
                        if (timeLeft <= 0) {
                            clearInterval(interval);
                            timerText.textContent = 'EXPIRED';
                        }
                    }, 1000);

                    container.querySelector('#stop-qr-btn').onclick = () => {
                        clearInterval(interval);
                        qrArea.style.display = 'none';
                        startBtn.parentElement.style.display = 'flex';
                        startBtn.disabled = false;
                        startBtn.textContent = 'Start Live Session';
                    };

                } catch (err) {
                    Toast.error(err.message);
                    startBtn.disabled = false;
                    startBtn.textContent = 'Start Live Session';
                }
            };
        } catch (err) {
            Toast.error('Failed to load subjects');
        }
    }

    renderStudentView(container) {
        container.innerHTML = `
            <div class="glass-panel" style="padding: 2.5rem; text-align: center; max-width: 500px; margin: 0 auto;">
                <h3 style="font-size: 1.5rem; margin-bottom: 1rem;">📷 Scan Attendance</h3>
                <p style="color: var(--text-secondary); margin-bottom: 2rem;">Scan the QR code displayed by your teacher to mark your attendance.</p>
                
                <div id="reader" style="width: 100%; border-radius: 12px; overflow: hidden; background: #000; aspect-ratio: 1; margin-bottom: 1.5rem;"></div>
                
                <div id="manual-entry" style="margin-top: 1rem;">
                    <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem;">Scanner not working? Enter code manually:</p>
                    <div style="display: flex; gap: 10px;">
                        <input type="text" id="manual-token" placeholder="Enter Token" style="flex: 1; padding: 12px; border-radius: 8px; border: 1px solid var(--glass-border); background: var(--bg-primary); color: var(--text-primary);">
                        <button class="glass-button" id="submit-token-btn">Submit</button>
                    </div>
                </div>
            </div>
        `;

        const submitBtn = container.querySelector('#submit-token-btn');
        const tokenInput = container.querySelector('#manual-token');

        const handleScan = async (token) => {
            if (this.isProcessing) return;
            this.isProcessing = true;
            try {
                const res = await ApiService.scanAttendanceToken(token);
                Toast.success(res.message);
                if (this.scanner) {
                    this.scanner.clear();
                }
                container.innerHTML = `
                    <div class="glass-panel fade-in" style="padding: 3rem; text-align: center;">
                        <div style="font-size: 4rem; color: var(--success); margin-bottom: 1rem;">✅</div>
                        <h3>Attendance Marked!</h3>
                        <p style="color: var(--text-secondary);">Your attendance for <strong>${res.subject}</strong> has been successfully recorded.</p>
                        <button class="glass-button" style="margin-top: 2rem;" onclick="location.reload()">Back to Dashboard</button>
                    </div>
                `;
            } catch (err) {
                Toast.error(err.message);
                this.isProcessing = false;
            }
        };

        submitBtn.onclick = () => {
            const token = tokenInput.value.trim();
            if (token) handleScan(token);
        };

        // Initialize Scanner with CDN script
        if (typeof Html5QrcodeScanner === 'undefined') {
            const script = document.createElement('script');
            script.src = "https://unpkg.com/html5-qrcode";
            script.onload = () => this.initScanner(handleScan);
            document.head.appendChild(script);
        } else {
            this.initScanner(handleScan);
        }
    }

    initScanner(onScan) {
        const readerElement = document.getElementById('reader');
        if (!readerElement) return;

        try {
            const html5QrcodeScanner = new Html5QrcodeScanner("reader", { 
                fps: 10, 
                qrbox: {width: 250, height: 250},
                aspectRatio: 1.0
            });
            
            html5QrcodeScanner.render((decodedText) => {
                onScan(decodedText);
            }, (error) => {
                // Ignore scan errors
            });
            this.scanner = html5QrcodeScanner;
        } catch (e) {
            console.error('Scanner init failed', e);
        }
    }
}
