import { ApiService } from '../../../services/ApiService.js';
import { Toast } from '../../../services/Toast.js';

export class ExamDashboard {
    constructor() {
        this.stats = null;
        this.isLoading = true;
    }

    render() {
        const container = document.createElement('div');
        container.className = 'fade-in';
        container.style.padding = '1.5rem';

        const header = document.createElement('div');
        header.style.marginBottom = '2rem';
        header.innerHTML = `
            <h1 style="font-size: 2rem; font-weight: 800; margin-bottom: 0.5rem; letter-spacing: -0.5px;">📋 Exam Command Center</h1>
            <p style="color: var(--text-secondary); font-size: 1.1rem;">Live monitoring of academic evaluations and schedules.</p>
        `;
        container.appendChild(header);

        this.contentArea = document.createElement('div');
        this.contentArea.innerHTML = this.renderLoading();
        container.appendChild(this.contentArea);

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

    updateUI() {
        if (!this.stats) return;

        const { totalEligibleStudents, todayStudentsCount, previousPapersCount, todaySchedule, upcomingPapers } = this.stats;

        this.contentArea.innerHTML = `
            <!-- Stats Grid -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; margin-bottom: 2.5rem;">
                ${this.renderStatCard('👨‍🎓', 'Eligible Students', totalEligibleStudents, 'linear-gradient(135deg, #6366f1, #818cf8)')}
                ${this.renderStatCard('📝', 'Today\'s Candidates', todayStudentsCount, 'linear-gradient(135deg, #10b981, #34d399)')}
                ${this.renderStatCard('📚', 'Previous Papers', previousPapersCount, 'linear-gradient(135deg, #f59e0b, #fbbf24)')}
                ${this.renderStatCard('📅', 'Upcoming Papers', upcomingPapers.length, 'linear-gradient(135deg, #8b5cf6, #a78bfa)')}
            </div>

            <div style="display: grid; grid-template-columns: 1fr; gap: 2rem; align-items: start;">
                ${window.innerWidth > 1024 ? `<div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 2rem;">` : ''}
                    
                    <!-- Today's Schedule -->
                    <div class="glass-panel" style="padding: 1.5rem; border-top: 4px solid #10b981;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                            <h3 style="margin: 0; font-size: 1.25rem; font-weight: 700;">🕒 Today's Paper Schedule</h3>
                            <span style="background: rgba(16, 185, 129, 0.1); color: #10b981; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 700;">LIVE</span>
                        </div>
                        <div id="today-schedule-list">
                            ${this.renderScheduleList(todaySchedule, true)}
                        </div>
                    </div>

                    <!-- Upcoming Papers -->
                    <div class="glass-panel" style="padding: 1.5rem; border-top: 4px solid #8b5cf6;">
                        <h3 style="margin-bottom: 1.5rem; font-size: 1.25rem; font-weight: 700;">📅 Upcoming Papers</h3>
                        <div id="upcoming-schedule-list">
                            ${this.renderUpcomingList(upcomingPapers)}
                        </div>
                    </div>

                ${window.innerWidth > 1024 ? `</div>` : ''}
            </div>

            <!-- Useful Actions Footer -->
            <div style="margin-top: 3rem; display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center;">
                <button class="glass-button" onclick="window.location.hash='exams/add'" style="padding: 12px 24px;">➕ Schedule New Exam</button>
                <button class="glass-button" onclick="window.location.hash='exams/marks'" style="padding: 12px 24px;">✍️ Enter Marks</button>
                <button class="glass-button" onclick="window.location.hash='exams'" style="padding: 12px 24px;">📋 View All Exams</button>
            </div>
        `;
    }

    renderStatCard(icon, label, value, gradient) {
        return `
            <div class="glass-panel stat-card" style="padding: 1.5rem; display: flex; align-items: center; gap: 1.25rem; overflow: hidden; position: relative; transition: transform 0.3s ease;">
                <div style="width: 60px; height: 60px; background: ${gradient}; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; color: white; box-shadow: 0 8px 16px rgba(0,0,0,0.1);">
                    ${icon}
                </div>
                <div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">${label}</div>
                    <div style="font-size: 1.8rem; font-weight: 800; line-height: 1;">${value}</div>
                </div>
                <div style="position: absolute; right: -10px; bottom: -10px; font-size: 4rem; opacity: 0.05; transform: rotate(-15deg);">${icon}</div>
            </div>
        `;
    }

    renderScheduleList(items, isToday) {
        if (!items || items.length === 0) {
            return `
                <div style="text-align: center; padding: 2rem; background: rgba(0,0,0,0.02); border-radius: 12px; border: 1px dashed var(--glass-border);">
                    <p style="color: var(--text-secondary); margin: 0;">No exams scheduled for ${isToday ? 'today' : 'this period'}.</p>
                </div>
            `;
        }

        return items.map(item => `
            <div class="schedule-item" style="display: flex; gap: 1.5rem; padding: 1.25rem; background: var(--bg-secondary); border-radius: 12px; margin-bottom: 1rem; border: 1px solid var(--glass-border); transition: all 0.2s ease;">
                <div style="min-width: 90px; text-align: center; padding-right: 1.5rem; border-right: 2px solid var(--accent-glow); display: flex; flex-direction: column; justify-content: center;">
                    <div style="font-weight: 800; color: var(--accent-color); font-size: 1.1rem;">${item.time || 'TBA'}</div>
                </div>
                <div style="flex: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
                        <div style="font-weight: 700; font-size: 1.1rem;">${item.subject} <span style="font-size: 0.8rem; opacity: 0.6; font-weight: 400;">[${item.code || 'N/A'}]</span></div>
                        <div style="font-size: 0.75rem; background: var(--accent-glow); color: var(--accent-color); padding: 2px 8px; border-radius: 4px; font-weight: 700;">${item.semester} Sem</div>
                    </div>
                    <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 8px;">${item.title} • ${item.course}</div>
                    <div style="display: flex; align-items: center; gap: 12px; font-size: 0.85rem;">
                        <span style="display: flex; align-items: center; gap: 4px;">📍 <b>${item.venue || 'Room TBA'}</b></span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderUpcomingList(items) {
        if (!items || items.length === 0) {
            return `
                <div style="text-align: center; padding: 2rem; background: rgba(0,0,0,0.02); border-radius: 12px; border: 1px dashed var(--glass-border);">
                    <p style="color: var(--text-secondary); margin: 0;">No upcoming exams found.</p>
                </div>
            `;
        }

        return items.map(item => {
            const date = new Date(item.date);
            const day = date.getDate();
            const month = date.toLocaleString('en-US', { month: 'short' });
            
            return `
                <div style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: var(--bg-secondary); border-radius: 10px; margin-bottom: 0.75rem; border: 1px solid var(--glass-border);">
                    <div style="width: 50px; height: 50px; background: white; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0,0,0,0.05); border: 1px solid #eee;">
                        <div style="font-size: 0.65rem; font-weight: 800; color: #8b5cf6; text-transform: uppercase;">${month}</div>
                        <div style="font-size: 1.1rem; font-weight: 800; color: #333; line-height: 1;">${day}</div>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: 700; font-size: 0.95rem;">${item.subject}</div>
                        <div style="font-size: 0.8rem; color: var(--text-secondary);">${item.course} • Sem ${item.semester}</div>
                    </div>
                    <div style="font-weight: 600; color: var(--accent-color); font-size: 0.85rem;">${item.time || ''}</div>
                </div>
            `;
        }).join('');
    }
}
