export class AIAssistant {
    constructor() {
        this.isOpen = false;
        this.widget = null;
        this.chatBox = null;
    }

    render() {
        // Main Widget Wrapper
        this.widget = document.createElement('div');
        this.widget.style.position = 'fixed';
        this.widget.style.bottom = '2rem';
        this.widget.style.right = '2rem';
        this.widget.style.zIndex = '9999';
        this.widget.style.fontFamily = "'Inter', sans-serif";

        // Floating Toggle Button
        const toggleBtn = document.createElement('button');
        toggleBtn.style.width = '60px';
        toggleBtn.style.height = '60px';
        toggleBtn.style.borderRadius = '50%';
        toggleBtn.style.background = 'linear-gradient(135deg, #7B61FF 0%, #00D4FF 100%)';
        toggleBtn.style.border = '1px solid rgba(255, 255, 255, 0.2)';
        toggleBtn.style.color = '#FFFFFF';
        toggleBtn.style.fontSize = '1.5rem';
        toggleBtn.style.cursor = 'pointer';
        toggleBtn.style.boxShadow = '0 8px 32px rgba(123, 97, 255, 0.4), 0 0 20px rgba(0, 212, 255, 0.2)';
        toggleBtn.style.display = 'flex';
        toggleBtn.style.alignItems = 'center';
        toggleBtn.style.justifyContent = 'center';
        toggleBtn.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
        toggleBtn.innerHTML = '✨';
        toggleBtn.className = 'float-slow';

        toggleBtn.onmouseenter = () => {
            toggleBtn.style.transform = 'scale(1.1) rotate(15deg)';
        };
        toggleBtn.onmouseleave = () => {
            toggleBtn.style.transform = 'scale(1) rotate(0deg)';
        };

        // Chat Box Panel (Hidden by default)
        this.chatBox = document.createElement('div');
        this.chatBox.style.position = 'absolute';
        this.chatBox.style.bottom = '80px';
        this.chatBox.style.right = '0';
        this.chatBox.style.width = '350px';
        this.chatBox.style.height = '460px';
        this.chatBox.style.background = 'rgba(11, 16, 35, 0.85)';
        this.chatBox.style.border = '1px solid rgba(123, 97, 255, 0.2)';
        this.chatBox.style.borderRadius = '16px';
        this.chatBox.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.5)';
        this.chatBox.style.backdropFilter = 'blur(20px)';
        this.chatBox.style.webkitBackdropFilter = 'blur(20px)';
        this.chatBox.style.display = 'none';
        this.chatBox.style.flexDirection = 'column';
        this.chatBox.style.overflow = 'hidden';
        this.chatBox.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
        this.chatBox.className = 'neon-glow hologram-scan';

        // Chat Box Inner HTML
        this.chatBox.innerHTML = `
            <!-- Header -->
            <div style="padding: 1.25rem; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08); background: rgba(123, 97, 255, 0.1);">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 1.2rem; filter: drop-shadow(0 0 5px var(--accent-blue));">🤖</span>
                    <div>
                        <div style="font-family: 'Outfit', sans-serif; font-size: 0.95rem; font-weight: 700; color: #FFFFFF;">Campus AI</div>
                        <div style="font-size: 0.7rem; color: #00FFB2; display: flex; align-items: center; gap: 4px;">
                            <span style="width: 5px; height: 5px; border-radius:50%; background: #00FFB2; display: inline-block;"></span> Online
                        </div>
                    </div>
                </div>
                <button id="closeChatBtn" style="background: transparent; border: none; color: #94A3B8; font-size: 1.2rem; cursor: pointer;">&times;</button>
            </div>

            <!-- Messages Area -->
            <div id="chatMessages" style="flex: 1; padding: 1.25rem; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; font-size: 0.85rem;">
                <div style="align-self: flex-start; background: rgba(255,255,255,0.05); padding: 10px 14px; border-radius: 12px 12px 12px 0; border: 1px solid rgba(255,255,255,0.05); max-width: 85%; line-height: 1.4;">
                    Hello! I'm your College OS assistant. How can I help you manage the campus today?
                </div>
            </div>

            <!-- Suggestion Tags -->
            <div style="padding: 0 1.25rem 0.5rem; display: flex; gap: 6px; overflow-x: auto; flex-shrink: 0;" class="suggestions-container">
                <button class="suggestion-tag" style="padding: 6px 12px; border-radius: 12px; border: 1px solid rgba(0,212,255,0.15); background: rgba(0,212,255,0.05); color: #00D4FF; font-size: 0.72rem; font-weight: 600; cursor: pointer; white-space: nowrap; transition: all 0.2s;" data-text="Check enrollment count">Check Enrollments</button>
                <button class="suggestion-tag" style="padding: 6px 12px; border-radius: 12px; border: 1px solid rgba(123,97,255,0.15); background: rgba(123,97,255,0.05); color: #B4C6FC; font-size: 0.72rem; font-weight: 600; cursor: pointer; white-space: nowrap; transition: all 0.2s;" data-text="When is the next exam?">Exam Schedule</button>
                <button class="suggestion-tag" style="padding: 6px 12px; border-radius: 12px; border: 1px solid rgba(0,255,178,0.15); background: rgba(0,255,178,0.05); color: #00FFB2; font-size: 0.72rem; font-weight: 600; cursor: pointer; white-space: nowrap; transition: all 0.2s;" data-text="How to mark attendance?">Mark Attendance</button>
            </div>

            <!-- Input Area -->
            <div style="padding: 0.75rem 1.25rem 1.25rem; border-top: 1px solid rgba(255,255,255,0.08); display: flex; gap: 8px;">
                <input type="text" id="chatInput" placeholder="Type a message..." style="flex: 1; padding: 10px 14px; background: rgba(5,8,22,0.6); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; color: #FFFFFF; font-size: 0.85rem; outline: none;">
                <button id="sendChatBtn" class="glass-button" style="padding: 10px 14px !important; border-radius: 8px !important;">Send</button>
            </div>
        `;

