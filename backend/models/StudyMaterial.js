const mongoose = require('mongoose');

const studyMaterialSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    type: {
        type: String,
        enum: ['Notes', 'PPT', 'Video', 'Reference Book', 'Other'],
        required: true
    },
    course: {
        type: String,
        required: true
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true
    },
    faculty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Faculty',
        required: true
    },
    fileUrl: String,
    link: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('StudyMaterial', studyMaterialSchema);
