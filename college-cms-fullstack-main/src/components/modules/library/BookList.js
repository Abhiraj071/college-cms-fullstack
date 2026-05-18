import { ApiService } from '../../../services/ApiService.js';
import { Table } from '../../common/Table.js';
import { auth } from '../../../services/AuthService.js';
import { Toast } from '../../../services/Toast.js';
import { Modal } from '../../../services/Modal.js';
import { ROUTES } from '../../../services/Constants.js';

export class BookList {
    constructor() {
        this.searchTerm = '';
        this.selectedCategory = 'All';
        this.allBooks = [];
    }

    render() {
        const container = document.createElement('div');
        container.className = 'fade-in';
        const user = auth.getUser();
        const isAdmin = user.role === 'admin';

        // Header Section
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'flex-end';
        header.style.marginBottom = '2.5rem';
        header.style.flexWrap = 'wrap';
        header.style.gap = '1.5rem';

        const titleSection = document.createElement('div');
        titleSection.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 0.5rem;">
                <span style="font-size: 2rem;">📚</span>
                <h2 style="font-size: 2rem; margin: 0; letter-spacing: -1px;">Digital Library</h2>
            </div>
            <p style="color: var(--text-secondary); font-size: 1rem; font-weight: 500;">Explore the academic repository and manage resource inventory.</p>
        `;

        if (isAdmin) {
            const addBtn = document.createElement('button');
            addBtn.className = 'glass-button';
            addBtn.style.background = 'var(--accent-color)';
            addBtn.style.color = 'white';
            addBtn.style.border = 'none';
            addBtn.style.padding = '10px 24px';
            addBtn.style.fontWeight = '700';
            addBtn.textContent = '➕ Add Asset';
            addBtn.onclick = () => { window.location.hash = ROUTES.LIBRARY_ADD; };
            header.appendChild(titleSection);
            header.appendChild(addBtn);
        } else {
            header.appendChild(titleSection);
        }
        container.appendChild(header);

        // Stats Bar
        const statsBar = document.createElement('div');
        statsBar.style.display = 'grid';
        statsBar.style.gridTemplateColumns = 'repeat(auto-fit, minmax(200px, 1fr))';
        statsBar.style.gap = '1.5rem';
        statsBar.style.marginBottom = '2rem';
        statsBar.id = 'stats-bar';
        container.appendChild(statsBar);

        // Control Bar
        const filterBar = document.createElement('div');
        filterBar.className = 'glass-panel';
        filterBar.style.padding = '1rem';
        filterBar.style.marginBottom = '2rem';
        filterBar.style.display = 'flex';
        filterBar.style.gap = '1rem';
        filterBar.style.alignItems = 'center';
        filterBar.style.flexWrap = 'wrap';
        filterBar.style.background = 'var(--bg-secondary)';

        filterBar.innerHTML = `
            <div style="flex: 1; min-width: 250px;">
                <label style="font-size: 0.7rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; display: block;">Search Catalog</label>
                <input type="text" id="bookSearch" placeholder="Filter by title, author or ISBN..." value="${this.searchTerm}">
            </div>
            <div style="width: 220px;">
                <label style="font-size: 0.7rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; display: block;">Narrow by Discipline</label>
                <select id="categoryFilter">
                    <option value="All">All Disciplines</option>
                    <option value="Computer Science">💻 Computer Science</option>
                    <option value="Mathematics">🔢 Mathematics</option>
                    <option value="Physics">⚛️ Physics</option>
                    <option value="Literature">📖 Literature</option>
                    <option value="History">🏛️ History</option>
                </select>
            </div>
        `;
        container.appendChild(filterBar);

        const listContainer = document.createElement('div');
        listContainer.id = 'book-list-results';
        container.appendChild(listContainer);

        const loadData = async () => {
            listContainer.innerHTML = `
                <div style="padding: 5rem; text-align: center;">
                    <div class="loader-spinner" style="width: 40px; height: 40px; border: 4px solid var(--accent-glow); border-top-color: var(--accent-color); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1.5rem;"></div>
                    <p style="color: var(--text-secondary); font-weight: 500;">Indexing library vault...</p>
                </div>
            `;
            try {
                this.allBooks = await ApiService.getBooks();
                this.updateStats(statsBar);
                this.updateList(listContainer, user);
            } catch (err) { Toast.error('Sync Error'); }
        };

        const searchIn = filterBar.querySelector('#bookSearch');
        const catFil = filterBar.querySelector('#categoryFilter');
        catFil.value = this.selectedCategory;
        searchIn.oninput = (e) => { this.searchTerm = e.target.value; this.updateList(listContainer, user); };
        catFil.onchange = (e) => { this.selectedCategory = e.target.value; this.updateList(listContainer, user); };

        loadData();
        return container;
    }

    updateStats(bar) {
        const t = this.allBooks.length;
        const a = this.allBooks.filter(b => b.available > 0).length;
        bar.innerHTML = `
            <div class="glass-panel" style="padding: 1.5rem; text-align: center; border: 1px solid var(--glass-border);">
                <div style="font-size: 0.7rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 8px;">Total Assets</div>
                <div style="font-size: 2rem; font-weight: 800; color: var(--accent-color);">${t}</div>
            </div>
            <div class="glass-panel" style="padding: 1.5rem; text-align: center; border: 1px solid var(--glass-border);">
                <div style="font-size: 0.7rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 8px;">Instock Circulation</div>
                <div style="font-size: 2rem; font-weight: 800; color: var(--success);">${a}</div>
            </div>
            <div class="glass-panel" style="padding: 1.5rem; text-align: center; border: 1px solid var(--glass-border);">
                <div style="font-size: 0.7rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 8px;">Current Outflow</div>
                <div style="font-size: 2rem; font-weight: 800; color: var(--warning);">${t - a}</div>
            </div>
        `;
    }

    updateList(container, user) {
        container.innerHTML = '';
        let filtered = this.allBooks.filter(b => {
            const mS = b.title.toLowerCase().includes(this.searchTerm.toLowerCase()) || b.author.toLowerCase().includes(this.searchTerm.toLowerCase()) || (b.isbn && b.isbn.includes(this.searchTerm));
            const mC = this.selectedCategory === 'All' || b.category === this.selectedCategory;
            return mS && mC;
        });

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="glass-panel" style="padding: 5rem 2rem; text-align: center; border: 1px dashed var(--glass-border); border-radius: 16px;">
                    <div style="font-size: 3rem; margin-bottom: 1.5rem; opacity: 0.2;">📚</div>
                    <h3 style="opacity: 0.6;">Repository Empty</h3>
                    <p style="color: var(--text-secondary); max-width: 320px; margin: 0 auto;">No assets found matching the current search parameters.</p>
                </div>
            `;
            return;
        }

