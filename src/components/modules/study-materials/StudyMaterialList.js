import { ApiService } from '../../../services/ApiService.js';
import { auth } from '../../../services/AuthService.js';
import { Toast } from '../../../services/Toast.js';
import { Modal } from '../../../services/Modal.js';

export class StudyMaterialList {
    constructor() {
        this.materials = [];
        this.subjects = [];
        this.selectedSubject = '';
    }

    render() {
        const user = auth.getUser();
        const container = document.createElement('div');
        container.className = 'fade-in';

        // Header
        const header = document.createElement('div');
        header.style.marginBottom = 'var(--space-md)';
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.flexWrap = 'wrap';
        header.style.gap = '1.5rem';

        header.innerHTML = `
            <div>
                <h2 style="font-size: 1.75rem; margin-bottom: 0.25rem;">Academic Repository</h2>
                <p style="color: var(--text-secondary); font-size: 0.95rem;">Digital library for notes, slideshows, and reference materials</p>
            </div>
            ${user.role === 'teacher' ? '<button id="upload-material" class="glass-button" style="padding: 10px 20px; font-size: 0.85rem; border:none;">+ Add Resource</button>' : ''}
        `;
        container.appendChild(header);

        const listContainer = document.createElement('div');
        listContainer.id = 'material-list-results';
        container.appendChild(listContainer);

        // Load Initial Data
        this.loadSubjects();
        this.loadMaterials(listContainer);

        // Event Listeners
        const uploadBtn = /** @type {HTMLElement} */ (header.querySelector('#upload-material'));
        if (uploadBtn) uploadBtn.onclick = () => this.showUploadModal(listContainer);

        return container;
    }

    async loadSubjects() {
        try {
            const [allSubjects, allTimetables] = await Promise.all([
                ApiService.getSubjects(),
                ApiService.getTimetables()
            ]);
            const user = auth.getUser();

            if (user.role === 'teacher') {
                const myAssignedSubjects = new Set();
                allTimetables.forEach(t => {
                    if (t.grid) {
                        Object.values(t.grid).forEach(slot => {
                            const isMine = slot.teacher === user.name ||
                                (user.facultyId && slot.teacher === String(user.facultyId)) ||
                                slot.teacher === user._id;
                            if (isMine) myAssignedSubjects.add(slot.subject);
                        });
                    }
                });
                this.subjects = allSubjects.filter(s => myAssignedSubjects.has(s.name));
            } else if (user.role === 'student') {
                const allStudents = await ApiService.getStudents();
                const profile = allStudents.find(s => (s.userId?._id || s.userId) === user._id);
                if (profile) {
                    this.subjects = allSubjects.filter(s =>
                        s.course === profile.course &&
                        String(s.year) === String(profile.year) &&
                        String(s.semester) === String(profile.semester)
                    );
                } else {
                    this.subjects = [];
                }
            } else {
                this.subjects = allSubjects;
            }
        } catch (err) { console.error('Subject loading error', err); }
    }

    async loadMaterials(container) {
        container.innerHTML = '<p style="text-align:center; padding:3rem; font-size: 0.9rem;">Indexing digital resources...</p>';
        try {
            const data = await ApiService.getStudyMaterials();
            // If student, filter materials to only enrolled subjects
            let displayData = data;
            if (auth.getUser().role === 'student') {
                const mySubjectIds = this.subjects.map(s => s._id);
                displayData = data.filter(m => {
                    const sId = m.subject?._id || m.subject;
                    return mySubjectIds.includes(sId);
                });
            }

            this.materials = displayData;

            if (this.materials.length === 0) {
                container.innerHTML = `
                    <div class="glass-panel" style="padding: 4rem; text-align: center; border: 1px dashed var(--glass-border);">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">📚</div>
                        <h3 style="margin-bottom: 0.5rem; font-size: 1.25rem;">Inventory is Empty</h3>
                        <p style="color: var(--text-secondary); font-size: 0.9rem;">No study materials available for your subjects yet.</p>
                    </div>`;
                return;
            }

            const grid = document.createElement('div');
            grid.style.display = 'grid';
            grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
            grid.style.gap = '1.25rem';

            this.materials.forEach(m => {
                const card = document.createElement('div');
                card.className = 'glass-panel fade-in';
                card.style.padding = '1.25rem';
                card.style.position = 'relative';
                card.style.display = 'flex';
                card.style.flexDirection = 'column';
                card.style.border = '1px solid var(--glass-border)';

                const icons = {
                    'Video': '🎬',
                    'PPT': '📊',
                    'Notes': '📝',
                    'Reference Book': '📖'
                };
                const icon = icons[m.type] || '📎';

                card.innerHTML = `
                    <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1rem;">
                        <div style="font-size: 1.5rem; background: var(--bg-primary); width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 10px; border: 1px solid var(--glass-border);">${icon}</div>
                        ${auth.getUser().role === 'teacher' ? `
                            <button class="delete-mat" data-id="${m._id}" style="background: rgba(239, 68, 68, 0.03); border: none; color: var(--danger); width: 28px; height: 28px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">✕</button>
                        ` : ''}
                    </div>
                    
                    <h3 style="margin-bottom: 0.4rem; font-size: 1.1rem; line-height: 1.3;">${m.title}</h3>
                    <div style="display: flex; gap: 6px; margin-bottom: 0.75rem; flex-wrap: wrap;">
                        <span style="font-size: 0.65rem; color: var(--accent-color); font-weight: 800; background: var(--accent-glow); padding: 3px 8px; border-radius: 8px; text-transform: uppercase;">${m.subject?.name || 'Subject'}</span>
                        <span style="font-size: 0.65rem; color: var(--text-secondary); font-weight: 700; background: rgba(0,0,0,0.03); padding: 3px 8px; border-radius: 8px; text-transform: uppercase;">${m.type}</span>
                    </div>
                    
                    <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1.25rem; height: 2.6rem; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.4;">${m.description || 'No additional context provided.'}</p>
                    
                    <div style="display: flex; gap: 0.75rem; margin-top: auto;">
                        ${m.fileUrl ? `<a href="${m.fileUrl}" target="_blank" class="glass-button" style="flex: 1; padding: 8px; font-size: 0.8rem; text-decoration:none;">Download</a>` : ''}
                        ${m.link ? `<a href="${m.link}" target="_blank" class="glass-button" style="flex: 1; padding: 8px; font-size: 0.8rem; text-decoration:none; background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--glass-border);">Access Link</a>` : ''}
                    </div>
                `;

                const delBtn = /** @type {HTMLElement} */ (card.querySelector('.delete-mat'));
                if (delBtn) {
                    delBtn.onclick = () => this.deleteMaterial(m._id, container);
                }

                grid.appendChild(card);
            });

            container.innerHTML = '';
            container.appendChild(grid);

        } catch (err) {
            Toast.error('Gallery sync failed');
            container.innerHTML = `<p style="color:var(--danger); text-align:center; padding: 3rem;">Error sync storage: ${err.message}</p>`;
        }
    }

