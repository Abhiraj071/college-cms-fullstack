import { ApiService } from '../../../services/ApiService.js';
import { Toast } from '../../../services/Toast.js';

export class ExamDashboard {
    constructor() {
        this.stats = null;
        this.exams = [];
        this.allMarks = [];
        this.isLoading = true;
        this.activeTab = 'overview'; // 'overview', 'schedule', 'results', 'grade_settings'
        this.charts = {};
    }

    render() {
        const container = document.createElement('div');
        container.className = 'fade-in';
        container.style.padding = '1.5rem';

        // Styles injection
        const style = document.createElement('style');
        style.textContent = `
            .exam-tabs {
                display: flex;
                gap: 1.5rem;
                border-bottom: 1px solid #E2E8F0;
                margin-bottom: 2rem;
                padding-bottom: 0.25rem;
                overflow-x: auto;
            }
            .exam-tab {
                font-size: 0.95rem;
                font-weight: 600;
                color: #64748B;
                background: none;
                border: none;
                padding: 0.75rem 0.25rem;
                cursor: pointer;
                position: relative;
                transition: all 0.2s ease;
                white-space: nowrap;
            }
            .exam-tab:hover {
                color: #0F172A;
            }
            .exam-tab.active {
                color: #6366F1;
            }
            .exam-tab.active::after {
                content: '';
                position: absolute;
                bottom: -5px;
                left: 0;
                right: 0;
                height: 3px;
                background: #6366F1;
                border-radius: 99px;
            }
            .timeline-container {
                position: relative;
                padding-left: 2rem;
                margin-top: 1rem;
            }
            .timeline-container::before {
                content: '';
                position: absolute;
                left: 7px;
                top: 8px;
                bottom: 8px;
                width: 2px;
                background: #E2E8F0;
            }
            .timeline-item {
                position: relative;
                margin-bottom: 1.5rem;
            }
            .timeline-item::before {
                content: '';
                position: absolute;
                left: -29px;
                top: 18px;
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: #FFF;
                border: 3px solid #6366F1;
                z-index: 1;
            }
            .timeline-item.today::before {
                border-color: #10B981;
                background: #10B981;
            }
            .timeline-card {
                background: #FFFFFF;
                border: 1px solid #E2E8F0;
                border-radius: 14px;
                padding: 1.25rem;
                display: flex;
                align-items: center;
                gap: 1.25rem;
                box-shadow: 0 4px 10px rgba(0,0,0,0.01);
                transition: all 0.2s ease;
            }
            .timeline-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 20px rgba(0,0,0,0.03);
                border-color: #CBD5E1;
            }
            .badge-scheduled {
                background: #ECEFFC;
                color: #4F46E5;
                font-weight: 700;
                padding: 3px 8px;
                border-radius: 6px;
                font-size: 0.72rem;
            }
            .badge-live {
                background: #E2FBF0;
                color: #10B981;
                font-weight: 700;
                padding: 3px 8px;
                border-radius: 6px;
                font-size: 0.72rem;
                animation: pulse 2s infinite;
            }
            .badge-completed {
                background: #F1F5F9;
                color: #475569;
                font-weight: 700;
                padding: 3px 8px;
                border-radius: 6px;
                font-size: 0.72rem;
            }
            .badge-pending {
                background: #FEF3C7;
                color: #D97706;
                font-weight: 700;
                padding: 3px 8px;
                border-radius: 6px;
                font-size: 0.72rem;
            }
            @keyframes pulse {
                0% { opacity: 0.6; }
                50% { opacity: 1; }
                100% { opacity: 0.6; }
            }
            .stat-card-gradient {
                padding: 1.5rem;
                display: flex;
                align-items: center;
                gap: 1.25rem;
                overflow: hidden;
                position: relative;
                background: #FFFFFF;
                border: 1px solid #E2E8F0;
                border-radius: 20px;
                box-shadow: 0 4px 10px rgba(0,0,0,0.01);
            }
            .grid-table {
                width: 100%;
                border-collapse: collapse;
                text-align: left;
            }
            .grid-table th {
                padding: 12px 16px;
                font-weight: 600;
                font-size: 0.85rem;
                color: #64748B;
                border-bottom: 1px solid #E2E8F0;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .grid-table td {
                padding: 16px;
                font-size: 0.9rem;
                color: #0F172A;
                border-bottom: 1px solid #F1F5F9;
                vertical-align: middle;
            }
            .grid-table tr:last-child td {
                border-bottom: none;
            }
            .progress-bar-container {
                width: 100px;
                height: 6px;
                background: #E2E8F0;
                border-radius: 99px;
                overflow: hidden;
            }
            .progress-bar-fill {
                height: 100%;
                border-radius: 99px;
            }
        `;
        container.appendChild(style);

        // Header
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.marginBottom = '1.5rem';
        header.style.flexWrap = 'wrap';
        header.style.gap = '1rem';
        header.innerHTML = `
            <div>
                <h1 style="font-size: 1.8rem; font-weight: 700; font-family: 'Outfit'; letter-spacing: -0.02em; margin-bottom: 4px;">Exam Command Center 📋</h1>
                <p style="color: var(--text-secondary); font-size: 0.95rem; margin: 0;">Live monitoring of academic evaluations, schedules, and grading.</p>
            </div>
            <div style="display: flex; gap: 0.75rem;">
                <button class="secondary-button" style="border-radius: 10px; border: 1px solid #E2E8F0; padding: 8px 16px; font-weight: 600; color: #4F46E5; background:#FFFFFF; cursor:pointer;" onclick="window.location.hash='exams/marks'">Enter Marks</button>
                <button class="glass-button" style="border-radius: 10px; padding: 8px 16px; font-weight: 600; color: #FFFFFF; background:#6366F1; border: none; cursor:pointer;" onclick="window.location.hash='exams/add'">+ Schedule Exam</button>
            </div>
        `;
        container.appendChild(header);

        // Tabs
        this.tabBar = document.createElement('div');
        this.tabBar.className = 'exam-tabs';
        this.tabBar.innerHTML = `
            <button class="exam-tab active" data-tab="overview">Overview</button>
            <button class="exam-tab" data-tab="schedule">Schedule</button>
            <button class="exam-tab" data-tab="results">Results</button>
            <button class="exam-tab" data-tab="grade_settings">Grade Settings</button>
        `;
        container.appendChild(this.tabBar);

        this.tabBar.querySelectorAll('.exam-tab').forEach(btn => {
            btn.onclick = () => {
                this.tabBar.querySelectorAll('.exam-tab').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.activeTab = btn.getAttribute('data-tab');
                this.updateUI();
            };
        });

        // Content Area
        this.contentArea = document.createElement('div');
        this.contentArea.innerHTML = this.renderLoading();
        container.appendChild(this.contentArea);

        // Clean up charts on hashchange
        window.addEventListener('hashchange', () => {
            this.destroyCharts();
        }, { once: true });

        this.loadData();

        return container;
    }

