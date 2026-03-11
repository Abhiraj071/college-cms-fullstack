const Faculty = require('../models/Faculty');
const User = require('../models/User');

// Get all faculty
exports.getAllFaculty = async (req, res) => {
    try {
        const faculty = await Faculty.find().populate('userId', 'username email');
        res.json(faculty);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Create faculty (Admin only)
exports.createFaculty = async (req, res) => {
    try {
        const { username, email, name, department, designation, phone, joinDate } = req.body;

        // Check if user exists
        let userInstance = await User.findOne({ $or: [{ username }, { email }] });
        if (userInstance) {
            return res.status(400).json({ message: 'Username or Email already exists' });
        }

        // Create User
        userInstance = new User({
            username,
            password: 'faculty123', // Default password
            role: 'teacher',
            name,
            email
        });
        await userInstance.save();

        // Create Faculty Record
        const faculty = new Faculty({
            userId: userInstance._id,
            name,
            email,
            phone,
            department,
            designation,
            qualification: req.body.qualification,
            joinDate
        });
        await faculty.save();

        res.status(201).json(faculty);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Delete faculty (Admin only)
exports.deleteFaculty = async (req, res) => {
    try {
        const faculty = await Faculty.findById(req.params.id);
        if (!faculty) {
            return res.status(404).json({ message: 'Faculty not found' });
        }

        // Delete associated user
        await User.findByIdAndDelete(faculty.userId);
        // Delete faculty record
        await Faculty.findByIdAndDelete(req.params.id);

        res.json({ message: 'Faculty member removed successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
// Update faculty (Admin only)
exports.updateFaculty = async (req, res) => {
    try {
        const { name, email, department, designation, phone } = req.body;

        const faculty = await Faculty.findById(req.params.id);
        if (!faculty) {
            return res.status(404).json({ message: 'Faculty not found' });
        }

        // Update Faculty Record
        faculty.name = name || faculty.name;
        faculty.email = email || faculty.email;
        faculty.department = department || faculty.department;
        faculty.designation = designation || faculty.designation;
        faculty.qualification = req.body.qualification || faculty.qualification;
        faculty.phone = phone || faculty.phone;
        await faculty.save();

        // Update Associated User
        if (faculty.userId) {
            await User.findByIdAndUpdate(faculty.userId, {
                name: faculty.name,
                email: faculty.email
            });
        }

        res.json(faculty);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Create bulk faculty (Admin only)
exports.createBulkFaculty = async (req, res) => {
    try {
        const { facultyMembers, department, designation, qualification, joinDate } = req.body;

        if (!Array.isArray(facultyMembers) || facultyMembers.length === 0) {
            return res.status(400).json({ message: 'No faculty members provided' });
        }

        const results = {
            success: 0,
            failed: 0,
            errors: []
        };

        for (const facultyData of facultyMembers) {
            try {
                const { name, email, phone } = facultyData;
                // Generate username from name: "John Doe" -> "john_doe"
                const username = name.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

                // 1. Check if user already exists
                let userInstance = await User.findOne({ $or: [{ username }, { email }] });
                if (userInstance) {
                    results.failed++;
                    results.errors.push(`Faculty ${name} (${email}): Username ${username} or Email already exists`);
                    continue;
                }

                // 2. Create User Account
                userInstance = new User({
                    username,
                    password: 'faculty123', // Default password
                    role: 'teacher',
                    name,
                    email
                });
                await userInstance.save();

                // 3. Create Faculty Record
                const faculty = new Faculty({
                    userId: userInstance._id,
                    name,
                    email,
                    phone,
                    department: facultyData.department || department,
                    designation: facultyData.designation || designation,
                    qualification: facultyData.qualification || qualification,
                    joinDate: joinDate || new Date()
                });
                await faculty.save();
                results.success++;
            } catch (err) {
                results.failed++;
                results.errors.push(`Faculty ${facultyData.name || 'Unknown'}: ${err.message}`);
            }
        }

        res.status(201).json({
            message: `Processed ${facultyMembers.length} faculty members. ${results.success} succeeded, ${results.failed} failed.`,
            results
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
