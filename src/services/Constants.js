export const ROLES = {
    ADMIN: 'admin',
    TEACHER: 'teacher',
    STUDENT: 'student'
};

export const ROUTES = {
    DASHBOARD: 'dashboard',
    PROFILE: 'my-profile',


    // Students
    STUDENTS_LIST: 'students',
    STUDENTS_ADD: 'students/add',
    STUDENTS_BULK: 'students/bulk',
    STUDENTS_EDIT: 'students/edit/:id',

    // Faculty
    FACULTY_LIST: 'faculty',
    FACULTY_ADD: 'faculty/add',
    FACULTY_BULK: 'faculty/bulk',
    FACULTY_EDIT: 'faculty/edit/:id',

    // Courses
    COURSES_LIST: 'courses',
    COURSES_ADD: 'courses/add',
    COURSES_EDIT: 'courses/edit/:id',
    BRANCHES: 'branches',

    // Academic
    ATTENDANCE: 'attendance',
    ASSIGNMENTS: 'assignments',
    STUDY_MATERIALS: 'study-materials',
    TIMETABLE: 'timetable',
    SUBJECTS_LIST: 'subjects',
    SUBJECTS_ADD: 'subjects/add',
    SUBJECTS_EDIT: 'subjects/edit/:id',


    // Communication
    NOTICES: 'notices',
    NOTICES_ADD: 'notices/add',
    NOTICES_EDIT: 'notices/edit/:id',

    // Library
    LIBRARY: 'library',
    LIBRARY_ADD: 'library/add',
    LIBRARY_EDIT: 'library/edit/:id',
    LIBRARY_MY_BOOKS: 'library-books',

    // Admin
    REPORTS: 'reports',
    SETTINGS: 'settings',



    // Auth
    LOGIN: 'login'
};

export const STORAGE_KEYS = {
    USERS: 'cms_users',
    STUDENTS: 'cms_students',
    COURSES: 'cms_courses',
    ATTENDANCE: 'cms_attendance',

    NOTICES: 'cms_notices',
    LIBRARY: 'cms_library',
    SESSION: 'cms_session'
};
