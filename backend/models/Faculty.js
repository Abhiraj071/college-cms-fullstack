const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: String,
    department: {
        type: String,
        required: true
    },
    designation: {
        type: String,
        required: true
    },
    qualification: {
        type: String,
        required: true
    },
    joinDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Faculty', facultySchema);
