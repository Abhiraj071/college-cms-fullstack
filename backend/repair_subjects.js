const mongoose = require('mongoose');
const Subject = require('./models/Subject');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/college_cms';

const repair = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        // Update all subjects that have no course
        const result = await Subject.updateMany(
            { $or: [{ course: { $exists: false } }, { course: null }, { course: '' }] },
            {
                $set: {
                    course: 'Diploma In Computer Science',
                    year: 3,
                    semester: 6
                }
            }
        );

        console.log(`Matched and Updated: ${result.matchedCount}`);
        console.log(`Modified: ${result.modifiedCount}`);

        // Let's verify one
        const sample = await Subject.findOne();
        console.log('Sample Updated Subject:', sample.name, sample.course, `Y${sample.year}/S${sample.semester}`);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

repair();
