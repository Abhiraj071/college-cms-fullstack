import { ApiService } from '../../../services/ApiService.js';

export class AlumniList {
    constructor() {
        this.alumni = [];
    }

    render() {
        const container = document.createElement('div');
        container.className = 'fade-in';
        container.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem;">
                <div>
                    <h1 style="margin:0;">🎓 Alumni & Graduated Records</h1>
                    <p style="color:var(--text-secondary); margin:4px 0 0;">Historical student data organized by batch</p>
                </div>
            </div>
            <div id="alumni-content">
                <div style="text-align:center; padding:3rem;">Loading archived records...</div>
            </div>
        `;

        this.loadAlumni(container);
        return container;
    }

    async loadAlumni(container) {
        try {
            this.alumni = await ApiService.getAlumni();
            const content = container.querySelector('#alumni-content');

            if (this.alumni.length === 0) {
                content.innerHTML = `
                    <div class="glass-panel" style="padding:3rem; text-align:center;">
                        <div style="font-size:3rem; margin-bottom:1rem;">📦</div>
                        <h3>No archived records yet</h3>
                        <p style="color:var(--text-secondary);">Students will appear here once they complete their final semester.</p>
                    </div>
                `;
                return;
            }

            // Group by batch
            const batches = {};
            this.alumni.forEach(a => {
                if (!batches[a.batch]) batches[a.batch] = [];
                batches[a.batch].push(a);
            });

            content.innerHTML = Object.keys(batches).sort().reverse().map(batchName => `
                <div class="glass-panel" style="padding:1.5rem; margin-bottom:2rem;">
                    <h2 style="margin:0 0 1.5rem; font-size:1.25rem; border-bottom:1px solid var(--glass-border); padding-bottom:0.75rem; color:var(--accent-color);">
                        📂 ${batchName}
                    </h2>
                    <div style="overflow-x:auto;">
                        <table style="width:100%; border-collapse:collapse; font-size:0.9rem;">
                            <thead>
                                <tr style="text-align:left; color:var(--text-secondary); border-bottom:1px solid var(--glass-border);">
                                    <th style="padding:1rem;">Roll No</th>
                                    <th style="padding:1rem;">Name</th>
                                    <th style="padding:1rem;">Final CGPA</th>
                                    <th style="padding:1rem;">Attendance</th>
                                    <th style="padding:1rem;">Graduation Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${batches[batchName].map(a => `
                                    <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                                        <td style="padding:1rem; font-weight:700;">${a.rollNo}</td>
                                        <td style="padding:1rem;">${a.name}</td>
                                        <td style="padding:1rem;"><span style="background:var(--accent-glow); color:var(--accent-color); padding:2px 8px; border-radius:4px; font-weight:700;">${a.cgpa.toFixed(2)}</span></td>
                                        <td style="padding:1rem;">${a.totalAttendance || 'N/A'}</td>
                                        <td style="padding:1rem; color:var(--text-secondary);">${new Date(a.graduationDate).toLocaleDateString()}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `).join('');

        } catch (err) {
            console.error(err);
            container.querySelector('#alumni-content').innerHTML = `
                <div class="glass-panel" style="padding:2rem; color:var(--danger); text-align:center;">
                    Failed to load alumni data.
                </div>
            `;
        }
    }
}
