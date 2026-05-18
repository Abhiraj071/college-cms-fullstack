import { ApiService } from '../../../services/ApiService.js';
import { Table } from '../../common/Table.js';
import { Toast } from '../../../services/Toast.js';
import { Modal } from '../../../services/Modal.js';
import { auth } from '../../../services/AuthService.js';
import { ROUTES } from '../../../services/Constants.js';

export class CourseList {
    constructor() {
        this.courses = [];
    }

    render() {
        const container = document.createElement('div');
        container.className = 'fade-in';

        // Header Section
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.marginBottom = '2rem';

        const title = document.createElement('h2');
        title.textContent = 'Courses & Subjects';
        title.style.margin = '0';

        const addBtn = document.createElement('button');
        addBtn.className = 'glass-button';
        addBtn.textContent = '+ Add New Course';
        addBtn.onclick = () => { window.location.hash = 'courses/add'; };

        header.appendChild(title);
        header.appendChild(addBtn);
        container.appendChild(header);

        const currentUser = auth.getUser();
        if (currentUser && currentUser.role !== 'admin') {
            addBtn.style.display = 'none';
        }

        // Table
        const tableCard = document.createElement('div');
        tableCard.className = 'glass-panel';
        tableCard.style.padding = '1rem';

        const loadData = async () => {
            tableCard.innerHTML = '<div style="padding: 2rem; text-align: center;">Loading academic programs...</div>';
            try {
                this.courses = await ApiService.getCourses();
                tableCard.innerHTML = '';

                const table = new Table({
                    columns: [
                        { key: 'name', label: 'Course Name', render: (val) => `<strong>${val}</strong>` },
                        { key: 'code', label: 'Code', render: (val) => `<span style="font-family: monospace; opacity: 0.8;">${val}</span>` },
                        { key: 'duration', label: 'Duration (Years)', render: (val) => `${val} Year${val > 1 ? 's' : ''}` },
                        { key: 'branches', label: 'Branches', render: (val) => `<span style="font-size: 0.8rem;">${(val || []).length} Specialized</span>` },
                        {
                            key: '_id',
                            label: 'Enrollment',
                            render: (_, item) => {
                                if (currentUser && currentUser.role === 'admin') {
                                    return `<button style="background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 4px; padding: 4px 10px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='rgba(16, 185, 129, 0.2)'" onmouseout="this.style.background='rgba(16, 185, 129, 0.1)'" onclick="window.location.hash='${ROUTES.SUBJECTS_ADD}?course=${encodeURIComponent(item.name)}'">+ Enroll Subject</button>`;
                                }
                                return '';
                            }
                        }
                    ],
                    data: this.courses,
                    onEdit: (currentUser && currentUser.role !== 'admin') ? null : (id) => {
                        window.location.hash = ROUTES.COURSES_EDIT.replace(':id', id);
                    },
                    onDelete: (currentUser && currentUser.role !== 'admin') ? null : (id) => {
                        const course = this.courses.find(c => c._id === id);
                        Modal.confirm('Delete Course?', `Are you sure you want to remove ${course?.name || 'this course'}? This may affect enrolled students.`, async () => {
                            try {
                                await ApiService.deleteCourse(id);
                                loadData(); // Refresh
                                Toast.success('Course deleted.');
                            } catch (err) {
                                Toast.error(err.message);
                            }
                        });
                    }
                });

                tableCard.appendChild(table.render());
            } catch (err) {
                Toast.error('Failed to load courses: ' + err.message);
                tableCard.innerHTML = `<p style="color:red; text-align:center; padding:2rem;">Error: ${err.message}</p>`;
            }
        }

        loadData();
        container.appendChild(tableCard);

        return container;
    }
}
