/**
 * Enhanced Table Component
 * - Column sorting (click header to toggle asc/desc)
 * - Client-side text search filter
 * - Pagination
 * - All original edit/delete actions preserved
 */
export class Table {
    constructor({ columns, data, onEdit = null, onDelete = null, actions = true,
                  pageSize = 15, searchable = true, extraActions = null }) {
        this.columns      = columns;
        this._allData     = data;
        this._filtered    = [...data];
        this.onEdit       = onEdit;
        this.onDelete     = onDelete;
        this.actions      = actions;
        this.extraActions = extraActions;  // fn(item) => HTML string with buttons
        this.pageSize     = pageSize;
        this.searchable   = searchable;
        this._page        = 1;
        this._sortCol     = null;
        this._sortDir     = 'asc';
        this._query       = '';
        this._container   = null;
    }

    // Public: update data after initial render
    setData(newData) {
        this._allData   = newData;
        this._page      = 1;
        this._applyFilters();
        if (this._container) this._rerenderBody();
    }

    render() {
        const wrap = document.createElement('div');
        wrap.className = 'enhanced-table-wrap';
        this._container = wrap;

        // ── Search bar ─────────────────────────────────────────────────────
        if (this.searchable) {
            const bar = document.createElement('div');
            bar.style.cssText = 'display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem;flex-wrap:wrap;';
            bar.innerHTML = `
                <div style="position:relative;flex:1;min-width:200px;">
                    <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text-secondary);pointer-events:none;">🔍</span>
                    <input id="tbl-search" type="text" placeholder="Filter records…" value="${this._query}"
                        style="width:100%;padding:8px 12px 8px 34px;border-radius:var(--radius-sm);
                               border:1px solid var(--glass-border);background:var(--bg-secondary);
                               color:var(--text-primary);font-size:0.875rem;outline:none;transition:border 0.2s;">
                </div>
                <span id="tbl-count" style="font-size:0.8rem;color:var(--text-secondary);white-space:nowrap;"></span>
            `;
            wrap.appendChild(bar);

            const input = bar.querySelector('#tbl-search');
            input.addEventListener('input', e => {
                this._query = e.target.value.trim().toLowerCase();
                this._page  = 1;
                this._applyFilters();
                this._rerenderBody();
            });
            input.addEventListener('focus',  () => input.style.borderColor = 'var(--accent-color)');
            input.addEventListener('blur',   () => input.style.borderColor = 'var(--glass-border)');
        }

        // ── Table ──────────────────────────────────────────────────────────
        const tableWrap = document.createElement('div');
        tableWrap.style.overflowX = 'auto';

        const table = document.createElement('table');
        table.style.cssText = 'width:100%;border-collapse:collapse;min-width:600px;background:var(--bg-secondary);';
        table.innerHTML = this._buildHead();
        table.appendChild(this._buildBody());
        tableWrap.appendChild(table);
        wrap.appendChild(tableWrap);

        // ── Pagination ─────────────────────────────────────────────────────
        const pager = document.createElement('div');
        pager.id    = 'tbl-pager';
        pager.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:0.75rem 0;font-size:0.82rem;color:var(--text-secondary);flex-wrap:wrap;gap:0.5rem;';
        wrap.appendChild(pager);
        this._updatePager();

        // Sort header click
        wrap.querySelectorAll('th[data-col]').forEach(th => {
            th.addEventListener('click', () => {
                const col = th.dataset.col;
                if (this._sortCol === col) {
                    this._sortDir = this._sortDir === 'asc' ? 'desc' : 'asc';
                } else {
                    this._sortCol = col;
                    this._sortDir = 'asc';
                }
                this._applyFilters();
                // Update header indicators
                wrap.querySelectorAll('th[data-col]').forEach(h => {
                    h.querySelector('.sort-icon').textContent =
                        h.dataset.col === this._sortCol ? (this._sortDir === 'asc' ? ' ↑' : ' ↓') : ' ⇅';
                });
                this._rerenderBody();
            });
        });

        return wrap;
    }

