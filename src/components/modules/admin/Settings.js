import { ApiService } from '../../../services/ApiService.js';
import { Toast } from '../../../services/Toast.js';

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

        container.appendChild(content);

        // Event Listeners
        setTimeout(() => {
            const backupBtn = container.querySelector('#backup-btn');
            backupBtn.addEventListener('click', () => this.backupData(backupBtn));

            container.querySelector('#restore-file').addEventListener('change', (e) => this.restoreData(e));
            container.querySelector('#reset-btn').addEventListener('click', () => this.resetSystem());
            this.updateStats(container);
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
        }
    }
}
