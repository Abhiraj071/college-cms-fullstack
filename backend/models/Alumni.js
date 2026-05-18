const mongoose = require('mongoose');

const alumniSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name:     { type: String, required: true },
    rollNo:   { type: String, required: true },
    course:   { type: String, required: true },
    batch:    { type: String, required: true }, // e.g. "B.Tech 2020-2024"
    email:    { type: String, required: true },
    phone:    String,
    joinDate: { type: Date },
    graduationDate: { type: Date, default: Date.now },
    cgpa:     { type: Number, default: 0.0 },
    totalAttendance: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Alumni', alumniSchema);
