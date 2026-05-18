const Exam = require('../models/Exam');
const Result = require('../models/Result');

// ─── Exam Controllers ───

exports.getExams = async (req, res) => {
    try {
        const query = {};
        if (req.query.course) query.course = req.query.course;
        if (req.query.semester) query.semester = req.query.semester;

        const exams = await Exam.find(query).sort({ date: -1 });
        res.json(exams);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createExam = async (req, res) => {
    try {
        const exam = new Exam(req.body);
        const savedExam = await exam.save();
        res.status(201).json(savedExam);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.updateExam = async (req, res) => {
    try {
        const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!exam) return res.status(404).json({ message: 'Exam not found' });
        res.json(exam);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteExam = async (req, res) => {
    try {
        const exam = await Exam.findByIdAndDelete(req.params.id);
        if (!exam) return res.status(404).json({ message: 'Exam not found' });
        
        // Also delete related results
        await Result.deleteMany({ exam: req.params.id });
        res.json({ message: 'Exam and associated results deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─── Result Controllers ───

exports.getResultsByExam = async (req, res) => {
    try {
        const results = await Result.find({ exam: req.params.examId })
            .populate('student', 'name enrollNo rollNo email')
            .populate('subjects.subject', 'name code');
        res.json(results);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getResultsByStudent = async (req, res) => {
    try {
        const results = await Result.find({ student: req.params.studentId })
            .populate('exam')
            .populate('subjects.subject', 'name code');
        res.json(results);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.saveResult = async (req, res) => {
    try {
        const { exam, student, course, semester, subjects } = req.body;

        // Ensure we don't duplicate result records, we update them instead
        let result = await Result.findOne({ exam, student });
        
        if (result) {
            result.subjects = subjects;
            // update hooks will recalc
        } else {
            result = new Result({ exam, student, course, semester, subjects });
        }

        const savedResult = await result.save();
        res.status(200).json(savedResult);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.bulkImportResults = async (req, res) => {
    try {
        const { examId, results } = req.body;
        if (!examId || !results || !Array.isArray(results)) {
            return res.status(400).json({ message: 'Invalid data format' });
        }

        let importedCount = 0;
        for (const data of results) {
            let result = await Result.findOne({ exam: examId, student: data.student });
            if (result) {
                result.subjects = data.subjects;
            } else {
                result = new Result({
                    exam: examId,
                    student: data.student,
                    course: data.course,
                    semester: data.semester,
                    subjects: data.subjects
                });
            }
            await result.save();
            importedCount++;
        }
        res.json({ message: `Successfully imported ${importedCount} results.` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
