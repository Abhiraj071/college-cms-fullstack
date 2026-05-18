require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Faculty = require('./models/Faculty');
const Subject = require('./models/Subject');

async function assign() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/college_cms');
    const user = await User.findOne({ name: 'Pooja Soni' });
    if (!user) {
        console.log('User not found');
        process.exit();
    }
    const faculty = await Faculty.findOne({ userId: user._id });
    if (!faculty) {
        console.log('Faculty record not found');
        process.exit();
    }
    
    // Assign a few subjects
    const subjectsToAssign = ['Advanced Web Technology ', 'Computer Network ', 'Programming In C'];
    const result = await Subject.updateMany(
        { name: { $in: subjectsToAssign } },
        { faculty: faculty._id }
    );
    
    console.log(`Successfully assigned ${result.modifiedCount} subjects to Pooja Soni.`);
    process.exit();
}

assign().catch(err => {
    console.error(err);
    process.exit(1);
});
