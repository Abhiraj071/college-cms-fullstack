const mongoose = require('mongoose');
const User = require('./models/User');
const Faculty = require('./models/Faculty');
const dotenv = require('dotenv');

dotenv.config({ path: './.env' }); // Path relative to backend folder

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected to DB');

        const users = await User.find({ role: 'teacher' });
        console.log(`Found ${users.length} teachers.`);

        for (const user of users) {
            const faculty = await Faculty.findOne({ userId: user._id });
            if (faculty) {
                console.log(`[OK] Teacher ${user.name} (${user._id}) has Faculty Profile: ${faculty._id}`);
                if (faculty.name !== user.name && user.name) {
                    faculty.name = user.name;
                    await faculty.save();
                    console.log('Synced name.');
                }
            } else {
                console.log(`[MISSING] Teacher ${user.name} (${user._id}) DOES NOT have a Faculty Profile.`);
                console.log('Creating Faculty Profile...');

                const newFaculty = new Faculty({
                    userId: user._id,
                    name: user.name || user.username || 'Unknown Faculty',
                    email: user.email || `faculty+${user._id}@example.com`,
                    phone: '0000000000',
                    department: 'General',
                    designation: 'Lecturer',
                    joinDate: new Date()
                });

                await newFaculty.save();
                console.log(`[FIXED] Created Faculty Profile: ${newFaculty._id}`);
            }
        }

        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
