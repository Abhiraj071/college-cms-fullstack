const Setting = require('../models/Setting');

/**
 * Utility to get current semester dates from settings
 * @returns {Promise<{start: Date, end: Date} | null>}
 */
exports.getSemesterDates = async () => {
    try {
        const semesterSetting = await Setting.findOne({ key: 'semester_dates' });
        if (semesterSetting && semesterSetting.value) {
            return {
                start: new Date(semesterSetting.value.start),
                end: new Date(semesterSetting.value.end)
            };
        }
        return null;
    } catch (err) {
        console.error('Error fetching semester dates:', err);
        return null;
    }
};
