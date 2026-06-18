const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Subject = require('../models/Subject');

router.get('/summary', async (req, res) => {
    try {
        const [studentCount, subjectCount] = await Promise.all([
            Student.countDocuments(),
            Subject.countDocuments()
        ]);
        res.json({ studentCount, subjectCount });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/attendance', async (req, res) => {
    try {
        const records = await Attendance.find().lean();
        res.json(records);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/subjects', async (req, res) => {
    try {
        const subjects = await Subject.find().lean();
        res.json(subjects);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/predictions', async (req, res) => {
    res.json([]);
});

module.exports = router;
