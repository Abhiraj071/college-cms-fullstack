export class Table {
    constructor({ columns, data, onEdit = null, onDelete = null, actions = true }) {
        this.columns = columns; // [{ key, label, render? }]
        this.data = data;
        this.onEdit = onEdit;
        this.onDelete = onDelete;
        this.actions = actions;
    }

    render() {
        const tableContainer = document.createElement('div');
        tableContainer.style.overflowX = 'auto';
        tableContainer.className = 'fade-in';

        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.minWidth = '700px';

        // Header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headerRow.style.background = 'rgba(0,0,0,0.015)';
        headerRow.style.borderBottom = '1.5px solid var(--glass-border)';

        this.columns.forEach(col => {
            const th = document.createElement('th');
            th.textContent = col.label;
            th.style.padding = '1rem 1.25rem';
            th.style.textAlign = 'left';
            th.style.color = 'var(--text-secondary)';
            th.style.fontWeight = '700';
            th.style.fontSize = '0.75rem';
            th.style.textTransform = 'uppercase';
            th.style.letterSpacing = '0.04em';
            headerRow.appendChild(th);
        });

        if (this.actions) {
            const th = document.createElement('th');
            th.textContent = 'Action';
            th.style.padding = '1rem 1.25rem';
            th.style.textAlign = 'right';
            th.style.color = 'var(--text-secondary)';
            th.style.fontWeight = '700';
            th.style.fontSize = '0.75rem';
            th.style.textTransform = 'uppercase';
            headerRow.appendChild(th);
        }

        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Body
        const tbody = document.createElement('tbody');

        if (this.data.length === 0) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = this.columns.length + (this.actions ? 1 : 0);
            td.innerHTML = `
                <div style="padding: 3rem; text-align: center;">
                    <p style="color: var(--text-secondary); margin: 0; font-size: 0.9rem;">No matching records found.</p>
                </div>`;
            tr.appendChild(td);
            tbody.appendChild(tr);
        } else {
            this.data.forEach(item => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid var(--glass-border)';
                tr.style.transition = 'background 0.2s ease';

                tr.addEventListener('mouseenter', () => {
                    tr.style.background = 'rgba(99, 102, 241, 0.015)';
                });
                tr.addEventListener('mouseleave', () => {
                    tr.style.background = 'transparent';
                });

                this.columns.forEach(col => {
                    const td = document.createElement('td');
                    td.style.padding = '1rem 1.25rem';
                    td.style.fontSize = '0.9rem';
                    td.style.color = 'var(--text-primary)';

                    if (col.render) {
                        td.innerHTML = col.render(item[col.key], item);
                    } else {
                        const val = item[col.key];
                        td.textContent = (val !== undefined && val !== null) ? val : '-';
                    }
                    tr.appendChild(td);
                });

                if (this.actions) {
                    const td = document.createElement('td');
                    td.style.padding = '0.75rem 1.25rem';
                    td.style.textAlign = 'right';

                    const actionContainer = document.createElement('div');
                    actionContainer.style.display = 'flex';
                    actionContainer.style.justifyContent = 'flex-end';
                    actionContainer.style.gap = '0.5rem';

                    if (this.onEdit) {
                        const editBtn = document.createElement('button');
                        editBtn.innerHTML = `
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        `;
                        editBtn.title = 'Edit';
                        editBtn.style.cssText = `
                            padding: 6px;
                            background: var(--bg-primary);
                            border: 1px solid var(--glass-border);
                            border-radius: 6px;
                            color: var(--text-secondary);
                            cursor: pointer;
                            transition: all 0.2s;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        `;
                        editBtn.onmouseenter = () => { editBtn.style.color = 'var(--accent-color)'; editBtn.style.borderColor = 'var(--accent-color)'; editBtn.style.background = 'white'; };
                        editBtn.onmouseleave = () => { editBtn.style.color = 'var(--text-secondary)'; editBtn.style.borderColor = 'var(--glass-border)'; editBtn.style.background = 'var(--bg-primary)'; };
                        const itemId = item?._id || item.id || item;
                        editBtn.onclick = () => this.onEdit(itemId);
                        actionContainer.appendChild(editBtn);
                    }

                    if (this.onDelete) {
                        const deleteBtn = document.createElement('button');
                        deleteBtn.innerHTML = `
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        `;
                        deleteBtn.title = 'Delete';
                        deleteBtn.style.cssText = `
                            padding: 6px;
                            background: rgba(239, 68, 68, 0.03);
                            border: 1px solid rgba(239, 68, 68, 0.1);
                            border-radius: 6px;
                            color: var(--danger);
                            cursor: pointer;
                            transition: all 0.2s;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        `;
                        deleteBtn.onmouseenter = () => { deleteBtn.style.background = 'var(--danger)'; deleteBtn.style.color = 'white'; };
                        deleteBtn.onmouseleave = () => { deleteBtn.style.background = 'rgba(239, 68, 68, 0.03)'; deleteBtn.style.color = 'var(--danger)'; };
                        const itemId = item?._id || item.id || item;
                        deleteBtn.onclick = () => this.onDelete(itemId);
                        actionContainer.appendChild(deleteBtn);
                    }

                    td.appendChild(actionContainer);
                    tr.appendChild(td);
                }

                tbody.appendChild(tr);
            });
        }

        table.appendChild(tbody);
        tableContainer.appendChild(table);
        return tableContainer;
    }
}
