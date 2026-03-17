import { ApiService } from '../../../services/ApiService.js';

export class AcademicCalendar {
    constructor() {
        this.current = new Date();
        this.events  = [];
    }

    render() {
        const wrap = document.createElement('div');
        wrap.className = 'fade-in';
        wrap.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem;">
                <div>
                    <h1 style="font-size:1.6rem;margin:0;">📆 Academic Calendar</h1>
                    <p style="margin:4px 0 0;color:var(--text-secondary);font-size:0.9rem;">Events, holidays and examination schedule</p>
                </div>
                <div style="display:flex;gap:0.5rem;">
                    <button id="cal-prev" class="glass-button" style="background:var(--bg-secondary)!important;color:var(--text-primary)!important;border:1px solid var(--glass-border)!important;padding:8px 14px!important;">‹ Prev</button>
                    <button id="cal-today" class="glass-button" style="background:var(--bg-secondary)!important;color:var(--text-primary)!important;border:1px solid var(--glass-border)!important;padding:8px 14px!important;">Today</button>
                    <button id="cal-next" class="glass-button" style="background:var(--bg-secondary)!important;color:var(--text-primary)!important;border:1px solid var(--glass-border)!important;padding:8px 14px!important;">Next ›</button>
                </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 300px;gap:1.5rem;">
                <div class="glass-panel" style="padding:1.5rem;">
                    <div id="cal-header" style="text-align:center;margin-bottom:1rem;"></div>
                    <div id="cal-grid"></div>
                </div>
                <div>
                    <div class="glass-panel" style="padding:1.25rem;margin-bottom:1rem;">
                        <h3 style="margin:0 0 0.75rem;font-size:0.95rem;">📌 Legend</h3>
                        <div style="display:flex;flex-direction:column;gap:6px;font-size:0.8rem;">
                            <div style="display:flex;align-items:center;gap:8px;"><span style="width:12px;height:12px;border-radius:3px;background:#6366F1;display:inline-block;"></span> Notices / Events</div>
                            <div style="display:flex;align-items:center;gap:8px;"><span style="width:12px;height:12px;border-radius:3px;background:#10B981;display:inline-block;"></span> Today</div>
                            <div style="display:flex;align-items:center;gap:8px;"><span style="width:12px;height:12px;border-radius:3px;background:#F59E0B;display:inline-block;"></span> Weekend</div>
                        </div>
                    </div>
                    <div class="glass-panel" style="padding:1.25rem;">
                        <h3 style="margin:0 0 0.75rem;font-size:0.95rem;">📋 This Month's Notices</h3>
                        <div id="event-list" style="max-height:340px;overflow-y:auto;"></div>
                    </div>
                </div>
            </div>
        `;

        wrap.querySelector('#cal-prev').addEventListener('click', () => {
            this.current = new Date(this.current.getFullYear(), this.current.getMonth() - 1, 1);
            this._renderCalendar(wrap);
        });
        wrap.querySelector('#cal-next').addEventListener('click', () => {
            this.current = new Date(this.current.getFullYear(), this.current.getMonth() + 1, 1);
            this._renderCalendar(wrap);
        });
        wrap.querySelector('#cal-today').addEventListener('click', () => {
            this.current = new Date();
            this._renderCalendar(wrap);
        });

        this._fetchAndRender(wrap);
        return wrap;
    }

    async _fetchAndRender(wrap) {
        try {
            this.events = await ApiService.getNotices().catch(() => []);
        } catch (_) {}
        this._renderCalendar(wrap);
    }

    _renderCalendar(wrap) {
        const y     = this.current.getFullYear();
        const m     = this.current.getMonth();
        const today = new Date();
        const firstDay = new Date(y, m, 1).getDay();
        const daysInMonth = new Date(y, m + 1, 0).getDate();
        const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

        wrap.querySelector('#cal-header').innerHTML = `<h2 style="margin:0;font-size:1.3rem;">${monthNames[m]} ${y}</h2>`;

        const dayLabels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        let html = `<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:4px;">
            ${dayLabels.map(d => `<div style="text-align:center;font-size:0.7rem;font-weight:700;color:var(--text-secondary);padding:4px;">${d}</div>`).join('')}
        </div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;">`;

        // Empty cells before first day
        for (let i = 0; i < firstDay; i++) html += `<div></div>`;

        for (let d = 1; d <= daysInMonth; d++) {
            const isToday   = today.getFullYear()===y && today.getMonth()===m && today.getDate()===d;
            const isWeekend = [0,6].includes(new Date(y,m,d).getDay());
            const dayEvents = this.events.filter(e => {
                const ed = new Date(e.date || e.createdAt);
                return ed.getFullYear()===y && ed.getMonth()===m && ed.getDate()===d;
            });
            const bg = isToday ? '#10B981' : isWeekend ? 'rgba(245,158,11,0.1)' : 'var(--bg-primary)';
            const fg = isToday ? '#fff' : 'var(--text-primary)';
            html += `
                <div style="
                    min-height:52px;padding:4px;border-radius:8px;
                    background:${bg};color:${fg};
                    border:1px solid ${isToday?'#10B981':'var(--glass-border)'};
                    cursor:${dayEvents.length?'pointer':'default'};
                    transition:all 0.15s;
                " ${dayEvents.length ? `title="${dayEvents.map(e=>e.title).join(', ')}"` : ''}>
                    <div style="font-size:0.8rem;font-weight:${isToday?700:500};text-align:right;padding:2px;">${d}</div>
                    ${dayEvents.slice(0,2).map(() => `<div style="height:4px;border-radius:2px;background:#6366F1;margin-top:2px;"></div>`).join('')}
                </div>`;
        }

        html += '</div>';
        wrap.querySelector('#cal-grid').innerHTML = html;

        // Event list for this month
        const monthEvents = this.events.filter(e => {
            const ed = new Date(e.date || e.createdAt);
            return ed.getFullYear()===y && ed.getMonth()===m;
        }).sort((a,b) => new Date(a.date||a.createdAt)-new Date(b.date||b.createdAt));

        const listEl = wrap.querySelector('#event-list');
        if (monthEvents.length === 0) {
            listEl.innerHTML = `<p style="color:var(--text-secondary);font-size:0.85rem;text-align:center;padding:1rem;">No events this month.</p>`;
        } else {
            listEl.innerHTML = monthEvents.map(e => {
                const d = new Date(e.date || e.createdAt);
                return `<div style="padding:0.5rem 0;border-bottom:1px solid var(--glass-border);last-child:border:none;">
                    <div style="font-size:0.7rem;color:var(--accent-color);font-weight:700;">${d.toLocaleDateString('en-US',{month:'short',day:'numeric'})}</div>
                    <div style="font-size:0.85rem;font-weight:600;">${e.title}</div>
                    <div style="font-size:0.75rem;color:var(--text-secondary);">${e.category||'General'}</div>
                </div>`;
            }).join('');
        }
    }
}
