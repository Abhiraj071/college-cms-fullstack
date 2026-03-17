const mongoose = require('mongoose');

const markSchema = new mongoose.Schema({
    studentId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    marksObtained:  { type: Number, required: true, min: 0 }
}, { _id: false });

const examSchema = new mongoose.Schema({
    title:      { type: String, required: true, trim: true },
    course:     { type: String, required: true },
    subject:    { type: String, required: true },
    date:       { type: Date, required: true },
    time:       { type: String },
    totalMarks: { type: Number, required: true, default: 100 },
    room:       { type: String },
    type:       { type: String, enum: ['Internal', 'Mid-Term', 'Final', 'Practical'], default: 'Internal' },
    marks:      [markSchema]
}, { timestamps: true });

examSchema.index({ course: 1, date: 1 });

module.exports = mongoose.model('Exam', examSchema);
