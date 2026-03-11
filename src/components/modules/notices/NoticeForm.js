import { ApiService } from '../../../services/ApiService.js';
import { ValidationService as VS } from '../../../services/ValidationService.js';
import { ROUTES } from '../../../services/Constants.js';
import { Toast } from '../../../services/Toast.js';

export class NoticeForm {
    constructor(noticeId = null) {
        this.noticeId = noticeId;
        this.isEdit = !!noticeId;
        this.noticeData = null;
    }

    render() {
        const container = document.createElement('div');
        container.className = 'fade-in';
        container.style.maxWidth = '800px';
        container.style.margin = '0 auto';

        // Header
        const header = document.createElement('div');
        header.style.marginBottom = '2rem';
        header.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem; cursor: pointer; color: var(--text-secondary);" onclick="window.location.hash='${ROUTES.NOTICES}'">
                <span>← Back to Board</span>
            </div>
            <h2 style="margin-top: 1rem;">${this.isEdit ? 'Edit Notice' : 'Post New Notice'}</h2>
        `;
        container.appendChild(header);

        // Form Card
        const card = document.createElement('div');
        card.className = 'glass-panel';
        card.style.padding = '2.5rem';

        const form = document.createElement('form');
        form.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
                <div style="grid-column: span 2;">
                    <label>Notice Title</label>
                    <input type="text" name="title" placeholder="e.g. Schedule for Mid-Term Exams" required>
                </div>
                <div>
                    <label>Category</label>
                    <select name="category" required>
                        <option value="Academic">Academic</option>
                        <option value="Exams">Exams</option>
                        <option value="Events">Events</option>
                        <option value="Administrative">Administrative</option>
                        <option value="Holiday">Holiday</option>
                        <option value="General">General Updates</option>
                    </select>
                </div>
                <div>
                    <label>Target Audience</label>
                    <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
                         <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; font-weight: normal;">
                            <input type="checkbox" name="target" value="admin" checked> Admin
                         </label>
                         <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; font-weight: normal;">
                            <input type="checkbox" name="target" value="teacher" checked> Teachers
                         </label>
                         <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; font-weight: normal;">
                            <input type="checkbox" name="target" value="student" checked> Students
                         </label>
                    </div>
                </div>
                <div style="grid-column: span 2;">
                    <label>Message / Details</label>
                    <textarea name="content" rows="6" placeholder="Type the detailed announcement here..." required></textarea>
                </div>
            </div>

            <div style="border-top: 1px solid var(--glass-border); padding-top: 2rem; display: flex; justify-content: flex-end; gap: 1rem;">
                <button type="button" class="glass-button" style="background: transparent;" onclick="window.history.back()">Cancel</button>
                <button type="submit" id="submitBtn" class="glass-button">${this.isEdit ? 'Update Notice' : 'Publish to Board'}</button>
            </div>
        `;

        const submitBtn = /** @type {HTMLButtonElement} */ (form.querySelector('#submitBtn'));

        const initForm = async () => {
            if (this.isEdit) {
                try {
                    const notices = await ApiService.getNotices();
                    this.noticeData = notices.find(n => n._id === this.noticeId);
                    if (this.noticeData) {
                        /** @type {HTMLInputElement} */ (form.querySelector('[name="title"]')).value = this.noticeData.title;
                        /** @type {HTMLSelectElement} */ (form.querySelector('[name="category"]')).value = this.noticeData.category;
                        /** @type {HTMLTextAreaElement} */ (form.querySelector('[name="content"]')).value = this.noticeData.content;

                        // Set checkboxes
                        form.querySelectorAll('input[name="target"]').forEach(elem => {
                            const cb = /** @type {HTMLInputElement} */ (elem);
                            cb.checked = this.noticeData.targetRoles.includes(cb.value);
                        });
                    } else {
                        Toast.error('Notice not found');
                        window.location.hash = ROUTES.NOTICES;
                    }
                } catch (err) {
                    Toast.error('Failed to load notice: ' + err.message);
                }
            }
        };

        initForm();

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            VS.clearErrors(form);

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            const targetRoles = Array.from(form.querySelectorAll('input[name="target"]:checked')).map(cb => (/** @type {HTMLInputElement} */ (cb)).value);

            // --- Validation ---
            let isValid = true;
            if (!VS.validateRequired(data.title)) { VS.highlightError(form.querySelector('[name="title"]'), 'Title is required'); isValid = false; }
            if (!VS.validateRequired(data.content)) { VS.highlightError(form.querySelector('[name="content"]'), 'Message content is required'); isValid = false; }
            if (targetRoles.length === 0) {
                Toast.error('Please select at least one target audience');
                isValid = false;
            }

            if (!isValid) return;

            submitBtn.textContent = this.isEdit ? 'Updating...' : 'Publishing...';
            submitBtn.disabled = true;

            try {
                const noticeObj = {
                    title: data.title,
                    content: data.content,
                    category: data.category,
                    targetRoles: targetRoles
                };

                if (this.isEdit) {
                    await ApiService.updateNotice(this.noticeId, noticeObj);
                    Toast.success('Notice Updated Successfully!');
                } else {
                    await ApiService.addNotice(noticeObj);
                    Toast.success('Notice Published Successfully!');
                }
                window.location.hash = ROUTES.NOTICES;
            } catch (err) {
                Toast.error(err.message);
                submitBtn.textContent = this.isEdit ? 'Update Notice' : 'Publish to Board';
                submitBtn.disabled = false;
            }
        });

        card.appendChild(form);
        container.appendChild(card);
        return container;
    }
}