    showUploadModal(refreshContainer) {
        const modalContent = document.createElement('div');
        modalContent.style.padding = '0.5rem 0';
        modalContent.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 1rem;">
                <div>
                    <label style="font-weight: 700; font-size: 0.85rem; margin-bottom: 0.4rem; display: block;">Resource Designation</label>
                    <input type="text" id="mat-title" style="width: 100%; padding: 10px;" placeholder="e.g. Calculus Notes">
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div>
                        <label style="font-weight: 700; font-size: 0.85rem; margin-bottom: 0.4rem; display: block;">Media Type</label>
                        <select id="mat-type" style="width: 100%; padding: 10px;">
                            <option>Notes</option>
                            <option>PPT</option>
                            <option>Video</option>
                            <option>Reference Book</option>
                            <option>Other</option>
                        </select>
                    </div>
                    <div>
                        <label style="font-weight: 700; font-size: 0.85rem; margin-bottom: 0.4rem; display: block;">Linked Subject</label>
                        <select id="mat-subject" style="width: 100%; padding: 10px;">
                            ${this.subjects.map(s => `<option value="${s._id}">${s.name}</option>`).join('')}
                        </select>
                    </div>
                </div>
                 <div>
                    <label style="font-weight: 700; font-size: 0.85rem; margin-bottom: 0.4rem; display: block;">Resource URL / Cloud Link</label>
                    <input type="text" id="mat-link" style="width: 100%; padding: 10px;" placeholder="https://cloud.com/file">
                </div>
                <div>
                    <label style="font-weight: 700; font-size: 0.85rem; margin-bottom: 0.4rem; display: block;">Context Description</label>
                    <textarea id="mat-desc" style="width: 100%; height: 80px; padding: 10px;" placeholder="Briefly explain content..."></textarea>
                </div>
            </div>
        `;

        Modal.show({
            title: 'Publish Academic Resource',
            content: modalContent,
            confirmText: 'Publish',
            onConfirm: async () => {
                const title = /** @type {HTMLInputElement} */ (modalContent.querySelector('#mat-title')).value;
                const type = /** @type {HTMLSelectElement} */ (modalContent.querySelector('#mat-type')).value;
                const subjectId = /** @type {HTMLSelectElement} */ (modalContent.querySelector('#mat-subject')).value;
                const link = /** @type {HTMLInputElement} */ (modalContent.querySelector('#mat-link')).value;
                const description = /** @type {HTMLTextAreaElement} */ (modalContent.querySelector('#mat-desc')).value;
                const sub = this.subjects.find(s => s._id === subjectId);

                if (!title || !link) {
                    Toast.error('Title and Link required');
                    return false;
                }

                try {
                    await ApiService.createStudyMaterial({
                        title, type,
                        subject: subjectId,
                        course: sub?.course,
                        link,
                        description
                    });
                    Toast.success('Material published!');
                    this.loadMaterials(refreshContainer);
                    return true;
                } catch (err) {
                    Toast.error(err.message);
                    return false;
                }
            }
        });
    }

    async deleteMaterial(id, refreshContainer) {
        Modal.confirm('Delete Resource?', 'This will be removed from the library. Continue?', async () => {
            try {
                await ApiService.deleteStudyMaterial(id);
                Toast.success('Resource purged');
                this.loadMaterials(refreshContainer);
                return true;
            } catch (err) {
                Toast.error(err.message);
                return false;
            }
        });
    }
}
