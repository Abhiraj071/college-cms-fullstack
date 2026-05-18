const jwt = require('jsonwebtoken');

exports.protect = async (req, res, next) => {
    if (req.user) return next();
    let token;

    if (req.headers.authorization && req.headers.authorization.toLowerCase().startsWith('bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'Authentication token missing. Please log in again.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { ...decoded, _id: decoded.id }; // Normalize _id for consistency
        next();
    } catch (err) {
        console.error('JWT Verify Error:', err.message);
        return res.status(401).json({ message: 'Session expired or invalid. Please log in again.' });
    }
};

exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `User role ${req.user.role} is not authorized to access this route`
            });
        }
        next();
    };
};
