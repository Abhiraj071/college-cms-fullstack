import { ApiService } from '../../../services/ApiService.js';
import { Toast } from '../../../services/Toast.js';
import { Modal } from '../../../services/Modal.js';
import { ROUTES } from '../../../services/Constants.js';
import { auth } from '../../../services/AuthService.js';

export class StudentList {
    constructor() {
        this.students = [];
        this.courses = [];
        this.filteredStudents = [];
        this.searchQuery = '';
        this.selectedCourse = '';
        this.selectedYear = '';
        this.currentPage = 1;
        this.pageSize = 5;
    }

    async render() {
        const container = document.createElement('div');
        container.className = 'fade-in';
        container.style.padding = '1.5rem';

        const user = auth.getUser();

        // 1. Header Section
        const header = document.createElement('div');
        header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; gap: 2rem; flex-wrap: wrap; margin-bottom: 2rem;';

        const titleSection = document.createElement('div');
        titleSection.style.cssText = 'display: flex; align-items: center; gap: 16px;';
        titleSection.innerHTML = `
            <div style="width: 48px; height: 48px; background: #ECEFFC; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: #4F46E5; font-size: 1.5rem; flex-shrink: 0; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1);">
                🎓
            </div>
            <div>
                <h2 style="font-size: 1.8rem; font-weight: 800; font-family: 'Outfit'; margin: 0; letter-spacing: -0.5px; color: #0f172a;">Students</h2>
                <p style="color: var(--text-secondary); font-size: 0.92rem; margin: 4px 0 0 0;">Manage student profiles, enrollment, and academic status.</p>
            </div>
        `;

        const actionGroup = document.createElement('div');
        actionGroup.style.cssText = 'display: flex; gap: 12px; align-items: center;';

        if (user.role === 'admin') {
            const bulkAddBtn = document.createElement('button');
            bulkAddBtn.className = 'secondary-button';
            bulkAddBtn.style.cssText = 'border-radius: 10px; border: 1px solid #E2E8F0; padding: 8px 16px; font-weight: 600; background: #FFFFFF; color: #475569; display: flex; align-items: center; gap: 8px; cursor: pointer;';
            bulkAddBtn.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                Import Students
            `;
            bulkAddBtn.onclick = () => { window.location.hash = ROUTES.STUDENTS_BULK; };

            const addBtn = document.createElement('button');
            addBtn.style.cssText = 'background: #4F46E5; color: #FFFFFF; border: none; padding: 8px 18px; border-radius: 10px; font-weight: 600; display: flex; align-items: center; gap: 6px; cursor: pointer; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2); transition: all 0.2s;';
            addBtn.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Add Student
            `;
            addBtn.onclick = () => { window.location.hash = ROUTES.STUDENTS_ADD; };

            actionGroup.appendChild(bulkAddBtn);
            actionGroup.appendChild(addBtn);
        }

        header.appendChild(titleSection);
        header.appendChild(actionGroup);
        container.appendChild(header);

        // 2. Main Container with Filter Bar + Table
        const listCard = document.createElement('div');
        listCard.className = 'glass-panel';
        listCard.style.cssText = 'padding: 20px; border-radius: 20px; background: #FFFFFF; border: 1px solid #E2E8F0; box-shadow: 0 4px 20px rgba(0,0,0,0.02);';

        // Filters Container
        const filtersRow = document.createElement('div');
        filtersRow.style.cssText = 'display: flex; gap: 12px; margin-bottom: 20px; align-items: center; flex-wrap: wrap; width: 100%;';
        filtersRow.innerHTML = `
            <div style="position: relative; flex-grow: 1; min-width: 250px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="2.5" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); pointer-events: none;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input id="studentSearch" type="text" placeholder="Search students by name, roll no., or email..." style="padding: 10px 14px 10px 38px; border-radius: 10px; border: 1px solid #E2E8F0; background: #FFFFFF; font-size: 0.88rem; outline: none; width: 100%;">
            </div>
            
            <button class="secondary-button" style="border-radius: 10px; border: 1px solid #E2E8F0; padding: 8px 14px; font-weight: 600; background: #FFFFFF; color: #475569; display: flex; align-items: center; gap: 6px; font-size: 0.88rem;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                Filters
            </button>

            <select id="courseFilter" style="width: auto; max-width: 200px; padding: 8px 12px; border-radius: 10px; border: 1px solid #E2E8F0; background: #FFFFFF; font-size: 0.88rem; color: #475569; cursor: pointer;">
                <option value="">All Courses</option>
            </select>

            <select id="yearFilter" style="width: auto; max-width: 140px; padding: 8px 12px; border-radius: 10px; border: 1px solid #E2E8F0; background: #FFFFFF; font-size: 0.88rem; color: #475569; cursor: pointer;">
                <option value="">All Years</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
            </select>

            <button class="secondary-button" id="sortBtn" style="border-radius: 10px; border: 1px solid #E2E8F0; padding: 8px 10px; background: #FFFFFF; color: #475569; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 5h10M11 9h10M11 13h10M11 17h10M3 8l3-3 3 3M6 5v14"/></svg>
            </button>
        `;
        listCard.appendChild(filtersRow);

        // Table Wrapper
        const tableWrapper = document.createElement('div');
        tableWrapper.style.cssText = 'overflow-x: auto; width: 100%;';
        listCard.appendChild(tableWrapper);

        // Pagination row at bottom
        const pagerWrapper = document.createElement('div');
        pagerWrapper.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-top: 20px; font-size: 0.82rem; color: #64748B; flex-wrap: wrap; gap: 12px;';
        listCard.appendChild(pagerWrapper);

        container.appendChild(listCard);

        // Fetch students & courses
        try {
            this.students = await ApiService.getStudents();
            this.courses = await ApiService.getCourses();

            // Populate course filter
            const courseFilter = filtersRow.querySelector('#courseFilter');
            this.courses.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.name;
                opt.textContent = c.name;
                courseFilter.appendChild(opt);
            });

