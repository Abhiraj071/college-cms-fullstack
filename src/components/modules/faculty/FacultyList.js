import { ApiService } from '../../../services/ApiService.js';
import { Table } from '../../common/Table.js';
import { Toast } from '../../../services/Toast.js';
import { Modal } from '../../../services/Modal.js';
import { ROUTES } from '../../../services/Constants.js';
import { auth } from '../../../services/AuthService.js';

export class FacultyList {
    constructor() {
        this.faculty = [];
    }

    render() {
        const user = auth.getUser();
        const container = document.createElement('div');
        container.className = 'fade-in';

        // Header Section
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.marginBottom = '2rem';

        const title = document.createElement('h2');
        title.textContent = 'Faculty';
        title.style.margin = '0';
        title.style.marginRight = '2rem';
        title.style.minWidth = 'fit-content';

        const layoutGroup = document.createElement('div');
        layoutGroup.style.display = 'flex';
        layoutGroup.style.gap = '1.5rem';
        layoutGroup.style.alignItems = 'center';
        layoutGroup.style.flexWrap = 'wrap';

        const filterGroup = document.createElement('div');
        filterGroup.style.display = 'flex';
        filterGroup.style.gap = '1rem';
        filterGroup.style.background = 'rgba(255,255,255,0.05)';
        filterGroup.style.padding = '4px';
        filterGroup.style.borderRadius = '8px';

        // 1. Department/Program Filter
        const deptSelect = document.createElement('select');
        deptSelect.style.padding = '0.5rem';
        deptSelect.style.borderRadius = '6px';
        deptSelect.style.border = 'none';
        deptSelect.style.background = 'transparent';
        deptSelect.style.color = 'var(--text-primary)';
        deptSelect.style.cursor = 'pointer';

        deptSelect.innerHTML = `<option value="">Loading...</option>`;
        ApiService.getCourses().then(async (data) => {
            deptSelect.innerHTML = `<option value="">All Departments</option>` +
                data.map(c => `<option value="${c.name}">${c.name}</option>`).join('') +
                `<option value="General">General Faculty</option>`;

            if (user.role === 'student') {
                try {
                    const allStudents = await ApiService.getStudents();
                    const profile = allStudents.find(s => (s.userId?._id || s.userId) === user._id);
                    if (profile) {
                        deptSelect.value = profile.course;
                        deptSelect.disabled = true;
                        loadFaculty();
                    }
                } catch (err) {
                    console.error('Student faculty filter error', err);
                }
            } else {
                loadFaculty();
            }
        }).catch(err => {
            deptSelect.innerHTML = `<option value="">Failed to load departments</option>`;
            Toast.error('Could not load programs: ' + err.message);
        });

        filterGroup.appendChild(deptSelect);

        // 2. Add Faculty Button
        const addBtn = document.createElement('button');
        addBtn.className = 'glass-button';
        addBtn.innerHTML = '<span style="font-size:1.2rem; vertical-align: middle;">+</span> Add Faculty';
        addBtn.style.padding = '8px 20px';
        addBtn.onclick = () => { window.location.hash = ROUTES.FACULTY_ADD; };
        if (user.role !== 'admin') addBtn.style.display = 'none';

        const bulkAddBtn = document.createElement('button');
        bulkAddBtn.className = 'glass-button';
        bulkAddBtn.style.background = 'rgba(255, 255, 255, 0.05)';
        bulkAddBtn.style.color = 'var(--text-primary)';
        bulkAddBtn.innerHTML = 'Import CSV/Excel';
        bulkAddBtn.style.padding = '8px 20px';
        bulkAddBtn.onclick = () => { window.location.hash = ROUTES.FACULTY_BULK; };
        if (user.role !== 'admin') bulkAddBtn.style.display = 'none';

        layoutGroup.appendChild(filterGroup);
        layoutGroup.appendChild(bulkAddBtn);
        layoutGroup.appendChild(addBtn);

        header.appendChild(title);
        header.appendChild(layoutGroup);
        container.appendChild(header);

        // Main Content (Table)
        const tableCard = document.createElement('div');
        tableCard.className = 'glass-panel';
        tableCard.style.padding = '1rem';
        tableCard.style.minHeight = '200px';

        // Initial State
        tableCard.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                <div style="font-size: 3rem; margin-bottom: 1rem;">👨‍🏫</div>
                <p>Please select a <strong>Program / Department</strong> to view faculty.</p>
            </div>
        `;

        // Filter Logic
        const loadFaculty = async () => {
            const selectedDept = deptSelect.value;

            tableCard.innerHTML = '<div style="padding: 2rem; text-align: center;">Loading faculty...</div>';

            try {
                this.allFaculty = await ApiService.getFaculty();
                const filtered = selectedDept
                    ? this.allFaculty.filter(f => f.department === selectedDept)
                    : this.allFaculty;

                tableCard.innerHTML = '';

                if (filtered.length === 0) {
                    tableCard.innerHTML = `
                        <div style="text-align: center; padding: 2rem;">
                            <p>No faculty found${selectedDept ? ' for ' + selectedDept : ''}.</p>
                        </div>
                    `;
                    return;
                }

                const table = new Table({
                    columns: [
                        {
                            key: 'name', label: 'Faculty Member', render: (val, item) => `
                            <div style="font-weight: 600;">${val}</div>
                            <div style="font-size: 0.75rem; color: var(--text-secondary); opacity: 0.8;">${item.userId?.username || 'no-login'}</div>
                        ` },
                        {
                            key: 'email', label: 'Contact Details', render: (val, item) => `
                            <div style="font-size: 0.9rem;">${val || 'No Email'}</div>
                            <div style="font-size: 0.8rem; color: var(--text-secondary);">${item.phone || 'No Phone'}</div>
                        ` },
                        { key: 'department', label: 'Program', render: (val) => `<span style="padding: 3px 10px; background: rgba(99, 102, 241, 0.1); color: var(--accent-color); border-radius: 6px; font-size: 0.75rem; font-weight: 500;">${val}</span>` },
                        { key: 'designation', label: 'Designation', render: (val) => `<span style="font-size: 0.9rem; font-weight: 500;">${val || 'Faculty'}</span>` },
                        { key: 'joinDate', label: 'Joined On', render: (val) => `<span style="font-size: 0.8rem; color: var(--text-secondary);">${val ? new Date(val).toLocaleDateString() : 'N/A'}</span>` }
                    ],
                    data: filtered,
                    actions: user.role === 'admin',
                    onEdit: user.role === 'admin' ? (id) => {
                        window.location.hash = ROUTES.FACULTY_EDIT.replace(':id', id);
                    } : null,
                    onDelete: user.role === 'admin' ? (id) => {
                        const member = this.allFaculty.find(f => f._id === id);
                        Modal.confirm('Delete Faculty Member?', `Are you sure you want to dismiss ${member?.name || 'this member'}? This will also remove their login credentials.`, async () => {
                            try {
                                await ApiService.deleteFaculty(id);
                                loadFaculty();
                                Toast.success('Faculty member removed.');
                            } catch (err) {
                                Toast.error(err.message);
                            }
                        });
                    } : null
                });

                tableCard.appendChild(table.render());
            } catch (err) {
                Toast.error('Failed to load faculty: ' + err.message);
                tableCard.innerHTML = `<p style="color:red; text-align:center; padding:2rem;">Error: ${err.message}</p>`;
            }
        };

        deptSelect.onchange = loadFaculty;
        container.appendChild(tableCard);

        return container;
    }
}
