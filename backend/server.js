require('dotenv').config();
const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');
const helmet    = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path      = require('path');

const { protect, authorize } = require('./middleware/authMiddleware');

const app = express();

// ─── Body Parser ─────────────────────────────────────────────────────────────
// Limit raised to 10 MB so that large JSON backup files (restore feature) are
// accepted without a 413 / 500 error.
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Security & Performance ───────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));

// ─── Rate Limiting (auth routes only) ────────────────────────────────────────
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',            require('./routes/authRoutes'));
app.use('/api/students',        protect, require('./routes/studentRoutes'));
app.use('/api/faculty',         protect, require('./routes/facultyRoutes'));
app.use('/api/courses',         protect, require('./routes/courseRoutes'));
app.use('/api/subjects',        protect, require('./routes/subjectRoutes'));
app.use('/api/attendance',      protect, require('./routes/attendanceRoutes'));
app.use('/api/timetables',      protect, require('./routes/timetableRoutes'));
app.use('/api/notices',         protect, require('./routes/noticeRoutes'));
app.use('/api/assignments',     protect, require('./routes/assignmentRoutes'));
app.use('/api/books',           protect, require('./routes/bookRoutes'));
app.use('/api/study-materials', protect, require('./routes/studyMaterialRoutes'));
app.use('/api/search',          protect, require('./routes/searchRoutes'));
app.use('/api/upload',          protect, require('./routes/uploadRoutes'));
app.use('/api/email',           protect, authorize('admin'), require('./routes/emailRoutes'));
app.use('/api/system',          protect, authorize('admin'), require('./routes/systemRoutes'));
app.use('/api/exams',           protect, require('./routes/examRoutes'));
app.use('/api/analytics',       protect, require('./routes/analyticsRoutes'));
app.use('/api/activity-log',    protect, require('./routes/activityLogRoutes'));

// ─── Serve Frontend ───────────────────────────────────────────────────────────
const frontendPath = path.join(__dirname, '..');
app.use(express.static(frontendPath));
app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// ─── Connect DB & Start ───────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log(`MongoDB connected → ${mongoose.connection.name}`);
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(err => {
        console.error('MongoDB connection failed:', err.message);
        process.exit(1);
    });
