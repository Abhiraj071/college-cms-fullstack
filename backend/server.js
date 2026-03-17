const express = require('express');
const compression = require('compression');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Load environment variables
dotenv.config();

// Validate required env vars early
const required = ['JWT_SECRET', 'MONGODB_URI'];
for (const key of required) {
    if (!process.env[key]) {
        console.error(`❌ Missing required environment variable: ${key}`);
        process.exit(1);
    }
}
if (process.env.JWT_SECRET === 'replace_with_a_long_random_secret_min_32_chars') {
    console.error('❌ JWT_SECRET is still set to the placeholder value. Please set a real secret.');
    process.exit(1);
}

const app = express();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Security headers via helmet
// Use a relaxed CSP so the SPA frontend can load scripts/styles
app.use(helmet({
    contentSecurityPolicy: false, // SPA serves its own inline scripts; tune if you add a build step
}));

// Compression
app.use(compression());

// CORS – restrict to configured origin in production
const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:5000';
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' ? allowedOrigin : true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};
app.use(cors(corsOptions));

// Body parsing (limit payload size to prevent abuse)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Larger limit specifically for backup restore uploads
app.use('/api/system/import', express.json({ limit: '50mb' }));

// Rate limiting for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,                   // max 20 attempts per window
    message: { message: 'Too many login attempts, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// General API limiter
const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
});

// Serve static uploads (uploaded files only – no directory listing)
app.use('/uploads', express.static('uploads', { index: false }));

// Apply general rate limit to all API routes
app.use('/api', apiLimiter);

// Routes
const { protect, authorize } = require('./middleware/authMiddleware');

app.use('/api/auth', authLimiter, require('./routes/authRoutes'));
app.use('/api/upload', protect, require('./routes/uploadRoutes'));     // auth required
app.use('/api/system', protect, authorize('admin'), require('./routes/systemRoutes')); // admin only
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/faculty', require('./routes/facultyRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/notices', require('./routes/noticeRoutes'));
app.use('/api/books', require('./routes/bookRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/timetables', require('./routes/timetableRoutes'));
app.use('/api/subjects', require('./routes/subjectRoutes'));
app.use('/api/assignments', require('./routes/assignmentRoutes'));
app.use('/api/study-materials', require('./routes/studyMaterialRoutes'));

// ── New feature routes (additive) ──────────────────────────────────────────
app.use('/api/search',        require('./routes/searchRoutes'));
app.use('/api/email',         require('./routes/emailRoutes'));

// Serve Frontend Static Files with caching
const root = path.join(__dirname, '../');
app.use(express.static(root, {
    maxAge: '1d',    // cache static assets for 1 day
    etag: true,
    index: false
}));

// SPA Catch-all
app.get(/^(?!\/api).+/, (req, res) => {
    res.sendFile(path.join(root, 'index.html'));
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
    maxPoolSize: 10,    // connection pool for performance
})
    .then(async () => {
        console.log('✅ Connected to MongoDB');
        await initializeAdmin();
        // Start scheduled jobs after DB is ready
        try {
            const { startBackupJob } = require('./jobs/backupJob');
            startBackupJob();
        } catch (e) {
            console.warn('⚠️  Backup job unavailable (install node-cron):', e.message);
        }
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });

async function initializeAdmin() {
    try {
        const User = require('./models/User');
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminPassword || adminPassword === 'change_this_in_production') {
            console.warn('⚠️  ADMIN_PASSWORD env var is not set or is using the default placeholder.');
            console.warn('   Please set a strong ADMIN_PASSWORD in your .env file.');
        }

        let adminUser = await User.findOne({ username: 'admin' });

        if (!adminUser) {
            adminUser = new User({
                username: 'admin',
                name: 'System Administrator',
                email: 'admin@college.edu',
                role: 'admin',
                password: adminPassword || 'ChangeMe@123!',
            });
            await adminUser.save();
            console.log('✅ Admin user created. Please change the password immediately.');
        } else {
            console.log('✅ Admin user already exists.');
        }
    } catch (err) {
        console.error('⚠️ Admin initialization failed:', err.message);
    }
}

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    // Don't leak internal error details in production
    const message = process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message;
    res.status(err.status || 500).json({ message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT} [${process.env.NODE_ENV || 'development'}]`);
});
