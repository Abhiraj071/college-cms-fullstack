const Student = require('../models/Student');
const User = require('../models/User');
const crypto = require('crypto');

// Generate a secure random default password
function generateDefaultPassword() {
    return crypto.randomBytes(10).toString('base64url'); // e.g. "aB3xR9mK2p"
}

// Get all students
exports.getStudents = async (req, res) => {
    try {
        const { userId } = req.query;
        const query = userId ? { userId } : {};
        const students = await Student.find(query)
            .populate('userId', 'username email')
            .lean();     // lean() returns plain JS objects – faster, less memory
        res.json(students);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Create student (Admin only)
exports.createStudent = async (req, res) => {
    try {
        const { username, email, name, rollNo, course, semester, phone, joinDate } = req.body;

        if (!username || !email || !name || !rollNo || !course || !semester) {
            return res.status(400).json({ message: 'username, email, name, rollNo, course and semester are required' });
        }

        // 1. Check if user already exists
        let userInstance = await User.findOne({ $or: [{ username }, { email }] });
        if (userInstance) {
            return res.status(400).json({ message: 'User or Email already exists' });
        }

        // 2. Check if roll number exists
        const rollExists = await Student.findOne({ rollNo });
        if (rollExists) {
            return res.status(400).json({ message: 'Roll number already exists' });
        }

        const defaultPassword = generateDefaultPassword();

        // 3. Create User Account
        userInstance = new User({
            username,
            password: defaultPassword,
            role: 'student',
            name,
            email
        });
        await userInstance.save();

        // 4. Create Student Record
        const student = new Student({
            userId: userInstance._id,
            name, rollNo, course, semester, email, phone, joinDate,
            cgpa: 0.0
        });
        await student.save();

        // Return generated password once so admin can share it with student
        res.status(201).json({ ...student.toObject(), defaultPassword });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Delete student (Admin only)
exports.deleteStudent = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        await User.findByIdAndDelete(student.userId);
        await Student.findByIdAndDelete(req.params.id);
        res.json({ message: 'Student deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update student (Admin only)
exports.updateStudent = async (req, res) => {
    try {
        const { name, rollNo, course, semester, phone, email } = req.body;
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        if (name)     student.name = name;
        if (rollNo)   student.rollNo = rollNo;
        if (course)   student.course = course;
        if (semester) student.semester = semester;
        if (phone)    student.phone = phone;
        if (email)    student.email = email;
        await student.save();

        if (student.userId) {
            await User.findByIdAndUpdate(student.userId, {
                name: student.name,
                email: student.email
            });
        }
        res.json(student);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Create bulk students (Admin only)
exports.createBulkStudents = async (req, res) => {
    try {
        const { students, course, semester, joinDate } = req.body;

        if (!Array.isArray(students) || students.length === 0) {
            return res.status(400).json({ message: 'No students provided' });
        }

        const results = { success: 0, failed: 0, errors: [], createdStudents: [] };

        for (const studentData of students) {
            try {
                const { name, rollNo, email, phone } = studentData;
                const username = rollNo;

                let userInstance = await User.findOne({ $or: [{ username }, { email }] });
                if (userInstance) {
                    results.failed++;
                    results.errors.push(`${name} (${rollNo}): User or Email already exists`);
                    continue;
                }

                const rollExists = await Student.findOne({ rollNo });
                if (rollExists) {
                    results.failed++;
                    results.errors.push(`${name} (${rollNo}): Roll number already exists`);
                    continue;
                }

                const defaultPassword = generateDefaultPassword();
                userInstance = new User({
                    username,
                    password: defaultPassword,
                    role: 'student',
                    name,
                    email
                });
                await userInstance.save();

                const student = new Student({
                    userId: userInstance._id,
                    name, rollNo, course, semester, email, phone,
                    joinDate: joinDate || new Date(),
                    cgpa: 0.0
                });
                await student.save();
                results.success++;
                results.createdStudents.push({ rollNo, name, defaultPassword });
            } catch (err) {
                results.failed++;
                results.errors.push(`${studentData.name || 'Unknown'}: ${err.message}`);
            }
        }

        res.status(201).json({
            message: `Processed ${students.length} students. ${results.success} succeeded, ${results.failed} failed.`,
            results
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
