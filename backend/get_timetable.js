const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
dotenv.config({ path: __dirname + '/.env' });

const Timetable = require('./models/Timetable');
const Subject = require('./models/Subject');

async function getInfo() {
    try {
        const uri = process.env.MONGODB_URI.replace('localhost', '127.0.0.1');
        await mongoose.connect(uri);
        
        const tt = await Timetable.findOne({ course: 'Diploma In Computer Science', semester: '4' });
        
        fs.writeFileSync('c:/Users/Hi-Rich/Desktop/college-cms-fullstack-main/backend/output_tt.json', JSON.stringify(tt, null, 2));
        
        console.log("Written to output_tt.json");
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}
getInfo();
