const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
dotenv.config({ path: __dirname + '/.env' });

const Attendance = require('./models/Attendance');

async function getInfo() {
    try {
        const uri = process.env.MONGODB_URI.replace('localhost', '127.0.0.1');
        await mongoose.connect(uri);
        
        const dist = await Attendance.distinct('subject', { course: "Diploma In Computer Science", semester: "4" });
        
        fs.writeFileSync('c:/Users/Hi-Rich/Desktop/college-cms-fullstack-main/backend/output_distinct.json', JSON.stringify(dist, null, 2));
        
        console.log("Written to output_distinct.json");
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}
getInfo();
