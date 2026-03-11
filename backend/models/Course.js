const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },
    duration: {
        type: Number,
        required: true
    },
    description: String,
    branches: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch'
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Course', courseSchema);
