/**
 * Grading Service
 * Handles rules around grace marks, pass criteria, and aggregate grading.
 */

/**
 * Silently applies Grace Marks (max 5 marks across max 2 subjects)
 * Updates `isPassed` to true if the margin needed is within the grace balance.
 * Modifies the subjects array in place.
 * 
 * @param {Array} subjects - Array of subject objects that must have `maxTotal` and `total` (or `marksObtained`) and `isPassed`.
 */
exports.applyGraceMarks = (subjects, passFraction = 0.4) => {
    let graceBalance = 5;
    let graceSubjectsCount = 0;
    
    const failingSubjects = subjects.filter(s => !s.isPassed);
    
    failingSubjects.forEach(s => {
        const passing = s.maxTotal * passFraction;
        const obtained = s.total !== undefined ? s.total : s.marksObtained;
        s.marginNeeded = passing - obtained;
    });
    
    // Sort by smallest margin needed first (easiest to pass)
    failingSubjects.sort((a, b) => a.marginNeeded - b.marginNeeded);
    
    for (const sub of failingSubjects) {
        if (graceBalance > 0 && graceSubjectsCount < 2) {
            if (sub.marginNeeded > 0 && sub.marginNeeded <= graceBalance) {
                sub.isPassed = true;
                graceBalance -= sub.marginNeeded;
                graceSubjectsCount++;
            }
        }
    }
};

/**
 * Calculates a letter grade based on percentage and a dynamic grading policy
 * 
 * @param {Number} percentage 
 * @param {Object} gradingPolicy 
 * @returns {String} letter grade
 */
exports.getGradeForPercentage = (percentage, gradingPolicy = null) => {
    const grades = gradingPolicy && gradingPolicy.grades && gradingPolicy.grades.length > 0
        ? gradingPolicy.grades
        : [
            { grade: 'A+', minPct: 90 },
            { grade: 'A', minPct: 80 },
            { grade: 'B', minPct: 70 },
            { grade: 'C', minPct: 60 },
            { grade: 'D', minPct: 50 }
          ];

    // Sort descending to check higher scores first
    const sortedGrades = [...grades].sort((a, b) => b.minPct - a.minPct);

    for (const g of sortedGrades) {
        if (percentage >= g.minPct) {
            return g.grade;
        }
    }
    return 'F';
};
