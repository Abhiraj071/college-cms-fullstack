const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    course: {
        type: String, // Course name
        required: true
    },
    year: {
        type: String, // e.g. "1", "2"
        required: true
    },
    semester: {
        type: String, // e.g. "1", "2"
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    students: [{
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student'
        },
        status: {
            type: String,
            enum: ['Present', 'Absent', 'Late'],
            default: 'Present'
        }
    }],
    markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Ensure unique attendance per class session
attendanceSchema.index({ date: 1, course: 1, year: 1, semester: 1, subject: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
