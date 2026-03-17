const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Faculty = require('../models/Faculty'); // moved to top-level (not inside hot path)

// Register User – should only be called by admin after initial setup
exports.register = async (req, res) => {
    try {
        const { username, email } = req.body;

        if (!username || !email || !req.body.password || !req.body.name || !req.body.role) {
            return res.status(400).json({ message: 'username, email, password, name and role are required' });
        }

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
                facultyId,
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

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        const user = await User.findOne({ username });
        if (!user) {
            // Use same message for missing user and wrong password to prevent user enumeration
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        let facultyId = null;
        if (user.role === 'teacher') {
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
                facultyId,
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
