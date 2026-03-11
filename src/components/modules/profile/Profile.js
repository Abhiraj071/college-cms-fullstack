import { storage } from '../../../services/StorageService.js';
import { auth } from '../../../services/AuthService.js';
import { ApiService } from '../../../services/ApiService.js';
import { ROUTES, STORAGE_KEYS } from '../../../services/Constants.js';
import { Toast } from '../../../services/Toast.js';
import { Modal } from '../../../services/Modal.js';

export class Profile {
    constructor() {
        this.editing = false;
    }

    render() {
        const container = document.createElement('div');
        container.className = 'fade-in';

        const user = auth.getUser();
        // Basic user data from storage (sync)
        let fullUser = storage.getData('users').find(u => u.id === user.id || u.id === user._id || u._id === user.id);

        if (!fullUser) fullUser = user;

        if (!fullUser || (!fullUser.id && !fullUser._id)) {
            container.innerHTML = '<div class="glass-panel" style="padding: 2rem;">User profile not found. Please re-login.</div>';
            return container;
        }

        // Load extended data asynchronously
        this.loadExtendedProfile(container, fullUser);
        return container;
    }

    async loadExtendedProfile(container, user) {
        // Initial generic render (loading state or just basic info)
        container.innerHTML = `<div class="glass-panel" style="padding: 4rem; text-align: center;">Loading Profile...</div>`;

        let extraInfo = null;
        try {
            const uid = user.id || user._id;
            if (user.role === 'student') {
                const students = await ApiService.getStudents();
                extraInfo = students.find(s => {
                    const sId = s.userId?._id || s.userId;
                    return sId == uid;
                });
            } else if (user.role === 'teacher') {
                const faculty = await ApiService.getFaculty();
                extraInfo = faculty.find(f => {
                    const fId = f.userId?._id || f.userId;
                    return fId == uid;
                });
            }
        } catch (err) {
            console.error('Failed to load extended profile', err);
        }

        this.renderContent(container, user, extraInfo);
    }

    renderContent(container, user, extraInfo) {
        container.innerHTML = '';

        const header = document.createElement('div');
        header.style.marginBottom = '2.5rem';
        header.innerHTML = `
            <h2>My Account</h2>
            <p style="color: var(--text-secondary);">View and update your personal information</p>
        `;
        container.appendChild(header);

        const card = document.createElement('div');
        card.className = 'glass-panel';
        card.style.maxWidth = '900px';
        card.style.margin = '0 auto';
        card.style.padding = '3rem';

        const content = document.createElement('div');
        content.style.display = 'grid';
        content.style.gridTemplateColumns = 'repeat(auto-fit, minmax(280px, 1fr))';
        content.style.gap = '3rem';

        // Avatar Section
        const avatarCol = document.createElement('div');
        avatarCol.style.textAlign = 'center';
        avatarCol.innerHTML = `
            <div style="width: 140px; height: 140px; border-radius: 50%; background: var(--accent-color); margin: 0 auto 1.5rem; display: flex; align-items: center; justify-content: center; font-size: 3.5rem; font-weight: bold; box-shadow: 0 10px 40px rgba(99, 102, 241, 0.4); color: white;">
                ${user.name ? user.name.charAt(0).toUpperCase() : '?'}
            </div>
            <h3 style="margin-bottom: 0.5rem; font-size: 1.5rem;">${user.name}</h3>
            <span style="padding: 6px 16px; background: rgba(99, 102, 241, 0.1); color: var(--accent-color); border-radius: 20px; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                ${user.role}
            </span>
            
            <div style="margin-top: 3rem; display: flex; flex-direction: column; gap: 1rem;">
                <button id="changePassBtn" class="glass-button" style="width: 100%; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.05); color: var(--text-primary);">Change Password</button>
                <button id="logoutBtn" class="glass-button" style="width: 100%; background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3); color: var(--danger);">Sign Out</button>
            </div>
        `;
        content.appendChild(avatarCol);

        // Settings Section
        const settingsCol = document.createElement('div');

        // Build Extended Info HTML
        let extendedFields = '';
        if (extraInfo) {
            extendedFields += `<div style="margin-top: 2rem; padding-top: 2rem; border-top: 1px dashed var(--glass-border);">
                <h4 style="margin-bottom: 1rem; color: var(--accent-color);">Academic Details</h4>`;

            if (user.role === 'student') {
                extendedFields += `
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                        <div>
                            <label style="font-size:0.8rem; color:var(--text-secondary);">Course</label>
                            <div style="font-weight:600;">${extraInfo.course || 'N/A'}</div>
                        </div>
                        <div>
                            <label style="font-size:0.8rem; color:var(--text-secondary);">Roll No</label>
                            <div style="font-weight:600;">${extraInfo.rollNo || 'N/A'}</div>
                        </div>
                         <div>
                            <label style="font-size:0.8rem; color:var(--text-secondary);">Year</label>
                            <div style="font-weight:600;">${Math.ceil((extraInfo.semester || 1) / 2)}</div>
                        </div>
                        <div>
                            <label style="font-size:0.8rem; color:var(--text-secondary);">Semester</label>
                            <div style="font-weight:600;">${extraInfo.semester || 'N/A'}</div>
                        </div>
                    </div>
                    <div>
                        <label style="font-size:0.8rem; color:var(--text-secondary);">Address</label>
                        <div style="font-weight:600;">${extraInfo.address || 'N/A'}</div>
                    </div>
                `;
            } else if (user.role === 'teacher') {
                extendedFields += `
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                        <div>
                            <label style="font-size:0.8rem; color:var(--text-secondary);">Department</label>
                            <div style="font-weight:600;">${extraInfo.department || 'N/A'}</div>
                        </div>
                        <div>
                            <label style="font-size:0.8rem; color:var(--text-secondary);">Designation</label>
                            <div style="font-weight:600;">${extraInfo.designation || 'Faculty'}</div>
                        </div>
                        <div>
                            <label style="font-size:0.8rem; color:var(--text-secondary);">Qualification</label>
                            <div style="font-weight:600;">${extraInfo.qualification || 'N/A'}</div>
                        </div>
                        <div>
                            <label style="font-size:0.8rem; color:var(--text-secondary);">Phone</label>
                            <div style="font-weight:600;">${extraInfo.phone || 'N/A'}</div>
                        </div>
                    </div>
                `;
            }
            extendedFields += `</div>`;
        }

        settingsCol.innerHTML = `
            <form id="profileForm">
                <div style="margin-bottom: 1.5rem;">
                    <label>Full Name</label>
                    <input type="text" name="name" value="${user.name}" ${!this.editing ? 'readonly' : ''} 
                        style="${!this.editing ? 'background: transparent; border-bottom: 1px solid rgba(0,0,0,0.1); border-top: none; border-left: none; border-right: none;' : ''}">
                </div>
                <div style="margin-bottom: 1.5rem;">
                    <label>Login Username</label>
                    <input type="text" value="${user.username}" readonly style="background: transparent; border-bottom: 1px solid rgba(0,0,0,0.1); border-top: none; border-left: none; border-right: none; opacity: 0.6;">
                    <small style="color: var(--text-secondary); display: block; margin-top: 0.2rem;">Username cannot be changed.</small>
                </div>
                <div style="margin-bottom: 2rem;">
                    <label>Email Address</label>
                    <input type="email" name="email" value="${user.email || ''}" ${!this.editing ? 'readonly' : ''}
                        style="${!this.editing ? 'background: transparent; border-bottom: 1px solid rgba(0,0,0,0.1); border-top: none; border-left: none; border-right: none;' : ''}">
                </div>
                
                ${extendedFields}

                <div style="text-align: right; margin-top: 2rem;">
                    ${!this.editing ?
                '<button type="button" id="editProfileBtn" class="glass-button">Edit Account Info</button>' :
                '<button type="button" id="cancelEditBtn" class="glass-button" style="background: transparent; margin-right: 1rem; color: var(--text-primary);">Cancel</button><button type="submit" class="glass-button">Save Changes</button>'
            }
                </div>
            </form>
        `;
        content.appendChild(settingsCol);
        card.appendChild(content);
        container.appendChild(card);

        this.attachListeners(container, user, extraInfo);
    }

