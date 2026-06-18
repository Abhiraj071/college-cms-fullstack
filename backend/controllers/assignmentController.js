const Assignment = require('../models/Assignment');
const Subject = require('../models/Subject');
const Student = require('../models/Student');
const semesterService = require('../services/semesterService');

exports.getAssignments = async (req, res) => {
    try {
        const { course, subject, year, semester } = req.query;
        let query = {};
        if (course) query.course = course;
        if (subject) query.subject = subject;
        if (year) query.year = year;
        if (semester) query.semester = semester;

        // Role-based filtering
        if (req.user.role === 'admin') {
            // Admin sees all matching assignments
        } else if (req.user.role === 'student') {
            const student = await Student.findOne({ userId: req.user._id });
            if (student) {
                query.course = student.course;

                // Handle optional/missing 'year' in Student schema by deriving from semester
                if (student.year) {
                    query.year = student.year;
                } else {
                    query.year = Math.ceil(student.semester / 2);
                }

                query.semester = student.semester;
            } else {
                return res.json([]);
            }
        } else {
            return res.status(403).json({ message: 'Access restricted to Admins and Students only.' });
        }

        const assignments = await Assignment.find(query)
            .populate('subject', 'name')
            .sort({ createdAt: -1 });
        res.json(assignments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createAssignment = async (req, res) => {
    try {
        const { subject: subjectId, title, deadline, description, allowLate, course, year, semester } = req.body;

        const semesterDates = await semesterService.getSemesterDates();
        if (semesterDates && deadline) {
            const deadlineDate = new Date(deadline);
            if (deadlineDate < semesterDates.start || deadlineDate > semesterDates.end) {
                return res.status(400).json({ 
                    message: `Assignment deadlines must be within the semester learning period: ${semesterDates.start.toDateString()} to ${semesterDates.end.toDateString()}` 
                });
            }
        }

        let fileUrl = req.body.fileUrl; // Fallback to URL if no file uploaded
        if (req.file) {
            fileUrl = `${req.protocol}://${req.get('host')}/${req.file.path.replace(/\\/g, '/')}`;
        }

        const subject = await Subject.findById(subjectId);
        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        const assignment = new Assignment({
            title,
            description,
            subject: subjectId,
            course: course || subject.course,
            year: year || subject.year,
            semester: semester || subject.semester,
            deadline,
            fileUrl,
            allowLate: allowLate === 'true' || allowLate === true
        });

        await assignment.save();
        res.status(201).json(assignment);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.submitAssignment = async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);
        if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

        if (new Date(assignment.deadline) < new Date() && !assignment.allowLate) {
            return res.status(400).json({ message: 'Submission closed.' });
        }

        let fileUrl = req.body.fileUrl;
        if (req.file) {
            fileUrl = `${req.protocol}://${req.get('host')}/${req.file.path.replace(/\\/g, '/')}`;
        }

        const submission = {
            student: req.user._id,
            fileUrl: fileUrl,
            submittedAt: new Date()
        };

        if (req.user.role === 'student') {
            const studentProfile = await Student.findOne({ userId: req.user._id });
            if (studentProfile) submission.student = studentProfile._id;
        }

        // Check if student already submitted
        const existingIndex = assignment.submissions.findIndex(s => s.student && s.student.toString() === submission.student.toString());
        if (existingIndex > -1) {
            assignment.submissions[existingIndex] = submission; // Update existing submission
        } else {
            assignment.submissions.push(submission);
        }

        await assignment.save();
        res.json(assignment);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.gradeSubmission = async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);
        if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

        const submission = assignment.submissions.id(req.params.submissionId);
        if (!submission) return res.status(404).json({ message: 'Submission not found' });

        submission.grade = req.body.grade;
        submission.feedback = req.body.feedback;

        await assignment.save();
        res.json(assignment);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteAssignment = async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);
        if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

        await Assignment.findByIdAndDelete(req.params.id);
        res.json({ message: 'Assignment removed' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getFacultyClasses = async (req, res) => {
    // Stubbed out as Faculty role has been removed.
    res.json([]);
};
