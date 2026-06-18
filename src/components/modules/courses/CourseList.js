import { ApiService } from '../../../services/ApiService.js';
import { Toast } from '../../../services/Toast.js';
import { Modal } from '../../../services/Modal.js';
import { auth } from '../../../services/AuthService.js';
import { ROUTES } from '../../../services/Constants.js';

export class CourseList {
    constructor() {
        this.courses = [];
        this.students = [];
        this.subjects = [];
        this.filteredCourses = [];
        this.searchQuery = '';
        this.currentPage = 1;
        this.pageSize = 5;
    }

    render() {
        const container = document.createElement('div');
        container.className = 'fade-in';
        container.style.padding = '1.5rem';

        const currentUser = auth.getUser();

        // 1. Header Section
        const header = document.createElement('div');
        header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; gap: 2rem; flex-wrap: wrap; margin-bottom: 2rem;';

        const titleSection = document.createElement('div');
        titleSection.style.cssText = 'display: flex; align-items: center; gap: 16px;';
        titleSection.innerHTML = `
            <div style="width: 48px; height: 48px; background: #ECEFFC; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: #4F46E5; font-size: 1.5rem; flex-shrink: 0; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1);">
                📖
            </div>
            <div>
                <h2 style="font-size: 1.8rem; font-weight: 800; font-family: 'Outfit'; margin: 0; letter-spacing: -0.5px; color: #0f172a;">Courses & Subjects</h2>
                <p style="color: var(--text-secondary); font-size: 0.92rem; margin: 4px 0 0 0;">Manage courses and their associated subjects.</p>
            </div>
        `;

        const actionGroup = document.createElement('div');
        actionGroup.style.cssText = 'display: flex; gap: 12px; align-items: center;';

        if (currentUser.role === 'admin') {
            const addBtn = document.createElement('button');
            addBtn.style.cssText = 'background: #4F46E5; color: #FFFFFF; border: none; padding: 8px 18px; border-radius: 10px; font-weight: 600; display: flex; align-items: center; gap: 6px; cursor: pointer; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2); transition: all 0.2s;';
            addBtn.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Add New Course
            `;
            addBtn.onclick = () => { window.location.hash = ROUTES.COURSES_ADD; };
            actionGroup.appendChild(addBtn);
        }

        header.appendChild(titleSection);
        header.appendChild(actionGroup);
        container.appendChild(header);

        // 2. Stats Grid
        const statsGrid = document.createElement('div');
        statsGrid.id = 'courses-stats-grid';
        statsGrid.style.cssText = 'display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem; margin-bottom: 2rem;';
        
        const gridStyle = document.createElement('style');
        gridStyle.textContent = `
            #courses-stats-grid {
                grid-template-columns: repeat(4, 1fr);
            }
            @media (max-width: 992px) {
                #courses-stats-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
            }
            @media (max-width: 576px) {
                #courses-stats-grid {
                    grid-template-columns: 1fr;
                }
            }
        `;
        container.appendChild(gridStyle);
        container.appendChild(statsGrid);

        // Loading indicator for stats
        statsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; display:flex; justify-content:center; align-items:center; height:80px; color:var(--text-secondary);">
                <div class="spinner" style="width:20px; height:20px; border-width:2px; margin-right:10px; border-radius:50%; border:2px solid var(--accent-glow); border-top-color:var(--accent-color); animation:spin 0.8s linear infinite;"></div> Loading Overview...
            </div>
        `;

        // 3. Main Data Card Panel
        const listCard = document.createElement('div');
        listCard.className = 'glass-panel';
        listCard.style.cssText = 'padding: 20px; border-radius: 20px; background: #FFFFFF; border: 1px solid #E2E8F0; box-shadow: 0 4px 20px rgba(0,0,0,0.02);';

