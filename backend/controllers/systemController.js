const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

exports.exportBackup = async (req, res) => {
    try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        const backupData = {};

        for (const col of collections) {
            const collectionName = col.name;
            // Skip system collections if any
            if (collectionName.startsWith('system.')) continue;

            const data = await mongoose.connection.db.collection(collectionName).find({}).toArray();
            backupData[collectionName] = data;
        }

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            version: '2.0.0',
            data: backupData
        });
    } catch (err) {
        console.error('Export Error:', err);
        res.status(500).json({ message: 'Failed to generate backup' });
    }
};

exports.importBackup = async (req, res) => {
    try {
        const { backupData } = req.body;
        if (!backupData) {
            return res.status(400).json({ message: 'No backup data provided' });
        }

        // 1. Clear current database
        const collections = await mongoose.connection.db.listCollections().toArray();
        for (const col of collections) {
            if (col.name.startsWith('system.')) continue;
            await mongoose.connection.db.collection(col.name).deleteMany({});
        }

        // Helper function to recursively convert valid hex strings to ObjectIDs
        const convertToObjectId = (obj) => {
            if (obj === null || typeof obj !== 'object') {
                // If it's a string and looks like a 24-char hex ObjectId, try converting it
                if (typeof obj === 'string' && /^[0-9a-fA-F]{24}$/.test(obj)) {
                    return new mongoose.Types.ObjectId(obj);
                }
                return obj;
            }

            if (Array.isArray(obj)) {
                return obj.map(item => convertToObjectId(item));
            }

            const newObj = {};
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    // Dates might also need conversion if they came back as strings
                    if (typeof obj[key] === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(obj[key])) {
                        newObj[key] = new Date(obj[key]);
                    } else if (key === '_id' && typeof obj[key] === 'string') {
                        // Always convert _id
                        newObj[key] = new mongoose.Types.ObjectId(obj[key]);
                    } else {
                        newObj[key] = convertToObjectId(obj[key]);
                    }
                }
            }
            return newObj;
        };

        // 2. Import data
        for (const [collectionName, documents] of Object.entries(backupData)) {
            if (documents.length > 0) {
                const processedDocs = documents.map(doc => convertToObjectId(doc));
                await mongoose.connection.db.collection(collectionName).insertMany(processedDocs);
            }
        }

        res.json({ success: true, message: 'System restored successfully' });
    } catch (err) {
        console.error('Import Error:', err);
        res.status(500).json({ message: 'Failed to restore backup: ' + err.message });
    }
};


exports.getSystemStats = async (req, res) => {
    try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        let totalRecords = 0;
        const collectionStats = [];

        for (const col of collections) {
            if (col.name.startsWith('system.')) continue;
            const count = await mongoose.connection.db.collection(col.name).countDocuments();
            totalRecords += count;
            collectionStats.push({ name: col.name, count });
        }

        res.json({
            totalRecords,
            collections: collectionStats,
            dbName: mongoose.connection.name
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch stats' });
    }
};

exports.factoryReset = async (req, res) => {
    try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        let deletedCounts = {};

        for (const col of collections) {
            const collectionName = col.name;
            if (collectionName.startsWith('system.')) continue;

            if (collectionName === 'users') {
                // Delete everything except admin users
                const result = await mongoose.connection.db.collection(collectionName).deleteMany({ role: { $ne: 'admin' } });
                deletedCounts[collectionName] = result.deletedCount;
            } else {
                // Delete all documents in other collections
                const result = await mongoose.connection.db.collection(collectionName).deleteMany({});
                deletedCounts[collectionName] = result.deletedCount;
            }
        }

        res.json({
            success: true,
            message: 'Factory reset completed successfully. All non-admin data has been removed.',
            deletedCounts
        });
    } catch (err) {
        console.error('Factory Reset Error:', err);
        res.status(500).json({ success: false, message: 'Failed to perform factory reset', error: err.message });
    }
};
