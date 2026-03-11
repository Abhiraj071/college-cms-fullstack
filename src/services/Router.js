import { ROLES, ROUTES } from './Constants.js';

// Import Components
import { Dashboard } from '../components/Dashboard.js';
import { Profile } from '../components/modules/profile/Profile.js';
import { StudentList } from '../components/modules/students/StudentList.js';
import { StudentForm } from '../components/modules/students/StudentForm.js';
import { BulkStudentForm } from '../components/modules/students/BulkStudentForm.js';

import { FacultyList } from '../components/modules/faculty/FacultyList.js';
import { FacultyForm } from '../components/modules/faculty/FacultyForm.js';
import { BulkFacultyForm } from '../components/modules/faculty/BulkFacultyForm.js';
import { CourseList } from '../components/modules/courses/CourseList.js';
import { CourseForm } from '../components/modules/courses/CourseForm.js';
import { BranchManager } from '../components/modules/courses/BranchManager.js';
import { AttendanceView } from '../components/modules/attendance/AttendanceView.js';

import { NoticeList } from '../components/modules/notices/NoticeList.js';
import { NoticeForm } from '../components/modules/notices/NoticeForm.js';
import { Timetable } from '../components/modules/timetable/Timetable.js';
import { BookList } from '../components/modules/library/BookList.js';
import { BookForm } from '../components/modules/library/BookForm.js';
import { ReportCenter } from '../components/modules/reports/ReportCenter.js';
import { Settings } from '../components/modules/admin/Settings.js';

import { SubjectList } from '../components/modules/subjects/SubjectList.js';
import { SubjectForm } from '../components/modules/subjects/SubjectForm.js';
import { AssignmentList } from '../components/modules/assignments/AssignmentList.js';
import { StudyMaterialList } from '../components/modules/study-materials/StudyMaterialList.js';

const ALL = [ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT];
const STAFF = [ROLES.ADMIN, ROLES.TEACHER];

export class Router {
    constructor() {
        this.routes = {
            [ROUTES.DASHBOARD]: { roles: ALL, component: Dashboard },
            [ROUTES.PROFILE]: { roles: ALL, component: Profile },


            // Students
            [ROUTES.STUDENTS_LIST]: { roles: [ROLES.ADMIN], component: StudentList },
            [ROUTES.STUDENTS_ADD]: { roles: [ROLES.ADMIN], component: StudentForm },
            [ROUTES.STUDENTS_BULK]: { roles: [ROLES.ADMIN], component: BulkStudentForm },


            // Faculty
            [ROUTES.FACULTY_LIST]: { roles: [ROLES.ADMIN], component: FacultyList },
            [ROUTES.FACULTY_ADD]: { roles: [ROLES.ADMIN], component: FacultyForm },
            [ROUTES.FACULTY_BULK]: { roles: [ROLES.ADMIN], component: BulkFacultyForm },

            // Courses
            [ROUTES.COURSES_LIST]: { roles: STAFF, component: CourseList },
            [ROUTES.COURSES_ADD]: { roles: [ROLES.ADMIN], component: CourseForm },
            [ROUTES.BRANCHES]: { roles: [ROLES.ADMIN], component: BranchManager },

            // Attendance
            [ROUTES.ATTENDANCE]: { roles: ALL, component: AttendanceView },

            // Academic
            [ROUTES.ASSIGNMENTS]: { roles: ALL, component: AssignmentList },
            [ROUTES.STUDY_MATERIALS]: { roles: [ROLES.ADMIN], component: StudyMaterialList },



            // Notices
            [ROUTES.NOTICES]: { roles: ALL, component: NoticeList },
            [ROUTES.NOTICES_ADD]: { roles: STAFF, component: NoticeForm },

            // Timetable
            [ROUTES.TIMETABLE]: { roles: ALL, component: Timetable },

            // Subjects
            [ROUTES.SUBJECTS_LIST]: { roles: ALL, component: SubjectList },
            [ROUTES.SUBJECTS_ADD]: { roles: [ROLES.ADMIN], component: SubjectForm },

            // Library
            [ROUTES.LIBRARY]: { roles: [ROLES.ADMIN, ROLES.STUDENT], component: BookList },
            [ROUTES.LIBRARY_ADD]: { roles: [ROLES.ADMIN], component: BookForm },
            [ROUTES.LIBRARY_MY_BOOKS]: { roles: [ROLES.STUDENT], component: BookList },

            // Reports & Settings
            [ROUTES.REPORTS]: { roles: STAFF, component: ReportCenter },
            [ROUTES.SETTINGS]: { roles: [ROLES.ADMIN], component: Settings }
        };
    }

    getRouteInfo(hash) {
        const path = hash.split('?')[0] || ROUTES.DASHBOARD;
        const params = new URLSearchParams(hash.split('?')[1] || '');

        // Handle Dynamic Routes using Constant prefix
        const facultyEditPrefix = ROUTES.FACULTY_EDIT.split('/:')[0];
        const studentEditPrefix = ROUTES.STUDENTS_EDIT.split('/:')[0];

        if (path.startsWith(facultyEditPrefix + '/')) {
            return {
                path,
                params,
                config: {
                    roles: [ROLES.ADMIN],
                    component: FacultyForm,
                    dynamicId: path.split('/').pop()
                }
            };
        }

        if (path.startsWith(studentEditPrefix + '/')) {
            return {
                path,
                params,
                config: {
                    roles: [ROLES.ADMIN],
                    component: StudentForm,
                    dynamicId: path.split('/').pop()
                }
            };
        }

        const noticeEditPrefix = ROUTES.NOTICES_EDIT.split('/:')[0];
        if (path.startsWith(noticeEditPrefix + '/')) {
            return {
                path,
                params,
                config: {
                    roles: [ROLES.ADMIN, ROLES.TEACHER],
                    component: NoticeForm,
                    dynamicId: path.split('/').pop()
                }
            };
        }

        const courseEditPrefix = ROUTES.COURSES_EDIT.split('/:')[0];
        if (path.startsWith(courseEditPrefix + '/')) {
            return {
                path,
                params,
                config: {
                    roles: [ROLES.ADMIN],
                    component: CourseForm,
                    dynamicId: path.split('/').pop()
                }
            };
        }

        const libraryEditPrefix = ROUTES.LIBRARY_EDIT.split('/:')[0];
        if (path.startsWith(libraryEditPrefix + '/')) {
            return {
                path,
                params,
                config: {
                    roles: [ROLES.ADMIN],
                    component: BookForm,
                    dynamicId: path.split('/').pop()
                }
            };
        }



        const subjectEditPrefix = ROUTES.SUBJECTS_EDIT.split('/:')[0];
        if (path.startsWith(subjectEditPrefix + '/')) {
            return {
                path,
                params,
                config: {
                    roles: [ROLES.ADMIN],
                    component: SubjectForm,
                    dynamicId: path.split('/').pop()
                }
            };
        }

        return {
            path,
            params,
            config: this.routes[path] || null
        };
    }

    navigate(hash) {
        window.location.hash = hash;
    }
}

export const router = new Router();