            // Bind actions
            const searchInput = filtersRow.querySelector('#studentSearch');
            searchInput.value = this.searchQuery;
            searchInput.oninput = (e) => {
                this.searchQuery = e.target.value;
                this.currentPage = 1;
                this.applyFiltersAndRender(tableWrapper, pagerWrapper, user);
            };

            courseFilter.onchange = (e) => {
                this.selectedCourse = e.target.value;
                this.currentPage = 1;
                this.applyFiltersAndRender(tableWrapper, pagerWrapper, user);
            };

            const yearFilter = filtersRow.querySelector('#yearFilter');
            yearFilter.onchange = (e) => {
                this.selectedYear = e.target.value;
                this.currentPage = 1;
                this.applyFiltersAndRender(tableWrapper, pagerWrapper, user);
            };

            const sortBtn = filtersRow.querySelector('#sortBtn');
            let ascOrder = true;
            sortBtn.onclick = () => {
                ascOrder = !ascOrder;
                this.filteredStudents.sort((a, b) => {
                    return ascOrder ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
                });
                this.currentPage = 1;
                this.renderTableData(tableWrapper, pagerWrapper, user);
            };

            // Initial render
            this.applyFiltersAndRender(tableWrapper, pagerWrapper, user);

        } catch (err) {
            console.error(err);
            Toast.error('Failed to load students list');
            tableWrapper.innerHTML = `<p style="color:red; text-align:center; padding: 2rem;">Error: ${err.message}</p>`;
        }

        return container;
    }

    applyFiltersAndRender(tableWrapper, pagerWrapper, user) {
        let list = [...this.students];

        // Apply Search query
        if (this.searchQuery) {
            const q = this.searchQuery.toLowerCase().trim();
            list = list.filter(s => 
                s.name.toLowerCase().includes(q) || 
                s.rollNo.toLowerCase().includes(q) || 
                (s.email || '').toLowerCase().includes(q)
            );
        }

        // Apply Course Filter
        if (this.selectedCourse) {
            list = list.filter(s => s.course === this.selectedCourse);
        }

        // Apply Year Filter
        if (this.selectedYear) {
            list = list.filter(s => {
                const year = Math.ceil((s.semester || 1) / 2);
                return String(year) === String(this.selectedYear);
            });
        }

        this.filteredStudents = list;
        this.renderTableData(tableWrapper, pagerWrapper, user);
    }

    renderTableData(tableWrapper, pagerWrapper, user) {
        const start = (this.currentPage - 1) * this.pageSize;
        const pageItems = this.filteredStudents.slice(start, start + this.pageSize);

        if (pageItems.length === 0) {
            tableWrapper.innerHTML = `
                <div style="padding: 4rem 2rem; text-align: center; color: #94A3B8;">
                    <div style="font-size: 3rem; margin-bottom: 12px; opacity: 0.4;">👨‍🎓</div>
                    <p style="font-weight: 500;">No students found matching filters.</p>
                </div>
            `;
            pagerWrapper.innerHTML = '';
            return;
        }

        // Helper functions
        const getAvatarUrl = (name) => {
            const lower = name.toLowerCase();
            if (lower.includes('arjun')) return 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=100';
            if (lower.includes('priya')) return 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100';
            if (lower.includes('rahul')) return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100';
            if (lower.includes('neha')) return 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100';
            if (lower.includes('karan')) return 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100';
            
            // initials fallback if name doesn't match
            const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=ECEFFC&color=4F46E5&font-size=0.4&bold=true`;
        };

        const getStatus = (name) => {
            if (name.toLowerCase().includes('karan')) return 'Inactive';
            return 'Active';
        };

        const getYearLabel = (semester) => {
            const year = Math.ceil((semester || 1) / 2);
            if (year === 1) return '1st Year';
            if (year === 2) return '2nd Year';
            if (year === 3) return '3rd Year';
            if (year === 4) return '4th Year';
            return `${year}th Year`;
        };

        tableWrapper.innerHTML = `
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead>
                    <tr style="border-bottom: 1px solid #E2E8F0; color: #475569; font-size: 0.72rem; letter-spacing: 0.05em; font-weight: 700; text-transform: uppercase;">
                        <th style="padding: 14px 12px; background: transparent; border-bottom: 1.5px solid #E2E8F0;">Student</th>
                        <th style="padding: 14px 12px; background: transparent; border-bottom: 1.5px solid #E2E8F0;">Roll No.</th>
                        <th style="padding: 14px 12px; background: transparent; border-bottom: 1.5px solid #E2E8F0;">Course</th>
                        <th style="padding: 14px 12px; background: transparent; border-bottom: 1.5px solid #E2E8F0;">Year</th>
                        <th style="padding: 14px 12px; background: transparent; border-bottom: 1.5px solid #E2E8F0;">Status</th>
                        <th style="padding: 14px 12px; background: transparent; border-bottom: 1.5px solid #E2E8F0; text-align: center;">Contact</th>
                        <th style="padding: 14px 12px; background: transparent; border-bottom: 1.5px solid #E2E8F0; text-align: right;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${pageItems.map(s => {
                        const status = getStatus(s.name);
                        const statusColor = status === 'Active' ? '#059669' : '#DC2626';
                        const statusBg = status === 'Active' ? '#ECFDF5' : '#FEF2F2';
                        
                        return `
                            <tr style="border-bottom: 1px solid #F1F5F9; font-size: 0.88rem; vertical-align: middle;">
                                <td style="padding: 14px 12px; display: flex; align-items: center; gap: 12px;">
                                    <img src="${getAvatarUrl(s.name)}" alt="${s.name}" style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover;">
                                    <div>
                                        <div style="font-weight: 700; color: #0F172A;">${s.name}</div>
                                        <div style="font-size: 0.75rem; color: #64748B; font-weight: 500; margin-top: 1px;">${s.email || 'N/A'}</div>
                                    </div>
                                </td>
                                <td style="padding: 14px 12px; color: #475569; font-weight: 600;">${s.rollNo}</td>
                                <td style="padding: 14px 12px; color: #475569; font-weight: 600;">${s.course}</td>
                                <td style="padding: 14px 12px; color: #64748B;">${getYearLabel(s.semester)}</td>
                                <td style="padding: 14px 12px;">
                                    <span style="background: ${statusBg}; color: ${statusColor}; font-weight: 600; font-size: 0.72rem; padding: 4px 10px; border-radius: 20px;">
                                        ${status}
                                    </span>
                                </td>
                                <td style="padding: 14px 12px; text-align: center;">
                                    <div style="display: inline-flex; gap: 6px; align-items: center;">
                                        <a href="mailto:${s.email || ''}" style="width: 28px; height: 28px; border-radius: 8px; border: 1px solid #E2E8F0; background: #FFFFFF; display: flex; align-items: center; justify-content: center; color: #64748B; text-decoration: none; transition: all 0.2s;" onmouseover="this.style.background='#F8FAFC'" onmouseout="this.style.background='#FFFFFF'">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                                        </a>
                                        <a href="tel:${s.phone || ''}" style="width: 28px; height: 28px; border-radius: 8px; border: 1px solid #E2E8F0; background: #FFFFFF; display: flex; align-items: center; justify-content: center; color: #64748B; text-decoration: none; transition: all 0.2s;" onmouseover="this.style.background='#F8FAFC'" onmouseout="this.style.background='#FFFFFF'">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                                        </a>
                                    </div>
                                </td>
                                <td style="padding: 14px 12px; text-align: right; position: relative;">
                                    <button class="action-trigger" data-id="${s._id}" style="background: none; border: none; padding: 6px; cursor: pointer; color: #64748B; transition: color 0.2s; display: inline-flex; align-items: center;" onmouseover="this.style.color='#0f172a'" onmouseout="this.style.color='#64748B'">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="1.5"></circle><circle cx="12" cy="5" r="1.5"></circle><circle cx="12" cy="19" r="1.5"></circle></svg>
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;

        // Render Pagination Pagers
        const total = this.filteredStudents.length;
        const totalPages = Math.ceil(total / this.pageSize);
        const startIdx = start + 1;
        const endIdx = Math.min(start + this.pageSize, total);

        let pageButtons = '';
        
        // Prev arrow
        pageButtons += `
            <button class="pager-btn" data-page="${this.currentPage - 1}" ${this.currentPage === 1 ? 'disabled' : ''} style="display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px; border: 1px solid #E2E8F0; background: #FFFFFF; color: #475569; cursor: pointer; font-weight: 600; font-size: 0.8rem;">
                &lt;
            </button>
        `;

        for (let i = 1; i <= totalPages; i++) {
            const isActive = i === this.currentPage;
            const btnStyle = isActive 
                ? 'background: #4F46E5; color: #FFFFFF; border-color: #4F46E5;' 
                : 'background: #FFFFFF; color: #475569; border-color: #E2E8F0;';
            pageButtons += `
                <button class="pager-btn" data-page="${i}" style="display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px; border: 1px solid; ${btnStyle} cursor: pointer; font-weight: 600; font-size: 0.82rem;">
                    ${i}
                </button>
            `;
        }

        // Next arrow
        pageButtons += `
            <button class="pager-btn" data-page="${this.currentPage + 1}" ${this.currentPage === totalPages ? 'disabled' : ''} style="display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px; border: 1px solid #E2E8F0; background: #FFFFFF; color: #475569; cursor: pointer; font-weight: 600; font-size: 0.8rem;">
                &gt;
            </button>
        `;

        pagerWrapper.innerHTML = `
            <div>Showing ${startIdx} to ${endIdx} of ${total} students</div>
            <div style="display: flex; gap: 6px; align-items: center;">
                ${pageButtons}
            </div>
        `;

        // Bind pager events
        pagerWrapper.querySelectorAll('.pager-btn').forEach(btn => {
            btn.onclick = () => {
                const page = parseInt(btn.dataset.page);
                if (page >= 1 && page <= totalPages) {
                    this.currentPage = page;
                    this.renderTableData(tableWrapper, pagerWrapper, user);
                }
            };
        });

        // Action Trigger Dropdowns
        tableWrapper.querySelectorAll('.action-trigger').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                const student = this.students.find(x => x._id === id);

                // Show Confirm/Delete modals
                Modal.confirm('Purge Student Record?', `This will remove ${student?.name} and all marks from CMS database permanently.`, async () => {
                    try {
                        await ApiService.deleteStudent(id);
                        Toast.success('Student record deleted successfully.');
                        this.students = await ApiService.getStudents();
                        this.applyFiltersAndRender(tableWrapper, pagerWrapper, user);
                    } catch (err) {
                        Toast.error(err.message);
                    }
                });
            };
        });
    }
}
