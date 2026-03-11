const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true,
        unique: true
    },
    course: {
        type: String,
        required: false
    },
    year: {
        type: Number,
        required: false,
        min: 1,
        max: 5
    },
    semester: {
        type: Number,
        required: false,
        min: 1,
        max: 10
    },
    credits: {
        type: Number,
        default: 3
    },
    faculty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Faculty'
    },
    type: {
        type: String,
        enum: ['Theory', 'Practical', 'Lab', 'Project'],
        default: 'Theory'
    },
    description: String
}, {
    timestamps: true
});

module.exports = mongoose.model('Subject', subjectSchema);
