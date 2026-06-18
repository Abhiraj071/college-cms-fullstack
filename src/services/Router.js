import { ROLES, ROUTES } from './Constants.js';

// Import Components
import { Dashboard } from '../components/Dashboard.js';
import { Profile } from '../components/modules/profile/Profile.js';
import { StudentList } from '../components/modules/students/StudentList.js';
import { StudentForm } from '../components/modules/students/StudentForm.js';
import { BulkStudentForm } from '../components/modules/students/BulkStudentForm.js';


import { CourseList } from '../components/modules/courses/CourseList.js';
import { CourseForm } from '../components/modules/courses/CourseForm.js';
import { BranchManager } from '../components/modules/courses/BranchManager.js';
import { AttendanceView } from '../components/modules/attendance/AttendanceView.js';

import { NoticeList } from '../components/modules/notices/NoticeList.js';
import { NoticeForm } from '../components/modules/notices/NoticeForm.js';

import { BookList } from '../components/modules/library/BookList.js';
import { BookForm } from '../components/modules/library/BookForm.js';
import { ReportCenter } from '../components/modules/reports/ReportCenter.js';
import { Settings } from '../components/modules/admin/Settings.js';

import { SubjectList } from '../components/modules/subjects/SubjectList.js';
import { SubjectForm } from '../components/modules/subjects/SubjectForm.js';
import { AssignmentList } from '../components/modules/assignments/AssignmentList.js';
import { StudyMaterialList } from '../components/modules/study-materials/StudyMaterialList.js';

import { AcademicCalendar }   from '../components/modules/calendar/AcademicCalendar.js';
import { ExamList }           from '../components/modules/exams/ExamList.js';
import { ExamForm }           from '../components/modules/exams/ExamForm.js';
import { MarkEntry }          from '../components/modules/exams/MarkEntry.js';
import { ExamDashboard }      from '../components/modules/exams/ExamDashboard.js';
import { StudentResults }     from '../components/modules/students/StudentResults.js';
import { BulkExamForm }      from '../components/modules/exams/BulkExamForm.js';
import { AdmitCardManager }   from '../components/modules/exams/AdmitCardManager.js';
import { ExamRegistration }   from '../components/modules/students/ExamRegistration.js';
import { BulkSubjectForm }   from '../components/modules/subjects/BulkSubjectForm.js';

import { AlumniList }         from '../components/modules/students/AlumniList.js';

const ALL = [ROLES.ADMIN, ROLES.STUDENT];
const STAFF = [ROLES.ADMIN];

export class Router {
    constructor() {
        this.routes = {
            [ROUTES.DASHBOARD]: { roles: ALL, component: Dashboard },
            [ROUTES.PROFILE]: { roles: ALL, component: Profile },


            // Students
            [ROUTES.STUDENTS_LIST]: { roles: [ROLES.ADMIN], component: StudentList },
            [ROUTES.STUDENTS_ADD]: { roles: [ROLES.ADMIN], component: StudentForm },
            [ROUTES.STUDENTS_BULK]: { roles: [ROLES.ADMIN], component: BulkStudentForm },




            // Courses
            [ROUTES.COURSES_LIST]: { roles: STAFF, component: CourseList },
            [ROUTES.COURSES_ADD]: { roles: [ROLES.ADMIN], component: CourseForm },
            [ROUTES.BRANCHES]: { roles: [ROLES.ADMIN], component: BranchManager },



            // Subjects
            [ROUTES.SUBJECTS_LIST]: { roles: ALL, component: SubjectList },
            [ROUTES.SUBJECTS_BULK]: { roles: [ROLES.ADMIN], component: BulkSubjectForm },
            [ROUTES.SUBJECTS_ADD]: { roles: [ROLES.ADMIN], component: SubjectForm },

            // Library
            [ROUTES.LIBRARY]: { roles: [ROLES.ADMIN, ROLES.STUDENT], component: BookList },
            [ROUTES.LIBRARY_ADD]: { roles: [ROLES.ADMIN], component: BookForm },
            [ROUTES.LIBRARY_MY_BOOKS]: { roles: [ROLES.STUDENT], component: BookList },

            // Settings
            [ROUTES.SETTINGS]: { roles: [ROLES.ADMIN], component: Settings },

            // Reports
            [ROUTES.REPORTS]: { roles: STAFF, component: ReportCenter },

            // ── Exams & Results ─────────────────────────────────────────────
            [ROUTES.EXAMS_LIST]:   { roles: ALL,              component: ExamList },
            [ROUTES.EXAMS_BULK]:   { roles: [ROLES.ADMIN],    component: BulkExamForm },
            [ROUTES.EXAMS_DASHBOARD]: { roles: STAFF,         component: ExamDashboard },
            [ROUTES.EXAMS_ADD]:    { roles: [ROLES.ADMIN],    component: ExamForm },
            [ROUTES.EXAMS_MARKS]:  { roles: STAFF,            component: MarkEntry },
            [ROUTES.EXAMS_ADMIT_CARDS]: { roles: STAFF,       component: AdmitCardManager },
            [ROUTES.EXAM_REGISTRATION]: { roles: [ROLES.STUDENT], component: ExamRegistration },
            [ROUTES.RESULTS]:      { roles: [ROLES.STUDENT],  component: StudentResults },

            [ROUTES.ALUMNI]:       { roles: [ROLES.ADMIN],    component: AlumniList },
        };
    }

    getRouteInfo(hash) {
        let path = hash.split('?')[0] || ROUTES.DASHBOARD;
        if (path.startsWith('/')) {
            path = path.substring(1);
        }
        const params = new URLSearchParams(hash.split('?')[1] || '');

        // Handle Dynamic Routes using Constant prefix
        const studentEditPrefix = ROUTES.STUDENTS_EDIT.split('/:')[0];

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
                    roles: STAFF,
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
