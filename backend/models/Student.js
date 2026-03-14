const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    name: {
        type: String,
        required: true
    },
    rollNo: {
        type: String,
        required: true,
        unique: true
    },
    course: {
        type: String,
        required: true
    },
    semester: {
        type: Number,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: String,
    joinDate: {
        type: Date,
        default: Date.now
    },
    cgpa: {
        type: Number,
        default: 0.0
    },
    present: {
        type: Number,
        default: 0
    },
    absent: {
        type: Number,
        default: 0
    },
    totalClasses: {
        type: Number,
        default: 0
    },
    attendancePercentage: {
        type: String,
        default: "0%"
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Student', studentSchema);
