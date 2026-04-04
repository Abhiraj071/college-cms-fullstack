const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
    userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name:          { type: String, required: true },
    email:         { type: String, required: true },
    phone:         String,
    department:    { type: String, required: true },
    designation:   { type: String, required: true },
    qualification: { type: String, default: '' },
    joinDate:      { type: Date, default: Date.now }
}, { timestamps: true });

// Index for lookup by userId (used in login faculty resolution)
facultySchema.index({ userId: 1 });
// Index for filtering by department
facultySchema.index({ department: 1 });

module.exports = mongoose.model('Faculty', facultySchema);
