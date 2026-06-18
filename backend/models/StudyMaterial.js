const mongoose = require('mongoose');

const studyMaterialSchema = new mongoose.Schema({
    title:       { type: String, required: true },
    description: String,
    type:        { type: String, enum: ['Notes', 'PPT', 'Video', 'Reference Book', 'Other'], required: true },
    course:      { type: String, required: true },
    subject:     { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    fileUrl:     String,
    link:        String,
}, { timestamps: true });

// Common query: fetch materials by course
studyMaterialSchema.index({ course: 1, subject: 1 });

module.exports = mongoose.model('StudyMaterial', studyMaterialSchema);
