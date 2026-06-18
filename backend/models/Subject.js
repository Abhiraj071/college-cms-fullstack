const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    name:    { type: String, required: true },
    code:    { type: String, required: true, unique: true },
    course:  { type: String },
    year:    { type: Number, min: 1, max: 5 },
    semester:{ type: Number, min: 1, max: 10 },
    type:    { type: String, enum: ['Theory', 'Practical'], default: 'Theory' },
    description: String
}, { timestamps: true });

// Compound index for the common getSubjects(course, year, semester) query
subjectSchema.index({ course: 1, year: 1, semester: 1 });

module.exports = mongoose.model('Subject', subjectSchema);
