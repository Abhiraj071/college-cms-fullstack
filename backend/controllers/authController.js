const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register User (Admin Only usually, or initial setup)
exports.register = async (req, res) => {
    try {
        const { username, email } = req.body;

        // Check if user exists
        let user = await User.findOne({ $or: [{ username }, { email }] });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        user = new User(req.body);
        await user.save();

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        let facultyId = null;
        if (user.role === 'teacher') {
            const Faculty = require('../models/Faculty');
            const fac = await Faculty.findOne({ userId: user._id });
            if (fac) facultyId = fac._id;
        }

        res.status(201).json({
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
                name: user.name,
                email: user.email,
                facultyId: facultyId
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Login User
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        let facultyId = null;
        if (user.role === 'teacher') {
            const Faculty = require('../models/Faculty');
            const fac = await Faculty.findOne({ userId: user._id });
            if (fac) facultyId = fac._id;
        }

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
                name: user.name,
                email: user.email,
                department: user.department,
                facultyId: facultyId
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