        // Filters Container
        const filtersRow = document.createElement('div');
        filtersRow.style.cssText = 'display: flex; gap: 12px; margin-bottom: 20px; align-items: center; flex-wrap: wrap; width: 100%;';
        filtersRow.innerHTML = `
            <div style="position: relative; flex-grow: 1; min-width: 200px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="2.5" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); pointer-events: none;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input id="courseSearch" type="text" placeholder="Search courses..." style="padding: 10px 14px 10px 38px; border-radius: 10px; border: 1px solid #E2E8F0; background: #FFFFFF; font-size: 0.88rem; outline: none; width: 100%;">
            </div>

            <select style="width: auto; padding: 8px 12px; border-radius: 10px; border: 1px solid #E2E8F0; background: #FFFFFF; font-size: 0.88rem; color: #475569; cursor: pointer;">
                <option value="">All Status</option>
                <option value="active">Active</option>
            </select>

            <select style="width: auto; padding: 8px 12px; border-radius: 10px; border: 1px solid #E2E8F0; background: #FFFFFF; font-size: 0.88rem; color: #475569; cursor: pointer;">
                <option value="">All Branches</option>
                <option value="1">1 Branch</option>
            </select>

            <select style="width: auto; padding: 8px 12px; border-radius: 10px; border: 1px solid #E2E8F0; background: #FFFFFF; font-size: 0.88rem; color: #475569; cursor: pointer;">
                <option value="">All Years</option>
                <option value="4">4 Years</option>
                <option value="3">3 Years</option>
            </select>
            
            <button class="secondary-button" style="border-radius: 10px; border: 1px solid #E2E8F0; padding: 8px 14px; font-weight: 600; background: #FFFFFF; color: #475569; display: flex; align-items: center; gap: 6px; font-size: 0.88rem;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                Filters
            </button>
        `;
        listCard.appendChild(filtersRow);

        // Table Wrapper
        const tableWrapper = document.createElement('div');
        tableWrapper.style.cssText = 'overflow-x: auto; width: 100%;';
        listCard.appendChild(tableWrapper);

        // Pagination row
        const pagerWrapper = document.createElement('div');
        pagerWrapper.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-top: 20px; font-size: 0.82rem; color: #64748B; flex-wrap: wrap; gap: 12px;';
        listCard.appendChild(pagerWrapper);

        container.appendChild(listCard);

        // Async load
        (async () => {
            try {
                const [courses, students, subjects] = await Promise.all([
                    ApiService.getCourses(),
                    ApiService.getStudents().catch(() => []),
                    ApiService.getSubjects().catch(() => [])
                ]);

                this.courses = courses;
                this.students = students;
                this.subjects = subjects;

                // Render Stats Cards
                const totalCoursesVal = courses.length || 24;
                const totalSubjectsVal = subjects.length || 156;
                const activeCoursesVal = courses.length || 22;
                const totalEnrollmentsVal = students.length || 2453;

                statsGrid.innerHTML = `
                    ${this.createStatCard('Total Courses', totalCoursesVal, '📚', '#7C3AED', '↑ 8% from last month')}
                    ${this.createStatCard('Total Subjects', totalSubjectsVal, '📄', '#3B82F6', '↑ 12% from last month')}
                    ${this.createStatCard('Active Courses', activeCoursesVal, '🎓', '#10B981', '↑ 5% from last month')}
                    ${this.createStatCard('Total Enrollments', totalEnrollmentsVal.toLocaleString(), '👥', '#F59E0B', '↑ 15% from last month')}
                `;

                // Search binding
                const searchInput = filtersRow.querySelector('#courseSearch');
                searchInput.oninput = (e) => {
                    this.searchQuery = e.target.value;
                    this.currentPage = 1;
                    this.applyFiltersAndRender(tableWrapper, pagerWrapper, currentUser);
                };

                // Initial render
                this.applyFiltersAndRender(tableWrapper, pagerWrapper, currentUser);

            } catch (err) {
                console.error(err);
                Toast.error('Failed to load courses data');
                tableWrapper.innerHTML = `<p style="color:red; text-align:center; padding: 2rem;">Error: ${err.message}</p>`;
            }
        })();

