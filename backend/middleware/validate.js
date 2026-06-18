const { z } = require('zod');

/**
 * Express middleware to validate request bodies against a Zod schema.
 */
const validate = (schema) => (req, res, next) => {
    try {
        req.body = schema.parse(req.body);
        next();
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: err.errors
            });
        }
        next(err);
    }
};

module.exports = validate;
