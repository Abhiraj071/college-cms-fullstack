const { z } = require('zod');

exports.loginSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters')
});

exports.registerStudentSchema = z.object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email(),
    password: z.string().min(6),
    course: z.string().min(1),
    semester: z.number().int().min(1).max(8)
});