    // ── Private helpers ────────────────────────────────────────────────────

    _applyFilters() {
        let data = [...this._allData];

        if (this._query) {
            const q = this._query;
            data = data.filter(item =>
                this.columns.some(col => {
                    const val = item[col.key];
                    return val !== null && val !== undefined &&
                           String(val).toLowerCase().includes(q);
                })
            );
        }

        if (this._sortCol) {
            const dir = this._sortDir === 'asc' ? 1 : -1;
            data.sort((a, b) => {
                const av = a[this._sortCol] ?? '';
                const bv = b[this._sortCol] ?? '';
                if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
                return String(av).localeCompare(String(bv)) * dir;
            });
        }

        this._filtered = data;
        this._updateCount();
    }

    _buildHead() {
        const colsHtml = this.columns.map(col => `
            <th data-col="${col.key}" style="
                padding:11px 14px;text-align:left;color:var(--text-secondary);
                font-weight:700;font-size:0.72rem;text-transform:uppercase;
                letter-spacing:.05em;background:var(--bg-primary);
                border-bottom:2px solid var(--glass-border);
                cursor:pointer;user-select:none;white-space:nowrap;transition:color 0.15s;
            " title="Sort by ${col.label}">
                ${col.label}<span class="sort-icon" style="color:var(--text-secondary);font-size:0.65rem;"> ⇅</span>
            </th>`).join('');

        const actHtml = (this.actions && (this.onEdit || this.onDelete || this.extraActions)) ? `
            <th style="padding:11px 14px;text-align:right;color:var(--text-secondary);
                font-weight:700;font-size:0.72rem;text-transform:uppercase;
                letter-spacing:.05em;background:var(--bg-primary);
                border-bottom:2px solid var(--glass-border);">Actions</th>` : '';

        return `<thead><tr>${colsHtml}${actHtml}</tr></thead>`;
    }

    _buildBody() {
        const tbody = document.createElement('tbody');
        tbody.id    = 'tbl-body';
        const start = (this._page - 1) * this.pageSize;
        const page  = this._filtered.slice(start, start + this.pageSize);

        if (page.length === 0) {
            const tr = tbody.insertRow();
            const td = tr.insertCell();
            td.colSpan = this.columns.length + ((this.actions && (this.onEdit||this.onDelete||this.extraActions)) ? 1 : 0);
            td.innerHTML = `<div style="padding:3.5rem 2rem;text-align:center;">
                <div style="font-size:2.5rem;margin-bottom:0.75rem;opacity:.4;">📂</div>
                <p style="color:var(--text-secondary);margin:0;font-size:0.95rem;">
                    ${this._query ? `No results for "<strong>${this._query}</strong>"` : 'No records found.'}
                </p>
            </div>`;
            return tbody;
        }

        page.forEach(item => {
            const tr = tbody.insertRow();
            tr.style.cssText = 'border-bottom:1px solid var(--glass-border);transition:background 0.15s;';
            tr.addEventListener('mouseenter', () => tr.style.background = 'var(--bg-primary)');
            tr.addEventListener('mouseleave', () => tr.style.background = '');

            this.columns.forEach(col => {
                const td = tr.insertCell();
                td.style.cssText = 'padding:13px 14px;font-size:0.875rem;color:var(--text-primary);';
                if (col.render) {
                    td.innerHTML = col.render(item[col.key], item);
                } else {
                    const val = item[col.key];
                    td.textContent = (val !== undefined && val !== null && val !== '') ? val : '—';
                }
            });

            if (this.actions && (this.onEdit || this.onDelete || this.extraActions)) {
                const td   = tr.insertCell();
                td.style.cssText = 'padding:10px 14px;text-align:right;';
                const row  = document.createElement('div');
                row.style.cssText = 'display:flex;justify-content:flex-end;align-items:center;gap:6px;';
                const id   = item?._id || item?.id || item;

                if (this.extraActions) {
                    const temp = document.createElement('div');
                    temp.innerHTML = this.extraActions(item);
                    while (temp.firstChild) row.appendChild(temp.firstChild);
                }

                if (this.onEdit) {
                    const btn = this._iconBtn('edit', id, 'var(--accent-color)');
                    btn.addEventListener('click', () => this.onEdit(id));
                    row.appendChild(btn);
                }
                if (this.onDelete) {
                    const btn = this._iconBtn('delete', id, 'var(--danger)');
                    btn.addEventListener('click', () => this.onDelete(id));
                    row.appendChild(btn);
                }
                td.appendChild(row);
            }
        });

        return tbody;
    }

