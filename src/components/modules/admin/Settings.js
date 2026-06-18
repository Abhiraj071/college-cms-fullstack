import { ApiService } from '../../../services/ApiService.js';
import { Toast } from '../../../services/Toast.js';
import { ThemeService } from '../../../services/ThemeService.js';

export class Settings {
    constructor() {
    }

    render() {
        const container = document.createElement('div');
        container.className = 'fade-in';

        const header = document.createElement('div');
        header.style.marginBottom = '1.5rem';
        header.innerHTML = `
            <h2>System Administration</h2>
            <p style="color: var(--text-secondary);">Manage Application Data, Academic Policy, and Institution Profile</p>
        `;
        container.appendChild(header);

        // Switch Toggle Styling
        const toggleStyle = document.createElement('style');
        toggleStyle.textContent = `
            .switch input:checked + .slider {
                background-color: var(--accent-color) !important;
            }
            .switch .slider:before {
                position: absolute;
                content: "";
                height: 16px;
                width: 16px;
                left: 3px;
                bottom: 3px;
                background-color: white;
                transition: .4s;
                border-radius: 50%;
            }
            .switch input:checked + .slider:before {
                transform: translateX(22px);
            }
        `;
        container.appendChild(toggleStyle);

        // Tab Navigation
        const tabsContainer = document.createElement('div');
        tabsContainer.style.cssText = 'display:flex; flex-wrap:wrap; gap:10px; margin-bottom:2rem; border-bottom:1px solid var(--border-color); padding-bottom:2px;';
        tabsContainer.innerHTML = `
            <button class="tab-btn active" data-tab="profile" style="background:transparent; border:none; color:var(--text-primary); font-weight:600; padding:10px 16px; cursor:pointer; font-family:'Outfit'; font-size:0.95rem; border-bottom:2px solid transparent; transition:all 0.2s;">🏫 Institution Profile</button>
            <button class="tab-btn" data-tab="academic" style="background:transparent; border:none; color:var(--text-secondary); font-weight:600; padding:10px 16px; cursor:pointer; font-family:'Outfit'; font-size:0.95rem; border-bottom:2px solid transparent; transition:all 0.2s;">📚 Academic & Fees</button>
            <button class="tab-btn" data-tab="payment" style="background:transparent; border:none; color:var(--text-secondary); font-weight:600; padding:10px 16px; cursor:pointer; font-family:'Outfit'; font-size:0.95rem; border-bottom:2px solid transparent; transition:all 0.2s;">💳 Payment Gateway</button>
            <button class="tab-btn" data-tab="toggles" style="background:transparent; border:none; color:var(--text-secondary); font-weight:600; padding:10px 16px; cursor:pointer; font-family:'Outfit'; font-size:0.95rem; border-bottom:2px solid transparent; transition:all 0.2s;">🔒 Portal Access</button>
            <button class="tab-btn" data-tab="system" style="background:transparent; border:none; color:var(--text-secondary); font-weight:600; padding:10px 16px; cursor:pointer; font-family:'Outfit'; font-size:0.95rem; border-bottom:2px solid transparent; transition:all 0.2s;">⚙️ System & Theme</button>
        `;
        container.appendChild(tabsContainer);

        // Panels Container
        const panelsContainer = document.createElement('div');
        container.appendChild(panelsContainer);

        // ─── TAB 1: PROFILE ───
        const profilePanel = document.createElement('div');
        profilePanel.id = 'tab-profile';
        profilePanel.className = 'tab-panel';
        profilePanel.style.display = 'grid';
        profilePanel.style.gridTemplateColumns = 'repeat(auto-fit, minmax(320px, 1fr))';
        profilePanel.style.gap = '2rem';
        
        const profileCard = this.createCard('Institution Branding', 'Configure general identity details for document printing');
        profileCard.innerHTML += `
            <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
                <div>
                    <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.25rem; font-weight:600;">Institution Name</label>
                    <input type="text" id="inst-name" class="form-input" style="width: 100%;" placeholder="e.g. Global Institute of Technology">
                </div>
                <div>
                    <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.25rem; font-weight:600;">Affiliation & Subtitle</label>
                    <input type="text" id="inst-subheading" class="form-input" style="width: 100%;" placeholder="e.g. (Affiliated to Technical University & Approved by AICTE)">
                </div>
                <div>
                    <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.25rem; font-weight:600;">Controller of Examinations Name</label>
                    <input type="text" id="inst-controller" class="form-input" style="width: 100%;" placeholder="e.g. Prof. R. Sharma">
                </div>
                <button id="save-profile-btn" class="glass-button" style="background: var(--accent-color); color: white; font-weight:600; margin-top:0.5rem;">
                    💾 Save Branding Profile
                </button>
            </div>
        `;
        profilePanel.appendChild(profileCard);

        const previewCard = this.createCard('Document Live Preview', 'How printed cards will appear with current settings');
        previewCard.innerHTML += `
            <div style="margin-top: 1rem; padding: 1.5rem; background: #ffffff; border: 1px solid #ddd; border-radius: 8px; font-family: sans-serif; color:#000; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                <div style="border: 2px double #000; padding: 12px; text-align: center;">
                    <h4 id="preview-name" style="margin: 0; font-size: 14px; text-transform: uppercase; font-weight: 900; color:#000; font-family: Arial, sans-serif;">Global Institute of Technology</h4>
                    <p id="preview-subheading" style="margin: 4px 0 0 0; font-size: 9px; color:#333; font-family: Arial, sans-serif;">(Affiliated to Technical University & Approved by AICTE)</p>
                    <div style="margin: 8px 0; border-top: 1px dashed #000;"></div>
                    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 25px; font-size: 8px; color: #000; font-family: Arial, sans-serif;">
                        <span>STUDENT: JOHN DOE</span>
                        <div style="text-align: center;">
                            <span id="preview-controller" style="font-family: 'Brush Script MT', cursive, serif; font-size: 12px; font-weight:bold; display:block; color: #000; line-height: 1;">Prof. R. Sharma</span>
                            <span style="border-top:1px solid #000; font-weight:bold; padding-top:2px; display:inline-block; font-size:7px;">Controller of Examinations</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        profilePanel.appendChild(previewCard);
        panelsContainer.appendChild(profilePanel);

        // ─── TAB 2: ACADEMIC & FEES ───
        const academicPanel = document.createElement('div');
        academicPanel.id = 'tab-academic';
        academicPanel.className = 'tab-panel';
        academicPanel.style.display = 'none';
        academicPanel.style.gridTemplateColumns = 'repeat(auto-fit, minmax(320px, 1fr))';
        academicPanel.style.gap = '2rem';

        const semesterCard = this.createCard('Academic Calendar', 'Configure active semester term dates (triggers student rollovers)');
        semesterCard.innerHTML += `
            <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
                <div>
                    <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.25rem; font-weight:600;">Semester Start Date</label>
                    <input type="date" id="sem-start-date" class="form-input" style="width: 100%;">
                </div>
                <div>
                    <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.25rem; font-weight:600;">Semester End Date</label>
                    <input type="date" id="sem-end-date" class="form-input" style="width: 100%;">
                </div>
                <button id="save-sem-dates-btn" class="glass-button" style="background: var(--accent-color); color: white; font-weight:600;">
                    💾 Save Dates
                </button>
            </div>
        `;
        academicPanel.appendChild(semesterCard);

        const policyCard = this.createCard('Grading & Attendance Policy', 'Establish standards for examinations eligibility and grading');
        policyCard.innerHTML += `
            <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
                <div>
                    <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.25rem; font-weight:600;">Minimum Attendance Required (%)</label>
                    <input type="number" id="policy-att-threshold" class="form-input" min="0" max="100" style="width: 100%;" placeholder="e.g. 75">
                </div>
                <div>
                    <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.25rem; font-weight:600;">Passing Marks Threshold (%)</label>
                    <input type="number" id="policy-pass-pct" class="form-input" min="0" max="100" style="width: 100%;" placeholder="e.g. 40">
                </div>
                <button id="save-policy-btn" class="glass-button" style="background: var(--accent-color); color: white; font-weight:600; margin-top:0.5rem;">
                    💾 Save Policy Rules
                </button>
            </div>
        `;
        academicPanel.appendChild(policyCard);

        const feeCard = this.createCard('Exam Registration Fees', 'Configure student fee rates for exam portals');
        feeCard.innerHTML += `
            <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
                <div>
                    <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.25rem; font-weight:600;">Base Registration Fee (₹)</label>
                    <input type="number" id="fee-base" class="form-input" min="0" style="width: 100%;" placeholder="e.g. 1250">
                </div>
                <div>
                    <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.25rem; font-weight:600;">Backlog Fee Per Subject (₹)</label>
                    <input type="number" id="fee-backlog" class="form-input" min="0" style="width: 100%;" placeholder="e.g. 350">
                </div>
                <button id="save-fee-btn" class="glass-button" style="background: var(--accent-color); color: white; font-weight:600; margin-top:0.5rem;">
                    💾 Save Fee Rules
                </button>
            </div>
        `;
        academicPanel.appendChild(feeCard);

        const gradingCard = this.createCard('Grading Brackets Scheme', 'Set percentage score boundaries for letter grades');
        gradingCard.innerHTML += `
            <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1rem;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                    <thead>
                        <tr style="border-bottom: 1px solid var(--border-color); text-align: left; color: var(--text-secondary);">
                            <th style="padding: 4px;">Grade</th>
                            <th style="padding: 4px; text-align: right;">Min Score %</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="padding: 6px; font-weight: 700; color: var(--accent-color);">A+ (Outstanding)</td>
                            <td style="padding: 6px;"><input type="number" id="grade-pct-Aplus" class="form-input" style="width: 70px; text-align: right; float: right;" min="0" max="100" value="90"></td>
                        </tr>
                        <tr>
                            <td style="padding: 6px; font-weight: 700;">A (Excellent)</td>
                            <td style="padding: 6px;"><input type="number" id="grade-pct-A" class="form-input" style="width: 70px; text-align: right; float: right;" min="0" max="100" value="80"></td>
                        </tr>
                        <tr>
                            <td style="padding: 6px; font-weight: 700;">B (Good)</td>
                            <td style="padding: 6px;"><input type="number" id="grade-pct-B" class="form-input" style="width: 70px; text-align: right; float: right;" min="0" max="100" value="70"></td>
                        </tr>
                        <tr>
                            <td style="padding: 6px; font-weight: 700;">C (Average)</td>
                            <td style="padding: 6px;"><input type="number" id="grade-pct-C" class="form-input" style="width: 70px; text-align: right; float: right;" min="0" max="100" value="60"></td>
                        </tr>
                        <tr>
                            <td style="padding: 6px; font-weight: 700;">D (Pass)</td>
                            <td style="padding: 6px;"><input type="number" id="grade-pct-D" class="form-input" style="width: 70px; text-align: right; float: right;" min="0" max="100" value="50"></td>
                        </tr>
                    </tbody>
                </table>
                <button id="save-grading-btn" class="glass-button" style="background: var(--accent-color); color: white; font-weight:600; margin-top:0.5rem;">
                    💾 Save Grading Scheme
                </button>
            </div>
        `;
        academicPanel.appendChild(gradingCard);
        panelsContainer.appendChild(academicPanel);

        // ─── TAB 3: PAYMENT GATEWAY ───
        const paymentPanel = document.createElement('div');
        paymentPanel.id = 'tab-payment';
        paymentPanel.className = 'tab-panel';
        paymentPanel.style.display = 'none';
        paymentPanel.style.gridTemplateColumns = 'repeat(auto-fit, minmax(320px, 1fr))';
        paymentPanel.style.gap = '2rem';

        const stripeCard = this.createCard('Stripe Gateway Config', 'Choose active payment mode and keys for examinations');
        stripeCard.innerHTML += `
            <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
                <div>
                    <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.25rem; font-weight:600;">Payment Gateway Mode</label>
                    <select id="payment-mode" class="form-input" style="width: 100%;">
                        <option value="test">Sandbox Mode (Mock Checkout)</option>
                        <option value="production">Production Mode (Stripe Checkout)</option>
                    </select>
                </div>
                <div>
                    <label style="display: block; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.25rem; font-weight:600;">Stripe Secret Key</label>
                    <input type="password" id="payment-secret-key" class="form-input" style="width: 100%;" placeholder="sk_test_...">
                </div>
                <button id="save-payment-btn" class="glass-button" style="background: var(--accent-color); color: white; font-weight:600; margin-top:0.5rem;">
                    💾 Save Gateway Settings
                </button>
            </div>
        `;
        paymentPanel.appendChild(stripeCard);
        panelsContainer.appendChild(paymentPanel);

        // ─── TAB 4: PORTAL ACCESS ───
        const togglesPanel = document.createElement('div');
        togglesPanel.id = 'tab-toggles';
        togglesPanel.className = 'tab-panel';
        togglesPanel.style.display = 'none';
        togglesPanel.style.gridTemplateColumns = 'repeat(auto-fit, minmax(320px, 1fr))';
        togglesPanel.style.gap = '2rem';

        const accessCard = this.createCard('Portal Access Controls', 'Open or close student ERP modules in real-time');
        accessCard.innerHTML += `
            <div style="display: flex; flex-direction: column; gap: 1.25rem; margin-top: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
                    <div>
                        <strong style="display: block; font-size: 0.9rem;">Student Exam Registration</strong>
                        <span style="font-size: 0.75rem; color: var(--text-secondary);">Allow students to apply and pay fees</span>
                    </div>
                    <label class="switch" style="position: relative; display: inline-block; width: 44px; height: 22px;">
                        <input type="checkbox" id="toggle-reg-portal" style="opacity: 0; width: 0; height: 0;">
                        <span class="slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 22px;"></span>
                    </label>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
                    <div>
                        <strong style="display: block; font-size: 0.9rem;">Admit Card Downloads</strong>
                        <span style="font-size: 0.75rem; color: var(--text-secondary);">Permit students to export and print hall tickets</span>
                    </div>
                    <label class="switch" style="position: relative; display: inline-block; width: 44px; height: 22px;">
                        <input type="checkbox" id="toggle-admit-download" style="opacity: 0; width: 0; height: 0;">
                        <span class="slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 22px;"></span>
                    </label>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
                    <div>
                        <strong style="display: block; font-size: 0.9rem;">Public Result Checker</strong>
                        <span style="font-size: 0.75rem; color: var(--text-secondary);">Enable public search and verification of results</span>
                    </div>
                    <label class="switch" style="position: relative; display: inline-block; width: 44px; height: 22px;">
                        <input type="checkbox" id="toggle-public-results" style="opacity: 0; width: 0; height: 0;">
                        <span class="slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 22px;"></span>
                    </label>
                </div>
                <button id="save-toggles-btn" class="glass-button" style="background: var(--accent-color); color: white; font-weight:600; margin-top:0.5rem;">
                    💾 Save Portal Access Rules
                </button>
            </div>
        `;
        togglesPanel.appendChild(accessCard);
        panelsContainer.appendChild(togglesPanel);

        // ─── TAB 5: SYSTEM & THEME ───
        const systemPanel = document.createElement('div');
        systemPanel.id = 'tab-system';
        systemPanel.className = 'tab-panel';
        systemPanel.style.display = 'none';
        systemPanel.style.gridTemplateColumns = 'repeat(auto-fit, minmax(320px, 1fr))';
        systemPanel.style.gap = '2rem';

        const dataCard = this.createCard('Data Management', 'Backup and Restore System Data (Database)');
        dataCard.innerHTML += `
            <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
                <button id="backup-btn" class="glass-button" style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-weight:600;">
                    <span>📥</span> Backup Full Database (JSON)
                </button>
                <div style="position: relative;">
                     <input type="file" id="restore-file" accept=".json" style="position: absolute; width: 100%; height: 100%; opacity: 0; cursor: pointer;">
                     <button class="glass-button" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-weight:600;">
                        <span>📤</span> Restore Data
                     </button>
                </div>
                <button id="reset-btn" class="glass-button delete-btn" style="background: rgba(239, 68, 68, 0.2); border-color: rgba(239, 68, 68, 0.5); color: #fca5a5; font-weight:600;">
                    <span>⚠️</span> Factory Reset
                </button>
            </div>
        `;
        systemPanel.appendChild(dataCard);

        const infoCard = this.createCard('System Information', 'Database Details');
        infoCard.innerHTML += `
            <div style="margin-top: 1rem; display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.9rem;">
                <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: 5px;">
                    <span>Version</span>
                    <span style="color: var(--accent-color); font-weight:600;">2.0.0</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: 5px;">
                    <span>Total Database Records</span>
                    <span id="total-records" style="font-weight:600;">Loading...</span>
                </div>
                 <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: 5px;">
                    <span>Last Backup</span>
                    <span id="last-backup" style="font-weight:600;">-</span>
                </div>
                <div id="collection-breakdown" style="padding: 0.5rem; border-top: 1px solid var(--border-color); margin-top: 0.5rem;">
                    <!-- Collection counts will appear here -->
                </div>
            </div>
        `;
        systemPanel.appendChild(infoCard);

        const emailCard = this.createCard('Email Notifications', 'Send attendance alerts and system emails');
        emailCard.innerHTML += `
            <div style="display:flex;flex-direction:column;gap:0.75rem;margin-top:1rem;">
                <p style="font-size:0.82rem;color:var(--text-secondary);margin:0; line-height:1.4;">
                    Configure SMTP settings in <code style="background:var(--bg-primary);padding:2px 5px;border-radius:4px; border: 1px solid var(--border-color);">backend/.env</code> to enable email alerts.
                </p>
                <button id="send-low-att-emails" class="glass-button" style="background:rgba(245,158,11,0.1)!important;color:var(--warning)!important;border:1px solid rgba(245,158,11,0.3)!important; font-weight:600;">
                    ⚠️ Send Low Attendance Alerts
                </button>
                <div id="email-status" style="font-size:0.8rem;color:var(--text-secondary); font-weight:600;"></div>
            </div>
        `;
        systemPanel.appendChild(emailCard);

        const logCard = this.createCard('Audit Activity Log', 'Audit all system actions and data changes');
        logCard.innerHTML += `
            <div style="margin-top:1rem; display:flex; flex-direction:column; gap:1rem;">
                <p style="font-size:0.82rem;color:var(--text-secondary);margin:0; line-height:1.4;">
                    Track every student creation, attendance mark, login, and system change.
                </p>
                <button class="glass-button" onclick="window.location.hash='activity-log'" style="font-weight:600;">View Activity Log →</button>
            </div>
        `;
        systemPanel.appendChild(logCard);

        const themeCard = this.createCard('Theme Engine', 'Personalize your interface with modes and accents');
        themeCard.innerHTML += `
            <div style="display:flex;flex-direction:column;gap:1.5rem;margin-top:1rem;">
                <div>
                    <label style="display:block;font-size:0.75rem;font-weight:700;text-transform:uppercase;margin-bottom:10px;color:var(--text-secondary);">Interface Mode</label>
                    <div style="display:flex;gap:10px;">
                        <button class="mode-btn ${ThemeService.getMode() === 'light' ? 'active' : ''}" data-mode="light" style="flex:1;padding:10px;border-radius:8px;border:1px solid var(--glass-border);background:var(--bg-primary);cursor:pointer;color:var(--text-primary);font-weight:600; transition:all 0.2s;">☀️ Light</button>
                        <button class="mode-btn ${ThemeService.getMode() === 'dark' ? 'active' : ''}" data-mode="dark" style="flex:1;padding:10px;border-radius:8px;border:1px solid var(--glass-border);background:#0f172a;cursor:pointer;color:white;font-weight:600; transition:all 0.2s;">🌙 Dark</button>
                    </div>
                </div>
                <div>
                    <label style="display:block;font-size:0.75rem;font-weight:700;text-transform:uppercase;margin-bottom:10px;color:var(--text-secondary);">Accent Color</label>
                    <div style="display:grid;grid-template-columns:repeat(5, 1fr);gap:8px;">
                        ${Object.entries(ThemeService.THEMES).map(([key, t]) => `
                            <button class="accent-btn ${ThemeService.getAccent() === key ? 'active' : ''}" 
                                    data-accent="${key}" 
                                    title="${t.name}"
                                    style="aspect-ratio:1;border-radius:50%;border:3px solid ${ThemeService.getAccent() === key ? 'var(--text-primary)' : 'transparent'};background:${t.color};cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,0.1); transition:transform 0.2s;">
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        systemPanel.appendChild(themeCard);
        panelsContainer.appendChild(systemPanel);

        // Tab Switching Event Handler
        const tabBtns = container.querySelectorAll('.tab-btn');
        const tabPanels = container.querySelectorAll('.tab-panel');
        
        tabBtns.forEach(btn => {
            btn.onclick = () => {
                tabBtns.forEach(b => {
                    b.style.color = 'var(--text-secondary)';
                    b.style.borderBottomColor = 'transparent';
                    b.classList.remove('active');
                });
                btn.style.color = 'var(--accent-color)';
                btn.style.borderBottomColor = 'var(--accent-color)';
                btn.classList.add('active');
                
                tabPanels.forEach(p => p.style.display = 'none');
                container.querySelector(`#tab-${btn.dataset.tab}`).style.display = 'grid';
            };
        });

