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

        // 1. Stats Bar
        const statsBar = document.createElement('div');
        statsBar.style.display = 'grid';
        statsBar.style.gridTemplateColumns = 'repeat(auto-fit, minmax(200px, 1fr))';
        statsBar.style.gap = '1.5rem';
        statsBar.style.marginBottom = '2rem';
        statsBar.id = 'stats-bar';
        container.appendChild(statsBar);

        // 2. Control Bar (Search & Filter)
        const controlBar = document.createElement('div');
        controlBar.className = 'glass-panel';
        controlBar.style.padding = '1rem 1.5rem';
        controlBar.style.marginBottom = '2rem';
        controlBar.style.display = 'flex';
        controlBar.style.gap = '1rem';
        controlBar.style.alignItems = 'center';
        controlBar.style.flexWrap = 'wrap';

        controlBar.innerHTML = `
            <div style="flex: 1; min-width: 250px;">
                <input type="text" id="bookSearch" placeholder="Search by Title, Author or ISBN..." value="${this.searchTerm}">
            </div>
            <div style="width: 200px;">
                <select id="categoryFilter">
                    <option value="All">All Categories</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics</option>
                    <option value="Literature">Literature</option>
                    <option value="History">History</option>
                </select>
            </div>
            ${user.role === 'admin' ? `
                <button class="glass-button" id="addNewBookBtn">+ Add Book</button>
            ` : ''}
        `;
        container.appendChild(controlBar);

        if (user.role === 'admin') {
            /** @type {HTMLElement} */ (controlBar.querySelector('#addNewBookBtn')).onclick = () => {
                window.location.hash = 'library/add';
            };
        }

        // 3. Grid/Table Container
        const listContainer = document.createElement('div');
        listContainer.id = 'book-list-results';
        container.appendChild(listContainer);

        const loadData = async () => {
            listContainer.innerHTML = '<div style="padding: 2rem; text-align: center;">Loading library inventory...</div>';
            try {
                this.allBooks = await ApiService.getBooks();
                this.updateStats(statsBar);
                this.updateList(listContainer, user);
            } catch (err) {
                Toast.error('Failed to load books: ' + err.message);
                listContainer.innerHTML = `<p style="color:red; text-align:center;">Error: ${err.message}</p>`;
            }
        };

        // Events
        const searchInput = /** @type {HTMLInputElement} */ (controlBar.querySelector('#bookSearch'));
        const categoryFilter = /** @type {HTMLSelectElement} */ (controlBar.querySelector('#categoryFilter'));
        categoryFilter.value = this.selectedCategory;

        searchInput.addEventListener('input', (e) => {
            this.searchTerm = /** @type {HTMLInputElement} */ (e.target).value;
            this.updateList(listContainer, user);
        });

        categoryFilter.addEventListener('change', (e) => {
            this.selectedCategory = /** @type {HTMLSelectElement} */ (e.target).value;
            this.updateList(listContainer, user);
        });

        loadData();

        return container;
    }

    updateStats(statsBar) {
        const total = this.allBooks.length;
        const available = this.allBooks.filter(b => b.status === 'Available').length;
        const outOfStock = this.allBooks.filter(b => b.status === 'Out of Stock' || (b.available === 0)).length;

        statsBar.innerHTML = `
            <div class="glass-panel" style="padding: 1.5rem; text-align: center;">
                <div style="font-size: 0.9rem; color: var(--text-secondary);">Total Titles</div>
                <div style="font-size: 2rem; font-weight: bold; color: var(--accent-color);">${total}</div>
            </div>
            <div class="glass-panel" style="padding: 1.5rem; text-align: center;">
                <div style="font-size: 0.9rem; color: var(--text-secondary);">Available</div>
                <div style="font-size: 2rem; font-weight: bold; color: var(--success);">${available}</div>
            </div>
            <div class="glass-panel" style="padding: 1.5rem; text-align: center;">
                <div style="font-size: 0.9rem; color: var(--text-secondary);">Stock Status</div>
                <div style="font-size: 1.5rem; font-weight: bold; color: var(--warning);">${total - outOfStock} In Stock</div>
            </div>
        `;
    }

    updateList(container, user) {
        container.innerHTML = '';

        // Apply Filtering
        let books = this.allBooks.filter(book => {
            const matchesSearch = book.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                book.author.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                (book.isbn && book.isbn.includes(this.searchTerm));
            const matchesCategory = this.selectedCategory === 'All' || book.category === this.selectedCategory;
            return matchesSearch && matchesCategory;
        });

        if (books.length === 0) {
            container.innerHTML = `
                <div class="glass-panel" style="padding: 3rem; text-align: center; color: var(--text-secondary);">
                    <div style="font-size: 2rem; margin-bottom: 1rem;">📚</div>
                    <p>No books found matching your criteria.</p>
                </div>
            `;
            return;
        }

        const table = new Table({
            columns: [
                {
                    key: 'title', label: 'Book Details', render: (val, item) => `
                    <div style="font-weight: 500;">${val}</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">${item.author} | ISBN: ${item.isbn || 'N/A'}</div>
                `},
                { key: 'category', label: 'Category' },
                {
                    key: 'status', label: 'Status', render: (val, item) => {
                        const status = (item.available > 0) ? 'Available' : 'Out of Stock';
                        const color = status === 'Available' ? 'var(--success)' : 'var(--danger)';
                        const bg = status === 'Available' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
                        return `<span style="padding: 4px 12px; background: ${bg}; color: ${color}; border-radius: 12px; font-size: 0.8rem; font-weight: 500;">${status}</span>`;
                    }
                },
                {
                    key: 'available', label: 'Stock', render: (val, item) => `${val} / ${item.quantity}`
                },
                {
                    key: '_id', label: 'Actions', render: (val, item) => {
                        if (user.role !== 'admin') return '-';

                        return `
                            <div style="display: flex; gap: 0.5rem;">
                                <button class="edit-book-btn glass-button" data-id="${val}" style="padding: 4px 12px; font-size: 0.8rem;">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 4px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                    Edit
                                </button>
                            </div>
                        `;
                    }
                }
            ],
            data: books,
            onEdit: null,
            onDelete: user.role === 'admin' ? (id) => {
                const book = books.find(b => b._id === id);
                Modal.confirm('Delete Book Record?', `Are you sure you want to remove ${book?.title || 'this book'} from the library catalog?`, async () => {
                    try {
                        await ApiService.deleteBook(id);
                        window.location.reload();
                        Toast.success('Book record removed.');
                    } catch (err) {
                        Toast.error(err.message);
                    }
                });
            } : null
        });

        const tableNode = table.render();

        tableNode.addEventListener('click', (e) => {
            if (!(e.target instanceof Element)) return;

            const editBtn = e.target.closest('.edit-book-btn');
            if (editBtn) {
                const bookId = /** @type {HTMLElement} */ (editBtn).dataset.id;
                window.location.hash = ROUTES.LIBRARY_EDIT.replace(':id', bookId);
            }
        });

        container.appendChild(tableNode);
    }
}
