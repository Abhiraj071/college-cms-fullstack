const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
dotenv.config({ path: __dirname + '/.env' });

const Attendance = require('./models/Attendance');
const Student = require('./models/Student');

async function getInfo() {
    try {
        const uri = process.env.MONGODB_URI.replace('localhost', '127.0.0.1');
        await mongoose.connect(uri);
        
        // Find Semester 4 students
        const students = await Student.find({ course: "Diploma In Computer Science", semester: 4 });
        const studentIds = students.map(s => s._id);
        
        // Find attendance records containing these students
        const attendances = await Attendance.find({ 'students.studentId': { $in: studentIds } }).populate('subject');
        
        const data = attendances.map(a => ({
            date: a.date,
            subject: a.subject ? a.subject.name : "null",
            subjectId: a.subject ? a.subject._id : "null",
            studentsCount: a.students.length
        }));
        
        fs.writeFileSync('c:/Users/Hi-Rich/Desktop/college-cms-fullstack-main/backend/output_attendance.json', JSON.stringify(data, null, 2));
        
        console.log("Written to output_attendance.json");
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}
getInfo();
