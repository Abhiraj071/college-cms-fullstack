const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
    exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    course: { type: String },
    semester: { type: Number },
    subjects: [{
        subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
        subjectCode: { type: String },
        subjectName: { type: String },
        theoryMarks: { type: Number, default: 0 },
        sessionalMarks: { type: Number, default: 0 },
        totalMarks: { type: Number, default: 0 },
        isSupplementary: { type: Boolean, default: false }
    }],
    totalScore: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    overallStatus: { type: String, enum: ['Pass', 'Supplementary'], default: 'Pass' }
}, { timestamps: true });

resultSchema.pre('save', function(next) {
    let totalScore = 0;
    let hasSupplementary = false;
    let maxTotal = this.subjects.length * 100;

    this.subjects.forEach(sub => {
        sub.totalMarks = (sub.theoryMarks || 0) + (sub.sessionalMarks || 0);
        totalScore += sub.totalMarks;
        if (sub.totalMarks < 40) {
            sub.isSupplementary = true;
            hasSupplementary = true;
        } else {
            sub.isSupplementary = false;
        }
    });

    this.totalScore = totalScore;
    if (maxTotal > 0) {
        this.percentage = (totalScore / maxTotal) * 100;
        this.percentage = Math.round(this.percentage * 100) / 100; // Keep two decimals
    }
    this.overallStatus = hasSupplementary ? 'Supplementary' : 'Pass';

    next();
});

resultSchema.index({ exam: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Result', resultSchema);
