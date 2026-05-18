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
        let fullUser = storage.getData('users').find(u => u.id === user.id || u.id === user._id || u._id === user.id);
        if (!fullUser) fullUser = user;

        if (!fullUser || (!fullUser.id && !fullUser._id)) {
            container.innerHTML = '<div class="glass-panel" style="padding: 3rem; text-align: center;">Identity not verified. Please re-login.</div>';
            return container;
        }

        this.loadExtendedProfile(container, fullUser);
        return container;
    }

    async loadExtendedProfile(container, user) {
        container.innerHTML = `
            <div style="padding: 5rem; text-align: center;">
                <div class="loader-spinner" style="width: 40px; height: 40px; border: 4px solid var(--accent-glow); border-top-color: var(--accent-color); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1.5rem;"></div>
                <p style="color: var(--text-secondary); font-weight: 500;">Accessing user vault...</p>
            </div>
        `;

        let extraInfo = null;
        try {
            const uid = user.id || user._id;
            if (user.role === 'student') {
                const students = await ApiService.getStudents();
                extraInfo = students.find(s => (s.userId?._id || s.userId) == uid);
            } else if (user.role === 'teacher') {
                const faculty = await ApiService.getFaculty();
                extraInfo = faculty.find(f => (f.userId?._id || f.userId) == uid);
            }
        } catch (err) { console.error(err); }

        this.renderContent(container, user, extraInfo);
    }

    renderContent(container, user, extraInfo) {
        container.innerHTML = '';

        const header = document.createElement('div');
        header.style.marginBottom = '2.5rem';
        header.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 0.5rem;">
                <span style="font-size: 2rem;">👤</span>
                <h2 style="font-size: 2rem; margin: 0; letter-spacing: -1px;">My Account</h2>
            </div>
            <p style="color: var(--text-secondary); font-size: 1rem; font-weight: 500;">Personalize your profile and manage account security.</p>
        `;
        container.appendChild(header);

        const card = document.createElement('div');
        card.className = 'glass-panel';
        card.style.maxWidth = '1000px';
        card.style.margin = '0 auto';
        card.style.display = 'grid';
        card.style.gridTemplateColumns = '320px 1fr';
        card.style.gap = '0';
        card.style.overflow = 'hidden';
        card.style.padding = '0';

        // Sidebar Panel
        const sidePanel = document.createElement('div');
        sidePanel.style.padding = '3rem 2rem';
        sidePanel.style.background = 'linear-gradient(180deg, var(--bg-secondary), transparent)';
        sidePanel.style.borderRight = '1px solid var(--glass-border)';
        sidePanel.style.textAlign = 'center';
        sidePanel.innerHTML = `
            <div style="width: 120px; height: 120px; border-radius: 40px; background: linear-gradient(135deg, var(--accent-color), #4f46e5); margin: 0 auto 1.5rem; display: flex; align-items: center; justify-content: center; font-size: 3rem; font-weight: 800; color: white; box-shadow: 0 20px 40px rgba(99, 102, 241, 0.3); transform: rotate(-5deg);">
                ${user.name ? user.name.charAt(0).toUpperCase() : '?'}
            </div>
            <h3 style="margin: 0 0 0.5rem; font-size: 1.5rem; letter-spacing: -0.5px;">${user.name}</h3>
            <div style="display:inline-block; padding: 4px 12px; background: var(--accent-glow); color: var(--accent-color); border-radius: 20px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3rem;">
                ${user.role}
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 0.75rem; text-align: left;">
                <button id="changePassBtn" style="background: var(--bg-primary); border: 1px solid var(--glass-border); border-radius: 12px; padding: 12px 16px; font-size: 0.85rem; font-weight: 700; color: var(--text-primary); cursor: pointer; display: flex; align-items: center; gap: 10px;">
                    <span>🛡️</span> Security Settings
                </button>
                <button id="logoutBtn" style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 12px; padding: 12px 16px; font-size: 0.85rem; font-weight: 700; color: var(--danger); cursor: pointer; display: flex; align-items: center; gap: 10px;">
                    <span>👋</span> Log Out
                </button>
            </div>
        `;
        card.appendChild(sidePanel);

        // Form Panel
        const formPanel = document.createElement('div');
        formPanel.style.padding = '3rem';
        
        let academic = '';
        if (extraInfo) {
            academic = `
                <div style="margin-top: 2.5rem; padding-top: 2rem; border-top: 1px dashed var(--glass-border);">
                    <h4 style="font-size: 0.75rem; font-weight: 800; color: var(--accent-color); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1.5rem;">Academic Verification</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                        ${user.role === 'student' ? `
                            <div><label style="font-size:0.65rem; font-weight:800; color:var(--text-secondary); text-transform:uppercase;">Program</label><div style="font-weight:700; margin-top:4px;">${extraInfo.course || '---'}</div></div>
                            <div><label style="font-size:0.65rem; font-weight:800; color:var(--text-secondary); text-transform:uppercase;">Registration</label><div style="font-weight:700; margin-top:4px;">${extraInfo.rollNo || '---'}</div></div>
                            <div><label style="font-size:0.65rem; font-weight:800; color:var(--text-secondary); text-transform:uppercase;">Semester</label><div style="font-weight:700; margin-top:4px;">SEM ${extraInfo.semester || '---'}</div></div>
                            <div><label style="font-size:0.65rem; font-weight:800; color:var(--text-secondary); text-transform:uppercase;">Origin</label><div style="font-weight:700; margin-top:4px;">${extraInfo.address || 'Internship Host'}</div></div>
                        ` : `
                            <div><label style="font-size:0.65rem; font-weight:800; color:var(--text-secondary); text-transform:uppercase;">Faculty Dept.</label><div style="font-weight:700; margin-top:4px;">${extraInfo.department || 'General'}</div></div>
                            <div><label style="font-size:0.65rem; font-weight:800; color:var(--text-secondary); text-transform:uppercase;">Rank</label><div style="font-weight:700; margin-top:4px;">${extraInfo.designation || 'Lecturer'}</div></div>
                            <div><label style="font-size:0.65rem; font-weight:800; color:var(--text-secondary); text-transform:uppercase;">Qualifications</label><div style="font-weight:700; margin-top:4px;">${extraInfo.qualification || '---'}</div></div>
                            <div><label style="font-size:0.65rem; font-weight:800; color:var(--text-secondary); text-transform:uppercase;">Contact</label><div style="font-weight:700; margin-top:4px;">${extraInfo.phone || '---'}</div></div>
                        `}
                    </div>
                </div>
            `;
        }

        formPanel.innerHTML = `
            <form id="profileForm" style="display: flex; flex-direction: column; gap: 1.5rem;">
                <div>
                    <label style="display: block; margin-bottom: 6px; font-size: 0.75rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase;">Public Name</label>
                    <input type="text" name="name" value="${user.name}" ${!this.editing ? 'readonly' : ''} style="${!this.editing ? 'background:transparent; border-color:transparent; padding:0; font-weight:800; font-size:1.1rem; color:var(--text-primary);' : ''}">
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                    <div>
                        <label style="display: block; margin-bottom: 6px; font-size: 0.75rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase;">User handle</label>
                        <input type="text" value="@${user.username}" readonly style="background:transparent; border-color:transparent; padding:0; font-weight:700; color:var(--text-secondary); opacity:0.7;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 6px; font-size: 0.75rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase;">Email synchronization</label>
                        <input type="email" name="email" value="${user.email || ''}" ${!this.editing ? 'readonly' : ''} style="${!this.editing ? 'background:transparent; border-color:transparent; padding:0; font-weight:700; color:var(--text-primary);' : ''}">
                    </div>
                </div>
                ${academic}
                <div style="margin-top: 1rem; text-align: right;">
                    ${!this.editing ? 
                        '<button type="button" id="editProfileBtn" class="glass-button" style="padding: 10px 24px; font-weight: 700;">✏️ Edit Personal Info</button>' : 
                        '<button type="button" id="cancelEditBtn" style="background:transparent; border:none; color:var(--text-secondary); font-weight:700; margin-right: 1.5rem; cursor:pointer;">Discard</button><button type="submit" class="glass-button" style="background:var(--accent-color); color:white; border:none; padding:10px 24px; font-weight:700;">💾 Save Identity</button>'
                    }
                </div>
            </form>
        `;
        card.appendChild(formPanel);
        container.appendChild(card);

        this.attachListeners(container, user, extraInfo);
    }

    attachListeners(container, user, extraInfo) {
        if (container.querySelector('#editProfileBtn')) container.querySelector('#editProfileBtn').onclick = () => { this.editing = true; this.renderContent(container, user, extraInfo); };
        if (container.querySelector('#cancelEditBtn')) container.querySelector('#cancelEditBtn').onclick = () => { this.editing = false; this.renderContent(container, user, extraInfo); };
        
        const form = container.querySelector('#profileForm');
        if (form instanceof HTMLFormElement) {
            form.onsubmit = (e) => {
                e.preventDefault();
                const data = Object.fromEntries(new FormData(form).entries());
                storage.updateItem('users', user.id, data);
                const session = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSION));
                session.name = data.name;
                localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
                auth.checkSession();
                this.editing = false;
                Toast.success('Vault Updated');
                const updated = storage.getData('users').find(u => u.id === user.id);
                this.renderContent(container, updated, extraInfo);
            };
        }

        if (container.querySelector('#logoutBtn')) container.querySelector('#logoutBtn').onclick = () => {
            Modal.confirm('End Session?', 'Do you want to sign out from this device?', () => { auth.logout(); window.location.hash = ROUTES.LOGIN; });
        };
        if (container.querySelector('#changePassBtn')) container.querySelector('#changePassBtn').onclick = () => this.showPasswordModal();
    }

    showPasswordModal() {
        const modalContent = document.createElement('div');
        modalContent.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 1rem;">
                <div><label style="display:block; margin-bottom:6px; font-size:0.7rem; font-weight:800; color:var(--text-secondary); text-transform:uppercase;">New Password</label><input type="password" id="newPass" style="width:100%;" placeholder="••••••••"></div>
                <div><label style="display:block; margin-bottom:6px; font-size:0.7rem; font-weight:800; color:var(--text-secondary); text-transform:uppercase;">Verify Password</label><input type="password" id="confirmPass" style="width:100%;" placeholder="••••••••"></div>
            </div>
        `;
        Modal.show({
            title: 'Privacy Guard',
            content: modalContent,
            confirmText: 'Sync Password',
            onConfirm: async () => {
                const n = modalContent.querySelector('#newPass').value;
                const c = modalContent.querySelector('#confirmPass').value;
                if (n !== c) return Toast.error('Mismatch!');
                if (n.length < 5) return Toast.error('Too short!');
                storage.updateItem('users', auth.getUser().id, { password: storage.hashPassword(n) });
                Toast.success('Secure!');
                return true;
            }
        });
    }
}
