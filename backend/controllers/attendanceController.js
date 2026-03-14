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

        const Student = require('../models/Student');
        for (const studentRec of students) {
            const sId = studentRec.studentId;
            const allRecords = await Attendance.find({ 'students.studentId': sId });
            
            let presentCount = 0;
            let absentCount = 0;
            
            for (const rec of allRecords) {
                const sData = rec.students.find(s => s.studentId.toString() === sId.toString());
                if (sData) {
                    if (sData.status === 'Present') {
                        presentCount++;
                    } else if (sData.status === 'Absent') {
                        absentCount++;
                    }
                }
            }
            
            const totalClasses = presentCount + absentCount;
            let percentage = "0%";
            if (totalClasses > 0) {
                percentage = Math.round((presentCount / totalClasses) * 100) + "%";
            }
            
            await Student.findByIdAndUpdate(sId, {
                present: presentCount,
                absent: absentCount,
                totalClasses: totalClasses,
                attendancePercentage: percentage
            });
        }

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
