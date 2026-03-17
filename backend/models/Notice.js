const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
    title:   { type: String, required: true },
    content: { type: String, required: true },
    category:{ type: String, default: 'General' },
    author:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date:    { type: Date, default: Date.now },
    targetRoles: [{
        type: String,
        enum: ['admin', 'teacher', 'student'],
    }]
}, { timestamps: true });

// Notices are almost always fetched sorted by date descending
noticeSchema.index({ date: -1 });
noticeSchema.index({ category: 1 });

module.exports = mongoose.model('Notice', noticeSchema);
