const mongoose = require('mongoose');

const markSchema = new mongoose.Schema({
    examId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Exam',    required: true },
    studentId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    studentSemester: { type: Number }, // The semester the student was in when this mark was recorded
    marksObtained: { type: Number, required: true, min: 0 },
    subjectMarks:  [{
        subjectId: String,
        subjectName: String,
        subjectCode: String,
        semester: Number,
        isSupplementary: { type: Boolean, default: false },
        theory: Number,
        sessional: Number,
        viva: Number,
        total: Number,
        maxTheory: Number,
        maxSessional: Number,
        maxViva: Number,
        maxTotal: Number
    }],
    remarks:       { type: String, default: '' },
    enteredBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Unique mark per student per exam
markSchema.index({ examId: 1, studentId: 1 }, { unique: true });
markSchema.index({ studentId: 1 });

module.exports = mongoose.model('Mark', markSchema);
