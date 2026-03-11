const Attendance = require('../models/Attendance');

exports.getAttendance = async (req, res) => {
    const { date, course, year, semester, subject } = req.query;
    try {
        const query = {};
        if (date) query.date = new Date(date);
        if (course) query.course = course;
        if (year) query.year = year;
        if (semester) query.semester = semester;
        if (subject) query.subject = subject;

        const attendance = await Attendance.find(query).populate({
            path: 'students.studentId',
            populate: { path: 'userId', select: 'name' }
        });
        res.json(attendance);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.markAttendance = async (req, res) => {
    const { date, course, year, semester, subject, students } = req.body;
    try {
        const record = await Attendance.findOneAndUpdate(
            { date: new Date(date), course, year, semester, subject },
            {
                students,
                markedBy: req.user._id
            },
            { upsert: true, new: true }
        );
        res.json(record);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.getStudentAttendance = async (req, res) => {
    try {
        // This would be more complex (filtering the students array within Attendance documents)
        // For now, return all records and we filter on frontend, 
        // or write a mongo aggregation.
        const records = await Attendance.find({
            'students.studentId': req.params.studentId
        });
        res.json(records);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
