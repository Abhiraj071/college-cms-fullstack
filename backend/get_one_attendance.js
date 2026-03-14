const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
dotenv.config({ path: __dirname + '/.env' });

const Attendance = require('./models/Attendance');

async function getInfo() {
    try {
        const uri = process.env.MONGODB_URI.replace('localhost', '127.0.0.1');
        await mongoose.connect(uri);
        
        const atts = await Attendance.find({ date: new Date('2026-01-19') }).limit(5);
        
        fs.writeFileSync('c:/Users/Hi-Rich/Desktop/college-cms-fullstack-main/backend/output_one.json', JSON.stringify(atts, null, 2));
        
        console.log("Written to output_one.json");
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}
getInfo();
