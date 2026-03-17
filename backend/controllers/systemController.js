const mongoose = require('mongoose');

exports.exportBackup = async (req, res) => {
    try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        const backupData = {};

        for (const col of collections) {
            const name = col.name;
            if (name.startsWith('system.')) continue;
            backupData[name] = await mongoose.connection.db.collection(name).find({}).toArray();
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
        let backupData = req.body.backupData;
        if (!backupData || typeof backupData !== 'object') {
            return res.status(400).json({ message: 'No valid backup data provided' });
        }

        // Handle exports from the app's own /api/system/export endpoint,
        // which wraps collections under a { success, timestamp, version, data: {...} } envelope
        if (backupData.data && typeof backupData.data === 'object' && !Array.isArray(backupData.data)) {
            backupData = backupData.data;
        }

        // Clear current database (non-system collections)
        const existing = await mongoose.connection.db.listCollections().toArray();
        for (const col of existing) {
            if (col.name.startsWith('system.')) continue;
            await mongoose.connection.db.collection(col.name).deleteMany({});
        }

        const convertToObjectId = (obj) => {
            if (obj === null || typeof obj !== 'object') {
                if (typeof obj === 'string' && /^[0-9a-fA-F]{24}$/.test(obj)) {
                    try { return new mongoose.Types.ObjectId(obj); } catch { return obj; }
                }
                return obj;
            }
            if (Array.isArray(obj)) return obj.map(convertToObjectId);

            const out = {};
            for (const [key, val] of Object.entries(obj)) {
                if (key === '_id' && typeof val === 'string') {
                    try { out[key] = new mongoose.Types.ObjectId(val); } catch { out[key] = val; }
                } else if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(val)) {
                    out[key] = new Date(val);
                } else {
                    out[key] = convertToObjectId(val);
                }
            }
            return out;
        };

        let restoredCollections = 0;
        let restoredDocuments = 0;

        for (const [collectionName, documents] of Object.entries(backupData)) {
            if (!Array.isArray(documents) || documents.length === 0) continue;
            const processed = documents.map(convertToObjectId);
            await mongoose.connection.db.collection(collectionName).insertMany(processed, { ordered: false });
            restoredCollections++;
            restoredDocuments += processed.length;
        }

        res.json({
            success: true,
            message: `System restored successfully. ${restoredCollections} collections, ${restoredDocuments} documents imported.`
        });
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

        // Run all countDocuments in parallel for speed
        await Promise.all(
            collections
                .filter(col => !col.name.startsWith('system.'))
                .map(async col => {
                    const count = await mongoose.connection.db.collection(col.name).countDocuments();
                    totalRecords += count;
                    collectionStats.push({ name: col.name, count });
                })
        );

        res.json({ totalRecords, collections: collectionStats, dbName: mongoose.connection.name });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch stats' });
    }
};

exports.factoryReset = async (req, res) => {
    try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        const deletedCounts = {};

        for (const col of collections) {
            const name = col.name;
            if (name.startsWith('system.')) continue;
            const filter = name === 'users' ? { role: { $ne: 'admin' } } : {};
            const result = await mongoose.connection.db.collection(name).deleteMany(filter);
            deletedCounts[name] = result.deletedCount;
        }

        res.json({
            success: true,
            message: 'Factory reset completed. All non-admin data removed.',
            deletedCounts
        });
    } catch (err) {
        console.error('Factory Reset Error:', err);
        res.status(500).json({ success: false, message: 'Failed to perform factory reset' });
    }
};
