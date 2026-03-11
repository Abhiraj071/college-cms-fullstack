const mongoose = require('mongoose');
const User = require('./backend/models/User');
const Faculty = require('./backend/models/Faculty');
const Subject = require('./backend/models/Subject');
const dotenv = require('dotenv');

dotenv.config({ path: './backend/.env' });

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log('Connected to DB');

        // Find a teacher user
        const teacher = await User.findOne({ role: 'teacher' });
        if (!teacher) {
            console.log('No teacher found');
            process.exit();
        }
        console.log('Teacher User:', teacher.username, teacher._id);

        const faculty = await Faculty.findOne({ userId: teacher._id });
        if (!faculty) {
            console.log('No Faculty profile found for teacher');
            process.exit();
        }
        console.log('Faculty Profile:', faculty.name, faculty._id);

        const subjects = await Subject.find({ faculty: faculty._id });
        console.log('Subjects assigned to this faculty:', subjects.length);
        subjects.forEach(s => console.log(' - ', s.name, s._id));

        const allSubjects = await Subject.find({});
        console.log('Total subjects in DB:', allSubjects.length);

        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