        // Event Listeners
        toggleBtn.onclick = () => this.toggleChat();
        this.chatBox.querySelector('#closeChatBtn').onclick = () => this.toggleChat();

        const inputField = this.chatBox.querySelector('#chatInput');
        const sendBtn = this.chatBox.querySelector('#sendChatBtn');

        const sendMessage = () => {
            const text = inputField.value.trim();
            if (!text) return;
            this.addUserMessage(text);
            inputField.value = '';
            this.generateBotResponse(text);
        };

        sendBtn.onclick = sendMessage;
        inputField.onkeydown = (e) => {
            if (e.key === 'Enter') sendMessage();
        };

        // Suggestion tags events
        this.chatBox.querySelectorAll('.suggestion-tag').forEach(tag => {
            tag.onclick = () => {
                const query = tag.getAttribute('data-text');
                this.addUserMessage(query);
                this.generateBotResponse(query);
            };
        });

        this.widget.appendChild(toggleBtn);
        this.widget.appendChild(this.chatBox);

        return this.widget;
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.chatBox.style.display = 'flex';
            this.chatBox.style.opacity = '0';
            this.chatBox.style.transform = 'translateY(15px) scale(0.95)';
            setTimeout(() => {
                this.chatBox.style.opacity = '1';
                this.chatBox.style.transform = 'translateY(0) scale(1)';
            }, 50);
            this.chatBox.querySelector('#chatInput').focus();
        } else {
            this.chatBox.style.opacity = '0';
            this.chatBox.style.transform = 'translateY(15px) scale(0.95)';
            setTimeout(() => {
                this.chatBox.style.display = 'none';
            }, 200);
        }
    }

    addUserMessage(text) {
        const chatMessages = this.chatBox.querySelector('#chatMessages');
        const msgDiv = document.createElement('div');
        msgDiv.style.alignSelf = 'flex-end';
        msgDiv.style.background = 'linear-gradient(135deg, #7B61FF 0%, #00D4FF 100%)';
        msgDiv.style.padding = '10px 14px';
        msgDiv.style.borderRadius = '12px 12px 0 12px';
        msgDiv.style.maxWidth = '85%';
        msgDiv.style.lineHeight = '1.4';
        msgDiv.style.color = '#FFFFFF';
        msgDiv.style.boxShadow = '0 4px 12px rgba(123, 97, 255, 0.2)';
        msgDiv.textContent = text;

        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    addBotMessage(text) {
        const chatMessages = this.chatBox.querySelector('#chatMessages');
        const msgDiv = document.createElement('div');
        msgDiv.style.alignSelf = 'flex-start';
        msgDiv.style.background = 'rgba(255,255,255,0.05)';
        msgDiv.style.padding = '10px 14px';
        msgDiv.style.borderRadius = '12px 12px 12px 0';
        msgDiv.style.border = '1px solid rgba(255,255,255,0.05)';
        msgDiv.style.maxWidth = '85%';
        msgDiv.style.lineHeight = '1.4';
        msgDiv.style.color = '#E2E8F0';
        msgDiv.innerHTML = text;

        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    generateBotResponse(query) {
        const chatMessages = this.chatBox.querySelector('#chatMessages');
        
        // Show typing indicator
        const typingIndicator = document.createElement('div');
        typingIndicator.id = 'typingIndicator';
        typingIndicator.style.alignSelf = 'flex-start';
        typingIndicator.style.background = 'rgba(255,255,255,0.03)';
        typingIndicator.style.padding = '10px 14px';
        typingIndicator.style.borderRadius = '12px 12px 12px 0';
        typingIndicator.style.color = '#64748B';
        typingIndicator.textContent = 'Typing...';
        chatMessages.appendChild(typingIndicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        const cleanQuery = query.toLowerCase();

        setTimeout(() => {
            // Remove typing indicator
            const indicator = chatMessages.querySelector('#typingIndicator');
            if (indicator) indicator.remove();

            let reply = '';

            if (cleanQuery.includes('enroll') || cleanQuery.includes('student') || cleanQuery.includes('count')) {
                reply = 'I can help you view student data. Navigate to the <b>Students</b> tab in the sidebar to review registered profiles, or visit the <b>Dashboard</b> where the enrollment breakdown is dynamically visualized.';
            } else if (cleanQuery.includes('exam') || cleanQuery.includes('schedule') || cleanQuery.includes('date')) {
                reply = 'Examinations are tracked in the <b>Exams</b> module. You can check the active schedules, add new examinations, and print student admit cards by clicking <b>Exams</b> in the control room sidebar.';
            } else if (cleanQuery.includes('attendance') || cleanQuery.includes('present') || cleanQuery.includes('mark')) {
                reply = 'Attendance operations are handled under the <b>Attendance</b> section. Faculty can create self-marking tokens, and administrators can monitor low-attendance warning lists directly from the control dashboard.';
            } else if (cleanQuery.includes('notice') || cleanQuery.includes('announce')) {
                reply = 'New announcements and notices are added in the <b>Notices</b> panel. Students will immediately see these updates on their dashboard feeds when logged in.';
            } else {
                reply = 'I have analyzed your request. As a digital campus assistant, I can direct you to all administrative modules. Try querying "Exam Schedule", "Check Enrollments", or "Mark Attendance".';
            }

            this.addBotMessage(reply);
        }, 900);
    }
}
