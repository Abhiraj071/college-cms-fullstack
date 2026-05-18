const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
    course: { type: String, required: true },
    year: { type: Number, required: true },
    semester: { type: Number, required: true },

    // Dynamic Structure
    days: {
        type: [String],
        default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    },
    timeSlots: {
        type: [String],
        default: ['09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '12:00 - 01:00']
    },

    // The actual schedule data: simple map of "day_time" -> { subject, ... }
    // Key format: `${day}::${timeSlot}`
    grid: {
        type: Map,
        of: new mongoose.Schema({
            subject: String,
            teacher: String,
            room: String,
            color: String
        }, { _id: false })
    }
}, {
    timestamps: true
});

// One timetable document per Course-Year-Semester tuple
timetableSchema.index({ course: 1, year: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('Timetable', timetableSchema);
