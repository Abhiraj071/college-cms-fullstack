const Attendance = require('../models/Attendance');
const Student = require('../models/Student');

exports.getAttendance = async (req, res) => {
    const { date, course, year, semester, subject } = req.query;
    try {
        const query = {};
        if (date)     query.date = new Date(date);
        if (course)   query.course = course;
        if (year)     query.year = year;
        if (semester) query.semester = semester;
        if (subject)  query.subject = subject;

        const attendance = await Attendance.find(query)
            .populate({ path: 'students.studentId', populate: { path: 'userId', select: 'name' } })
            .lean();
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
            { students, markedBy: req.user._id },
            { upsert: true, new: true }
        );

        // Update attendance summaries using aggregation instead of N+1 queries
        const studentIds = students.map(s => s.studentId);

        // Single aggregation to get counts for all affected students at once
        const pipeline = [
            { $match: { 'students.studentId': { $in: studentIds.map(id => require('mongoose').Types.ObjectId.createFromHexString ? require('mongoose').Types.ObjectId.createFromHexString(id.toString()) : id) } } },
            { $unwind: '$students' },
            { $match: { 'students.studentId': { $in: studentIds } } },
            { $group: {
                _id: '$students.studentId',
                present: { $sum: { $cond: [{ $eq: ['$students.status', 'Present'] }, 1, 0] } },
                absent:  { $sum: { $cond: [{ $eq: ['$students.status', 'Absent'] },  1, 0] } },
            }}
        ];

        const summaries = await Attendance.aggregate(pipeline);

        // Bulk-update all student documents in parallel
        await Promise.all(summaries.map(s => {
            const total = s.present + s.absent;
            const pct = total > 0 ? Math.round((s.present / total) * 100) + '%' : '0%';
            return Student.findByIdAndUpdate(s._id, {
                present: s.present,
                absent: s.absent,
                totalClasses: total,
                attendancePercentage: pct,
            });
        }));

        res.json(record);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.getStudentAttendance = async (req, res) => {
    try {
        const records = await Attendance.find({
            'students.studentId': req.params.studentId
        }).lean();
        res.json(records);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
