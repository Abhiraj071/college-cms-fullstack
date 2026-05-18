const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
    title:       { type: String, required: true },
    description: String,
    course:      { type: String, required: true },
    year:        { type: Number, required: true },
    semester:    { type: Number, required: true },
    subject:     { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    faculty:     { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true },
    deadline:    { type: Date, required: true },
    allowLate:   { type: Boolean, default: false },
    fileUrl:     String,
    submissions: [{
        student:     { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
        fileUrl:     String,
        submittedAt: { type: Date, default: Date.now },
        grade:       String,
        feedback:    String
    }]
}, { timestamps: true });

// Common query: fetch assignments by course/semester
assignmentSchema.index({ course: 1, semester: 1 });
// Fetch assignments created by a faculty member
assignmentSchema.index({ faculty: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);
