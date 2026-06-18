export class ApiService {
    static BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000/api'
        : '/api';

    static async request(endpoint, options = {}) {
        const token = localStorage.getItem('token');
        const headers = {
            ...options.headers
        };

        if (!options.isFormData) {
            headers['Content-Type'] = 'application/json';
        }

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const { isFormData, ...otherOptions } = options;
            const fetchOptions = { ...otherOptions, headers };

            const response = await fetch(`${this.BASE_URL}${endpoint}`, fetchOptions);

            const data = await response.json();
            
            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.hash = '#/login';
                throw new Error('Session expired. Please login again.');
            }

            if (!response.ok) {
                throw new Error(data.message || 'Something went wrong');
            }

            return data;
        } catch (err) {
            console.error('API Error:', err.message);
            if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
                throw new Error('Cannot connect to server. Please make sure the backend is running (npm start in the backend folder).');
            }
            throw err;
        }
    }

    // --- Auth Endpoints ---
    static async login(credentials) {
        return await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
    }

    static async register(userData) {
        return await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    // --- Student Endpoints ---
    static async getStudents(userId = null) {
        let url = '/students';
        if (userId) url += `?userId=${userId}`;
        return await this.request(url);
    }

    static async getAlumni() {
        return await this.request('/alumni');
    }

    static async addStudent(studentData) {
        return await this.request('/students', {
            method: 'POST',
            body: JSON.stringify(studentData)
        });
    }

    static async addBulkStudents(bulkData) {
        return await this.request('/students/bulk', {
            method: 'POST',
            body: JSON.stringify(bulkData)
        });
    }

    static async deleteStudent(id) {
        return await this.request(`/students/${id}`, {
            method: 'DELETE'
        });
    }

    static async updateStudent(id, studentData) {
        return await this.request(`/students/${id}`, {
            method: 'PUT',
            body: JSON.stringify(studentData)
        });
    }

    // --- Faculty Endpoints (Stubbed) ---
    static async getFaculty() {
        return [];
    }

    static async addFaculty(facultyData) {
        return { success: true };
    }

    static async addBulkFaculty(bulkData) {
        return { success: true };
    }

    static async deleteFaculty(id) {
        return { success: true };
    }

    static async updateFaculty(id, facultyData) {
        return { success: true };
    }

    // --- Course & Branch Endpoints ---
    static async getCourses() {
        return await this.request('/courses');
    }

    static async addCourse(courseData) {
        return await this.request('/courses', {
            method: 'POST',
            body: JSON.stringify(courseData)
        });
    }

    static async deleteCourse(id) {
        return await this.request(`/courses/${id}`, {
            method: 'DELETE'
        });
    }

    static async updateCourse(id, courseData) {
        return await this.request(`/courses/${id}`, {
            method: 'PUT',
            body: JSON.stringify(courseData)
        });
    }

    static async getBranches() {
        return await this.request('/courses/branches');
    }

    static async addBranch(branchData) {
        return await this.request('/courses/branches', {
            method: 'POST',
            body: JSON.stringify(branchData)
        });
    }

    static async deleteBranch(id) {
        return await this.request(`/courses/branches/${id}`, {
            method: 'DELETE'
        });
    }

    // --- Notice Endpoints ---
    static async getNotices() {
        return await this.request('/notices');
    }

    static async addNotice(noticeData) {
        return await this.request('/notices', {
            method: 'POST',
            body: JSON.stringify(noticeData)
        });
    }

    static async deleteNotice(id) {
        return await this.request(`/notices/${id}`, {
            method: 'DELETE'
        });
    }

    static async updateNotice(id, noticeData) {
        return await this.request(`/notices/${id}`, {
            method: 'PUT',
            body: JSON.stringify(noticeData)
        });
    }

    // --- Book Endpoints ---
    static async getBooks() {
        return await this.request('/books');
    }

    static async addBook(bookData) {
        return await this.request('/books', {
            method: 'POST',
            body: JSON.stringify(bookData)
        });
    }

    static async updateBook(id, bookData) {
        return await this.request(`/books/${id}`, {
            method: 'PUT',
            body: JSON.stringify(bookData)
        });
    }

    static async deleteBook(id) {
        return await this.request(`/books/${id}`, {
            method: 'DELETE'
        });
    }



    // --- Attendance Endpoints ---
    static async getAttendance(date, course, year, semester, subject) {
        let url = '/attendance?';
        if (date) url += `date=${date}&`;
        if (course) url += `course=${encodeURIComponent(course)}&`;
        if (year) url += `year=${year}&`;
        if (semester) url += `semester=${semester}&`;
        if (subject) url += `subject=${encodeURIComponent(subject)}&`;
        return await this.request(url);
    }

    static async markAttendance(attendanceData) {
        return await this.request('/attendance', {
            method: 'POST',
            body: JSON.stringify(attendanceData)
        });
    }

    static async getStudentAttendance(studentId) {
        return await this.request(`/attendance/student/${studentId}`);
    }

    static async createAttendanceSession(data) {
        return await this.request('/attendance/session', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    static async scanAttendanceToken(token) {
        return await this.request('/attendance/mark-self', {
            method: 'POST',
            body: JSON.stringify({ token })
        });
    }

    // --- Timetable Endpoints (Stubbed) ---
    static async getTimetables(course, year, semester) {
        return [];
    }

    static async updateTimetable(timetableData) {
        return { success: true };
    }

    static async deleteTimetable(id) {
        return { success: true };
    }

    // --- Subject Endpoints ---
    static async getSubjects(course, year, semester) {
        let url = '/subjects?';
        if (course) url += `course=${encodeURIComponent(course)}&`;
        if (year) url += `year=${year}&`;
        if (semester) url += `semester=${semester}`;
        return await this.request(url);
    }

    static async addSubject(subjectData) {
        return await this.request('/subjects', {
            method: 'POST',
            body: JSON.stringify(subjectData)
        });
    }

    static async addBulkSubjects(data) {
        return await this.request('/subjects/bulk', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    static async updateSubject(id, subjectData) {
        return await this.request(`/subjects/${id}`, {
            method: 'PUT',
            body: JSON.stringify(subjectData)
        });
    }

    static async deleteSubject(id) {
        return await this.request(`/subjects/${id}`, {
            method: 'DELETE'
        });
    }

    // --- Assignment Endpoints ---
    static async getFacultyClasses() {
        return [];
    }

    static async getAssignments(course, subject) {
        let url = '/assignments?';
        if (course) url += `course=${encodeURIComponent(course)}&`;
        if (subject) url += `subject=${encodeURIComponent(subject)}`;
        return await this.request(url);
    }

    static async createAssignment(assignmentData) {
        const isFormData = assignmentData instanceof FormData;
        return await this.request('/assignments', {
            method: 'POST',
            body: isFormData ? assignmentData : JSON.stringify(assignmentData),
            isFormData
        });
    }

    static async submitAssignment(id, data) {
        const isFormData = data instanceof FormData;
        return await this.request(`/assignments/${id}/submit`, {
            method: 'POST',
            body: isFormData ? data : JSON.stringify(data),
            isFormData
        });
    }

    static async gradeSubmission(assignmentId, submissionId, gradeData) {
        return await this.request(`/assignments/${assignmentId}/grade/${submissionId}`, {
            method: 'PUT',
            body: JSON.stringify(gradeData)
        });
    }

    static async deleteAssignment(id) {
        return await this.request(`/assignments/${id}`, {
            method: 'DELETE'
        });
    }

    // --- Study Material Endpoints ---
    static async getStudyMaterials(course, subject) {
        let url = '/study-materials?';
        if (course) url += `course=${encodeURIComponent(course)}&`;
        if (subject) url += `subject=${encodeURIComponent(subject)}`;
        return await this.request(url);
    }

    static async createStudyMaterial(materialData) {
        return await this.request('/study-materials', {
            method: 'POST',
            body: JSON.stringify(materialData)
        });
    }

    static async deleteStudyMaterial(id) {
        return await this.request(`/study-materials/${id}`, {
            method: 'DELETE'
        });
    }

    // --- System Endpoints ---
    static async getSystemStats() {
        return await this.request('/system/stats');
    }

    static async exportBackup() {
        return await this.request('/system/export');
    }

    static async importBackup(backupData) {
        return await this.request('/system/import', {
            method: 'POST',
            body: JSON.stringify({ backupData })
        });
    }

    static async factoryReset() {
        return await this.request('/system/reset', {
            method: 'POST'
        });
    }

    static async getSettings() {
        return await this.request('/system/settings');
    }

    static async updateSetting(key, value) {
        return await this.request('/system/settings', {
            method: 'POST',
            body: JSON.stringify({ key, value })
        });
    }

    static async addBulkStudents(data) {
        return await this.request('/students/bulk', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    static async sendLowAttendanceAlerts(threshold = 0.75) {
        return await this.request('/email/low-attendance', {
            method: 'POST',
            body: JSON.stringify({ threshold })
        });
    }

    // ── Exams ─────────────────────────────────────────────────────────────────
    static async getExams() {
        return await this.request('/exams');
    }
    static async addExam(data) {
        return await this.request('/exams', { method: 'POST', body: JSON.stringify(data) });
    }
    static async updateExam(id, data) {
        return await this.request(`/exams/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    }
    static async deleteExam(id) {
        return await this.request(`/exams/${id}`, { method: 'DELETE' });
    }
    static async getMarksByExam(examId) {
        return await this.request(`/exams/${examId}/marks`);
    }
    static async getStudentMarks(studentId) {
        return await this.request(`/exams/marks/student/${studentId}`);
    }
    static async getStudentResultSummary(studentId) {
        return await this.request(`/exams/results/student/${studentId}`);
    }
    static async updateMarks(data) {
        return await this.request('/exams/marks', { method: 'POST', body: JSON.stringify(data) });
    }
    static async bulkUpdateMarks(marks) {
        return await this.request('/exams/marks/bulk', { method: 'POST', body: JSON.stringify({ marks }) });
    }
    static async getSemesterWiseResults(studentId) {
        return await this.request(`/exams/results/semester-wise/${studentId}`);
    }
    static async getSupplementarySubjects(course, semester) {
        return await this.request(`/exams/supplementary-subjects?course=${encodeURIComponent(course)}&semester=${semester}`);
    }

    // ── Exam Applications ─────────────────────────────────────────────────────
    static async getEligibleExams() {
        return await this.request('/exam-applications/eligible-exams');
    }
    static async getExamFormDetails(examId) {
        return await this.request(`/exam-applications/${examId}/form-details`);
    }
    static async submitExamApplication(data) {
        return await this.request('/exam-applications/submit', { method: 'POST', body: JSON.stringify(data) });
    }
    static async verifyExamPayment(sessionId, examId) {
        return await this.request(`/exam-applications/verify-payment?session_id=${sessionId}&examId=${examId}`);
    }
    static async getAdmitCard(examId) {
        return await this.request(`/exam-applications/${examId}/admit-card`);
    }

    // ── Analytics ─────────────────────────────────────────────────────────────
    static async getAnalyticsSummary() {
        return await this.request('/analytics/summary');
    }
    static async getAttendanceAnalytics() {
        return await this.request('/analytics/attendance');
    }
    static async getSubjectAnalytics() {
        return await this.request('/analytics/subjects');
    }

    // ── Global Search ─────────────────────────────────────────────────────────
    static async globalSearch(q) {
        return await this.request(`/search?q=${encodeURIComponent(q)}`);
    }

    // ── Activity Log ──────────────────────────────────────────────────────────
    static async getActivityLogs({ page = 1, limit = 50, category = '' } = {}) {
        let url = `/activity-log?page=${page}&limit=${limit}`;
        if (category) url += `&category=${category}`;
        return await this.request(url);
    }
    static async createActivityLog(action, category, details = {}) {
        return await this.request('/activity-log', {
            method: 'POST',
            body: JSON.stringify({ action, category, details }),
        });
    }

    static async getAnalyticsPredictions() {
        return await this.request('/analytics/predictions');
    }
    static async sendLowAttendanceAlerts(threshold = 0.75) {
        return await this.request('/email/low-attendance', {
            method: 'POST',
            body: JSON.stringify({ threshold }),
        });
    }

    static async getExamDashboardStats() {
        return await this.request('/exams/stats/dashboard');
    }

}
