const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
dotenv.config({ path: __dirname + '/.env' });

const Attendance = require('./models/Attendance');
const Student = require('./models/Student');
const Timetable = require('./models/Timetable');
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
        
        // Fetch timetable to map days to subjects
        const timetable = await Timetable.findOne({ course: 'Diploma In Computer Science', semester: '4' });
        if (!timetable || !timetable.grid) {
            console.error("No timetable found for Course: Diploma In Computer Science, Semester: 4");
            process.exit(1);
        }
        
        // Convert mongoose map to standard object or iterate with Mongoose Map methods
        const gridEntries = [];
        if (timetable.grid instanceof Map) {
            timetable.grid.forEach((value, key) => {
                gridEntries.push({ key, value });
            });
        } else {
            for (const key in timetable.grid) {
                if (Object.hasOwnProperty.call(timetable.grid, key)) {
                    gridEntries.push({ key, value: timetable.grid[key] });
                }
            }
        }
        
        // helper to get all unique subjects for a given day
        function getSubjectsForDay(dayStr) {
            const subjects = new Set();
            for (const entry of gridEntries) {
                if (entry.key.startsWith(dayStr)) {
                    const subj = entry.value.subject;
                    if (subj && !subj.match(/lunch|break/i)) {
                        subjects.add(subj.trim());
                    }
                }
            }
            return Array.from(subjects);
        }

        let upsertedCount = 0;
        
        // Process January, February, March
        for (const month of ['january', 'february', 'march']) {
            const { dates, records } = data[month];
            
            for (let i = 0; i < dates.length; i++) {
                const dateStr = dates[i];
                const dateObj = new Date(dateStr);
                const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                
                // Get subjects for this day
                const daySubjects = getSubjectsForDay(dayOfWeek);
                if (daySubjects.length === 0) {
                    // console.log(`No subjects found on ${dayOfWeek} (${dateStr}). Skipping.`);
                    continue;
                }
                
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
                
                for (const subjectName of daySubjects) {
                    // Find existing record for this subject
                    let existingRecord = await Attendance.findOne({
                        date: dateObj,
                        course: "Diploma In Computer Science",
                        year: "2",
                        semester: "4",
                        subject: subjectName
                    });
                    
                    if (existingRecord) {
                        const existingMap = new Map();
                        for (const es of existingRecord.students) {
                            existingMap.set(es.studentId.toString(), es);
                        }
                        
                        for (const ns of studentsArray) {
                            const sid = ns.studentId.toString();
                            if (existingMap.has(sid)) {
                                existingMap.get(sid).status = ns.status;
                            } else {
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
                            subject: subjectName, 
                            students: studentsArray,
                            markedBy: markedBy
                        });
                        upsertedCount++;
                    }
                }
            }
        }
        
        console.log(`Successfully updated ${upsertedCount} attendance records pointing to actual subjects.`);
        
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
