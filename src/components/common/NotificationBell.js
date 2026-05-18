import { NotificationService } from '../../services/NotificationService.js';

export class NotificationBell {
    constructor() {
        this.unread = 0;
        this.open   = false;
        this.el     = null;
        this._unsubscribe = null;
    }

    render() {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'position:relative; display:inline-block;';

        wrapper.innerHTML = `
            <button id="notif-btn" title="Notifications" style="
                position:relative; padding:8px 12px; border-radius:var(--radius-sm);
                background:var(--bg-secondary); border:1px solid var(--glass-border);
                color:var(--text-primary); cursor:pointer; font-size:1.1rem;
                display:flex; align-items:center; transition:all 0.2s;
            ">🔔<span id="notif-badge" style="
                display:none; position:absolute; top:4px; right:4px;
                min-width:16px; height:16px; background:var(--danger); color:#fff;
                border-radius:8px; font-size:0.65rem; font-weight:700;
                display:none; align-items:center; justify-content:center; padding:0 4px;
            ">0</span></button>

            <div id="notif-dropdown" style="
                display:none; position:absolute; top:calc(100% + 8px); right:0;
                width:340px; background:var(--bg-secondary);
                border:1px solid var(--glass-border); border-radius:12px;
                box-shadow:0 20px 40px rgba(0,0,0,0.25); z-index:9999; overflow:hidden;
            ">
                <div style="padding:0.85rem 1rem; border-bottom:1px solid var(--glass-border); display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-weight:700; font-size:0.9rem;">Notifications</span>
                    <button id="notif-refresh" style="background:none; border:none; cursor:pointer; font-size:0.75rem; color:var(--accent-color); padding:2px 6px;">↺ Refresh</button>
                </div>
                <div id="notif-list" style="max-height:360px; overflow-y:auto; padding:0.4rem;"></div>
            </div>
        `;

        this.el = wrapper;
        const btn      = wrapper.querySelector('#notif-btn');
        const dropdown = wrapper.querySelector('#notif-dropdown');
        const badge    = wrapper.querySelector('#notif-badge');
        const list     = wrapper.querySelector('#notif-list');
        const refresh  = wrapper.querySelector('#notif-refresh');

        // Toggle dropdown
        btn.addEventListener('click', e => {
            e.stopPropagation();
            this.open = !this.open;
            dropdown.style.display = this.open ? 'block' : 'none';
            if (this.open) this._loadNotifs(list, badge);
        });

        // Close on outside click
        document.addEventListener('click', () => {
            this.open = false;
            dropdown.style.display = 'none';
        });

        refresh.addEventListener('click', e => {
            e.stopPropagation();
            NotificationService.invalidate();
            this._loadNotifs(list, badge);
        });

        // Initial badge count
        this._loadBadge(badge);

        // Subscribe to updates
        this._unsubscribe = NotificationService.onUpdate(items => {
            this._setBadge(badge, items.length);
        });

        return wrapper;
    }

    async _loadBadge(badge) {
        const items = await NotificationService.getNotifications().catch(() => []);
        this._setBadge(badge, items.length);
    }

    _setBadge(badge, count) {
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }

    async _loadNotifs(list, badge) {
        list.innerHTML = `<div style="padding:1rem; text-align:center; color:var(--text-secondary); font-size:0.85rem;">Loading…</div>`;
        const items = await NotificationService.getNotifications(true).catch(() => []);
        this._setBadge(badge, items.length);

        if (items.length === 0) {
            list.innerHTML = `
                <div style="padding:2rem; text-align:center;">
                    <div style="font-size:2rem; margin-bottom:0.5rem;">✅</div>
                    <p style="color:var(--text-secondary); font-size:0.85rem; margin:0;">All caught up!</p>
                </div>`;
            return;
        }

        const typeColors = { info: 'var(--accent-color)', warning: 'var(--warning)', success: 'var(--success)', error: 'var(--danger)' };
        list.innerHTML = items.map(n => `
            <div class="notif-item" data-route="${n.route}" style="
                display:flex; gap:10px; padding:0.65rem 0.75rem; border-radius:8px;
                cursor:pointer; transition:background 0.15s; margin-bottom:2px;
            " onmouseover="this.style.background='var(--bg-primary)'" onmouseout="this.style.background=''">
                <div style="font-size:1.2rem; flex-shrink:0; line-height:1.4;">${n.icon}</div>
                <div style="flex:1; overflow:hidden;">
                    <div style="font-size:0.85rem; font-weight:600; white-space:nowrap; text-overflow:ellipsis; overflow:hidden;">${n.title}</div>
                    <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:1px;">${n.message}</div>
                    <div style="font-size:0.7rem; color:${typeColors[n.type]||'var(--text-secondary)'}; margin-top:2px;">${NotificationService.timeAgo(n.time)}</div>
                </div>
            </div>
        `).join('');

        list.querySelectorAll('.notif-item').forEach(el => {
            el.addEventListener('click', e => {
                e.stopPropagation();
                if (el.dataset.route) window.location.hash = el.dataset.route;
                this.open = false;
                list.closest('#notif-dropdown').style.display = 'none';
            });
        });
    }

    destroy() {
        if (this._unsubscribe) this._unsubscribe();
    }
}