    attachListeners(container, user, extraInfo) {
        const editBtn = container.querySelector('#editProfileBtn');
        if (editBtn) {
            editBtn.onclick = () => {
                this.editing = true;
                this.renderContent(container, user, extraInfo);
            };
        }

        const cancelBtn = container.querySelector('#cancelEditBtn');
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                this.editing = false;
                this.renderContent(container, user, extraInfo);
            };
        }

        const form = container.querySelector('#profileForm');
        if (form instanceof HTMLFormElement) {
            form.onsubmit = (e) => {
                e.preventDefault();
                const data = Object.fromEntries(new FormData(form).entries());
                storage.updateItem('users', user.id, data);

                // Sync with session if needed
                const session = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSION));
                session.name = data.name;
                localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
                auth.checkSession(); // Re-sync auth object

                this.editing = false;
                Toast.success('Profile updated successfully!');

                // Reload data to reflect
                const updatedUser = storage.getData('users').find(u => u.id === user.id);
                this.renderContent(container, updatedUser, extraInfo);
            };
        }

        const logoutBtn = container.querySelector('#logoutBtn');
        if (logoutBtn) {
            logoutBtn.onclick = () => {
                Modal.confirm('Sign Out?', 'Are you sure you want to end your current session?', () => {
                    auth.logout();
                    window.location.hash = ROUTES.LOGIN;
                });
            };
        }

        const changePassBtn = container.querySelector('#changePassBtn');
        if (changePassBtn) changePassBtn.onclick = () => this.showPasswordModal();
    }

    showPasswordModal() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 3000;
        `;

        modal.innerHTML = `
            <div class="glass-panel" style="padding: 2.5rem; width: 400px; animation: fadeIn 0.3s ease-out;">
                <h3 style="margin-bottom: 1.5rem;">Change Password</h3>
                <form id="passForm">
                    <div style="margin-bottom: 1.2rem;">
                        <label>New Password</label>
                        <input type="password" name="newPass" required placeholder="••••••••">
                    </div>
                    <div style="margin-bottom: 2rem;">
                        <label>Confirm Password</label>
                        <input type="password" name="confirmPass" required placeholder="••••••••">
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 1rem;">
                        <button type="button" id="closeModal" class="glass-button" style="background: transparent; color: var(--text-primary);">Cancel</button>
                        <button type="submit" class="glass-button">Update Password</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        const closeModal = modal.querySelector('#closeModal');
        if (closeModal instanceof HTMLElement) {
            closeModal.onclick = () => modal.remove();
        }

        const passForm = modal.querySelector('#passForm');
        if (passForm instanceof HTMLFormElement) {
            passForm.onsubmit = (e) => {
                e.preventDefault();
                const formData = Object.fromEntries(new FormData(passForm).entries());
                const newPass = String(formData.newPass);
                const confirmPass = String(formData.confirmPass);

                if (newPass !== confirmPass) {
                    Toast.error('Passwords do not match!');
                    return;
                }

                if (newPass.length < 5) {
                    Toast.error('Password must be at least 5 characters long!');
                    return;
                }

                const user = auth.getUser();
                storage.updateItem('users', user.id, { password: storage.hashPassword(newPass) });
                Toast.success('Password changed successfully!');
                modal.remove();
            };
        }
    }
}
