const academicService = require('../services/academicService');

// We can mock mongoose models since they are tested in integration tests
jest.mock('../models/Student', () => ({
    find: jest.fn().mockResolvedValue([])
}));
jest.mock('../models/Course', () => ({
    find: jest.fn().mockResolvedValue([])
}));
jest.mock('../models/Alumni', () => ({
    create: jest.fn()
}));
jest.mock('../models/Mark', () => ({
    find: jest.fn().mockResolvedValue([])
}));

describe('Academic Service - Promotion Logic', () => {
    it('should run promotion process without crashing (mocked)', async () => {
        await expect(academicService.promoteStudents()).resolves.not.toThrow();
    });
});
