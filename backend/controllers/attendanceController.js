const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const AttendanceSession = require('../models/AttendanceSession');
const semesterService = require('../services/semesterService');
const crypto = require('crypto');

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
        const semesterDates = await semesterService.getSemesterDates();
        if (semesterDates) {
            const markDate = new Date(date);
            if (markDate < semesterDates.start || markDate > semesterDates.end) {
                return res.status(400).json({ 
                    message: `Attendance can only be marked within the semester learning period: ${semesterDates.start.toDateString()} to ${semesterDates.end.toDateString()}` 
                });
            }
        }

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

exports.generateSession = async (req, res) => {
    const { course, year, semester, subject } = req.body;
    try {
        const token = crypto.randomBytes(16).toString('hex');
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        const session = await AttendanceSession.create({
            teacherId: req.user._id,
            course,
            year,
            semester,
            subject,
            token,
            expiresAt
        });

        res.status(201).json({
            token,
            expiresAt,
            course,
            subject
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.markSelfAttendance = async (req, res) => {
    const { token } = req.body;
    try {
        // 1. Validate Session
        const session = await AttendanceSession.findOne({ 
            token, 
            isActive: true,
            expiresAt: { $gt: new Date() }
        });

        if (!session) {
            return res.status(404).json({ message: 'Invalid or expired attendance session.' });
        }

        // 2. Find Student Record
        const student = await Student.findOne({ userId: req.user._id });
        if (!student) {
            return res.status(403).json({ message: 'Only students can mark self-attendance.' });
        }

        // 3. Check if student belongs to this course
        if (student.course !== session.course) {
             return res.status(403).json({ message: 'You are not enrolled in this course.' });
        }

        // 4. Update/Create Attendance Record for today
        const today = new Date();
        today.setHours(0,0,0,0);

        let attendance = await Attendance.findOne({
            date: today,
            course: session.course,
            year: session.year,
            semester: session.semester,
            subject: session.subject
        });

        if (!attendance) {
            attendance = new Attendance({
                date: today,
                course: session.course,
                year: session.year,
                semester: session.semester,
                subject: session.subject,
                markedBy: session.teacherId,
                students: []
            });
        }

        // 5. Add student if not already marked
        const alreadyMarked = attendance.students.find(s => s.studentId.toString() === student._id.toString());
        if (alreadyMarked) {
            return res.status(200).json({ message: 'Attendance already marked for today.' });
        }

        attendance.students.push({
            studentId: student._id,
            status: 'Present'
        });

        await attendance.save();

        // 6. Update student counts
        const allRecords = await Attendance.find({
            'students.studentId': student._id
        }).lean();

        let presentCount = 0;
        let totalCount = 0;
        allRecords.forEach(r => {
            const s = r.students.find(st => st.studentId.toString() === student._id.toString());
            if (s) {
                totalCount++;
                if (s.status === 'Present') presentCount++;
            }
        });

        const pct = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) + '%' : '0%';
        await Student.findByIdAndUpdate(student._id, {
            present: presentCount,
            absent: totalCount - presentCount,
            totalClasses: totalCount,
            attendancePercentage: pct
        });

        res.json({ message: 'Attendance marked successfully!', subject: session.subject });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
