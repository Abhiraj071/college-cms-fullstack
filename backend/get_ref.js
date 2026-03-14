const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
dotenv.config();

async function fetchData() {
    await mongoose.connect(process.env.MONGODB_URI);
    const Subject = require('./models/Subject');
    const Student = require('./models/Student');
    
    // List all subjects and students to see what we have
    const subjects = await Subject.find({});
    const students = await Student.find({});
    
    const data = {
        subjects: subjects.map(s => ({ id: s._id, name: s.name, course: s.course, semester: s.semester })),
        students: students.map(s => ({ id: s._id, name: s.name, rollNo: s.rollNo, course: s.course, semester: s.semester }))
    };
    
    fs.writeFileSync('db_ref.json', JSON.stringify(data, null, 2));
    console.log('Data saved to db_ref.json');
    mongoose.connection.close();
}

fetchData();
