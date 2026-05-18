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
                <span style="font-size: 2rem;">📢</span>
                <h2 style="font-size: 2rem; margin: 0; letter-spacing: -1px;">Notice Board</h2>
            </div>
            <p style="color: var(--text-secondary); font-size: 1rem; font-weight: 500;">Stay updated with official college announcements and events.</p>
        `;

        const actionSection = document.createElement('div');
        actionSection.style.display = 'flex';
        actionSection.style.gap = '1rem';
        actionSection.style.alignItems = 'center';

        const filterSection = document.createElement('div');
        filterSection.innerHTML = `
            <select id="noticeFilter" style="min-width: 180px;">
                <option value="All">All Categories</option>
                <option value="Academic">📚 Academic</option>
                <option value="Events">🎉 Events</option>
                <option value="Administrative">🛡️ Administrative</option>
                <option value="Holiday">🏖️ Holiday</option>
            </select>
        `;

        actionSection.appendChild(filterSection);
        if (user.role === 'admin' || user.role === 'teacher') {
            const addBtn = document.createElement('button');
            addBtn.className = 'glass-button';
            addBtn.style.background = 'var(--accent-color)';
            addBtn.style.color = 'white';
            addBtn.style.border = 'none';
            addBtn.style.padding = '10px 24px';
            addBtn.style.fontWeight = '700';
            addBtn.textContent = '➕ Post Notice';
            addBtn.onclick = () => { window.location.hash = ROUTES.NOTICES_ADD; };
            actionSection.appendChild(addBtn);
        }

        header.appendChild(titleSection);
        header.appendChild(actionSection);
        container.appendChild(header);

        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(340px, 1fr))';
        grid.style.gap = '1.5rem';
        container.appendChild(grid);

        const filter = filterSection.querySelector('#noticeFilter');
        filter.onchange = (e) => {
            this.selectedCategory = e.target.value;
            this.renderNotices(grid, user);
        };

        this.renderNotices(grid, user);
        return container;
    }

    async renderNotices(grid, user) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; padding: 5rem; text-align: center;">
                <div class="loader-spinner" style="width: 40px; height: 40px; border: 4px solid var(--accent-glow); border-top-color: var(--accent-color); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1.5rem;"></div>
                <p style="color: var(--text-secondary); font-weight: 500;">Fetching latest updates...</p>
            </div>
        `;

        try {
            const notices = await ApiService.getNotices();
            grid.innerHTML = '';
            const filtered = notices.filter(n => this.selectedCategory === 'All' || n.category === this.selectedCategory)
                                    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            if (filtered.length === 0) {
                grid.innerHTML = `
                    <div style="grid-column: 1/-1; padding: 5rem 2rem; text-align: center; border: 1px dashed var(--glass-border); border-radius: 16px;">
                        <div style="font-size: 3rem; margin-bottom: 1.5rem; opacity: 0.2;">📭</div>
                        <h3 style="opacity: 0.6;">Notice Board Empty</h3>
                        <p style="color: var(--text-secondary); max-width: 320px; margin: 0 auto;">No announcements were found in the <strong>${this.selectedCategory}</strong> category.</p>
                    </div>
                `;
                return;
            }

            filtered.forEach(notice => {
                const card = document.createElement('div');
                card.className = 'glass-panel fade-in';
                card.style.padding = '1.75rem';
                card.style.display = 'flex';
                card.style.flexDirection = 'column';
                card.style.border = '1px solid var(--glass-border)';
                card.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                
                const categoryColors = {
                    'Academic': { bg: 'rgba(99, 102, 241, 0.1)', text: 'var(--accent-color)' },
                    'Events': { bg: 'rgba(16, 185, 129, 0.1)', text: 'var(--success)' },
                    'Administrative': { bg: 'rgba(245, 158, 11, 0.1)', text: 'var(--warning)' },
                    'Holiday': { bg: 'rgba(239, 68, 68, 0.1)', text: 'var(--danger)' }
                };
                const color = categoryColors[notice.category] || { bg: 'var(--bg-primary)', text: 'var(--text-secondary)' };

                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <span style="background: ${color.bg}; color: ${color.text}; padding: 4px 10px; border-radius: 8px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">${notice.category}</span>
                        <span style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600;">${this.formatDate(notice.date)}</span>
                    </div>
                    <h3 style="margin: 0 0 1rem; font-size: 1.25rem; letter-spacing: -0.5px; color: var(--text-primary); line-height: 1.3;">${notice.title}</h3>
                    <div style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.6; margin-bottom: 1.5rem; flex: 1;">${notice.content}</div>
                    
                    <div style="padding-top: 1.25rem; border-top: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="width: 30px; height: 30px; border-radius: 50%; background: var(--bg-primary); border: 1px solid var(--glass-border); display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 800; color: var(--accent-color);">
                                ${notice.author?.name?.charAt(0) || 'A'}
                            </div>
                            <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary);">${notice.author?.name || 'Academic Admin'}</span>
                        </div>
                        ${(user.role === 'admin' || (user.role === 'teacher' && notice.author && (notice.author._id === user.id || notice.author._id === user._id))) ? `
                            <div style="display: flex; gap: 8px;">
                                <button class="edit-btn" style="background: var(--bg-primary); border: 1px solid var(--glass-border); border-radius: 8px; padding: 6px; cursor: pointer; color: var(--text-secondary);">✏️</button>
                                <button class="del-btn" style="background: var(--bg-primary); border: 1px solid var(--danger); border-radius: 8px; padding: 6px; cursor: pointer; color: var(--danger);">🗑️</button>
                            </div>
                        ` : ''}
                    </div>
                `;

                if (card.querySelector('.edit-btn')) card.querySelector('.edit-btn').onclick = () => window.location.hash = ROUTES.NOTICES_EDIT.replace(':id', notice._id);
                if (card.querySelector('.del-btn')) card.querySelector('.del-btn').onclick = () => {
                    Modal.confirm('Delete Notice?', 'This message will be removed for everyone.', async () => {
                        try { await ApiService.deleteNotice(notice._id); this.renderNotices(grid, user); Toast.success('Notice removed.'); }
                        catch (err) { Toast.error(err.message); }
                    });
                };
                grid.appendChild(card);
            });
        } catch (err) { Toast.error('Load Error'); }
    }

    formatDate(d) { return d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''; }
}
