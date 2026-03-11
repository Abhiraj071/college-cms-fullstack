const mongoose = require('mongoose');
const User = require('./models/User');
const Student = require('./models/Student');
const Subject = require('./models/Subject');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/college_cms';

const debug = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        // 1. Get a student (or create one for testing logic)
        // Let's look for ANY student first
        const student = await Student.findOne();
        if (!student) {
            console.log('No students found! Cannot debug.');
            process.exit(1);
        }

        console.log('--- STUDENT PROFILE ---');
        console.log(`Name: ${student.name}`);
        console.log(`Course: '${student.course}' (Type: ${typeof student.course})`);
        console.log(`Semester: ${student.semester} (Type: ${typeof student.semester})`);

        const calculatedYear = Math.ceil(student.semester / 2);
        console.log(`Calculated Year: ${calculatedYear}`);

        // 2. Find Subjects that SHOULD match
        // We look for subjects with looser criteria to see what's close
        const allSubjects = await Subject.find();
        console.log(`\nTotal Subjects in DB: ${allSubjects.length}`);

        const exactMatches = allSubjects.filter(s =>
            s.course === student.course &&
            String(s.year) === String(calculatedYear) &&
            String(s.semester) === String(student.semester)
        );

        console.log(`Exact Matches (Frontend Logic): ${exactMatches.length}`);

        if (exactMatches.length === 0) {
            console.log('\n--- WHY NO MATCHES? ---');
            // Check for partial matches
            const courseMatches = allSubjects.filter(s => s.course === student.course);
            console.log(`Matches by Course ('${student.course}'): ${courseMatches.length}`);

            if (courseMatches.length > 0) {
                courseMatches.forEach(s => {
                    console.log(`   Subject: ${s.name} | Year: ${s.year} (Exp: ${calculatedYear}) | Sem: ${s.semester} (Exp: ${student.semester})`);
                });
            } else {
                console.log('No subjects match the course name at all.');
                console.log('Sample Subjects:', allSubjects.slice(0, 3).map(s => `${s.name} (${s.course})`));
            }
        } else {
            console.log('Matches found in DB. If frontend is empty, maybe the user logged in is different?');
        }

        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

debug();
