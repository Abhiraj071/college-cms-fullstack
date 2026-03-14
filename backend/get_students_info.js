const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
dotenv.config({ path: __dirname + '/.env' });

const Student = require('./models/Student');
const Subject = require('./models/Subject');

async function getInfo() {
    try {
        const uri = process.env.MONGODB_URI.replace('localhost', '127.0.0.1');
        await mongoose.connect(uri);
        
        const students = await Student.find({}, 'name rollNo course semester');
        const subjects = await Subject.find({}, 'name code course semester year');
        
        const data = {
            students,
            subjects
        };
        fs.writeFileSync('c:/Users/Hi-Rich/Desktop/college-cms-fullstack-main/backend/output.json', JSON.stringify(data, null, 2));
        
        console.log("Written to output.json");
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}
getInfo();
