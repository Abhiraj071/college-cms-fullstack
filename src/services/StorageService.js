import { STORAGE_KEYS } from './Constants.js';

export class StorageService {
    constructor() {
        this.init();
    }

    init() {
        if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
            this.seedData();
        }
    }

    // Simple hash function for demo (Base64 + salt-like prefix)
    hashPassword(password) {
        return 'v1_' + btoa(password).split('').reverse().join('');
    }

    seedData() {
        const users = [
            { id: 'admin1', username: 'admin', password: this.hashPassword('password'), role: 'admin', name: 'System Administrator' },
            { id: 'teacher1', username: 'teacher', password: this.hashPassword('password'), role: 'teacher', name: 'Prof. Sarah Doe', department: 'Computer Science' },
            { id: 'student1', username: 'student', password: this.hashPassword('password'), role: 'student', name: 'Harry Potter' }
        ];

        const courses = [
            { id: 'c1', name: 'Computer Science', duration: '4 Years', term: 'Long', instructorId: 'teacher1' },
            { id: 'c2', name: 'Mechanical Engineering', duration: '4 Years', term: 'Long' },
            { id: 'c3', name: 'Business Logic', duration: '3 Months', term: 'Short' }
        ];

        const students = [
            { id: 's1', userId: 'student1', name: 'Harry Potter', rollNo: 'CS101', course: 'Computer Science', semester: 1, cgpa: '3.8' }
        ];

        const notices = [
            { id: 'n1', title: 'Welcome to ERP', message: 'The new system is now live.', date: new Date().toISOString(), author: 'Admin', category: 'General', priority: 'High' }
        ];

        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
        localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify(notices));
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
        localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEYS.GRADES, JSON.stringify([]));
    }

    getData(collection) {
        const key = STORAGE_KEYS[collection.toUpperCase()] || `cms_${collection}`;
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    }

    setData(collection, data) {
        const key = STORAGE_KEYS[collection.toUpperCase()] || `cms_${collection}`;
        localStorage.setItem(key, JSON.stringify(data));
    }

    addItem(collection, item) {
        const list = this.getData(collection);
        // Basic security: don't allow duplicate usernames in 'users'
        if (collection === 'users' && list.find(u => u.username === item.username)) {
            throw new Error('Username already exists');
        }
        list.push(item);
        this.setData(collection, list);
        return item;
    }

    updateItem(collection, id, updates) {
        const list = this.getData(collection);
        const index = list.findIndex(i => i.id === id);
        if (index !== -1) {
            list[index] = { ...list[index], ...updates };
            this.setData(collection, list);
            return list[index];
        }
        return null;
    }

    deleteItem(collection, id) {
        let list = this.getData(collection);
        list = list.filter(i => i.id !== id);
        this.setData(collection, list);
    }

    getUser(username, password) {
        const users = this.getData('users');
        const hashedInput = this.hashPassword(password);
        return users.find(u => u.username === username && u.password === hashedInput);
    }
}

export const storage = new StorageService();
