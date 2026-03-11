const express = require('express');
const compression = require('compression');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

const app = express();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(compression());
app.use(cors());
app.use(express.json());

// Serve static uploads

app.use('/uploads', express.static('uploads'));

const uploadRoutes = require('./routes/uploadRoutes');
const systemRoutes = require('./routes/systemRoutes');

// Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/auth', require('./routes/authRoutes'));
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

// Serve Frontend Static Files
const root = path.join(__dirname, '../');
app.use(express.static(root, {
    maxAge: '1d',
    index: false
}));

// SPA Catch-all: Redirect all non-API requests to index.html
app.get(/^(?!\/api).+/, (req, res) => {
    res.sendFile(path.join(root, 'index.html'));
});


// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/college_cms';
mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: err.message || 'Server Error' });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