        const table = new Table({
            columns: [
                { key: 'title', label: 'Inventory Identity', render: (v, item) => `<div><div style="font-weight: 800; color: var(--text-primary); font-size: 0.95rem;">${v}</div><div style="font-size: 0.7rem; color: var(--text-secondary); font-weight: 700;">${item.author} • ISBN: ${item.isbn || '---'}</div></div>` },
                { key: 'category', label: 'Discipline', render: (v) => `<span style="font-weight: 700; color: var(--text-secondary); font-size: 0.85rem;">${v}</span>` },
                { key: 'status', label: 'Status', render: (v, item) => {
                    const instock = item.available > 0;
                    return `<span style="padding: 4px 10px; background: ${instock ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; border-radius: 20px; font-size: 0.7rem; font-weight: 800; color: ${instock ? 'var(--success)' : 'var(--danger)'}; text-transform: uppercase;">${instock ? 'Instock' : 'Borrowed'}</span>`;
                }},
                { key: 'available', label: 'Stock Distribution', render: (v, item) => `<div style="display: flex; align-items: center; gap: 8px;"><div style="width: 60px; height: 6px; background: rgba(0,0,0,0.05); border-radius: 10px; overflow: hidden;"><div style="width: ${(v/item.quantity)*100}%; height: 100%; background: var(--accent-color);"></div></div><span style="font-size: 0.75rem; font-weight: 800; opacity: 0.7;">${v}/${item.quantity}</span></div>` }
            ],
            data: filtered,
            onEdit: user.role !== 'admin' ? null : (id) => window.location.hash = ROUTES.LIBRARY_EDIT.replace(':id', id),
            onDelete: user.role !== 'admin' ? null : (id) => {
                const b = filtered.find(x => x._id === id);
                Modal.confirm('Purge Asset?', `Remove ${b?.title} from the library catalog permanently?`, async () => {
                    try { await ApiService.deleteBook(id); this.allBooks = this.allBooks.filter(x => x._id !== id); this.updateStats(document.getElementById('stats-bar')); this.updateList(container, user); Toast.success('Asset Purged'); }
                    catch (err) { Toast.error(err.message); }
                });
            }
        });
        container.appendChild(table.render());
    }
}
