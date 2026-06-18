const Subject = require('../models/Subject');

exports.getSubjects = async (req, res) => {
    try {
        const { course, year, semester } = req.query;
        let query = {};

        if (course) query.course = course;
        if (year) query.year = parseInt(year);
        if (semester) query.semester = parseInt(semester);

        const subjects = await Subject.find(query).lean();
        res.json(subjects);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createSubject = async (req, res) => {
    try {
        const subject = new Subject(req.body);
        await subject.save();
        res.status(201).json(subject);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.createBulkSubjects = async (req, res) => {
    try {
        const { subjects } = req.body;
        if (!subjects || !Array.isArray(subjects)) {
            return res.status(400).json({ message: 'An array of subjects is required.' });
        }
        
        // Remove existing subjects for the given course to prevent duplicates when editing
        // Assuming all subjects in the array belong to the same course.
        if (subjects.length > 0 && subjects[0].course) {
            await Subject.deleteMany({ course: subjects[0].course });
        }

        const inserted = await Subject.insertMany(subjects);
        res.status(201).json({ message: `${inserted.length} subjects successfully created.`, inserted });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.updateSubject = async (req, res) => {
    try {
        const updated = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteSubject = async (req, res) => {
    try {
        await Subject.findByIdAndDelete(req.params.id);
        res.json({ message: 'Subject deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
