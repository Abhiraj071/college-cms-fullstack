const mongoose = require('mongoose');

const examApplicationSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    examId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    course:    { type: String, required: true },
    semester:  { type: Number, required: true },
    
    // Subjects applied for
    regularSubjects: [{
        subjectId: { type: String },
        name: { type: String },
        code: { type: String }
    }],
    supplementarySubjects: [{
        subjectId: { type: String },
        name: { type: String },
        code: { type: String },
        semester: { type: Number }
    }],

    // Payment details
    status: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' },
    feeAmount: { type: Number, required: true },
    transactionId: { type: String },
    paymentDate: { type: Date },

}, { timestamps: true });

// A student can only apply once for a specific exam
examApplicationSchema.index({ studentId: 1, examId: 1 }, { unique: true });

module.exports = mongoose.model('ExamApplication', examApplicationSchema);
