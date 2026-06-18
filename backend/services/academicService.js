const Student = require('../models/Student');
const Course = require('../models/Course');
const Alumni = require('../models/Alumni');
const Mark = require('../models/Mark');
const gradingService = require('./gradingService');

exports.promoteStudents = async () => {
    console.log('--- Starting Student Promotion Process ---');
    const Student = require('../models/Student');
    const Setting = require('../models/Setting');
    const academicPolicyObj = await Setting.findOne({ key: 'academic_policy' });
    const passPct = academicPolicyObj && academicPolicyObj.value && academicPolicyObj.value.passPercentage !== undefined
        ? academicPolicyObj.value.passPercentage
        : 40;
    const passFraction = passPct / 100;

    const students = await Student.find({});
    const courses = await Course.find({});
    const courseMap = {};
    courses.forEach(c => courseMap[c.name] = c);

    // Determine if we are moving to an ODD or EVEN semester globally
    let totalOdd = 0; let totalEven = 0;
    students.forEach(s => {
        if (s.semester % 2 !== 0) totalOdd++;
        else totalEven++;
    });
    const currentGlobalIsOdd = totalOdd > totalEven;
    const nextGlobalIsOdd = !currentGlobalIsOdd;
    
    console.log(`Global transition: ${currentGlobalIsOdd ? 'ODD' : 'EVEN'} -> ${nextGlobalIsOdd ? 'ODD' : 'EVEN'}`);

    for (const student of students) {
        const course = courseMap[student.course];
        const maxSem = course ? course.duration * 2 : 8;
        
        // --- 1. Evaluate Backlogs ---
        const marks = await Mark.find({ studentId: student._id }).populate('examId');
        
        const examsMap = {};
        marks.forEach(m => {
            if (!m.examId) return;
            const eId = m.examId._id.toString();
            if (!examsMap[eId]) examsMap[eId] = [];
            
            if (m.subjectMarks) {
                m.subjectMarks.forEach(sm => {
                    const max = sm.maxTotal || 100;
                    const passing = max * passFraction;
                    examsMap[eId].push({
                        subjectId: sm.subjectId || sm.subjectName,
                        semester: sm.semester || m.examId.semester || student.semester,
                        total: sm.total || 0,
                        maxTotal: max,
                        isPassed: (sm.total || 0) >= passing,
                        marginNeeded: passing - (sm.total || 0)
                    });
                });
            }
        });

        // Apply Grace Marks via Grading Service
        const allProcessedSubjects = [];
        Object.values(examsMap).forEach(examSubjects => {
            gradingService.applyGraceMarks(examSubjects, passFraction);
            allProcessedSubjects.push(...examSubjects);
        });

        // Calculate Active Backlogs
        const subjectStatus = {}; // subjectId -> isPassed
        const subjectSemester = {}; // subjectId -> original semester
        
        allProcessedSubjects.forEach(sub => {
            if (!subjectStatus[sub.subjectId]) {
                subjectStatus[sub.subjectId] = sub.isPassed;
            } else if (sub.isPassed) {
                subjectStatus[sub.subjectId] = true;
            }
            
            if (!subjectSemester[sub.subjectId]) {
                subjectSemester[sub.subjectId] = sub.semester;
            }
        });

        const activeBacklogs = Object.keys(subjectStatus)
            .filter(subId => !subjectStatus[subId])
            .map(subId => ({ subjectId: subId, semester: subjectSemester[subId] }));

        const hasYearBack = activeBacklogs.length > 5;
        const has1stYearBacklogs = activeBacklogs.some(b => b.semester === 1 || b.semester === 2);
        const justFinishedIsOdd = student.semester % 2 !== 0;

        console.log(`Student ${student.rollNo} (Sem ${student.semester}): Backlogs=${activeBacklogs.length}, YearBack=${hasYearBack}, 1stYearBack=${has1stYearBacklogs}`);

        if (!student.currentOddSemester) student.currentOddSemester = justFinishedIsOdd ? student.semester : student.semester - 1;
        if (!student.currentEvenSemester) student.currentEvenSemester = justFinishedIsOdd ? student.semester + 1 : student.semester;
        if (student.currentOddSemester < 1) student.currentOddSemester = 1;
        if (student.currentEvenSemester < 2) student.currentEvenSemester = 2;

        // --- 2. Calculate Next Target Semester ---
        if (justFinishedIsOdd) {
            let targetOdd = student.semester + 2;
            if (hasYearBack) targetOdd = student.semester; 
            if (targetOdd === 5 && has1stYearBacklogs) targetOdd = student.semester; 
            student.currentOddSemester = targetOdd;
        } else {
            let targetEven = student.semester + 2;
            if (hasYearBack) targetEven = student.semester; 
            if (targetEven === 6 && has1stYearBacklogs) targetEven = student.semester; 
            student.currentEvenSemester = targetEven;
        }

        // --- 3. Switch Track and Evaluate Graduation ---
        let nextSemester = nextGlobalIsOdd ? student.currentOddSemester : student.currentEvenSemester;

        if (nextSemester <= maxSem) {
            student.semester = nextSemester;
            student.present = 0;
            student.absent = 0;
            student.totalClasses = 0;
            student.attendancePercentage = '0%';
            await student.save();
        } else {
            if (activeBacklogs.length === 0) {
                const startYear = new Date(student.joinDate).getFullYear();
                const endYear = new Date().getFullYear();
                const batchLabel = `${student.course} ${startYear}-${endYear}`;

                await Alumni.create({
                    userId: student.userId,
                    name: student.name,
                    rollNo: student.rollNo,
                    course: student.course,
                    batch: batchLabel,
                    email: student.email,
                    phone: student.phone,
                    joinDate: student.joinDate,
                    graduationDate: new Date(),
                    cgpa: student.cgpa,
                    totalAttendance: student.attendancePercentage
                });

                await Student.findByIdAndDelete(student._id);
                console.log(`Graduated: ${student.name} (${batchLabel})`);
            } else {
                student.semester = nextSemester > maxSem ? maxSem : nextSemester;
                await student.save();
                console.log(`Student ${student.rollNo} finished max semesters but has backlogs. Holding.`);
            }
        }
    }
    console.log('--- Student Promotion Process Completed ---');
};
