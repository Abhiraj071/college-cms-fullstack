const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
dotenv.config({ path: __dirname + '/.env' });

const Attendance = require('./models/Attendance');
const Student = require('./models/Student');
const User = require('./models/User');
const data = require('./data');

async function syncAttendance() {
    try {
        const uri = process.env.MONGODB_URI.replace('localhost', '127.0.0.1');
        await mongoose.connect(uri);
        console.log("Connected to MongoDB");
        
        // Find teacher user to mark attendance
        const teacher = await User.findOne({ role: 'faculty' }) || await User.findOne({});
        const markedBy = teacher ? teacher._id : null;
        
        // Find Semester 4 students
        const students = await Student.find({ course: "Diploma In Computer Science", semester: 4 });
        
        const rollMap = {};
        for (let s of students) {
            rollMap[s.rollNo] = s._id;
        }
        
        let upsertedCount = 0;
        
        // Process January, February, March
        for (const month of ['january', 'february', 'march']) {
            const { dates, records } = data[month];
            
            for (let i = 0; i < dates.length; i++) {
                const dateStr = dates[i];
                const dateObj = new Date(dateStr);
                
                // Construct student array for this date
                const studentsArray = [];
                for (const roll in records) {
                    if (rollMap[roll]) {
                        const statusChar = records[roll][i];
                        const status = statusChar === 'P' ? 'Present' : 'Absent';
                        studentsArray.push({
                            studentId: rollMap[roll],
                            status: status
                        });
                    }
                }
                
                // Find existing record
                let existingRecord = await Attendance.findOne({
                    date: dateObj,
                    course: "Diploma In Computer Science",
                    year: "2",
                    semester: "4"
                });
                
                if (existingRecord) {
                    // Update existing
                    // Keep the subject as is (e.g. "Teacher Guardian")
                    // We need to merge studentsArray
                    const existingMap = new Map();
                    for (const es of existingRecord.students) {
                        existingMap.set(es.studentId.toString(), es);
                    }
                    
                    for (const ns of studentsArray) {
                        const sid = ns.studentId.toString();
                        if (existingMap.has(sid)) {
                            // Update status
                            existingMap.get(sid).status = ns.status;
                        } else {
                            // Add new
                            existingRecord.students.push(ns);
                        }
                    }
                    existingRecord.markedBy = existingRecord.markedBy || markedBy;
                    await existingRecord.save();
                    upsertedCount++;
                } else {
                    // Create new
                    await Attendance.create({
                        date: dateObj,
                        course: "Diploma In Computer Science",
                        year: "2",
                        semester: "4",
                        subject: "Teacher Guardian", 
                        students: studentsArray,
                        markedBy: markedBy
                    });
                    upsertedCount++;
                }
            }
        }
        
        console.log(`Successfully updated ${upsertedCount} attendance records.`);
        
        // Update stats
        console.log("Updating student global attendance stats...");
        const allStudents = await Student.find({});
        const allAttendances = await Attendance.find({});
        
        const studentStats = {};
        for (const student of allStudents) {
            studentStats[student._id.toString()] = { present: 0, absent: 0 };
        }
        
        for (const record of allAttendances) {
            for (const s of record.students) {
                const sid = s.studentId.toString();
                if (studentStats[sid]) {
                    if (s.status === 'Present') studentStats[sid].present++;
                    if (s.status === 'Absent') studentStats[sid].absent++;
                }
            }
        }
        
        for (const student of allStudents) {
            const sid = student._id.toString();
            const stats = studentStats[sid];
            const total = stats.present + stats.absent;
            let percent = "0%";
            if (total > 0) percent = Math.round((stats.present / total) * 100) + "%";
            
            await Student.findByIdAndUpdate(student._id, {
                present: stats.present,
                absent: stats.absent,
                totalClasses: total,
                attendancePercentage: percent
            });
        }
        console.log("Global student stats updated.");
        
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}
syncAttendance();