        // Set initial active style
        const activeBtn = container.querySelector('.tab-btn[data-tab="profile"]');
        if (activeBtn) {
            activeBtn.style.color = 'var(--accent-color)';
            activeBtn.style.borderBottomColor = 'var(--accent-color)';
        }

        // Live Preview binding
        setTimeout(() => {
            const instNameInput = container.querySelector('#inst-name');
            const instSubheadingInput = container.querySelector('#inst-subheading');
            const instControllerInput = container.querySelector('#inst-controller');
            
            const previewName = container.querySelector('#preview-name');
            const previewSubheading = container.querySelector('#preview-subheading');
            const previewController = container.querySelector('#preview-controller');

            instNameInput.addEventListener('input', () => previewName.textContent = instNameInput.value || 'Global Institute of Technology');
            instSubheadingInput.addEventListener('input', () => previewSubheading.textContent = instSubheadingInput.value || '(Affiliated to Technical University & Approved by AICTE)');
            instControllerInput.addEventListener('input', () => previewController.textContent = instControllerInput.value || 'Prof. R. Sharma');
        }, 0);

        // Event Listeners Binding
        setTimeout(() => {
            const backupBtn = container.querySelector('#backup-btn');
            backupBtn.addEventListener('click', () => this.backupData(backupBtn));

            container.querySelector('#restore-file').addEventListener('change', (e) => this.restoreData(e));
            container.querySelector('#reset-btn').addEventListener('click', () => this.resetSystem());

            container.querySelector('#save-sem-dates-btn').addEventListener('click', () => this.saveSemesterDates(container));
            container.querySelector('#save-profile-btn').addEventListener('click', () => this.saveInstitutionProfile(container));
            container.querySelector('#save-policy-btn').addEventListener('click', () => this.saveAcademicPolicy(container));
            container.querySelector('#save-fee-btn').addEventListener('click', () => this.saveFeeSettings(container));
            container.querySelector('#save-grading-btn').addEventListener('click', () => this.saveGradingPolicy(container));
            container.querySelector('#save-payment-btn').addEventListener('click', () => this.savePaymentSettings(container));
            container.querySelector('#save-toggles-btn').addEventListener('click', () => this.saveFeatureToggles(container));

            container.querySelector('#send-low-att-emails').addEventListener('click', async (e) => {
                const btn = e.target;
                const status = container.querySelector('#email-status');
                btn.disabled = true; btn.textContent = '📧 Sending…';
                try {
                    const r = await ApiService.sendLowAttendanceAlerts();
                    status.textContent = r.message;
                    status.style.color = 'var(--success)';
                    Toast.success(r.message);
                } catch (err) {
                    status.textContent = err.message;
                    status.style.color = 'var(--danger)';
                    Toast.error('Email failed: ' + err.message);
                } finally {
                    btn.disabled = false; btn.textContent = '⚠️ Send Low Attendance Alerts';
                }
            });

            themeCard.querySelectorAll('.mode-btn').forEach(btn => {
                btn.onclick = () => {
                    ThemeService.setMode(btn.dataset.mode);
                    themeCard.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    Toast.success(`Switched to ${btn.dataset.mode} mode`);
                };
            });

            themeCard.querySelectorAll('.accent-btn').forEach(btn => {
                btn.onclick = () => {
                    ThemeService.setAccent(btn.dataset.accent);
                    themeCard.querySelectorAll('.accent-btn').forEach(b => b.style.borderColor = 'transparent');
                    btn.style.borderColor = 'var(--text-primary)';
                    Toast.success(`Accent color updated to ${ThemeService.THEMES[btn.dataset.accent].name}`);
                };
            });

            this.updateStats(container);
            this.loadSettings(container);
        }, 0);