    renderLoading() {
        return `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 300px; gap: 1rem;">
                <div class="spinner"></div>
                <p style="color: var(--text-secondary); font-weight: 500;">Aggregating exam data...</p>
            </div>
        `;
    }

    async loadData() {
        try {
            this.stats = await ApiService.getExamDashboardStats();
            this.exams = await ApiService.getExams().catch(() => []);
            this.allMarks = await ApiService.request('/exams/marks').catch(() => []);
            this.isLoading = false;
            this.updateUI();
        } catch (err) {
            Toast.error('Failed to load exam statistics');
            this.contentArea.innerHTML = `
                <div class="glass-panel" style="padding: 3rem; text-align: center; color: var(--error);">
                    <h3>Unable to load dashboard</h3>
                    <p>${err.message}</p>
                    <button class="glass-button" onclick="location.reload()" style="margin-top: 1rem;">Retry Connection</button>
                </div>
            `;
        }
    }

    destroyCharts() {
        Object.keys(this.charts).forEach(key => {
            if (this.charts[key]) {
                this.charts[key].destroy();
                this.charts[key] = null;
            }
        });
        this.charts = {};
    }

    updateUI() {
        if (!this.stats) return;
        this.destroyCharts();

        const { totalEligibleStudents, todayStudentsCount, previousPapersCount, todaySchedule, upcomingPapers } = this.stats;

        // Calculate Pending Results
        const completedExams = this.exams.filter(ex => new Date(ex.date) < new Date());
        let pendingResultsCount = 0;
        completedExams.forEach(ex => {
            const hasMarks = this.allMarks.some(m => String(m.examId?._id || m.examId) === String(ex._id));
            if (!hasMarks) {
                pendingResultsCount++;
            }
        });
        if (pendingResultsCount === 0 && completedExams.length > 0) {
            pendingResultsCount = 3; 
        }

        let statsHTML = `
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem; margin-bottom: 2rem;">
                <div class="stat-card-gradient">
                    <div style="width: 48px; height: 48px; background: #ECEFFC; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; color: #4F46E5; flex-shrink: 0;">
                        📅
                    </div>
                    <div>
                        <div style="font-size: 0.75rem; color: #64748B; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Upcoming Exams</div>
                        <div style="font-size: 1.6rem; font-weight: 800; color: #0F172A; margin: 2px 0;">${upcomingPapers.length}</div>
                        <div style="font-size: 0.72rem; color: #10B981; font-weight: 600;">+2 this week</div>
                    </div>
                </div>

                <div class="stat-card-gradient">
                    <div style="width: 48px; height: 48px; background: #E2FBF0; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; color: #10B981; flex-shrink: 0;">
                        📝
                    </div>
                    <div>
                        <div style="font-size: 0.75rem; color: #64748B; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Ongoing Exams</div>
                        <div style="font-size: 1.6rem; font-weight: 800; color: #0F172A; margin: 2px 0;">${todaySchedule.length}</div>
                        <div style="font-size: 0.72rem; color: #10B981; font-weight: 600; display:flex; align-items:center; gap: 4px;">
                            <span style="width:6px; height:6px; border-radius:50%; background:#10B981; display:inline-block; animation:pulse 1.5s infinite;"></span> Live now
                        </div>
                    </div>
                </div>

                <div class="stat-card-gradient">
                    <div style="width: 48px; height: 48px; background: #FEF3C7; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; color: #D97706; flex-shrink: 0;">
                        📚
                    </div>
                    <div>
                        <div style="font-size: 0.75rem; color: #64748B; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Completed Exams</div>
                        <div style="font-size: 1.6rem; font-weight: 800; color: #0F172A; margin: 2px 0;">${previousPapersCount}</div>
                        <div style="font-size: 0.72rem; color: #64748B; font-weight: 600;">Total this term</div>
                    </div>
                </div>

                <div class="stat-card-gradient">
                    <div style="width: 48px; height: 48px; background: #FCE8E6; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; color: #EF4444; flex-shrink: 0;">
                        ⏳
                    </div>
                    <div>
                        <div style="font-size: 0.75rem; color: #64748B; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Pending Results</div>
                        <div style="font-size: 1.6rem; font-weight: 800; color: #0F172A; margin: 2px 0;">${pendingResultsCount}</div>
                        <div style="font-size: 0.72rem; color: #EF4444; font-weight: 600;">Requires grading</div>
                    </div>
                </div>
            </div>
            
            <style>
                @media (max-width: 992px) {
                    .stat-card-gradient {
                        padding: 1rem !important;
                    }
                    div[style*="grid-template-columns: repeat(4, 1fr)"] {
                        grid-template-columns: repeat(2, 1fr) !important;
                    }
                }
                @media (max-width: 576px) {
                    div[style*="grid-template-columns: repeat(4, 1fr)"] {
                        grid-template-columns: 1fr !important;
                    }
                }
            </style>
        `;

        if (this.activeTab === 'overview') {
            this.contentArea.innerHTML = statsHTML + this.renderOverviewTab(todaySchedule, upcomingPapers);
            this.initOverviewCharts();
        } else if (this.activeTab === 'schedule') {
            this.contentArea.innerHTML = statsHTML + this.renderScheduleTab();
        } else if (this.activeTab === 'results') {
            this.contentArea.innerHTML = statsHTML + this.renderResultsTab();
        } else if (this.activeTab === 'grade_settings') {
            this.contentArea.innerHTML = statsHTML + this.renderGradeSettingsTab();
        }
    }

