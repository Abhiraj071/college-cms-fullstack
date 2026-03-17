const Faculty = require('../models/Faculty');
const User = require('../models/User');
const crypto = require('crypto');

function generateDefaultPassword() {
    return crypto.randomBytes(10).toString('base64url');
}

// Get all faculty
exports.getAllFaculty = async (req, res) => {
    try {
        const faculty = await Faculty.find()
            .populate('userId', 'username email')
            .lean();
        res.json(faculty);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Create faculty (Admin only)
exports.createFaculty = async (req, res) => {
    try {
        const { username, email, name, department, designation, phone, joinDate } = req.body;

        if (!username || !email || !name || !department || !designation) {
            return res.status(400).json({ message: 'username, email, name, department and designation are required' });
        }

        let userInstance = await User.findOne({ $or: [{ username }, { email }] });
        if (userInstance) {
            return res.status(400).json({ message: 'Username or Email already exists' });
        }

        const defaultPassword = generateDefaultPassword();
        userInstance = new User({
            username,
            password: defaultPassword,
            role: 'teacher',
            name,
            email
        });
        await userInstance.save();

        const faculty = new Faculty({
            userId: userInstance._id,
            name, email, phone, department, designation,
            qualification: req.body.qualification,
            joinDate
        });
        await faculty.save();

        res.status(201).json({ ...faculty.toObject(), defaultPassword });
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
        await User.findByIdAndDelete(faculty.userId);
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

        if (name)        faculty.name = name;
        if (email)       faculty.email = email;
        if (department)  faculty.department = department;
        if (designation) faculty.designation = designation;
        if (req.body.qualification) faculty.qualification = req.body.qualification;
        if (phone)       faculty.phone = phone;
        await faculty.save();

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

        const results = { success: 0, failed: 0, errors: [], createdFaculty: [] };

        for (const facultyData of facultyMembers) {
            try {
                const { name, email, phone } = facultyData;
                const username = name.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

                let userInstance = await User.findOne({ $or: [{ username }, { email }] });
                if (userInstance) {
                    results.failed++;
                    results.errors.push(`${name}: Username ${username} or Email already exists`);
                    continue;
                }

                const defaultPassword = generateDefaultPassword();
                userInstance = new User({
                    username,
                    password: defaultPassword,
                    role: 'teacher',
                    name,
                    email
                });
                await userInstance.save();

                const faculty = new Faculty({
                    userId: userInstance._id,
                    name, email, phone,
                    department: facultyData.department || department,
                    designation: facultyData.designation || designation,
                    qualification: facultyData.qualification || qualification,
                    joinDate: joinDate || new Date()
                });
                await faculty.save();
                results.success++;
                results.createdFaculty.push({ username, name, defaultPassword });
            } catch (err) {
                results.failed++;
                results.errors.push(`${facultyData.name || 'Unknown'}: ${err.message}`);
            }
        }

        res.status(201).json({
            message: `Processed ${facultyMembers.length} faculty. ${results.success} succeeded, ${results.failed} failed.`,
            results
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