        return container;
    }

    createCard(title, subtitle) {
        const card = document.createElement('div');
        card.className = 'glass-panel';
        card.style.padding = '1.5rem';
        card.innerHTML = `
            <h3 style="margin-bottom: 0.25rem;">${title}</h3>
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem;">${subtitle}</p>
        `;
        return card;
    }

    async backupData(btn) {
        const originalText = btn.innerHTML;
        try {
            btn.disabled = true;
            btn.innerHTML = '<span>⏳</span> Generating Backup...';

            const response = await ApiService.exportBackup();
            const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `collegeOS_full_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            localStorage.setItem('cms_last_backup', new Date().toLocaleString());
            Toast.success('Full system backup generated successfully');

            // Trigger stats update
            const stats = document.querySelector('#last-backup');
            if (stats) stats.textContent = localStorage.getItem('cms_last_backup');
        } catch (err) {
            Toast.error('Backup failed: ' + err.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }

    async restoreData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const result = e.target.result;
                if (typeof result !== 'string') return;
                const data = JSON.parse(result);

                if (confirm(`CRITICAL: This will ERASE the entire database and restore ${Object.keys(data).length} collections. Are you sure?`)) {
                    await ApiService.importBackup(data);
                    Toast.success('Database restored! Reloading system...');
                    setTimeout(() => window.location.reload(), 1500);
                }
            } catch (err) {
                Toast.error('Restore failed: ' + err.message);
                console.error(err);
            }
        };
        reader.readAsText(file);
    }

    async resetSystem() {
        if (confirm('CRITICAL WARNING: This will delete ALL data (Students, Attendance, Courses, etc.) from the server. This cannot be undone. Are you sure?')) {
            const verify = prompt('Type "RESET" to confirm:');
            if (verify === 'RESET') {
                try {
                    await ApiService.factoryReset();
                    localStorage.clear();
                    alert('Factory reset complete. Server data has been deleted.');
                    window.location.reload();
                } catch (err) {
                    Toast.error('Factory reset failed: ' + err.message);
                    console.error('Factory Reset Error:', err);
                }
            }
        }
    }

    async updateStats(container) {
        try {
            const stats = await ApiService.getSystemStats();

            container.querySelector('#total-records').textContent = stats.totalRecords;
            container.querySelector('#last-backup').textContent = localStorage.getItem('cms_last_backup') || 'Never';

            const breakdown = container.querySelector('#collection-breakdown');
            breakdown.innerHTML = '<p style="font-weight: 600; margin-bottom: 0.5rem; font-size: 0.8rem;">Database Collections:</p>';

            stats.collections.forEach(col => {
                const row = document.createElement('div');
                row.style.cssText = 'display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 0.25rem; color: var(--text-secondary);';
                row.innerHTML = `<span>${col.name}</span> <span>${col.count}</span>`;
                breakdown.appendChild(row);
            });
        } catch (err) {
            console.error('Stats update failed:', err);
            container.querySelector('#total-records').textContent = 'Error loading stats';
            if (err.message.includes('expired') || err.message.includes('token')) {
                Toast.error('Session expired. Please log in again.');
            }
        }
    }

    async loadSettings(container) {
        try {
            const settings = await ApiService.getSettings();
            
            // 1. Semester dates
            const semesterDates = settings.find(s => s.key === 'semester_dates');
            if (semesterDates && semesterDates.value) {
                if (semesterDates.value.start) {
                    container.querySelector('#sem-start-date').value = semesterDates.value.start;
                }
                if (semesterDates.value.end) {
                    container.querySelector('#sem-end-date').value = semesterDates.value.end;
                }
            }

            // 2. Institution Profile
            const instProfile = settings.find(s => s.key === 'institution_profile');
            if (instProfile && instProfile.value) {
                container.querySelector('#inst-name').value = instProfile.value.name || 'Global Institute of Technology';
                container.querySelector('#inst-subheading').value = instProfile.value.subheading || '(Affiliated to Technical University & Approved by AICTE)';
                container.querySelector('#inst-controller').value = instProfile.value.controllerName || 'Prof. R. Sharma';
                
                // Update preview
                container.querySelector('#preview-name').textContent = instProfile.value.name || 'Global Institute of Technology';
                container.querySelector('#preview-subheading').textContent = instProfile.value.subheading || '(Affiliated to Technical University & Approved by AICTE)';
                container.querySelector('#preview-controller').textContent = instProfile.value.controllerName || 'Prof. R. Sharma';
            }

            // 3. Academic Policy
            const academicPolicy = settings.find(s => s.key === 'academic_policy');
            if (academicPolicy && academicPolicy.value) {
                container.querySelector('#policy-pass-pct').value = academicPolicy.value.passPercentage !== undefined ? academicPolicy.value.passPercentage : 40;
                container.querySelector('#policy-att-threshold').value = academicPolicy.value.attendanceThreshold !== undefined ? academicPolicy.value.attendanceThreshold : 75;
            }

            // 4. Fee Settings
            const feeSettings = settings.find(s => s.key === 'fee_settings');
            if (feeSettings && feeSettings.value) {
                container.querySelector('#fee-base').value = feeSettings.value.baseFee !== undefined ? feeSettings.value.baseFee : 1250;
                container.querySelector('#fee-backlog').value = feeSettings.value.supplementaryFee !== undefined ? feeSettings.value.supplementaryFee : 350;
            }

            // 5. Grading Policy
            const gradingPolicy = settings.find(s => s.key === 'grading_policy');
            if (gradingPolicy && gradingPolicy.value && gradingPolicy.value.grades) {
                gradingPolicy.value.grades.forEach(g => {
                    const el = container.querySelector(`#grade-pct-${g.grade.replace('+', 'plus')}`);
                    if (el) el.value = g.minPct;
                });
            }

            // 6. Payment Settings
            const paymentSettings = settings.find(s => s.key === 'payment_settings');
            if (paymentSettings && paymentSettings.value) {
                container.querySelector('#payment-mode').value = paymentSettings.value.mode || 'test';
                container.querySelector('#payment-secret-key').value = paymentSettings.value.stripeSecretKey || '';
            }

            // 7. Feature Toggles
            const featureToggles = settings.find(s => s.key === 'feature_toggles');
            if (featureToggles && featureToggles.value) {
                container.querySelector('#toggle-reg-portal').checked = featureToggles.value.examRegistration !== false;
                container.querySelector('#toggle-admit-download').checked = featureToggles.value.admitCardDownload !== false;
                container.querySelector('#toggle-public-results').checked = featureToggles.value.publicResultChecker !== false;
            }
        } catch (err) {
            console.error('Failed to load settings:', err);
        }
    }

    async saveSemesterDates(container) {
        try {
            const start = container.querySelector('#sem-start-date').value;
            const end = container.querySelector('#sem-end-date').value;

            if (!start || !end) {
                return Toast.error('Both start and end dates are required');
            }
            if (new Date(start) >= new Date(end)) {
                return Toast.error('Start date must be before end date');
            }

            const btn = container.querySelector('#save-sem-dates-btn');
            const originalText = btn.innerHTML;
            btn.innerHTML = 'Saving...';
            btn.disabled = true;

            await ApiService.updateSetting('semester_dates', { start, end });
            Toast.success('Semester dates saved successfully');

            btn.innerHTML = originalText;
            btn.disabled = false;
        } catch (err) {
            Toast.error('Failed to save semester dates: ' + err.message);
        }
    }

    async saveInstitutionProfile(container) {
        try {
            const name = container.querySelector('#inst-name').value;
            const subheading = container.querySelector('#inst-subheading').value;
            const controllerName = container.querySelector('#inst-controller').value;

            if (!name || !subheading || !controllerName) {
                return Toast.error('All profile fields are required');
            }

            const btn = container.querySelector('#save-profile-btn');
            const originalText = btn.innerHTML;
            btn.innerHTML = 'Saving...';
            btn.disabled = true;

            await ApiService.updateSetting('institution_profile', { name, subheading, controllerName });
            Toast.success('Institution profile updated successfully');

            btn.innerHTML = originalText;
            btn.disabled = false;
        } catch (err) {
            Toast.error('Failed to save profile: ' + err.message);
        }
    }

    async saveAcademicPolicy(container) {
        try {
            const passPercentage = parseFloat(container.querySelector('#policy-pass-pct').value);
            const attendanceThreshold = parseFloat(container.querySelector('#policy-att-threshold').value);

            if (isNaN(passPercentage) || passPercentage < 0 || passPercentage > 100) {
                return Toast.error('Pass percentage must be between 0 and 100');
            }
            if (isNaN(attendanceThreshold) || attendanceThreshold < 0 || attendanceThreshold > 100) {
                return Toast.error('Attendance threshold must be between 0 and 100');
            }

            const btn = container.querySelector('#save-policy-btn');
            const originalText = btn.innerHTML;
            btn.innerHTML = 'Saving...';
            btn.disabled = true;

            await ApiService.updateSetting('academic_policy', { passPercentage, attendanceThreshold });
            Toast.success('Academic policies saved successfully');

            btn.innerHTML = originalText;
            btn.disabled = false;
        } catch (err) {
            Toast.error('Failed to save policy: ' + err.message);
        }
    }

    async saveFeeSettings(container) {
        try {
            const baseFee = parseFloat(container.querySelector('#fee-base').value);
            const supplementaryFee = parseFloat(container.querySelector('#fee-backlog').value);

            if (isNaN(baseFee) || baseFee < 0) {
                return Toast.error('Base Fee must be a valid positive number');
            }
            if (isNaN(supplementaryFee) || supplementaryFee < 0) {
                return Toast.error('Backlog Fee must be a valid positive number');
            }

            const btn = container.querySelector('#save-fee-btn');
            const originalText = btn.innerHTML;
            btn.innerHTML = 'Saving...';
            btn.disabled = true;

            await ApiService.updateSetting('fee_settings', { baseFee, supplementaryFee });
            Toast.success('Fee policies saved successfully');

            btn.innerHTML = originalText;
            btn.disabled = false;
        } catch (err) {
            Toast.error('Failed to save fee settings: ' + err.message);
        }
    }

    async saveGradingPolicy(container) {
        try {
            const grades = [
                { grade: 'A+', minPct: parseFloat(container.querySelector('#grade-pct-Aplus').value) },
                { grade: 'A', minPct: parseFloat(container.querySelector('#grade-pct-A').value) },
                { grade: 'B', minPct: parseFloat(container.querySelector('#grade-pct-B').value) },
                { grade: 'C', minPct: parseFloat(container.querySelector('#grade-pct-C').value) },
                { grade: 'D', minPct: parseFloat(container.querySelector('#grade-pct-D').value) }
            ];

            for (const g of grades) {
                if (isNaN(g.minPct) || g.minPct < 0 || g.minPct > 100) {
                    return Toast.error(`Minimum percentage for grade ${g.grade} must be between 0 and 100`);
                }
            }

            const btn = container.querySelector('#save-grading-btn');
            const originalText = btn.innerHTML;
            btn.innerHTML = 'Saving...';
            btn.disabled = true;

            await ApiService.updateSetting('grading_policy', { grades });
            Toast.success('Grading policy saved successfully');

            btn.innerHTML = originalText;
            btn.disabled = false;
        } catch (err) {
            Toast.error('Failed to save grading policy: ' + err.message);
        }
    }

    async savePaymentSettings(container) {
        try {
            const mode = container.querySelector('#payment-mode').value;
            const stripeSecretKey = container.querySelector('#payment-secret-key').value;

            const btn = container.querySelector('#save-payment-btn');
            const originalText = btn.innerHTML;
            btn.innerHTML = 'Saving...';
            btn.disabled = true;

            await ApiService.updateSetting('payment_settings', { mode, stripeSecretKey });
            Toast.success('Payment settings updated successfully');

            btn.innerHTML = originalText;
            btn.disabled = false;
        } catch (err) {
            Toast.error('Failed to save payment settings: ' + err.message);
        }
    }

    async saveFeatureToggles(container) {
        try {
            const examRegistration = container.querySelector('#toggle-reg-portal').checked;
            const admitCardDownload = container.querySelector('#toggle-admit-download').checked;
            const publicResultChecker = container.querySelector('#toggle-public-results').checked;

            const btn = container.querySelector('#save-toggles-btn');
            const originalText = btn.innerHTML;
            btn.innerHTML = 'Saving...';
            btn.disabled = true;

            await ApiService.updateSetting('feature_toggles', { examRegistration, admitCardDownload, publicResultChecker });
            Toast.success('Portal access toggles updated successfully');

            btn.innerHTML = originalText;
            btn.disabled = false;
        } catch (err) {
            Toast.error('Failed to save portal toggles: ' + err.message);
        }
    }
}
