const Subject = require('../models/Subject');

exports.getSubjects = async (req, res) => {
    try {
        const { course, year, semester } = req.query;
        let query = {};

        if (course) query.course = course;
        if (year) query.year = parseInt(year);
        if (semester) query.semester = parseInt(semester);
        if (req.query.faculty) query.faculty = req.query.faculty;

        const subjects = await Subject.find(query).populate('faculty');
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
