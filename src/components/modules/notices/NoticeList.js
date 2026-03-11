import { ApiService } from '../../../services/ApiService.js';
import { auth } from '../../../services/AuthService.js';
import { Toast } from '../../../services/Toast.js';
import { Modal } from '../../../services/Modal.js';
import { ROUTES } from '../../../services/Constants.js';

export class NoticeList {
    constructor() {
        this.selectedCategory = 'All';
    }

    render() {
        const container = document.createElement('div');
        container.className = 'fade-in';
        const user = auth.getUser();

        // 1. Header Section
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'flex-end';
        header.style.marginBottom = '2.5rem';
        header.style.flexWrap = 'wrap';
        header.style.gap = '1.5rem';

        const titleSection = document.createElement('div');
        titleSection.innerHTML = `
            <h2 style="margin: 0;">Notice Board</h2>
            <p style="color: var(--text-secondary); margin: 0.5rem 0 0;">Official announcements and updates</p>
        `;

        const actionSection = document.createElement('div');
        actionSection.style.display = 'flex';
        actionSection.style.gap = '1rem';
        actionSection.style.alignItems = 'center';

        const filterSection = document.createElement('div');
        filterSection.innerHTML = `
            <select id="noticeFilter" class="glass-button" style="text-align: left; padding-right: 2rem;">
                <option value="All">All Categories</option>
                <option value="Academic">Academic</option>
                <option value="Events">Events</option>
                <option value="Administrative">Administrative</option>
                <option value="Holiday">Holiday</option>
            </select>
        `;

        actionSection.appendChild(filterSection);
        if (user.role === 'admin' || user.role === 'teacher') {
            const addBtn = document.createElement('button');
            addBtn.className = 'glass-button';
            addBtn.textContent = '+ Post New Notice';
            addBtn.onclick = () => { window.location.hash = 'notices/add'; };
            actionSection.appendChild(addBtn);
        }

        header.appendChild(titleSection);
        header.appendChild(actionSection);
        container.appendChild(header);

        // Grid Container
        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(320px, 1fr))';
        grid.style.gap = '1.5rem';
        container.appendChild(grid);

        const filter = header.querySelector('#noticeFilter');
        filter.addEventListener('change', (e) => {
            if (e.target instanceof HTMLSelectElement) {
                this.selectedCategory = e.target.value;
                this.renderNotices(grid, user);
            }
        });

        this.renderNotices(grid, user);

        return container;
    }

    async renderNotices(grid, user) {
        grid.innerHTML = '<div style="grid-column: 1 / -1; padding: 4rem; text-align: center;">Loading notices...</div>';

        try {
            const notices = await ApiService.getNotices();
            grid.innerHTML = '';

            const filtered = notices.filter(n =>
                this.selectedCategory === 'All' || n.category === this.selectedCategory
            ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            if (filtered.length === 0) {
                grid.innerHTML = `
                    <div style="grid-column: 1 / -1; padding: 4rem; text-align: center; color: var(--text-secondary);">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">📭</div>
                        <p>No notices found in this category.</p>
                    </div>
                `;
                return;
            }

            filtered.forEach(notice => {
                const card = document.createElement('div');
                card.className = 'glass-panel notice-card';
                card.style.padding = '1.8rem';
                card.style.display = 'flex';
                card.style.flexDirection = 'column';
                card.style.position = 'relative';

                const isImportant = false; // High priority example

                card.innerHTML = `
                    ${isImportant ? `<div style="position: absolute; top: -10px; right: 20px; background: #ef4444; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: bold; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);">IMPORTANT</div>` : ''}
                    
                    <div style="margin-bottom: 1.2rem;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                            <span style="font-size: 0.75rem; font-weight: 600; color: var(--accent-color); text-transform: uppercase;">${notice.category}</span>
                            <span style="font-size: 0.75rem; color: var(--text-secondary);">${this.formatDate(notice.date)}</span>
                        </div>
                        <h3 style="margin: 0 0 0.8rem; line-height: 1.4; color: var(--text-primary);">${notice.title}</h3>
                        <div style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.6; white-space: pre-wrap;">${notice.content}</div>
                    </div>

                    <div style="margin-top: auto; padding-top: 1.2rem; border-top: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <div style="width: 24px; height: 24px; border-radius: 50%; background: var(--accent-color); display: flex; align-items: center; justify-content: center; font-size: 0.7rem; color: white;">
                                ${notice.author?.name ? notice.author.name.charAt(0).toUpperCase() : 'A'}
                            </div>
                            <span style="font-size: 0.8rem; font-weight: 500;">${notice.author?.name || 'Admin'}</span>
                        </div>
                        ${(user.role === 'admin' || (user.role === 'teacher' && notice.author && notice.author._id === user._id)) ? `
                            <div style="display: flex; gap: 0.5rem;">
                                <button class="edit-notice-btn" style="background: transparent; border: none; color: var(--accent-color); opacity: 0.7; cursor: pointer; padding: 4px;">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                </button>
                                <button class="delete-notice-btn" style="background: transparent; border: none; color: #ef4444; opacity: 0.6; cursor: pointer; padding: 4px;">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                </button>
                            </div>
                        ` : ''}
                    </div>
                `;

                const editBtn = card.querySelector('.edit-notice-btn');
                if (editBtn instanceof HTMLElement) {
                    editBtn.onclick = () => {
                        window.location.hash = ROUTES.NOTICES_EDIT.replace(':id', notice._id);
                    };
                }

                const delBtn = card.querySelector('.delete-notice-btn');
                if (delBtn instanceof HTMLElement) {
                    delBtn.onclick = () => {
                        Modal.confirm('Delete Notice?', 'Are you sure you want to permanently remove this announcement?', async () => {
                            try {
                                await ApiService.deleteNotice(notice._id);
                                this.renderNotices(grid, user);
                                Toast.success('Notice removed successfully.');
                            } catch (err) {
                                Toast.error(err.message);
                            }
                        });
                    };
                }

                grid.appendChild(card);
            });
        } catch (err) {
            Toast.error('Failed to load notices: ' + err.message);
            grid.innerHTML = `<p style="padding: 2rem; color: red;">Error connection to notice server.</p>`;
        }
    }

    formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
}
