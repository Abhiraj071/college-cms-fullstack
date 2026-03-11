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
                localStorage.setItem('token', data.token);
                localStorage.setItem('cms_session', JSON.stringify(data.user));
                return true;
            }
            return false;
        } catch (err) {
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
            this.currentUser = JSON.parse(session);
            return true;
        }
        return false;
    }

    getUser() {
        return this.currentUser;
    }

    getToken() {
        return localStorage.getItem('token');
    }

    isAuthenticated() {
        return !!this.currentUser;
    }

    hasRole(role) {
        return this.currentUser && this.currentUser.role === role;
    }
}

export const auth = new AuthService();
