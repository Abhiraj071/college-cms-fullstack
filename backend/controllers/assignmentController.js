const Assignment = require('../models/Assignment');
const Subject = require('../models/Subject');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Timetable = require('../models/Timetable');

exports.getAssignments = async (req, res) => {
    try {
        const { course, subject, year, semester } = req.query;
        let query = {};
        if (course) query.course = course;
        if (subject) query.subject = subject;
        if (year) query.year = year;
        if (semester) query.semester = semester;

        // Role-based filtering
        if (req.user.role === 'teacher') {
            const faculty = await Faculty.findOne({ userId: req.user._id });
            if (faculty) {
                // Teachers see assignments they created OR assignments for subjects they teach?
                // Request says: "Can view submissions of only their students", "Can create... for subjects allocated to them".
                // Usually teachers want to see the assignments they created.
                query.faculty = faculty._id;
            } else {
                return res.json([]);
            }
        } else if (req.user.role === 'student') {
            const student = await Student.findOne({ userId: req.user._id });
            if (student) {
                query.course = student.course;

                // Handle optional/missing 'year' in Student schema by deriving from semester
                // Logic: Year 1 = Sem 1,2; Year 2 = Sem 3,4; etc.
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
            // Admin or others -> NO ACCESS
            return res.status(403).json({ message: 'Access restricted to Faculty and Students only.' });
        }

        const assignments = await Assignment.find(query)
            .populate('subject', 'name')
            .populate('faculty', 'name')
            .sort({ createdAt: -1 });
        res.json(assignments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createAssignment = async (req, res) => {
    try {
        const { subject: subjectId, title, deadline, description, allowLate, course, year, semester } = req.body;

        let fileUrl = req.body.fileUrl; // Fallback to URL if no file uploaded
        if (req.file) {
            fileUrl = `${req.protocol}://${req.get('host')}/${req.file.path.replace(/\\/g, '/')}`;
        }

        const subject = await Subject.findById(subjectId);
        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        // Get the faculty profile for the current user
        const faculty = await Faculty.findOne({ userId: req.user._id });

        // We need these for the assignment if the Subject doc lacks them
        let foundCourse, foundYear, foundSemester;

        // Check if the faculty is assigned to this subject
        if (req.user.role === 'teacher') {
            if (!faculty) {
                console.error(`CreateAssignment: Faculty profile not found for User ${req.user._id}`);
                return res.status(403).json({ message: 'Faculty profile not found for this user.' });
            }

            // Check if the faculty is assigned to this subject (Directly OR via Timetable)
            // 1. Direct Check
            let isAuthorized = false;
            if (subject.faculty && subject.faculty.toString() === faculty._id.toString()) {
                isAuthorized = true;
            }

            // 2. Timetable Check (if not directly authorized)
            if (!isAuthorized) {
                // Fetch ALL timetables
                const timetables = await Timetable.find({});
                const facultyName = faculty.name.trim().toLowerCase();
                const subjectName = subject.name.trim().toLowerCase();

                for (const tt of timetables) {
                    if (tt.grid) {
                        const slots = tt.grid instanceof Map ? Array.from(tt.grid.values()) : Object.values(tt.grid);
                        for (const slot of slots) {
                            if (slot.teacher && slot.teacher.trim().toLowerCase() === facultyName &&
                                slot.subject && slot.subject.trim().toLowerCase() === subjectName) {
                                isAuthorized = true;
                                foundCourse = tt.course;
                                foundYear = tt.year;
                                foundSemester = tt.semester;
                                break;
                            }
                        }
                    }
                    if (isAuthorized) break;
                }
            }

            if (!isAuthorized) {
                return res.status(403).json({ message: 'You are not assigned to this subject.' });
            }
        }

        const assignment = new Assignment({
            title,
            description,
            subject: subjectId,
            course: course || subject.course || foundCourse,
            year: year || subject.year || foundYear,
            semester: semester || subject.semester || foundSemester,
            deadline,
            fileUrl,
            allowLate: allowLate === 'true' || allowLate === true, // handle FormData string boolean
            faculty: faculty._id
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

        // Fix for Student ID vs User ID
        if (req.user.role === 'student') {
            // In submitAssignment, we might want to store the Student Profile ID if the schema strictly requires it.
            // But let's check if 'student' in submission schema is strictly ObjectId. Yes.
            // Does `req.user._id` match Student ID? No. User ID. 
            // We should find Student profile.
            const studentProfile = await Student.findOne({ userId: req.user._id });
            if (studentProfile) submission.student = studentProfile.code || studentProfile.name; // Wait, schema Types.ObjectId.
            // If schema is ObjectId, we must store ObjectId.
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

        const faculty = await Faculty.findOne({ userId: req.user._id });
        const facultyId = faculty ? faculty._id.toString() : null;

        if (req.user.role === 'teacher') {
            if (assignment.faculty.toString() !== facultyId) {
                return res.status(401).json({ message: 'Not authorized' });
            }
        }

        await Assignment.findByIdAndDelete(req.params.id);
        res.json({ message: 'Assignment removed' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getFacultyClasses = async (req, res) => {
    try {
        const faculty = await Faculty.findOne({ userId: req.user._id });
        if (!faculty) {
            return res.status(404).json({ message: 'Faculty profile not found' });
        }

        const classes = [];
        const uniqueKeys = new Set(); // To avoid duplicates: subjectId-course-year-sem

        // 1. Direct Subject Assignments
        // Find subjects where this faculty is explicitly assigned
        const directSubjects = await Subject.find({ faculty: faculty._id });
        for (const sub of directSubjects) {
            // Only add if course/year/sem are defined
            if (sub.course && sub.year && sub.semester) {
                const key = `${sub._id}-${sub.course}-${sub.year}-${sub.semester}`;
                if (!uniqueKeys.has(key)) {
                    uniqueKeys.add(key);
                    classes.push({
                        _id: sub._id, // Subject ID
                        name: sub.name,
                        course: sub.course,
                        year: sub.year,
                        semester: sub.semester,
                        source: 'direct'
                    });
                }
            }
        }

        // 2. Timetable Assignments
        const timetables = await Timetable.find({});
        const facultyName = faculty.name.trim().toLowerCase();

        // We need to resolve Subject Names (from Timetable) to Subject IDs
        // Let's optimize by fetching all subjects first or querying on demand
        const allSubjects = await Subject.find({});
        const subjectMap = new Map(); // Name_lower -> Subject Doc
        allSubjects.forEach(s => subjectMap.set(s.name.trim().toLowerCase(), s));

        for (const tt of timetables) {
            if (tt.grid) {
                const slots = tt.grid instanceof Map ? Array.from(tt.grid.values()) : Object.values(tt.grid);
                for (const slot of slots) {
                    if (slot.teacher && slot.teacher.trim().toLowerCase() === facultyName && slot.subject) {
                        const subName = slot.subject.trim().toLowerCase();
                        const subjectDoc = subjectMap.get(subName);

                        if (subjectDoc) {
                            const key = `${subjectDoc._id}-${tt.course}-${tt.year}-${tt.semester}`;
                            if (!uniqueKeys.has(key)) {
                                uniqueKeys.add(key);
                                classes.push({
                                    _id: subjectDoc._id,
                                    name: subjectDoc.name,
                                    course: tt.course,
                                    year: tt.year,
                                    semester: tt.semester,
                                    source: 'timetable'
                                });
                            }
                        }
                    }
                }
            }
        }

        res.json(classes);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};
