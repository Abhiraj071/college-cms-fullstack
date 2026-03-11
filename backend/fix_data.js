const mongoose = require('mongoose');
const Student = require('./models/Student');
const Subject = require('./models/Subject');
const Timetable = require('./models/Timetable');
const dotenv = require('dotenv');

dotenv.config({ path: './.env' });

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected to DB');

        // 1. Fix Student Abhishek
        const student = await Student.findOne({ name: /Abhishek Chauhan/i });
        if (student) {
            console.log(`Updating Student ${student.name}...`);
            student.semester = 6;
            student.year = 3;
            // Ensure course matches the others if needed, looks fine (Diploma...)
            await student.save();
            console.log('Student updated to Sem 6, Year 3.');
        } else {
            console.log('Student Abhishek not found.');
        }

        // 2. Backfill Subject Metadata from Timetable
        const timetables = await Timetable.find({}); // All timetables
        const subjects = await Subject.find({});

        console.log(`Scanning ${subjects.length} subjects for missing metadata...`);

        for (const sub of subjects) {
            // Only update if missing
            if (!sub.course || !sub.year || !sub.semester) {
                // Try to find this subject in any timetable
                const subName = sub.name.trim().toLowerCase();

                let textMatch = null;

                for (const tt of timetables) {
                    if (tt.grid) {
                        const slots = tt.grid instanceof Map ? Array.from(tt.grid.values()) : Object.values(tt.grid);
                        for (const slot of slots) {
                            if (slot.subject && slot.subject.trim().toLowerCase() === subName) {
                                textMatch = tt;
                                break;
                            }
                        }
                    }
                    if (textMatch) break;
                }

                if (textMatch) {
                    console.log(`Found context for Subject "${sub.name}": Course=${textMatch.course}, Year=${textMatch.year}, Sem=${textMatch.semester}`);
                    sub.course = textMatch.course;
                    sub.year = textMatch.year;
                    sub.semester = textMatch.semester;
                    await sub.save();
                    console.log('Subject updated.');
                }
            }
        }

        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
