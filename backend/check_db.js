const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/college_cms';

console.log('Connecting to:', MONGODB_URI);

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('✅ Connected to MongoDB');
        try {
            const users = await User.find({});
            console.log(`Found ${users.length} users:`);
            users.forEach(u => {
                console.log(`- ${u.username} (${u.role}) - Email: ${u.email}`);
            });
        } catch (err) {
            console.error('Error querying users:', err);
        } finally {
            mongoose.disconnect();
        }
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });
