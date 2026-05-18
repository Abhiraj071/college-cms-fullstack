const mongoose = require('mongoose');

const subjectScheduleSchema = new mongoose.Schema({
    subjectId:    { type: String },
    name:         { type: String, required: true },
    code:         { type: String },
    type:         { type: String },
    semester:     { type: Number },
    isSupplementary: { type: Boolean, default: false },
    date:         { type: Date },
    time:         { type: String },
    maxTotal:     { type: Number, default: 100 },
    maxTheory:    { type: Number, default: 70 },
    maxSessional: { type: Number, default: 30 },
    maxViva:      { type: Number, default: 0 },
    venue:        { type: String }
}, { _id: false });

const examSchema = new mongoose.Schema({
    title:           { type: String, required: true },
    course:          { type: String, required: true },
    semester:        { type: Number, min: 1, max: 10 },
    examType:        { type: String, enum: ['Regular', 'Supplementary'], default: 'Regular' },
    venue:           { type: String },
    subjectSchedules:{ type: [subjectScheduleSchema], default: [] },

    // Legacy fields for backward compatibility
    subject:         { type: String },
    date:            { type: Date },
    time:            { type: String },
    totalMarks:      { type: Number, default: 100 },
    passingMarks:    { type: Number, default: 40 },
    room:            { type: String },
    description:     { type: String },
    createdBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

examSchema.index({ course: 1, date: -1 });

module.exports = mongoose.model('Exam', examSchema);
