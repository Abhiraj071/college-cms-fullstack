const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/college_cms');

        // Check if admin exists
        const adminExists = await User.findOne({ role: 'admin' });
        if (adminExists) {
            console.log('Admin already exists.');
            process.exit();
        }

        const admin = new User({
            username: 'admin',
            password: 'admin123', // Will be hashed by pre-save middleware
            role: 'admin',
            name: 'System Administrator',
            email: 'admin@college.com'
        });

        await admin.save();
        console.log('✅ Admin user created: admin / admin123');
        process.exit();
    } catch (err) {
        console.error('❌ Error seeding admin:', err);
        process.exit(1);
    }
};

seedAdmin();
