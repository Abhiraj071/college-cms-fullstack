# College CMS – Full-Stack

A full-stack College Content Management System built with a Vanilla JS frontend and Express + MongoDB backend.

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB 6+ (local or Atlas)

### Installation

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd college-cms

# 2. Install backend dependencies
cd backend
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env – set JWT_SECRET, MONGODB_URI, and ADMIN_PASSWORD
```

### Environment Variables (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: 5000) |
| `MONGODB_URI` | **Yes** | MongoDB connection string |
| `JWT_SECRET` | **Yes** | Long random secret for JWT signing (min 32 chars) |
| `NODE_ENV` | No | `development` or `production` |
| `CORS_ORIGIN` | No | Allowed origin in production (e.g. `https://yourapp.com`) |
| `ADMIN_PASSWORD` | **Yes** | Initial admin password (change immediately after first login) |

Generate a strong `JWT_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Running

```bash
# Development (auto-reload)
cd backend && npm run dev

# Production
cd backend && npm start
```

The server serves the frontend SPA from the project root and the API at `/api`.

---

## Architecture

```
college-cms/
├── backend/                  # Express API
│   ├── controllers/          # Route handler logic
│   ├── middleware/           # Auth (JWT), file upload (Multer)
│   ├── models/               # Mongoose schemas & indexes
│   ├── routes/               # Express routers
│   ├── seed.js               # Database seed script
│   └── server.js             # Entry point
├── src/
│   ├── components/           # Vanilla JS UI components
│   └── services/             # API client, auth, routing, etc.
├── styles/                   # CSS
└── index.html                # SPA shell
```

---

## Security Notes

- **JWT_SECRET** must be a strong random value — never use the placeholder.
- **ADMIN_PASSWORD** is only set on first boot. Change it via the profile page immediately.
- When students/faculty are bulk-created, a random password is returned in the API response for that request only — store it securely and share with the user.
- File uploads are restricted to specific extensions + MIME types. Upload filenames are randomised.
- All `/api/system/*` routes (export, import, reset) are admin-only.
- Rate limiting is applied: 20 auth attempts per 15 min, 200 API calls per minute.

---

## API Overview

| Prefix | Auth required | Notes |
|---|---|---|
| `POST /api/auth/login` | No | |
| `POST /api/auth/register` | Admin only | |
| `GET/POST/PUT/DELETE /api/students` | Yes | Write ops admin-only |
| `GET/POST/PUT/DELETE /api/faculty` | Yes | Write ops admin-only |
| `GET/POST/PUT/DELETE /api/courses` | Yes | Write ops admin-only |
| `GET/POST/PUT/DELETE /api/subjects` | Yes | |
| `GET/POST /api/attendance` | Yes | |
| `GET/POST/PUT/DELETE /api/notices` | Yes | |
| `GET/POST/PUT/DELETE /api/books` | Yes | |
| `GET/POST/DELETE /api/assignments` | Yes | |
| `GET/POST/DELETE /api/study-materials` | Yes | |
| `GET/POST /api/timetables` | Yes | |
| `POST /api/upload` | Yes | File upload |
| `GET /api/system/stats` | Admin only | |
| `GET /api/system/export` | Admin only | Full DB export |
| `POST /api/system/import` | Admin only | Full DB restore |
| `POST /api/system/reset` | Admin only | Factory reset |
