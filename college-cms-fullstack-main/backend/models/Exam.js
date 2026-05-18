const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
    title: { type: String, required: true }, // e.g., "Midterm 2026", "Final Semester"
    course: { type: String, required: true },
    semester: { type: Number }, // Optional: Exam can be for a full course
    date: { type: Date, required: true },
    type: { type: String, enum: ['Regular', 'Supplementary'], default: 'Regular' },
    status: { type: String, enum: ['Scheduled', 'Ongoing', 'Completed', 'Published'], default: 'Scheduled' },
    timetable: [{
        date: { type: Date, required: true },
        timing: { type: String, required: true },
        subject: { type: String, required: true },
        code: { type: String }
    }]
}, { timestamps: true });

// Indexes for typical queries
examSchema.index({ course: 1, semester: 1 });
examSchema.index({ date: -1 });

module.exports = mongoose.model('Exam', examSchema);
