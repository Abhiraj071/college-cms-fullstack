import { ApiService } from './ApiService.js';

export class AuthService {
    constructor() {
        this.currentUser = null;
    }

    async login(username, password) {
        try {
            const data = await ApiService.login({ username, password });
            if (data && data.token) {
                this.currentUser = data.user;
                // Store token and a sanitised user profile (never store passwords or sensitive data)
                localStorage.setItem('token', data.token);
                localStorage.setItem('cms_session', JSON.stringify({
                    id:         data.user.id,
                    username:   data.user.username,
                    name:       data.user.name,
                    role:       data.user.role,
                    email:      data.user.email,
                    department: data.user.department,
                    facultyId:  data.user.facultyId,
                }));
                return true;
            }
            return false;
        } catch (err) {
            // Do not log credentials; only log the error message
            console.error('Login failed:', err.message);
            throw err;
        }
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('token');
        localStorage.removeItem('cms_session');
    }

    checkSession() {
        const session = localStorage.getItem('cms_session');
        const token = localStorage.getItem('token');
        if (session && token) {
            try {
                this.currentUser = JSON.parse(session);
            } catch {
                // Corrupted session data – clear it
                this.logout();
                return false;
            }
            return true;
        }
        return false;
    }

    getUser()          { return this.currentUser; }
    getToken()         { return localStorage.getItem('token'); }
    isAuthenticated()  { return !!this.currentUser; }
    hasRole(role)      { return this.currentUser?.role === role; }
}

export const auth = new AuthService();
