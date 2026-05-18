const Exam = require('../models/Exam');
const Mark = require('../models/Mark');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const semesterService = require('../services/semesterService');

// ── Exam CRUD ────────────────────────────────────────────────────────────────

exports.getExams = async (req, res) => {
    try {
        const filter = {};
        if (req.query.course) filter.course = req.query.course;
        if (req.query.subject) filter.subject = req.query.subject;

        const exams = await Exam.find(filter).sort({ date: -1 });
        res.json(exams);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getAllMarks = async (req, res) => {
    try {
        const filter = {};
        if (req.query.course) {
            const courseName = req.query.course.trim();
            // 1. Find all students in this course
            const students = await Student.find({ course: { $regex: new RegExp(`^${courseName}$`, 'i') } }).select('_id');
            const studentIds = students.map(s => s._id);
            // 2. Filter marks for these students
            filter.studentId = { $in: studentIds };
        }
        const marks = await Mark.find(filter)
            .populate('studentId', 'name rollNo course semester')
            .populate('examId', 'title course semester');
        res.json(marks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getExamById = async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id);
        if (!exam) return res.status(404).json({ message: 'Exam not found' });
        res.json(exam);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createExam = async (req, res) => {
    try {
        const semesterDates = await semesterService.getSemesterDates();
        if (semesterDates && req.body.date) {
            const examDate = new Date(req.body.date);
            if (examDate <= semesterDates.end) {
                return res.status(400).json({ 
                    message: `Exams must be scheduled AFTER the learning semester ends (after ${semesterDates.end.toDateString()}).` 
                });
            }
        }

        const exam = new Exam({ ...req.body, createdBy: req.user._id });
        await exam.save();
        res.status(201).json(exam);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.updateExam = async (req, res) => {
    try {
        const semesterDates = await semesterService.getSemesterDates();
        if (semesterDates && req.body.date) {
            const examDate = new Date(req.body.date);
            if (examDate <= semesterDates.end) {
                return res.status(400).json({ 
                    message: `Exams must be scheduled AFTER the learning semester ends (after ${semesterDates.end.toDateString()}).` 
                });
            }
        }

        const exam = await Exam.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
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
        // Cascade delete marks
        await Mark.deleteMany({ examId: req.params.id });
        res.json({ message: 'Exam and all associated marks deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── Marks ────────────────────────────────────────────────────────────────────

exports.getMarksByExam = async (req, res) => {
    try {
        const marks = await Mark.find({ examId: req.params.examId })
            .populate('studentId', 'name rollNo course semester')
            .populate('examId', 'title subject totalMarks passingMarks');
        res.json(marks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getMarksByStudent = async (req, res) => {
    try {
        const marks = await Mark.find({ studentId: req.params.studentId })
            .populate('examId', 'title subject totalMarks passingMarks date examType course');
        res.json(marks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.upsertMark = async (req, res) => {
    try {
        const { examId, studentId, marksObtained, subjectMarks, remarks } = req.body;
        if (!examId || !studentId || marksObtained === undefined) {
            return res.status(400).json({ message: 'examId, studentId, and marksObtained are required' });
        }

        const exam = await Exam.findById(examId);
        if (!exam) return res.status(404).json({ message: 'Exam not found' });

        // Prevent changing sessional marks if they already exist in ANY previous exam for this student
        const allStudentMarks = await Mark.find({ studentId });
        let finalSubjectMarks = subjectMarks || [];
        
        finalSubjectMarks = finalSubjectMarks.map(newMark => {
            let existingSessional = null;
            
            // Look for existing sessional marks in any previous record for this student/subject
            for (const m of allStudentMarks) {
                if (!m.subjectMarks) continue;
                const oldMark = m.subjectMarks.find(om => 
                    (om.subjectId && om.subjectId === newMark.subjectId) || 
                    (om.subjectName && om.subjectName === newMark.subjectName)
                );
                if (oldMark && oldMark.sessional !== undefined && oldMark.sessional !== null && oldMark.sessional !== '') {
                    existingSessional = oldMark.sessional;
                    break;
                }
            }

            if (existingSessional !== null) {
                // Keep the existing sessional value and recalculate total
                const sessional = existingSessional;
                const total = (newMark.theory || 0) + sessional + (newMark.viva || 0);
                return { ...newMark, sessional, total };
            }
            return newMark;
        });

        const mark = await Mark.findOneAndUpdate(
            { examId, studentId },
            { 
                marksObtained: finalSubjectMarks.reduce((acc, sm) => acc + (sm.total || 0), 0), 
                studentSemester: req.body.studentSemester || undefined,
                subjectMarks: finalSubjectMarks,
                remarks: remarks || '', 
                enteredBy: req.user._id 
            },
            { new: true, upsert: true, runValidators: true }
        );

        res.json(mark);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.bulkUpsertMarks = async (req, res) => {
    try {
        const { marks } = req.body; // Array of marks
        if (!marks || !Array.isArray(marks)) {
            return res.status(400).json({ message: 'marks array is required' });
        }

        const results = [];
        for (const markData of marks) {
            const { examId, studentId, studentSemester, subjectMarks, remarks } = markData;
            
            if (!examId || !studentId) continue;

            const finalSubjectMarks = subjectMarks || [];
            
            const mark = await Mark.findOneAndUpdate(
                { examId, studentId },
                { 
                    marksObtained: finalSubjectMarks.reduce((acc, sm) => acc + (sm.total || 0), 0), 
                    studentSemester: studentSemester || undefined,
                    subjectMarks: finalSubjectMarks,
                    remarks: remarks || '', 
                    enteredBy: req.user._id 
                },
                { new: true, upsert: true, runValidators: true }
            );
            results.push(mark);
        }

        res.json({ message: `Successfully updated ${results.length} records`, results });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// ── Result Summary for a Student ─────────────────────────────────────────────

exports.getStudentResultSummary = async (req, res) => {
    try {
        const { studentId } = req.params;
        const marks = await Mark.find({ studentId })
            .populate('examId', 'title subject totalMarks passingMarks date course subjectSchedules');

        let totalExams = 0;
        let totalObtained = 0;
        let totalPossible = 0;
        let passed = 0;
        
        let results = [];

        marks.forEach(m => {
            const exam = m.examId;
            
            if (m.subjectMarks && m.subjectMarks.length > 0) {
                m.subjectMarks.forEach(sm => {
                    const max = sm.maxTotal || 100;
                    const passing = max * 0.4; // 40% passing criteria
                    const perc = max > 0 ? ((sm.total / max) * 100).toFixed(1) : 0;
                    const isPassed = sm.total >= passing;
                    
                    if (isPassed) passed++;
                    totalExams++;
                    totalObtained += sm.total;
                    totalPossible += max;
                    
                    let subDate = exam && exam.date;
                    if (exam && exam.subjectSchedules) {
                        const sched = exam.subjectSchedules.find(s => s.subjectId === sm.subjectId || s.name === sm.subjectName);
                        if (sched && sched.date) subDate = sched.date;
                    }
                    
                    results.push({
                        _id: m._id + '_' + sm.subjectId,
                        examId: exam ? exam._id : null,
                        examTitle: exam ? exam.title : 'N/A',
                        subjectName: sm.subjectName,
                        subjectCode: exam?.subjectSchedules?.find(s => s.subjectId === sm.subjectId)?.code || '',
                        subjectType: exam?.subjectSchedules?.find(s => s.subjectId === sm.subjectId)?.type || 'Theory',
                        date: subDate,
                        marksObtained: sm.total,
                        maxTotal: max,
                        percentage: parseFloat(perc),
                        isPassed,
                        createdAt: m.createdAt,
                        // Detailed marks
                        theory: sm.theory || 0,
                        sessional: sm.sessional || 0,
                        viva: sm.viva || 0,
                        maxTheory: sm.maxTheory || 0,
                        maxSessional: sm.maxSessional || 0,
                        maxViva: sm.maxViva || 0,
                    });
                });
            } else {
                const max = exam ? exam.totalMarks : 100;
                const passing = exam ? exam.passingMarks : 40;
                const perc = max > 0 ? ((m.marksObtained / max) * 100).toFixed(1) : 0;
                const isPassed = m.marksObtained >= passing;
                if (isPassed) passed++;
                totalExams++;
                totalObtained += m.marksObtained;
                totalPossible += max;
                
                results.push({
                    _id: m._id,
                    examId: exam ? exam._id : null,
                    examTitle: exam ? exam.title : 'N/A',
                    subjectName: exam ? exam.subject : 'N/A',
                    subjectCode: '',
                    subjectType: 'Theory',
                    date: exam ? exam.date : null,
                    marksObtained: m.marksObtained,
                    maxTotal: max,
                    percentage: parseFloat(perc),
                    isPassed,
                    createdAt: m.createdAt,
                    theory: m.marksObtained,
                    sessional: 0,
                    viva: 0,
                    maxTheory: max,
                    maxSessional: 0,
                    maxViva: 0
                });
            }
        });

        const overallPerc = totalPossible > 0 ? ((totalObtained / totalPossible) * 100).toFixed(1) : 0;

        res.json({
            totalExams,
            passed,
            failed: totalExams - passed,
            totalObtained,
            totalPossible,
            overallPercentage: parseFloat(overallPerc),
            results
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── Semester-Wise Results with Supplementary Overlay ─────────────────────────

exports.getSemesterWiseResults = async (req, res) => {
    try {
        const { studentId } = req.params;
        const student = await Student.findById(studentId);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        const marks = await Mark.find({ studentId })
            .populate('examId', 'title subject totalMarks passingMarks date course semester subjectSchedules examType');

        // Collect all subject-level results with semester info
        const allSubjectResults = [];

        marks.forEach(m => {
            const exam = m.examId;
            if (!exam) return;

            if (m.subjectMarks && m.subjectMarks.length > 0) {
                m.subjectMarks.forEach(sm => {
                    // Determine semester: from subjectMark first, then from exam, then from matching schedule
                    let subSemester = sm.semester;
                    if (!subSemester && exam.semester) subSemester = exam.semester;
                    if (!subSemester) subSemester = student.semester || 1;

                    const max = sm.maxTotal || 100;
                    const passing = max * 0.4;
                    const isPassed = sm.total >= passing;

                    // Find schedule info for this subject
                    const sched = exam.subjectSchedules
                        ? exam.subjectSchedules.find(s => s.subjectId === sm.subjectId || s.name === sm.subjectName)
                        : null;

                    allSubjectResults.push({
                        examId: exam._id,
                        examTitle: exam.title,
                        examSemester: exam.semester,
                        examDate: exam.date,
                        subjectId: sm.subjectId,
                        subjectName: sm.subjectName,
                        subjectCode: sm.subjectCode || sched?.code || '',
                        subjectType: sched?.type || 'Theory',
                        semester: subSemester,
                        isSupplementary: sm.isSupplementary || false,
                        theory: sm.theory || 0,
                        sessional: sm.sessional || 0,
                        viva: sm.viva || 0,
                        total: sm.total || 0,
                        maxTheory: sm.maxTheory || 0,
                        maxSessional: sm.maxSessional || 0,
                        maxViva: sm.maxViva || 0,
                        maxTotal: max,
                        isPassed,
                        date: sched?.date || exam.date,
                        createdAt: m.createdAt
                    });
                });
            }
        });

        // Group by semester
        const semesterMap = {};
        allSubjectResults.forEach(r => {
            const sem = r.semester;
            if (!semesterMap[sem]) semesterMap[sem] = { regular: [], supplementary: [] };
            if (r.isSupplementary) {
                semesterMap[sem].supplementary.push(r);
            } else {
                semesterMap[sem].regular.push(r);
            }
        });

        // Build result cards per semester
        const semesters = Object.keys(semesterMap)
            .map(Number)
            .sort((a, b) => a - b)
            .map(sem => {
                const data = semesterMap[sem];
                const cards = [];

                // Card 1: Regular result
                if (data.regular.length > 0) {
                    const totalMax = data.regular.reduce((s, r) => s + r.maxTotal, 0);
                    const totalObt = data.regular.reduce((s, r) => s + r.total, 0);
                    const allPassed = data.regular.every(r => r.isPassed);

                    cards.push({
                        type: 'Regular',
                        label: `Semester ${sem} — Regular`,
                        subjects: data.regular,
                        totalObtained: totalObt,
                        totalMax,
                        isPassed: allPassed,
                        examTitle: data.regular[0]?.examTitle || '',
                        date: data.regular[0]?.date
                    });
                }

                // Card 2: Supplementary result
                if (data.supplementary.length > 0) {
                    let overlaidSubjects = [];
                    if (data.regular.length > 0) {
                        // Overlay on regular
                        overlaidSubjects = data.regular.map(reg => {
                            const suppMatch = data.supplementary.find(
                                s => s.subjectId === reg.subjectId || s.subjectName === reg.subjectName
                            );
                            if (suppMatch && !reg.isPassed) {
                                return { ...suppMatch, wasUpdated: true };
                            }
                            return { ...reg, wasUpdated: false };
                        });
                        
                        // Also add any supplementary subjects that weren't in the regular list
                        data.supplementary.forEach(supp => {
                            const inRegular = data.regular.some(reg => reg.subjectId === supp.subjectId || reg.subjectName === supp.subjectName);
                            if (!inRegular) {
                                overlaidSubjects.push({ ...supp, wasUpdated: true });
                            }
                        });
                    } else {
                        // Standalone supplementary
                        overlaidSubjects = data.supplementary.map(s => ({ ...s, wasUpdated: true }));
                    }

                    const totalMax = overlaidSubjects.reduce((s, r) => s + r.maxTotal, 0);
                    const totalObt = overlaidSubjects.reduce((s, r) => s + r.total, 0);
                    const allPassed = overlaidSubjects.every(r => r.isPassed);

                    cards.push({
                        type: 'Supplementary',
                        label: `Semester ${sem} — Supplementary`,
                        subjects: overlaidSubjects,
                        totalObtained: totalObt,
                        totalMax,
                        isPassed: allPassed,
                        examTitle: data.supplementary[0]?.examTitle || data.regular[0]?.examTitle || 'Supplementary Exam',
                        date: data.supplementary[0]?.date || data.regular[0]?.date
                    });
                }

                return { semester: sem, cards };
            });

        res.json({
            student: {
                name: student.name,
                rollNo: student.rollNo,
                course: student.course,
                semester: student.semester
            },
            semesters
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ── Get Supplementary Subjects for a Course+Semester ─────────────────────────
// Returns subjects from PREVIOUS semesters where at least one student failed

exports.getSupplementarySubjects = async (req, res) => {
    try {
        const { course, semester } = req.query;
        if (!course || !semester) {
            return res.status(400).json({ message: 'course and semester are required' });
        }

        const currentSem = parseInt(semester);

        // Find all students in this course who are in the requested semester
        const students = await Student.find({ course, semester: currentSem });
        if (students.length === 0) {
            return res.json({ supplementarySubjects: [] });
        }

        const studentIds = students.map(s => s._id);

        // Fetch all marks for these students
        const allMarks = await Mark.find({ studentId: { $in: studentIds } })
            .populate('examId', 'course semester subjectSchedules');

        // Find all failed subjects from previous semesters
        const failedSubjectsMap = {}; // key: subjectId or subjectName

        allMarks.forEach(m => {
            const exam = m.examId;
            if (!exam) return;

            m.subjectMarks.forEach(sm => {
                const subSem = sm.semester || exam.semester;
                // Only look at previous semesters
                if (subSem && subSem < currentSem && !sm.isSupplementary) {
                    const max = sm.maxTotal || 100;
                    const passing = max * 0.4;
                    if (sm.total < passing) {
                        const key = sm.subjectId || sm.subjectName;

                        // Check if student already passed this subject in a supplementary attempt
                        const hasPassedSupp = allMarks.some(m2 =>
                            m2.subjectMarks.some(sm2 =>
                                (sm2.subjectId === sm.subjectId || sm2.subjectName === sm.subjectName)
                                && sm2.isSupplementary
                                && sm2.total >= passing
                            )
                        );

                        if (!hasPassedSupp && !failedSubjectsMap[key]) {
                            const sched = exam.subjectSchedules
                                ? exam.subjectSchedules.find(s => s.subjectId === sm.subjectId || s.name === sm.subjectName)
                                : null;

                            failedSubjectsMap[key] = {
                                subjectId: sm.subjectId,
                                name: sm.subjectName,
                                code: sm.subjectCode || sched?.code || '',
                                type: sched?.type || 'Theory',
                                semester: subSem,
                                maxTotal: sm.maxTotal || 100,
                                maxTheory: sm.maxTheory || 70,
                                maxSessional: sm.maxSessional || 30,
                                maxViva: sm.maxViva || 0
                            };
                        }
                    }
                }
            });
        });

        res.json({
            supplementarySubjects: Object.values(failedSubjectsMap)
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getPublicResult = async (req, res) => {
    try {
        const { rollNo, examId } = req.query;
        if (!rollNo || !examId) {
            return res.status(400).json({ message: 'Roll Number and Exam ID are required' });
        }

        const student = await Student.findOne({ rollNo: rollNo.trim() });
        if (!student) return res.status(404).json({ message: 'Student not found with this Roll Number' });

        const exam = await Exam.findById(examId);
        if (!exam) return res.status(404).json({ message: 'Exam not found' });

        const mark = await Mark.findOne({ examId, studentId: student._id });
        if (!mark) return res.status(404).json({ message: 'Result not found for this student in the selected exam' });

        res.json({
            student: {
                name: student.name,
                rollNo: student.rollNo,
                course: student.course,
                semester: student.semester
            },
            exam: {
                title: exam.title,
                course: exam.course,
                semester: exam.semester,
                date: exam.date,
                subjectSchedules: exam.subjectSchedules
            },
            marks: {
                subjectMarks: mark.subjectMarks,
                marksObtained: mark.marksObtained,
                totalPossible: (mark.subjectMarks || []).reduce((acc, sm) => acc + (sm.maxTotal || 100), 0)
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getExamStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const allExams = await Exam.find();

        let totalEligibleStudents = 0;
        let todayStudentsCount = 0;
        let previousPapersCount = 0;
        let todaySchedule = [];
        let upcomingPapers = [];

        const examClasses = new Set();
        
        allExams.forEach(exam => {
            if (exam.course && exam.semester) {
                examClasses.add(`${exam.course}|${exam.semester}`);
            }
            
            if (exam.subjectSchedules && exam.subjectSchedules.length > 0) {
                exam.subjectSchedules.forEach(sched => {
                    if (!sched.date) return;
                    const schedDate = new Date(sched.date);
                    schedDate.setHours(0,0,0,0);
                    
                    if (schedDate < today) {
                        previousPapersCount++;
                    } else if (schedDate.getTime() === today.getTime()) {
                        todaySchedule.push({
                            title: exam.title,
                            subject: sched.name,
                            code: sched.code,
                            time: sched.time,
                            venue: sched.venue || exam.venue,
                            course: exam.course,
                            semester: exam.semester
                        });
                    } else {
                        upcomingPapers.push({
                            title: exam.title,
                            subject: sched.name,
                            code: sched.code,
                            date: sched.date,
                            time: sched.time,
                            course: exam.course,
                            semester: exam.semester
                        });
                    }
                });
            } else if (exam.date) {
                const schedDate = new Date(exam.date);
                schedDate.setHours(0,0,0,0);
                
                if (schedDate < today) {
                    previousPapersCount++;
                } else if (schedDate.getTime() === today.getTime()) {
                    todaySchedule.push({
                        title: exam.title,
                        subject: exam.subject || 'N/A',
                        time: exam.time,
                        venue: exam.venue || exam.room,
                        course: exam.course,
                        semester: exam.semester
                    });
                } else {
                    upcomingPapers.push({
                        title: exam.title,
                        subject: exam.subject || 'N/A',
                        date: exam.date,
                        time: exam.time,
                        course: exam.course,
                        semester: exam.semester
                    });
                }
            }
        });

        // Calculate total eligible students
        for (const classKey of examClasses) {
            const [course, semester] = classKey.split('|');
            const count = await Student.countDocuments({ course, semester: parseInt(semester) });
            totalEligibleStudents += count;
        }

        // Calculate today's students
        const todayClasses = new Set();
        todaySchedule.forEach(s => {
            todayClasses.add(`${s.course}|${s.semester}`);
        });

        for (const classKey of todayClasses) {
            const [course, semester] = classKey.split('|');
            const count = await Student.countDocuments({ course, semester: parseInt(semester) });
            todayStudentsCount += count;
        }

        upcomingPapers.sort((a, b) => new Date(a.date) - new Date(b.date));

        res.json({
            totalEligibleStudents,
            todayStudentsCount,
            previousPapersCount,
            todaySchedule,
            upcomingPapers: upcomingPapers.slice(0, 10)
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
