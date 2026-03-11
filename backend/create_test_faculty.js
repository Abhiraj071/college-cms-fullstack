const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Faculty = require('./models/Faculty');
const Subject = require('./models/Subject');
const Timetable = require('./models/Timetable');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/college_cms';

const setup = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        // 1. Create User
        const email = 'testfac@college.edu';
        await User.deleteOne({ email });
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        const user = new User({
            username: 'testfac',
            password: hashedPassword,
            role: 'teacher',
            name: 'Test Faculty',
            email: email
        });
        await user.save();
        console.log('User created: testfac / password123');

        // 2. Create Faculty Profile
        // Cleanup old profile if exists
        const existingFac = await Faculty.findOne({ email });
        if (existingFac) {
            // clean up old subjects/timetables for this faculty to avoid clutter
            await Subject.deleteMany({ faculty: existingFac._id });
            await Faculty.deleteOne({ _id: existingFac._id });
        }

        const faculty = new Faculty({
            userId: user._id,
            name: user.name,
            email: user.email,
            customId: 'FAC001',
            department: 'Computer Science',
            designation: 'Professor',
            qualification: 'PhD'
        });
        await faculty.save();
        console.log('Faculty profile created');

        // 3. Create Subject
        const subject = new Subject({
            name: 'Advanced Verification 101',
            code: 'AV101',
            course: 'B.Tech',
            year: 1,
            semester: 1,
            faculty: faculty._id,
            credits: 4,
            type: 'Theory'
        });
        await subject.save();
        console.log('Subject created: Advanced Verification 101');

        // 4. Create Timetable (Schedule on Monday and Tuesday)
        // Ensure we handle year/sem correctly as strings or numbers based on schema
        // checking schema matches isn't easy without reading files, but usually they are numbers
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        // Pick a day that is LIKELY not today, or just cover all of them?
        // Let's just put it on Monday.

        const grid = {
            'Monday::10:00': {
                subject: subject.name,
                teacher: faculty.name,
                room: 'Lab 1'
            }
        };

        const timetable = new Timetable({
            course: 'B.Tech',
            year: 1,
            semester: 1,
            grid: grid
        });

        // Remove old timetables for this course/year/sem to avoid conflicts or merge
        await Timetable.deleteMany({ course: 'B.Tech', year: 1, semester: 1 });
        await timetable.save();
        console.log('Timetable created for Monday');

        console.log('DONE');
        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

setup();
