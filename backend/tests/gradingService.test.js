const gradingService = require('../services/gradingService');

describe('Grading Service - Grace Marks', () => {
    it('should silently apply up to 5 grace marks across a maximum of 2 subjects', () => {
        const subjects = [
            { subjectId: 'S1', maxTotal: 100, total: 38, isPassed: false }, // Needs 2
            { subjectId: 'S2', maxTotal: 100, total: 37, isPassed: false }, // Needs 3
            { subjectId: 'S3', maxTotal: 100, total: 10, isPassed: false }, // Needs 30
        ];
        
        gradingService.applyGraceMarks(subjects);
        
        // S1 and S2 should now be marked as passed because their margins are 2 and 3 (Total = 5)
        const s1 = subjects.find(s => s.subjectId === 'S1');
        const s2 = subjects.find(s => s.subjectId === 'S2');
        const s3 = subjects.find(s => s.subjectId === 'S3');

        expect(s1.isPassed).toBe(true);
        expect(s2.isPassed).toBe(true);
        expect(s3.isPassed).toBe(false);

        // Totals must remain unchanged
        expect(s1.total).toBe(38);
        expect(s2.total).toBe(37);
    });

    it('should not apply grace marks if more than 5 marks are needed', () => {
        const subjects = [
            { subjectId: 'S1', maxTotal: 100, total: 34, isPassed: false } // Needs 6
        ];
        
        gradingService.applyGraceMarks(subjects);
        
        expect(subjects[0].isPassed).toBe(false);
    });

    it('should limit grace marks to a maximum of 2 subjects', () => {
        const subjects = [
            { subjectId: 'S1', maxTotal: 100, total: 39, isPassed: false }, // Needs 1
            { subjectId: 'S2', maxTotal: 100, total: 39, isPassed: false }, // Needs 1
            { subjectId: 'S3', maxTotal: 100, total: 39, isPassed: false }, // Needs 1
        ];
        
        gradingService.applyGraceMarks(subjects);
        
        const passedCount = subjects.filter(s => s.isPassed).length;
        expect(passedCount).toBe(2);
    });
});
