import { ApiService } from '../../../services/ApiService.js';
import { Table } from '../../common/Table.js';
import { Toast } from '../../../services/Toast.js';
import { Modal } from '../../../services/Modal.js';
import { ValidationService as VS } from '../../../services/ValidationService.js';

export class BranchManager {
    constructor() {
        this.branches = [];
    }

    render() {
        const container = document.createElement('div');
        container.className = 'fade-in';

        // Header
        const header = document.createElement('div');
        header.style.marginBottom = '2rem';
        header.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem; cursor: pointer; color: var(--text-secondary);" onclick="window.history.back()">
                <span>← Back to Courses</span>
            </div>
            <h2 style="margin-top: 1rem;">Branch Management</h2>
            <p style="color: var(--text-secondary);">Create and Manage Academic Departments</p>
        `;
        container.appendChild(header);

        const content = document.createElement('div');
        content.style.display = 'grid';
        content.style.gridTemplateColumns = '2fr 1fr';
        content.style.gap = '2rem';

        // Left: List
        const listCard = document.createElement('div');
        listCard.className = 'glass-panel';
        listCard.style.padding = '1.5rem';

        const loadBranches = async () => {
            listCard.innerHTML = `<h3 style="margin-bottom: 1rem;">Existing Branches</h3>
                                <div style="padding: 2rem; text-align: center;">Loading branches...</div>`;
            try {
                this.branches = await ApiService.getBranches();
                listCard.innerHTML = `<h3 style="margin-bottom: 1rem;">Existing Branches</h3>`;

                const table = new Table({
                    columns: [
                        { key: 'name', label: 'Branch Name', render: (val) => `<strong>${val}</strong>` },
                        { key: 'code', label: 'Code', render: (val) => `<span style="padding:4px 8px; background: rgba(255,255,255,0.1); border-radius: 4px;">${val}</span>` },
                        { key: '_id', label: 'DB ID', render: (val) => `<span style="color: var(--text-secondary); font-size: 0.7rem; opacity: 0.6;">${val}</span>` }
                    ],
                    data: this.branches,
                    onDelete: (id) => {
                        Modal.confirm('Delete Branch?', 'This action will permanently remove the branch. Associated courses might need update.', async () => {
                            try {
                                await ApiService.deleteBranch(id);
                                loadBranches();
                                Toast.success('Branch deleted successfully');
                            } catch (err) {
                                Toast.error(err.message);
                            }
                        });
                    },
                    onEdit: null
                });

                listCard.appendChild(table.render());
            } catch (err) {
                Toast.error('Failed to load branches: ' + err.message);
                listCard.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
            }
        };

        loadBranches();
        content.appendChild(listCard);

        // Right: Add Form
        const formCard = document.createElement('div');
        formCard.className = 'glass-panel';
        formCard.style.padding = '1.5rem';
        formCard.style.height = 'fit-content';

        formCard.innerHTML = `
            <h3 style="margin-bottom: 1.5rem;">Create New Branch</h3>
            <form id="add-branch-form">
                <div style="margin-bottom: 1rem;">
                    <label>Branch Name</label>
                    <input type="text" name="name" placeholder="e.g. Electrical Engineering" required>
                </div>
                <div style="margin-bottom: 1.5rem;">
                    <label>Branch Code</label>
                    <input type="text" name="code" placeholder="e.g. EE" required style="text-transform: uppercase;">
                </div>
                <div style="text-align: right;">
                    <button type="submit" id="submitBtn" class="glass-button" style="width: 100%;">+ Create Branch</button>
                </div>
            </form>
        `;

        /** @type {HTMLFormElement} */
        const form = formCard.querySelector('#add-branch-form');
        /** @type {HTMLButtonElement} */
        const submitBtn = formCard.querySelector('#submitBtn');

        form.onsubmit = async (e) => {
            e.preventDefault();
            VS.clearErrors(form);
            const formData = new FormData(form);
            const name = formData.get('name');
            const codeEntry = formData.get('code');
            const code = typeof codeEntry === 'string' ? codeEntry.toUpperCase() : '';

            let isValid = true;
            if (!VS.validateRequired(name)) { VS.highlightError(form.name, 'Name is required'); isValid = false; }
            if (!VS.validateRequired(code)) { VS.highlightError(form.code, 'Code is required'); isValid = false; }

            if (!isValid) return;

            submitBtn.textContent = 'Creating...';
            submitBtn.disabled = true;

            try {
                await ApiService.addBranch({ name, code });
                Toast.success('Branch Added successfully!');
                form.reset();
                loadBranches();
            } catch (err) {
                Toast.error(err.message);
            } finally {
                submitBtn.textContent = '+ Create Branch';
                submitBtn.disabled = false;
            }
        };

        content.appendChild(formCard);
        container.appendChild(content);

        return container;
    }
}
