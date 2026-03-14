const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const Attendance = require('./models/Attendance');
    const records = await Attendance.find({ 
        date: { 
            $gte: new Date('2026-03-01'), 
            $lt: new Date('2026-04-01') 
        } 
    }).limit(2);
    console.log(JSON.stringify(records, null, 2));
    mongoose.connection.close();
}
check();
