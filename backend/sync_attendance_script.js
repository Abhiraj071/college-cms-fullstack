const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: __dirname + '/.env' });

const Student = require('./models/Student');
const Attendance = require('./models/Attendance');

async function syncAttendance() {
    try {
        const uri = process.env.MONGODB_URI.replace('localhost', '127.0.0.1');
        await mongoose.connect(uri);
        console.log("Connected to MongoDB");

        const students = await Student.find({});
        const attendances = await Attendance.find({});

        const studentStats = {};

        for (const student of students) {
            studentStats[student._id.toString()] = {
                present: 0,
                absent: 0,
            };
        }

        // Process all attendance records
        for (const attendance of attendances) {
            for (const record of attendance.students) {
                const studentId = record.studentId.toString();
                if (studentStats[studentId]) {
                    if (record.status === 'Present') {
                        studentStats[studentId].present += 1;
                    } else if (record.status === 'Absent') {
                        studentStats[studentId].absent += 1;
                    }
                }
            }
        }

        for (const student of students) {
            const stats = studentStats[student._id.toString()];
            const totalClasses = stats.present + stats.absent;
            let attendancePercentage = "0%";
            if (totalClasses > 0) {
                attendancePercentage = Math.round((stats.present / totalClasses) * 100) + "%";
            }

            await Student.findByIdAndUpdate(student._id, {
                present: stats.present,
                absent: stats.absent,
                totalClasses: totalClasses,
                attendancePercentage: attendancePercentage
            });
            console.log(`Updated student ${student.rollNo}: present=${stats.present}, absent=${stats.absent}, total=${totalClasses}, pct=${attendancePercentage}`);
        }

        console.log("Attendance Sync Complete!");
        process.exit(0);

    } catch (err) {
        console.error("Error syncing attendance:", err);
        process.exit(1);
    }
}

syncAttendance();
