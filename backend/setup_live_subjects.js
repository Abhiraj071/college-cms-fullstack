require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Faculty = require('./models/Faculty');
const Subject = require('./models/Subject');

async function setupLive() {
    try {
        console.log("Connecting to database...");
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/college_cms');
        console.log("Connected successfully!");

        // 1. Find the User
        const user = await User.findOne({ name: 'Pooja Soni' });
        if (!user) {
            console.log('Error: User "Pooja Soni" not found in this database. Please create her account first.');
            process.exit(1);
        }

        // 2. Find the Faculty profile
        const faculty = await Faculty.findOne({ userId: user._id });
        if (!faculty) {
            console.log('Error: Faculty record for Pooja Soni not found.');
            process.exit(1);
        }

        // 3. Define subjects to ensure they exist and are assigned
        const subjectsData = [
            { name: 'Advanced Web Technology', code: 'AWT101', course: 'BCA', year: 3, semester: 6 },
            { name: 'Computer Network', code: 'CN102', course: 'BCA', year: 3, semester: 5 },
            { name: 'Programming In C', code: 'PIC103', course: 'BCA', year: 1, semester: 1 }
        ];

        let assignedCount = 0;

        for (const sub of subjectsData) {
            // Upsert (update or insert) the subject
            const updatedSubject = await Subject.findOneAndUpdate(
                { name: { $regex: new RegExp('^' + sub.name.trim(), 'i') } }, // match name case-insensitive and ignore trailing spaces
                { 
                    $set: { 
                        name: sub.name,
                        code: sub.code,
                        course: sub.course,
                        year: sub.year,
                        semester: sub.semester,
                        faculty: faculty._id 
                    } 
                },
                { upsert: true, new: true }
            );
            
            console.log(`Assigned: ${updatedSubject.name}`);
            assignedCount++;
        }
        
        console.log(`\nSuccess! Created/Assigned ${assignedCount} subjects to Pooja Soni.`);
        console.log("Important: Log out and log back in to see the changes!");
        process.exit(0);

    } catch (err) {
        console.error("An error occurred:", err);
        process.exit(1);
    }
}

setupLive();
