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
        table.style.backgroundColor = 'var(--bg-secondary)';

        // Header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headerRow.style.background = 'var(--bg-primary)';
        headerRow.style.borderBottom = '1px solid var(--glass-border)';

        this.columns.forEach(col => {
            const th = document.createElement('th');
            th.textContent = col.label;
            th.style.padding = '12px 16px';
            th.style.textAlign = 'left';
            th.style.color = 'var(--text-secondary)';
            th.style.fontWeight = '700';
            th.style.fontSize = '0.75rem';
            th.style.textTransform = 'uppercase';
            th.style.letterSpacing = '0.05em';
            headerRow.appendChild(th);
        });

        if (this.actions) {
            const th = document.createElement('th');
            th.innerHTML = '⚡ Actions';
            th.style.padding = '12px 16px';
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
                <div style="padding: 4rem 2rem; text-align: center;">
                    <div style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;">📂</div>
                    <p style="color: var(--text-secondary); margin: 0; font-size: 1rem; font-weight: 500;">No records found.</p>
                </div>`;
            tr.appendChild(td);
            tbody.appendChild(tr);
        } else {
            this.data.forEach(item => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid var(--glass-border)';
                tr.style.transition = 'all 0.2s ease';

                tr.addEventListener('mouseenter', () => {
                    tr.style.background = 'var(--bg-primary)';
                });
                tr.addEventListener('mouseleave', () => {
                    tr.style.background = 'transparent';
                });

                this.columns.forEach(col => {
                    const td = document.createElement('td');
                    td.style.padding = '14px 16px';
                    td.style.fontSize = '0.9rem';
                    td.style.color = 'var(--text-primary)';
                    td.style.fontWeight = '500';

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
                    td.style.padding = '10px 16px';
                    td.style.textAlign = 'right';

                    const actionContainer = document.createElement('div');
                    actionContainer.style.display = 'flex';
                    actionContainer.style.justifyContent = 'flex-end';
                    actionContainer.style.gap = '8px';

                    if (this.onEdit) {
                        const editBtn = document.createElement('button');
                        editBtn.innerHTML = `
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        `;
                        editBtn.title = 'Edit';
                        editBtn.style.cssText = `
                            padding: 8px;
                            background: var(--bg-secondary);
                            border: 1px solid var(--glass-border);
                            border-radius: 8px;
                            color: var(--text-secondary);
                            cursor: pointer;
                            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            box-shadow: var(--glass-shadow);
                        `;
                        editBtn.onmouseenter = () => { 
                            editBtn.style.color = 'var(--accent-color)'; 
                            editBtn.style.borderColor = 'var(--accent-color)';
                            editBtn.style.transform = 'translateY(-1px)';
                            editBtn.style.boxShadow = 'var(--hover-shadow)';
                        };
                        editBtn.onmouseleave = () => { 
                            editBtn.style.color = 'var(--text-secondary)'; 
                            editBtn.style.borderColor = 'var(--glass-border)';
                            editBtn.style.transform = 'none';
                            editBtn.style.boxShadow = 'var(--glass-shadow)';
                        };
                        const itemId = item?._id || item.id || item;
                        editBtn.onclick = () => this.onEdit(itemId);
                        actionContainer.appendChild(editBtn);
                    }

                    if (this.onDelete) {
                        const deleteBtn = document.createElement('button');
                        deleteBtn.innerHTML = `
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        `;
                        deleteBtn.title = 'Delete';
                        deleteBtn.style.cssText = `
                            padding: 8px;
                            background: rgba(239, 68, 68, 0.05);
                            border: 1px solid rgba(239, 68, 68, 0.2);
                            border-radius: 8px;
                            color: var(--danger);
                            cursor: pointer;
                            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        `;
                        deleteBtn.onmouseenter = () => { 
                            deleteBtn.style.background = 'var(--danger)'; 
                            deleteBtn.style.color = 'white';
                            deleteBtn.style.transform = 'translateY(-1px)';
                        };
                        deleteBtn.onmouseleave = () => { 
                            deleteBtn.style.background = 'rgba(239, 68, 68, 0.05)'; 
                            deleteBtn.style.color = 'var(--danger)';
                            deleteBtn.style.transform = 'none';
                        };
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
