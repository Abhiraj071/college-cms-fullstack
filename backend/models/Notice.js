const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    category: {
        type: String, // 'Academic', 'Event', 'Holiday', 'Exams', 'General'
        default: 'General'
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    targetRoles: [{
        type: String,
        enum: ['admin', 'teacher', 'student'],
        default: ['admin', 'teacher', 'student']
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Notice', noticeSchema);
