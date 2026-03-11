const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');
const Faculty = require('./models/Faculty');
const Student = require('./models/Student');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/college_cms';

const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');
    } catch (err) {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    }
};

const seedData = async () => {
    await connectDB();

    try {
        // Clear existing data
        await User.deleteMany({});
        await Faculty.deleteMany({});
        await Student.deleteMany({});
        console.log('🗑️  Cleared existing users, faculty, and students');

        // --- Create Admin ---
        const adminUser = new User({
            username: 'admin',
            password: 'admin123', // Will be hashed
            role: 'admin',
            name: 'System Administrator',
            email: 'admin@college.edu'
        });
        await adminUser.save();
        console.log('✅ Created Admin: admin / admin123');

        console.log('\n🎉 Database seeded successfully (Admin Only)!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error seeding data:', err);
        process.exit(1);
    }
};

seedData();
