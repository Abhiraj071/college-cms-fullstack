const mongoose = require('mongoose');
const User = require('./models/User');
const Student = require('./models/Student');
const Assignment = require('./models/Assignment');
const Subject = require('./models/Subject');
const dotenv = require('dotenv');

dotenv.config({ path: './.env' });

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected to DB');

        // 1. Find the Student "Abhishek Chauhan"
        // I'll search by name if possible, or just List all students and assignments

        try {
            console.log('--- STUDENT PROFILES ---');
            const students = await Student.find({}).populate('userId');
            students.forEach(s => {
                console.log(`Student: ${s.name} | Course: ${s.course}, Year: ${s.year}, Sem: ${s.semester} | UserID: ${s.userId?._id}`);
            });

            console.log('\n--- ASSIGNMENTS ---');
            const assignments = await Assignment.find({}).populate('subject');
            assignments.forEach(a => {
                const subName = a.subject ? a.subject.name : 'Unknown Subject';
                const subId = a.subject ? a.subject._id : a.subject;
                console.log(`Assignment: ${a.title} | Subject: ${subName} (${subId})`);
                console.log(`   > Metadata: Course: ${a.course}, Year: ${a.year}, Sem: ${a.semester}`);
                console.log(`   > Faculty: ${a.faculty}`);
            });

            console.log('\n--- SUBJECTS ---');
            // List subjects to check if IDs match
            const subjects = await Subject.find({});
            subjects.forEach(s => {
                console.log(`Subject: ${s.name} (${s._id}) | Course: ${s.course}, Year: ${s.year}`);
            });

        } catch (e) {
            console.error(e);
        }

        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