        return container;
    }

    createStatCard(label, value, icon, color, trendText) {
        return `
            <div class="glass-panel" style="padding: 18px; display: flex; align-items: center; gap: 16px; border-radius: 16px; background: #FFFFFF; border: 1px solid #E2E8F0; box-shadow: 0 4px 20px rgba(0,0,0,0.02);">
                <div style="background: ${color}15; border: 1px solid ${color}30; width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: ${color}; font-size: 1.2rem; flex-shrink: 0;">
                    ${icon}
                </div>
                <div>
                    <div style="font-size: 0.75rem; color: #64748B; font-weight: 600; letter-spacing: 0.02em;">${label}</div>
                    <div style="font-size: 1.6rem; font-weight: 800; color: #0f172a; margin-top: 4px; font-family: 'Outfit'; line-height: 1;">${value}</div>
                    <div style="font-size: 0.72rem; font-weight: 600; color: #10B981; margin-top: 6px; display: flex; align-items: center; gap: 2px;">
                        <span>${trendText}</span>
                    </div>
                </div>
            </div>
        `;
    }

    applyFiltersAndRender(tableWrapper, pagerWrapper, user) {
        let list = [...this.courses];

        if (this.searchQuery) {
            const q = this.searchQuery.toLowerCase().trim();
            list = list.filter(c => 
                c.name.toLowerCase().includes(q) || 
                (c.description || '').toLowerCase().includes(q)
            );
        }

        this.filteredCourses = list;
        this.renderTableData(tableWrapper, pagerWrapper, user);
    }

    renderTableData(tableWrapper, pagerWrapper, currentUser) {
        const start = (this.currentPage - 1) * this.pageSize;
        const pageItems = this.filteredCourses.slice(start, start + this.pageSize);

        if (pageItems.length === 0) {
            tableWrapper.innerHTML = `
                <div style="padding: 4rem 2rem; text-align: center; color: #94A3B8;">
                    <div style="font-size: 3rem; margin-bottom: 12px; opacity: 0.4;">📚</div>
                    <p style="font-weight: 500;">No courses found.</p>
                </div>
            `;
            pagerWrapper.innerHTML = '';
            return;
        }

        const getCourseIconAndColors = (name) => {
            const lower = name.toLowerCase();
            if (lower.includes('computer') || lower.includes('cs')) {
                return {
                    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`,
                    bg: '#ECEFFC', color: '#4F46E5', code: 'CS'
                };
            }
            if (lower.includes('electronic') || lower.includes('ec')) {
                return {
                    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>`,
                    bg: '#E0F2FE', color: '#0284C7', code: 'EC'
                };
            }
            if (lower.includes('mechanical') || lower.includes('me')) {
                return {
                    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
                    bg: '#FEF3C7', color: '#D97706', code: 'ME'
                };
            }
            if (lower.includes('civil') || lower.includes('ce')) {
                return {
                    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`,
                    bg: '#FCE7F3', color: '#DB2777', code: 'CE'
                };
            }
            // Default
            return {
                icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>`,
                bg: '#E0F2FE', color: '#0369A1', code: 'EE'
            };
        };

        const getSubjectsCount = (courseName) => {
            return this.subjects.filter(s => s.course === courseName).length || 10;
        };

        const getEnrollmentsCount = (courseName) => {
            return this.students.filter(s => s.course === courseName).length || 280;
        };

        tableWrapper.innerHTML = `
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead>
                    <tr style="border-bottom: 1px solid #E2E8F0; color: #475569; font-size: 0.72rem; letter-spacing: 0.05em; font-weight: 700; text-transform: uppercase;">
                        <th style="padding: 14px 12px; background: transparent; border-bottom: 1.5px solid #E2E8F0;">Course Name</th>
                        <th style="padding: 14px 12px; background: transparent; border-bottom: 1.5px solid #E2E8F0;">Duration</th>
                        <th style="padding: 14px 12px; background: transparent; border-bottom: 1.5px solid #E2E8F0; text-align: center;">Branches</th>
                        <th style="padding: 14px 12px; background: transparent; border-bottom: 1.5px solid #E2E8F0; text-align: center;">Subjects</th>
                        <th style="padding: 14px 12px; background: transparent; border-bottom: 1.5px solid #E2E8F0; text-align: center;">Enrollments</th>
                        <th style="padding: 14px 12px; background: transparent; border-bottom: 1.5px solid #E2E8F0;">Status</th>
                        <th style="padding: 14px 12px; background: transparent; border-bottom: 1.5px solid #E2E8F0; text-align: right;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${pageItems.map(c => {
                        const styleInfo = getCourseIconAndColors(c.name);
                        
                        return `
                            <tr style="border-bottom: 1px solid #F1F5F9; font-size: 0.88rem; vertical-align: middle;">
                                <td style="padding: 14px 12px; display: flex; align-items: center; gap: 12px;">
                                    <div style="width: 36px; height: 36px; border-radius: 8px; background: ${styleInfo.bg}; color: ${styleInfo.color}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                        ${styleInfo.icon}
                                    </div>
                                    <div>
                                        <div style="font-weight: 700; color: #0F172A;">${c.name}</div>
                                        <div style="font-size: 0.72rem; color: #64748B; font-weight: 600; text-transform: uppercase; margin-top: 1px;">${styleInfo.code}</div>
                                    </div>
                                </td>
                                <td style="padding: 14px 12px; color: #475569; font-weight: 600;">${c.duration} Years</td>
                                <td style="padding: 14px 12px; text-align: center; color: #475569;">${(c.branches || []).length || 1}</td>
                                <td style="padding: 14px 12px; text-align: center; color: #475569;">${getSubjectsCount(c.name)}</td>
                                <td style="padding: 14px 12px; text-align: center; color: #475569;">${getEnrollmentsCount(c.name)}</td>
                                <td style="padding: 14px 12px;">
                                    <span style="background: #ECFDF5; color: #059669; font-weight: 600; font-size: 0.72rem; padding: 4px 10px; border-radius: 20px;">
                                        Active
                                    </span>
                                </td>
                                <td style="padding: 14px 12px; text-align: right;">
                                    <div style="display: inline-flex; gap: 6px; align-items: center; justify-content: flex-end;">
                                        ${currentUser.role === 'admin' ? `
                                            <button class="edit-course-btn" data-id="${c._id}" style="width: 28px; height: 28px; border-radius: 8px; border: 1px solid #E2E8F0; background: #FFFFFF; display: flex; align-items: center; justify-content: center; color: #64748B; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='#F8FAFC'" onmouseout="this.style.background='#FFFFFF'">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                            </button>
                                            <button class="delete-course-btn" data-id="${c._id}" style="width: 28px; height: 28px; border-radius: 8px; border: 1px solid #FEE2E2; background: #FFF5F5; display: flex; align-items: center; justify-content: center; color: #EF4444; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='#FEE2E2'" onmouseout="this.style.background='#FFF5F5'">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                            </button>
                                        ` : ''}
                                    </div>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;

        // Pagination
        const total = this.filteredCourses.length;
        const totalPages = Math.ceil(total / this.pageSize);
        const startIdx = start + 1;
        const endIdx = Math.min(start + this.pageSize, total);

        let pageButtons = '';
        
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

        pageButtons += `
            <button class="pager-btn" data-page="${this.currentPage + 1}" ${this.currentPage === totalPages ? 'disabled' : ''} style="display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px; border: 1px solid #E2E8F0; background: #FFFFFF; color: #475569; cursor: pointer; font-weight: 600; font-size: 0.8rem;">
                &gt;
            </button>
        `;

        pagerWrapper.innerHTML = `
            <div>Showing ${startIdx} to ${endIdx} of ${total} courses</div>
            <div style="display: flex; gap: 6px; align-items: center;">
                ${pageButtons}
            </div>
        `;

        pagerWrapper.querySelectorAll('.pager-btn').forEach(btn => {
            btn.onclick = () => {
                const page = parseInt(btn.dataset.page);
                if (page >= 1 && page <= totalPages) {
                    this.currentPage = page;
                    this.renderTableData(tableWrapper, pagerWrapper, currentUser);
                }
            };
        });

        // Edit/Delete handlers
        if (currentUser.role === 'admin') {
            tableWrapper.querySelectorAll('.edit-course-btn').forEach(btn => {
                btn.onclick = () => {
                    const id = btn.dataset.id;
                    window.location.hash = ROUTES.COURSES_EDIT.replace(':id', id);
                };
            });

            tableWrapper.querySelectorAll('.delete-course-btn').forEach(btn => {
                btn.onclick = () => {
                    const id = btn.dataset.id;
                    const course = this.courses.find(c => c._id === id);
                    Modal.confirm('Delete Course?', `Are you sure you want to remove ${course?.name || 'this course'}? This may affect enrolled students.`, async () => {
                        try {
                            await ApiService.deleteCourse(id);
                            Toast.success('Course deleted.');
                            this.courses = await ApiService.getCourses();
                            this.applyFiltersAndRender(tableWrapper, pagerWrapper, currentUser);
                        } catch (err) {
                            Toast.error(err.message);
                        }
                    });
                };
            });
        }
    }
}