    _iconBtn(type, id, accentColor) {
        const btn = document.createElement('button');
        btn.title = type === 'edit' ? 'Edit' : 'Delete';
        const isBgRed = type === 'delete';
        btn.style.cssText = `
            padding:7px;border-radius:7px;cursor:pointer;
            background:${isBgRed ? 'rgba(239,68,68,0.07)' : 'var(--bg-secondary)'};
            border:1px solid ${isBgRed ? 'rgba(239,68,68,0.2)' : 'var(--glass-border)'};
            color:${accentColor};display:flex;align-items:center;transition:all 0.15s;
        `;
        btn.innerHTML = type === 'edit'
            ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`
            : `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>`;
        btn.addEventListener('mouseenter', () => {
            btn.style.background = isBgRed ? 'var(--danger)' : accentColor;
            btn.style.color = '#fff';
            btn.style.borderColor = 'transparent';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.background = isBgRed ? 'rgba(239,68,68,0.07)' : 'var(--bg-secondary)';
            btn.style.color = accentColor;
            btn.style.borderColor = isBgRed ? 'rgba(239,68,68,0.2)' : 'var(--glass-border)';
        });
        return btn;
    }

    _rerenderBody() {
        if (!this._container) return;
        const old = this._container.querySelector('#tbl-body');
        if (old) old.replaceWith(this._buildBody());
        this._updatePager();
    }

    _updateCount() {
        const el = this._container?.querySelector('#tbl-count');
        if (el) el.textContent = `${this._filtered.length} of ${this._allData.length} records`;
    }

    _updatePager() {
        const pager = this._container?.querySelector('#tbl-pager');
        if (!pager) return;
        const total = this._filtered.length;
        const pages = Math.max(1, Math.ceil(total / this.pageSize));
        const start = Math.min((this._page - 1) * this.pageSize + 1, total);
        const end   = Math.min(this._page * this.pageSize, total);
        this._updateCount();

        if (pages <= 1) { pager.innerHTML = ''; return; }

        pager.innerHTML = `
            <span>Showing ${start}–${end} of ${total}</span>
            <div style="display:flex;gap:4px;align-items:center;">
                <button id="pg-first" style="${this._pgBtnStyle()}" ${this._page===1?'disabled':''} title="First">«</button>
                <button id="pg-prev"  style="${this._pgBtnStyle()}" ${this._page===1?'disabled':''} title="Previous">‹</button>
                <span style="padding:0 8px;font-size:0.82rem;">${this._page} / ${pages}</span>
                <button id="pg-next"  style="${this._pgBtnStyle()}" ${this._page===pages?'disabled':''} title="Next">›</button>
                <button id="pg-last"  style="${this._pgBtnStyle()}" ${this._page===pages?'disabled':''} title="Last">»</button>
            </div>`;

        pager.querySelector('#pg-first').addEventListener('click', () => { this._page = 1;     this._rerenderBody(); });
        pager.querySelector('#pg-prev' ).addEventListener('click', () => { this._page--;        this._rerenderBody(); });
        pager.querySelector('#pg-next' ).addEventListener('click', () => { this._page++;        this._rerenderBody(); });
        pager.querySelector('#pg-last' ).addEventListener('click', () => { this._page = pages; this._rerenderBody(); });
    }

    _pgBtnStyle() {
        return `padding:4px 10px;border-radius:6px;border:1px solid var(--glass-border);
                background:var(--bg-secondary);color:var(--text-primary);cursor:pointer;font-size:0.82rem;
                transition:all 0.15s;`;
    }
}
