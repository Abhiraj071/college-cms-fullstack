const Student = require('../models/Student');
const User = require('../models/User');

// Get all students
exports.getStudents = async (req, res) => {
    try {
        const { userId } = req.query;
        const query = userId ? { userId } : {};
        const students = await Student.find(query).populate('userId', 'username email');
        res.json(students);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Create student (Admin only)
exports.createStudent = async (req, res) => {
    try {
        const { username, email, name, rollNo, course, semester, phone, joinDate } = req.body;

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

        // 3. Create User Account
        userInstance = new User({
            username,
            password: 'password123', // Default password
            role: 'student',
            name,
            email
        });
        await userInstance.save();

        // 4. Create Student Record
        const student = new Student({
            userId: userInstance._id,
            name,
            rollNo,
            course,
            semester,
            email,
            phone,
            joinDate,
            cgpa: 0.0
        });
        await student.save();

        res.status(201).json(student);
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

        // Delete associated user account
        await User.findByIdAndDelete(student.userId);
        // Delete student record
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

        // Update Student Record
        student.name = name || student.name;
        student.rollNo = rollNo || student.rollNo;
        student.course = course || student.course;
        student.semester = semester || student.semester;
        student.phone = phone || student.phone;
        student.email = email || student.email;
        await student.save();

        // Update Associated User
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

        const results = {
            success: 0,
            failed: 0,
            errors: []
        };

        for (const studentData of students) {
            try {
                const { name, rollNo, email, phone } = studentData;
                const username = rollNo; // Roll number is the username

                // 1. Check if user already exists
                let userInstance = await User.findOne({ $or: [{ username }, { email }] });
                if (userInstance) {
                    results.failed++;
                    results.errors.push(`Student ${name} (${rollNo}): User or Email already exists`);
                    continue;
                }

                // 2. Check if roll number exists
                const rollExists = await Student.findOne({ rollNo });
                if (rollExists) {
                    results.failed++;
                    results.errors.push(`Student ${name} (${rollNo}): Roll number already exists`);
                    continue;
                }

                // 3. Create User Account
                userInstance = new User({
                    username,
                    password: 'password123', // Default password
                    role: 'student',
                    name,
                    email
                });
                await userInstance.save();

                // 4. Create Student Record
                const student = new Student({
                    userId: userInstance._id,
                    name,
                    rollNo,
                    course,
                    semester,
                    email,
                    phone,
                    joinDate: joinDate || new Date(),
                    cgpa: 0.0
                });
                await student.save();
                results.success++;
            } catch (err) {
                results.failed++;
                results.errors.push(`Student ${studentData.name || 'Unknown'}: ${err.message}`);
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