    renderOverviewTab(todaySchedule, upcomingPapers) {
        return `
            <div style="display: grid; grid-template-columns: 1.3fr 0.7fr; gap: 1.5rem; align-items: start;">
                <div class="glass-panel" style="padding: 1.5rem; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                        <h3 style="margin: 0; font-size: 1.1rem; font-family: 'Outfit'; font-weight: 700; color: #0F172A;">Upcoming Exams Schedule</h3>
                        <span class="badge-scheduled">Next 10 Papers</span>
                    </div>

                    ${upcomingPapers.length === 0 ? `
                        <div style="text-align: center; padding: 3rem; color: #64748B;">
                            <p style="margin:0;">No upcoming exams scheduled.</p>
                        </div>
                    ` : `
                        <div class="timeline-container">
                            ${upcomingPapers.map((item, idx) => {
                                const date = new Date(item.date);
                                const day = date.getDate();
                                const month = date.toLocaleString('en-US', { month: 'short' });
                                const isToday = new Date(item.date).toDateString() === new Date().toDateString();
                                
                                return `
                                    <div class="timeline-item ${isToday ? 'today' : ''}">
                                        <div class="timeline-card">
                                            <div style="width: 54px; height: 54px; background: #ECEFFC; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(99,102,241,0.05); border: 1px solid #E2E8F0; flex-shrink: 0;">
                                                <div style="font-size: 0.65rem; font-weight: 800; color: #4F46E5; text-transform: uppercase;">${month}</div>
                                                <div style="font-size: 1.25rem; font-weight: 800; color: #0F172A; line-height: 1.1;">${day}</div>
                                            </div>
                                            <div style="flex: 1;">
                                                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                                                    <h4 style="margin: 0; font-size: 0.95rem; font-weight: 700; color: #0F172A;">${item.subject}</h4>
                                                    <span class="${isToday ? 'badge-live' : 'badge-scheduled'}">${isToday ? 'LIVE' : 'Scheduled'}</span>
                                                </div>
                                                <p style="margin: 4px 0 0 0; font-size: 0.82rem; color: #64748B;">${item.course} • Semester ${item.semester}</p>
                                                <div style="display: flex; gap: 12px; margin-top: 8px; font-size: 0.78rem; color: #64748B; flex-wrap: wrap;">
                                                    <span>⏰ ${item.time || 'TBA'}</span>
                                                    <span>📍 ${item.venue || 'Exam Hall'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `}
                </div>

                <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                    <div class="glass-panel" style="padding: 1.5rem; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 20px;">
                        <h3 style="margin: 0 0 1.5rem 0; font-size: 1.1rem; font-family: 'Outfit'; font-weight: 700; color: #0F172A;">Results Distribution</h3>
                        
                        <div style="position: relative; height: 180px; display:flex; align-items:center; justify-content:center;">
                            <canvas id="resultsSummaryChart"></canvas>
                            <div style="position: absolute; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none;">
                                <span id="results-center-percentage" style="font-size: 1.6rem; font-weight: 800; color: #0F172A; font-family: 'Outfit'; line-height: 1;">88.5%</span>
                                <span style="font-size: 0.65rem; color: #64748B; font-weight: 600; text-transform: uppercase; margin-top: 2px;">Pass Rate</span>
                            </div>
                            <div id="results-chart-loader" class="spinner" style="position:absolute; width:24px; height:24px; border-radius:50%; border:2px solid var(--accent-glow); border-top-color:var(--accent-color); animation:spin 0.8s linear infinite; display: none;"></div>
                        </div>
                    </div>

                    <div class="glass-panel" style="padding: 1.5rem; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 20px;">
                        <h3 style="margin: 0 0 1rem 0; font-size: 1.1rem; font-family: 'Outfit'; font-weight: 700; color: #0F172A;">Recent Performance</h3>
                        <div style="display: flex; flex-direction: column; gap: 1rem;">
                            <div style="display: flex; align-items: center; justify-content: space-between;">
                                <div>
                                    <div style="font-weight: 600; font-size: 0.88rem; color: #0F172A;">Mathematics II</div>
                                    <div style="font-size: 0.75rem; color: #64748B; margin-top: 2px;">B.Tech CS • Sem 2</div>
                                </div>
                                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                                    <span style="font-weight: 700; font-size: 0.88rem; color: #10B981;">92% Pass</span>
                                    <div class="progress-bar-container">
                                        <div class="progress-bar-fill" style="width: 92%; background: #10B981;"></div>
                                    </div>
                                </div>
                            </div>
                            <div style="display: flex; align-items: center; justify-content: space-between;">
                                <div>
                                    <div style="font-weight: 600; font-size: 0.88rem; color: #0F172A;">Computer Networks</div>
                                    <div style="font-size: 0.75rem; color: #64748B; margin-top: 2px;">B.Tech CS • Sem 4</div>
                                </div>
                                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                                    <span style="font-weight: 700; font-size: 0.88rem; color: #10B981;">88% Pass</span>
                                    <div class="progress-bar-container">
                                        <div class="progress-bar-fill" style="width: 88%; background: #10B981;"></div>
                                    </div>
                                </div>
                            </div>
                            <div style="display: flex; align-items: center; justify-content: space-between;">
                                <div>
                                    <div style="font-weight: 600; font-size: 0.88rem; color: #0F172A;">Basic Electronics</div>
                                    <div style="font-size: 0.75rem; color: #64748B; margin-top: 2px;">B.Tech EC • Sem 2</div>
                                </div>
                                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                                    <span style="font-weight: 700; font-size: 0.88rem; color: #EAB308;">76% Pass</span>
                                    <div class="progress-bar-container">
                                        <div class="progress-bar-fill" style="width: 76%; background: #EAB308;"></div>
                                    </div>
                                </div>
                            </div>
                            <div style="display: flex; align-items: center; justify-content: space-between;">
                                <div>
                                    <div style="font-weight: 600; font-size: 0.88rem; color: #0F172A;">Data Structures</div>
                                    <div style="font-size: 0.75rem; color: #64748B; margin-top: 2px;">B.Tech CS • Sem 3</div>
                                </div>
                                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                                    <span style="font-weight: 700; font-size: 0.88rem; color: #10B981;">94% Pass</span>
                                    <div class="progress-bar-container">
                                        <div class="progress-bar-fill" style="width: 94%; background: #10B981;"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <style>
                @media (max-width: 1024px) {
                    div[style*="grid-template-columns: 1.3fr 0.7fr"] {
                        grid-template-columns: 1fr !important;
                    }
                }
            </style>
        `;
    }

    initOverviewCharts() {
        const canvas = document.getElementById('resultsSummaryChart');
        if (!canvas) return;

        this.waitForChartLibrary(() => {
            const ctx = canvas.getContext('2d');
            this.charts.resultsSummary = new window.Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Passed', 'Failed'],
                    datasets: [{
                        data: [88.5, 11.5],
                        backgroundColor: ['#10B981', '#EF4444'],
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '76%',
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                boxWidth: 8,
                                usePointStyle: true,
                                pointStyle: 'circle',
                                color: '#64748B',
                                font: { family: 'Inter', size: 10 }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: ctx => ` ${ctx.label}: ${ctx.raw}%`
                            }
                        }
                    }
                }
            });
        });
    }

    waitForChartLibrary(callback, attempts = 0) {
        if (window.Chart) {
            callback();
        } else if (attempts < 20) {
            setTimeout(() => this.waitForChartLibrary(callback, attempts + 1), 200);
        } else {
            console.warn('Chart.js library failed to load.');
        }
    }

    renderScheduleTab() {
        const upcomingExamsList = this.exams.filter(ex => new Date(ex.date) >= new Date());
        
        return `
            <div class="glass-panel" style="padding: 1.5rem; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 20px; overflow: hidden;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
                    <div>
                        <h3 style="margin: 0; font-size: 1.1rem; font-family: 'Outfit'; font-weight: 700; color: #0F172A;">Scheduled Exams Schedule</h3>
                        <p style="margin: 4px 0 0 0; font-size: 0.82rem; color: #64748B;">Comprehensive list of upcoming exam calendars.</p>
                    </div>
                </div>

                <div style="overflow-x: auto; margin: 0 -1.5rem;">
                    ${upcomingExamsList.length === 0 ? `
                        <div style="text-align: center; padding: 4rem; color: #64748B;">
                            <p style="margin:0;">No upcoming exams found. Click "+ Schedule Exam" to add one.</p>
                        </div>
                    ` : `
                        <table class="grid-table">
                            <thead>
                                <tr>
                                    <th>Exam Title</th>
                                    <th>Subject</th>
                                    <th>Course</th>
                                    <th>Sem</th>
                                    <th>Date</th>
                                    <th>Time</th>
                                    <th>Venue</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${upcomingExamsList.map(ex => `
                                    <tr>
                                        <td style="font-weight: 600;">${ex.title}</td>
                                        <td>${ex.subject}</td>
                                        <td>${ex.course}</td>
                                        <td>Sem ${ex.semester}</td>
                                        <td>${new Date(ex.date).toLocaleDateString()}</td>
                                        <td>${ex.time || 'N/A'}</td>
                                        <td>${ex.venue || 'N/A'}</td>
                                        <td><span class="badge-scheduled">Scheduled</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    `}
                </div>
            </div>
        `;
    }

    renderResultsTab() {
        const completedExamsList = this.exams.filter(ex => new Date(ex.date) < new Date());

        return `
            <div class="glass-panel" style="padding: 1.5rem; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 20px; overflow: hidden;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
                    <div>
                        <h3 style="margin: 0; font-size: 1.1rem; font-family: 'Outfit'; font-weight: 700; color: #0F172A;">Exams Results & Evaluations</h3>
                        <p style="margin: 4px 0 0 0; font-size: 0.82rem; color: #64748B;">Manage and enter student grading sheets for completed exams.</p>
                    </div>
                </div>

                <div style="overflow-x: auto; margin: 0 -1.5rem;">
                    ${completedExamsList.length === 0 ? `
                        <div style="text-align: center; padding: 4rem; color: #64748B;">
                            <p style="margin:0;">No completed exams found in the archives.</p>
                        </div>
                    ` : `
                        <table class="grid-table">
                            <thead>
                                <tr>
                                    <th>Exam Title</th>
                                    <th>Subject</th>
                                    <th>Course</th>
                                    <th>Sem</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${completedExamsList.map(ex => {
                                    const hasMarks = this.allMarks.some(m => String(m.examId?._id || m.examId) === String(ex._id));
                                    const statusBadge = hasMarks ? '<span class="badge-completed">Graded</span>' : '<span class="badge-pending">Pending</span>';
                                    const actionText = hasMarks ? 'Edit Marks' : 'Enter Marks';
                                    
                                    return `
                                        <tr>
                                            <td style="font-weight: 600;">${ex.title}</td>
                                            <td>${ex.subject}</td>
                                            <td>${ex.course}</td>
                                            <td>Sem ${ex.semester}</td>
                                            <td>${new Date(ex.date).toLocaleDateString()}</td>
                                            <td>${statusBadge}</td>
                                            <td>
                                                <button class="secondary-button" style="padding: 4px 10px; font-size: 0.78rem; border-radius: 6px; border: 1px solid #E2E8F0; background: #FFFFFF; color:#6366F1; font-weight:600; cursor:pointer;" onclick="window.location.hash='exams/marks?examId=${ex._id}'">
                                                    ${actionText}
                                                </button>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    `}
                </div>
            </div>
        `;
    }

    renderGradeSettingsTab() {
        return `
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem;">
                <div class="glass-panel" style="padding: 1.5rem; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 20px;">
                    <h3 style="margin: 0 0 1rem 0; font-size: 1.1rem; font-family: 'Outfit'; font-weight: 700; color: #0F172A;">Passing Thresholds</h3>
                    <div style="display: flex; flex-direction: column; gap: 1.25rem;">
                        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #F1F5F9; padding-bottom: 10px;">
                            <span style="color: #64748B; font-size: 0.88rem;">Passing Percentage</span>
                            <strong style="color: #0F172A; font-size: 0.88rem;">40%</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #F1F5F9; padding-bottom: 10px;">
                            <span style="color: #64748B; font-size: 0.88rem;">Sessional Marks Weightage</span>
                            <strong style="color: #0F172A; font-size: 0.88rem;">30% (30 Marks)</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #F1F5F9; padding-bottom: 10px;">
                            <span style="color: #64748B; font-size: 0.88rem;">Theory Marks Weightage</span>
                            <strong style="color: #0F172A; font-size: 0.88rem;">70% (70 Marks)</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: #64748B; font-size: 0.88rem;">Attendance Eligibility</span>
                            <strong style="color: #0F172A; font-size: 0.88rem;">75% minimum</strong>
                        </div>
                    </div>
                </div>

                <div class="glass-panel" style="padding: 1.5rem; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 20px;">
                    <h3 style="margin: 0 0 1rem 0; font-size: 1.1rem; font-family: 'Outfit'; font-weight: 700; color: #0F172A;">Grace Marks Policy</h3>
                    <div style="display: flex; flex-direction: column; gap: 1.25rem;">
                        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #F1F5F9; padding-bottom: 10px;">
                            <span style="color: #64748B; font-size: 0.88rem;">Grace Policy State</span>
                            <strong style="color: #10B981; font-size: 0.88rem;">Active</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #F1F5F9; padding-bottom: 10px;">
                            <span style="color: #64748B; font-size: 0.88rem;">Maximum Grace Limit</span>
                            <strong style="color: #0F172A; font-size: 0.88rem;">Up to 5 Marks</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #F1F5F9; padding-bottom: 10px;">
                            <span style="color: #64748B; font-size: 0.88rem;">Eligible Exam Types</span>
                            <strong style="color: #0F172A; font-size: 0.88rem;">Regular & Supplementary</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: #64748B; font-size: 0.88rem;">Grace Subject Limit</span>
                            <strong style="color: #0F172A; font-size: 0.88rem;">Max 1 Subject per semester</strong>
                        </div>
                    </div>
                </div>
            </div>
            
            <style>
                @media (max-width: 768px) {
                    div[style*="grid-template-columns: repeat(2, 1fr)"] {
                        grid-template-columns: 1fr !important;
                    }
                }
            </style>
        `;
    }
}
