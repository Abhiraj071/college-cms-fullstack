const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const initializeAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Direct database operation
        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');

        // Check if admin exists
        const adminExists = await usersCollection.findOne({ username: 'admin' });

        if (!adminExists) {
            // Create admin user with hashed password
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await usersCollection.insertOne({
                username: 'admin',
                password: hashedPassword,
                name: 'System Administrator',
                email: 'admin@college.edu',
                role: 'admin',
                createdAt: new Date(),
                updatedAt: new Date()
            });

            console.log('✅ Admin user created successfully!');
            console.log('   Username: admin');
            console.log('   Password: admin123');
        } else {
            console.log('ℹ️  Admin user already exists');
        }

        await mongoose.connection.close();
        console.log('✅ Database initialization complete');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

initializeAdmin();
