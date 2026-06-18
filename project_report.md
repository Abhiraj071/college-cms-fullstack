# Comprehensive Project Report: College CMS Fullstack

## Executive Summary
The **College CMS** is an advanced, full-stack Content Management System designed for educational institutions. It facilitates the management of students, faculty, courses, attendance, library resources, timetables, examinations, and alumni. The application adopts a modern single-page application (SPA) architecture for the frontend, coupled with a highly scalable Express.js RESTful API and a MongoDB database.

---

## 1. System Architecture

The project utilizes a decoupled client-server architecture:
- **Frontend**: A Vanilla JavaScript Single Page Application (SPA). It uses modular JavaScript components and an independent routing mechanism to ensure fast navigation without page reloads.
- **Backend**: A RESTful JSON API built on Node.js and Express.js, handling business logic, authentication, and database operations.
- **Database**: MongoDB, acting as a NoSQL document database, interfaced via Mongoose Object Data Modeling (ODM).

### Directory Structure Overview
```text
college-cms-fullstack-main/
├── backend/                  # RESTful API Backend
│   ├── controllers/          # Business logic for all API endpoints
│   ├── middleware/           # Auth protection, RBAC, File handling (Multer)
│   ├── models/               # Mongoose schema definitions (17 collections)
│   ├── routes/               # API route definitions and endpoint mapping
│   ├── seed.js               # Database initialization and mock data seeder
│   └── server.js             # Express application entry point
├── src/                      # Frontend Source Code
│   ├── components/           # UI components (Login, Dashboard)
│   │   ├── common/           # Shared UI elements (Navigation, Modals, Spinners)
│   │   └── modules/          # Feature-specific modules (15+ features)
│   └── services/             # Core logic (API Client, Auth, Routing, UI utilities)
├── styles/                   # Modular Vanilla CSS
├── index.html                # Main SPA shell
├── package.json              # Root configuration and npm scripts
└── README.md                 # Basic setup instructions
```

---

## 2. Technology Stack

### Frontend
- **Languages**: HTML5, CSS3, ES6+ JavaScript.
- **Paradigm**: Component-based Vanilla JS without heavy frameworks (e.g., no React/Vue), focusing on raw performance, DOM manipulation, and dynamic module loading.
- **Styling**: Vanilla CSS utilizing CSS variables, Flexbox, and Grid for a responsive UI.
- **Assets**: SVG icons, highly optimized images.

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js (v5.2.1)
- **Database**: MongoDB (v6+) / Mongoose ORM (v9.0.2)
- **Security Utilities**: `helmet`, `cors`, `express-rate-limit`, `bcryptjs`, `jsonwebtoken`
- **File Uploads**: `multer`
- **Utilities**: `compression` (gzip), `node-cron` (task scheduling), `nodemailer` (email delivery).

---

## 3. Database Schema & Models

The backend utilizes **17 Mongoose models**, creating a comprehensive relational-like structure within a NoSQL database.

1. **User.js**: Centralized authentication model storing credentials, roles (admin, faculty, student), and profile references.
2. **Student.js / Faculty.js / Alumni.js**: Profile schemas containing personal, academic, and demographic information.
3. **Course.js / Branch.js / Subject.js**: Academic structure schemas linking subjects to specific branches and courses.
4. **Attendance.js / AttendanceSession.js**: Granular attendance tracking linking students to specific lectures and dates.
5. **Notice.js**: System-wide or role-specific announcements and alerts.
6. **Assignment.js / Exam.js / Mark.js**: Academic evaluation schemas tracking questions, submissions, and grading.
7. **StudyMaterial.js**: Repository for uploaded academic documents, linked to subjects.
8. **Book.js**: Library management tracking book availability and metadata.
9. **Timetable.js**: Scheduling system linking time slots to subjects and faculty.
10. **Setting.js**: Global application configuration.

---

## 4. API Endpoints & Features

The API is fully modularized and exposed under the `/api` prefix. Key routes include:

| Domain | Route Prefix | Access Control | Description |
|--------|-------------|----------------|-------------|
| **Auth** | `/api/auth` | Public / Admin | Login, token generation, and secure user registration. |
| **Users** | `/api/students`, `/api/faculty`, `/api/alumni` | Protected | CRUD operations for users. Write ops are typically Admin-only. |
| **Academics** | `/api/courses`, `/api/subjects` | Protected | Management of the academic hierarchy. |
| **Operations**| `/api/attendance`, `/api/timetables` | Protected | Logging daily attendance and generating schedules. |
| **Evaluation**| `/api/assignments`, `/api/exams` | Protected | Handling assignments, tests, and marking. |
| **Library** | `/api/books`, `/api/study-materials` | Protected | Resource tracking and digital material uploads. |
| **Comms** | `/api/notices`, `/api/email` | Protected (Email: Admin) | Broadcasting announcements and triggered emails. |
| **Utility** | `/api/upload`, `/api/search`, `/api/analytics` | Protected | File uploads (Multer), global search, and dashboard metrics. |
| **System** | `/api/system`, `/api/activity-log` | Admin Only | Full DB export/import, factory reset, and audit logs. |

---

## 5. Security & Data Integrity

The CMS is built with enterprise-grade security considerations:
- **Authentication**: JWT-based stateless authentication. Passwords are salted and hashed using `bcryptjs`.
- **Role-Based Access Control (RBAC)**: Custom `authorize(...roles)` middleware ensures that sensitive routes (like user creation, DB reset, or email broadcasting) are strictly limited to the `admin` role.
- **Request Validation & Limits**:
  - `express-rate-limit`: Prevents brute-force attacks (e.g., 20 requests/15min on `/api/auth`).
  - `helmet`: Automatically sets HTTP headers to prevent XSS, clickjacking, and other common vulnerabilities.
- **Payload Limits**: The Express body parser is configured to `10mb` specifically to handle large JSON database backup files during system restores.
- **Secure File Uploads**: Multer is configured to restrict uploads to specific MIME types and extensions. Filenames are randomized on the server to prevent directory traversal attacks and file overwrites.

---

## 6. Frontend Modules

The frontend is divided into 15 specific modules loaded dynamically inside `src/components/modules/`, ensuring a clean separation of concerns:
- **Admin**: System controls, DB backups.
- **Users**: Students, Faculty, Profile.
- **Academics**: Courses, Subjects, Assignments, Exams, Timetable, Study Materials, Attendance.
- **Resources**: Library (Books), Notices.
- **Utility**: Calendar, Reports.

---

## 7. Deployment & Operations

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (v6 or higher, either local or Atlas cluster)

### Environment Configuration (`.env`)
- `PORT`: Server port (Default: 5000)
- `MONGODB_URI`: Connection string for the database.
- `JWT_SECRET`: A 32+ character cryptographic key used to sign session tokens.
- `ADMIN_PASSWORD`: A temporary password required to bootstrap the admin account on the first run.

### Running the Application
The package relies on npm scripts defined in the root `package.json` to streamline execution:
- `npm run dev`: Starts the backend server using `nodemon` for hot-reloading during development.
- `npm start`: Standard startup for production environments.

*Note: The Express backend is configured to statically serve the frontend assets and automatically route unhandled paths to `index.html` to support SPA routing.*
