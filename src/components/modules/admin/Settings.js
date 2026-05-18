import { ApiService } from '../../../services/ApiService.js';
import { Toast } from '../../../services/Toast.js';
import { ThemeService } from '../../../services/ThemeService.js';

export class Settings {
    constructor() {
    }

    render() {
        const container = document.createElement('div');
        container.className = 'fade-in';

        const header = document.createElement('div');
        header.style.marginBottom = '2rem';
        header.innerHTML = `
            <h2>System Administration</h2>
            <p style="color: var(--text-secondary);">Manage Application Data and Settings</p>
        `;
        container.appendChild(header);

        const content = document.createElement('div');
        content.style.display = 'grid';
        content.style.gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))';
        content.style.gap = '2rem';

        // Data Management Card
        const dataCard = this.createCard('Data Management', 'Backup and Restore System Data (Database)');
        dataCard.innerHTML += `
            <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
                <button id="backup-btn" class="glass-button" style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                    <span>📥</span> Backup Full Database (JSON)
                </button>
                <div style="position: relative;">
                     <input type="file" id="restore-file" accept=".json" style="position: absolute; width: 100%; height: 100%; opacity: 0; cursor: pointer;">
                     <button class="glass-button" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                        <span>📤</span> Restore Data
                     </button>
                </div>
                <button id="reset-btn" class="glass-button delete-btn" style="background: rgba(239, 68, 68, 0.2); border-color: rgba(239, 68, 68, 0.5); color: #fca5a5;">
                    <span>⚠️</span> Factory Reset
                </button>
            </div>
        `;
        content.appendChild(dataCard);

        // System Info Card
        const infoCard = this.createCard('System Information', 'Database Details');
        infoCard.innerHTML += `
            <div style="margin-top: 1rem; display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.9rem;">
                <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: rgba(255,255,255,0.05); border-radius: 5px;">
                    <span>Version</span>
                    <span style="color: var(--accent-color);">2.0.0</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: rgba(255,255,255,0.05); border-radius: 5px;">
                    <span>Total Database Records</span>
                    <span id="total-records">Loading...</span>
                </div>
                 <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: rgba(255,255,255,0.05); border-radius: 5px;">
                    <span>Last Backup</span>
                    <span id="last-backup">-</span>
                </div>
                <div id="collection-breakdown" style="padding: 0.5rem; border-top: 1px solid rgba(255,255,255,0.1); margin-top: 0.5rem;">
                    <!-- Collection counts will appear here -->
                </div>
            </div>
        `;
        content.appendChild(infoCard);

        // Academic Semester Card
        const semesterCard = this.createCard('Academic Semester', 'Configure current semester dates');
        semesterCard.innerHTML += `
            <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
                <div>
                    <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.25rem;">Semester Start Date</label>
                    <input type="date" id="sem-start-date" class="form-input" style="width: 100%;">
                </div>
                <div>
                    <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.25rem;">Semester End Date</label>
                    <input type="date" id="sem-end-date" class="form-input" style="width: 100%;">
                </div>
                <button id="save-sem-dates-btn" class="glass-button" style="background: var(--accent-color); color: white;">
                    💾 Save Dates
                </button>
            </div>
        `;
        content.appendChild(semesterCard);

        // ── Email Notifications Card ──────────────────────────────────────
        const emailCard = this.createCard('📧 Email Notifications', 'Send attendance alerts and system emails');
        emailCard.innerHTML += `
            <div style="display:flex;flex-direction:column;gap:0.75rem;margin-top:1rem;">
                <p style="font-size:0.82rem;color:var(--text-secondary);margin:0;">
                    Configure SMTP settings in <code style="background:var(--bg-primary);padding:2px 5px;border-radius:4px;">backend/.env</code> to enable email.
                </p>
                <button id="send-low-att-emails" class="glass-button" style="background:rgba(245,158,11,0.1)!important;color:var(--warning)!important;border:1px solid rgba(245,158,11,0.3)!important;">
                    ⚠️ Send Low Attendance Alerts
                </button>
                <div id="email-status" style="font-size:0.8rem;color:var(--text-secondary);"></div>
            </div>
        `;
        emailCard.querySelector('#send-low-att-emails').addEventListener('click', async (e) => {
            const btn = e.target;
            const status = emailCard.querySelector('#email-status');
            btn.disabled = true; btn.textContent = '📧 Sending…';
            try {
                const r = await ApiService.sendLowAttendanceAlerts();
                status.textContent = r.message;
                status.style.color = 'var(--success)';
                Toast.success(r.message);
            } catch (err) {
                status.textContent = err.message;
                status.style.color = 'var(--danger)';
                Toast.error('Email failed: ' + err.message);
            } finally {
                btn.disabled = false; btn.textContent = '⚠️ Send Low Attendance Alerts';
            }
        });
        content.appendChild(emailCard);

        // ── Activity Log Quick Link ───────────────────────────────────────
        const logCard = this.createCard('🕵️ Activity Log', 'Audit all system actions and data changes');
        logCard.innerHTML += `
            <div style="margin-top:1rem;">
                <p style="font-size:0.82rem;color:var(--text-secondary);margin:0 0 0.75rem;">
                    Track every student creation, attendance mark, login, and system change.
                </p>
                <button class="glass-button" onclick="window.location.hash='activity-log'">View Activity Log →</button>
            </div>
        `;
        content.appendChild(logCard);

        // ── Theme Personalization Card ──────────────────────────────────────
        const themeCard = this.createCard('🎨 Premium Theme Engine', 'Personalize your interface with modes and accents');
        themeCard.innerHTML += `
            <div style="display:flex;flex-direction:column;gap:1.5rem;margin-top:1rem;">
                <div>
                    <label style="display:block;font-size:0.75rem;font-weight:700;text-transform:uppercase;margin-bottom:10px;color:var(--text-secondary);">Interface Mode</label>
                    <div style="display:flex;gap:10px;">
                        <button class="mode-btn ${ThemeService.getMode() === 'light' ? 'active' : ''}" data-mode="light" style="flex:1;padding:10px;border-radius:8px;border:1px solid var(--glass-border);background:var(--bg-primary);cursor:pointer;color:var(--text-primary);font-weight:600;">☀️ Light</button>
                        <button class="mode-btn ${ThemeService.getMode() === 'dark' ? 'active' : ''}" data-mode="dark" style="flex:1;padding:10px;border-radius:8px;border:1px solid var(--glass-border);background:#0f172a;cursor:pointer;color:white;font-weight:600;">🌙 Dark</button>
                    </div>
                </div>
                <div>
                    <label style="display:block;font-size:0.75rem;font-weight:700;text-transform:uppercase;margin-bottom:10px;color:var(--text-secondary);">Accent Color</label>
                    <div style="display:grid;grid-template-columns:repeat(5, 1fr);gap:8px;">
                        ${Object.entries(ThemeService.THEMES).map(([key, t]) => `
                            <button class="accent-btn ${ThemeService.getAccent() === key ? 'active' : ''}" 
                                    data-accent="${key}" 
                                    title="${t.name}"
                                    style="aspect-ratio:1;border-radius:50%;border:3px solid ${ThemeService.getAccent() === key ? 'white' : 'transparent'};background:${t.color};cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,0.1); transition:transform 0.2s;">
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        themeCard.querySelectorAll('.mode-btn').forEach(btn => {
            btn.onclick = () => {
                ThemeService.setMode(btn.dataset.mode);
                themeCard.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                Toast.success(`Switched to ${btn.dataset.mode} mode`);
            };
        });

        themeCard.querySelectorAll('.accent-btn').forEach(btn => {
            btn.onclick = () => {
                ThemeService.setAccent(btn.dataset.accent);
                themeCard.querySelectorAll('.accent-btn').forEach(b => b.style.borderColor = 'transparent');
                btn.style.borderColor = 'white';
                Toast.success(`Accent color updated to ${ThemeService.THEMES[btn.dataset.accent].name}`);
            };
        });

        content.appendChild(themeCard);

        container.appendChild(content);

        // Event Listeners
        setTimeout(() => {
            const backupBtn = container.querySelector('#backup-btn');
            backupBtn.addEventListener('click', () => this.backupData(backupBtn));

            container.querySelector('#restore-file').addEventListener('change', (e) => this.restoreData(e));
            container.querySelector('#reset-btn').addEventListener('click', () => this.resetSystem());

            container.querySelector('#save-sem-dates-btn').addEventListener('click', () => this.saveSemesterDates(container));

            this.updateStats(container);
            this.loadSettings(container);
        }, 0);

        return container;
    }

    createCard(title, subtitle) {
        const card = document.createElement('div');
        card.className = 'glass-panel';
        card.style.padding = '1.5rem';
        card.innerHTML = `
            <h3 style="margin-bottom: 0.25rem;">${title}</h3>
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem;">${subtitle}</p>
        `;
        return card;
    }

    async backupData(btn) {
        const originalText = btn.innerHTML;
        try {
            btn.disabled = true;
            btn.innerHTML = '<span>⏳</span> Generating Backup...';

            const response = await ApiService.exportBackup();
            const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `collegeOS_full_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            localStorage.setItem('cms_last_backup', new Date().toLocaleString());
            Toast.success('Full system backup generated successfully');

            // Trigger stats update
            const stats = document.querySelector('#last-backup');
            if (stats) stats.textContent = localStorage.getItem('cms_last_backup');
        } catch (err) {
            Toast.error('Backup failed: ' + err.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }

    async restoreData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const result = e.target.result;
                if (typeof result !== 'string') return;
                const data = JSON.parse(result);

                if (confirm(`CRITICAL: This will ERASE the entire database and restore ${Object.keys(data).length} collections. Are you sure?`)) {
                    await ApiService.importBackup(data);
                    Toast.success('Database restored! Reloading system...');
                    setTimeout(() => window.location.reload(), 1500);
                }
            } catch (err) {
                Toast.error('Restore failed: ' + err.message);
                console.error(err);
            }
        };
        reader.readAsText(file);
    }

    async resetSystem() {
        if (confirm('CRITICAL WARNING: This will delete ALL data (Students, Attendance, Faculty, etc.) from the server. This cannot be undone. Are you sure?')) {
            const verify = prompt('Type "RESET" to confirm:');
            if (verify === 'RESET') {
                try {
                    await ApiService.factoryReset();
                    localStorage.clear();
                    alert('Factory reset complete. Server data has been deleted.');
                    window.location.reload();
                } catch (err) {
                    Toast.error('Factory reset failed: ' + err.message);
                    console.error('Factory Reset Error:', err);
                }
            }
        }
    }

    async updateStats(container) {
        try {
            const stats = await ApiService.getSystemStats();

            container.querySelector('#total-records').textContent = stats.totalRecords;
            container.querySelector('#last-backup').textContent = localStorage.getItem('cms_last_backup') || 'Never';

            const breakdown = container.querySelector('#collection-breakdown');
            breakdown.innerHTML = '<p style="font-weight: 600; margin-bottom: 0.5rem; font-size: 0.8rem;">Database Collections:</p>';

            stats.collections.forEach(col => {
                const row = document.createElement('div');
                row.style.cssText = 'display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 0.25rem; color: var(--text-secondary);';
                row.innerHTML = `<span>${col.name}</span> <span>${col.count}</span>`;
                breakdown.appendChild(row);
            });
        } catch (err) {
            console.error('Stats update failed:', err);
            container.querySelector('#total-records').textContent = 'Error loading stats';
            if (err.message.includes('expired') || err.message.includes('token')) {
                Toast.error('Session expired. Please log in again.');
            }
        }
    }

    async loadSettings(container) {
        try {
            const settings = await ApiService.getSettings();
            const semesterDates = settings.find(s => s.key === 'semester_dates');
            if (semesterDates && semesterDates.value) {
                if (semesterDates.value.start) {
                    container.querySelector('#sem-start-date').value = semesterDates.value.start;
                }
                if (semesterDates.value.end) {
                    container.querySelector('#sem-end-date').value = semesterDates.value.end;
                }
            }
        } catch (err) {
            console.error('Failed to load settings:', err);
            if (err.message.includes('expired') || err.message.includes('token')) {
                Toast.error('Your session has expired. Please log in again to manage settings.');
            }
        }
    }

    async saveSemesterDates(container) {
        try {
            const start = container.querySelector('#sem-start-date').value;
            const end = container.querySelector('#sem-end-date').value;

            if (!start || !end) {
                return Toast.error('Both start and end dates are required');
            }
            if (new Date(start) >= new Date(end)) {
                return Toast.error('Start date must be before end date');
            }

            const btn = container.querySelector('#save-sem-dates-btn');
            const originalText = btn.innerHTML;
            btn.innerHTML = 'Saving...';
            btn.disabled = true;

            await ApiService.updateSetting('semester_dates', { start, end });
            Toast.success('Semester dates saved successfully');

            btn.innerHTML = originalText;
            btn.disabled = false;
        } catch (err) {
            Toast.error('Failed to save semester dates: ' + err.message);
        }
    }
}
