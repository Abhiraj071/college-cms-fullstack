const Exam = require('../models/Exam');

// GET /api/exams
exports.getExams = async (req, res) => {
    try {
        const exams = await Exam.find().sort({ date: 1 });
        res.json(exams);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch exams: ' + err.message });
    }
};

// POST /api/exams
exports.createExam = async (req, res) => {
    try {
        const exam = await Exam.create(req.body);
        res.status(201).json(exam);
    } catch (err) {
        res.status(400).json({ message: 'Failed to create exam: ' + err.message });
    }
};

// PUT /api/exams/:id
exports.updateExam = async (req, res) => {
    try {
        const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!exam) return res.status(404).json({ message: 'Exam not found' });
        res.json(exam);
    } catch (err) {
        res.status(400).json({ message: 'Failed to update exam: ' + err.message });
    }
};

// DELETE /api/exams/:id
exports.deleteExam = async (req, res) => {
    try {
        const exam = await Exam.findByIdAndDelete(req.params.id);
        if (!exam) return res.status(404).json({ message: 'Exam not found' });
        res.json({ success: true, message: 'Exam deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete exam: ' + err.message });
    }
};

// GET /api/exams/:examId/marks
exports.getMarksByExam = async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.examId).populate('marks.studentId', 'name rollNo');
        if (!exam) return res.status(404).json({ message: 'Exam not found' });
        res.json(exam.marks);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch marks: ' + err.message });
    }
};

// GET /api/exams/marks/student/:studentId
exports.getStudentMarks = async (req, res) => {
    try {
        const exams = await Exam.find({ 'marks.studentId': req.params.studentId });
        const result = exams.map(exam => {
            const entry = exam.marks.find(m => m.studentId.toString() === req.params.studentId);
            return {
                examId: exam._id,
                title: exam.title,
                subject: exam.subject,
                course: exam.course,
                date: exam.date,
                type: exam.type,
                totalMarks: exam.totalMarks,
                marksObtained: entry ? entry.marksObtained : null
            };
        });
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch student marks: ' + err.message });
    }
};

// POST /api/exams/marks  — upsert a single student's mark for an exam
exports.updateMarks = async (req, res) => {
    try {
        const { examId, studentId, marksObtained } = req.body;
        if (!examId || !studentId || marksObtained === undefined) {
            return res.status(400).json({ message: 'examId, studentId and marksObtained are required' });
        }

        const exam = await Exam.findById(examId);
        if (!exam) return res.status(404).json({ message: 'Exam not found' });

        if (marksObtained > exam.totalMarks) {
            return res.status(400).json({ message: `Marks cannot exceed total marks (${exam.totalMarks})` });
        }

        const existing = exam.marks.find(m => m.studentId.toString() === studentId);
        if (existing) {
            existing.marksObtained = marksObtained;
        } else {
            exam.marks.push({ studentId, marksObtained });
        }

        await exam.save();
        res.json({ success: true, message: 'Marks updated successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update marks: ' + err.message });
    }
};
