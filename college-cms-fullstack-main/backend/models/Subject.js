const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    name:    { type: String, required: true },
    code:    { type: String, required: true, unique: true },
    course:  { type: String },
    year:    { type: Number, min: 1, max: 5 },
    semester:{ type: Number, min: 1, max: 10 },
    credits: { type: Number, default: 3 },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty' },
    type:    { type: String, enum: ['Theory', 'Practical', 'Lab', 'Project'], default: 'Theory' },
    description: String
}, { timestamps: true });

// Compound index for the common getSubjects(course, year, semester) query
subjectSchema.index({ course: 1, year: 1, semester: 1 });
// Index for faculty filter
subjectSchema.index({ faculty: 1 });

module.exports = mongoose.model('Subject', subjectSchema);
