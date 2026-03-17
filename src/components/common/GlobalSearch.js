import { ApiService } from '../../services/ApiService.js';
import { ROUTES } from '../../services/Constants.js';

export class GlobalSearch {
    constructor() {
        this.overlay   = null;
        this.results   = null;
        this.inputEl   = null;
        this._debounce = null;
        this._keyListener = null;
    }

    mount() {
        if (document.getElementById('global-search-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'global-search-overlay';
        overlay.style.cssText = `
            position: fixed; inset: 0; z-index: 99999;
            background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
            display: flex; align-items: flex-start; justify-content: center;
            padding-top: 8vh; opacity: 0; transition: opacity 0.2s ease;
        `;

        overlay.innerHTML = `
            <div id="gs-panel" style="
                width: 100%; max-width: 640px; margin: 0 1rem;
                background: var(--bg-secondary); border: 1px solid var(--glass-border);
                border-radius: 16px; box-shadow: 0 25px 50px rgba(0,0,0,0.4);
                overflow: hidden; transform: translateY(-10px); transition: transform 0.2s ease;
            ">
                <div style="display: flex; align-items: center; gap: 12px; padding: 1rem 1.25rem; border-bottom: 1px solid var(--glass-border);">
                    <span style="font-size: 1.1rem; opacity: 0.5;">🔍</span>
                    <input id="gs-input" type="text" placeholder="Search students, subjects, faculty, notices…"
                        style="flex:1; border:none; outline:none; background:transparent; font-size:1rem; color:var(--text-primary); font-family:var(--font-body);">
                    <kbd style="padding:3px 8px; background:var(--bg-primary); border:1px solid var(--glass-border); border-radius:6px; font-size:0.7rem; color:var(--text-secondary);">ESC</kbd>
                </div>
                <div id="gs-results" style="max-height: 420px; overflow-y: auto; padding: 0.5rem;"></div>
                <div style="padding: 0.5rem 1rem; border-top: 1px solid var(--glass-border); display:flex; gap:1rem; font-size:0.72rem; color:var(--text-secondary);">
                    <span>↵ to navigate</span><span>↑↓ to move</span><span>ESC to close</span>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        this.overlay  = overlay;
        this.inputEl  = overlay.querySelector('#gs-input');
        this.results  = overlay.querySelector('#gs-results');

        // Animate in
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
            overlay.querySelector('#gs-panel').style.transform = 'translateY(0)';
        });

        // Close on backdrop click
        overlay.addEventListener('click', e => { if (e.target === overlay) this.close(); });

        // Key handling
        this._keyListener = e => {
            if (e.key === 'Escape') this.close();
        };
        document.addEventListener('keydown', this._keyListener);

        this.inputEl.addEventListener('input', () => {
            clearTimeout(this._debounce);
            this._debounce = setTimeout(() => this._search(this.inputEl.value.trim()), 300);
        });

        this.inputEl.focus();
        this._showEmpty();
    }

    _showEmpty() {
        this.results.innerHTML = `
            <div style="padding:2rem; text-align:center; color:var(--text-secondary); font-size:0.9rem;">
                <div style="font-size:2rem; margin-bottom:0.5rem;">🔎</div>
                Type at least 2 characters to search across the entire system.
            </div>`;
    }

    async _search(q) {
        if (q.length < 2) { this._showEmpty(); return; }
        this.results.innerHTML = `<div style="padding:1.5rem; text-align:center; color:var(--text-secondary);">Searching…</div>`;

        try {
            const data = await ApiService.globalSearch(q);
            this._render(data, q);
        } catch (e) {
            this.results.innerHTML = `<div style="padding:1rem; color:var(--danger); font-size:0.85rem;">Search failed. Is the server running?</div>`;
        }
    }

    _render(data, q) {
        const total = (data.students?.length||0) + (data.faculty?.length||0) + (data.subjects?.length||0) + (data.notices?.length||0) + (data.courses?.length||0);
        if (total === 0) {
            this.results.innerHTML = `<div style="padding:2rem; text-align:center; color:var(--text-secondary);">No results found for "<strong>${q}</strong>"</div>`;
            return;
        }

        const hl = text => {
            const safe = String(text || '');
            return safe.replace(new RegExp(`(${q})`, 'gi'), `<mark style="background:rgba(99,102,241,0.2);color:var(--accent-color);border-radius:3px;padding:0 2px;">$1</mark>`);
        };

        const section = (icon, title, items, mapFn) => {
            if (!items?.length) return '';
            return `
                <div style="padding:0.5rem 0.75rem; font-size:0.7rem; font-weight:700; text-transform:uppercase; color:var(--text-secondary); letter-spacing:.05em;">${icon} ${title}</div>
                ${items.map(mapFn).join('')}
            `;
        };

        const row = (label, sub, route, badge='') => `
            <div class="gs-row" data-route="${route}" style="
                display:flex; align-items:center; gap:12px; padding:0.6rem 0.75rem;
                border-radius:8px; cursor:pointer; transition:background 0.15s;
            " onmouseover="this.style.background='var(--bg-primary)'" onmouseout="this.style.background=''">
                <div style="flex:1; overflow:hidden;">
                    <div style="font-size:0.9rem; font-weight:600; white-space:nowrap; text-overflow:ellipsis; overflow:hidden;">${label}</div>
                    <div style="font-size:0.75rem; color:var(--text-secondary);">${sub}</div>
                </div>
                ${badge ? `<span style="font-size:0.7rem; padding:2px 8px; background:var(--accent-glow); color:var(--accent-color); border-radius:12px; white-space:nowrap;">${badge}</span>` : ''}
            </div>`;

        this.results.innerHTML =
            section('👨‍🎓', 'Students', data.students, s =>
                row(hl(s.name), `${s.rollNo} · ${s.course} Sem ${s.semester}`, `${ROUTES.STUDENTS_LIST}`, s.email))
            + section('👨‍🏫', 'Faculty', data.faculty, f =>
                row(hl(f.name), `${f.department} · ${f.designation}`, ROUTES.FACULTY_LIST))
            + section('📖', 'Subjects', data.subjects, s =>
                row(hl(s.name), `${s.code} · ${s.course || 'General'}`, ROUTES.SUBJECTS_LIST, s.type))
            + section('📢', 'Notices', data.notices, n =>
                row(hl(n.title), n.category || 'General', ROUTES.NOTICES))
            + section('📚', 'Courses', data.courses, c =>
                row(hl(c.name), c.code || '', ROUTES.COURSES_LIST));

        // Attach click events
        this.results.querySelectorAll('.gs-row').forEach(el => {
            el.addEventListener('click', () => {
                window.location.hash = el.dataset.route;
                this.close();
            });
        });
    }

    close() {
        if (!this.overlay) return;
        this.overlay.style.opacity = '0';
        document.removeEventListener('keydown', this._keyListener);
        setTimeout(() => {
            this.overlay.remove();
            this.overlay = null;
        }, 200);
    }
}

export const globalSearch = new GlobalSearch();
