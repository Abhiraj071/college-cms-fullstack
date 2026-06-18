const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Run every night at 2:00 AM
cron.schedule('0 2 * * *', async () => {
    console.log('--- Starting Automated Nightly Database Backup ---');
    try {
        const backupDir = path.join(__dirname, '../backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const collections = await mongoose.connection.db.listCollections().toArray();
        const backupData = {};

        for (const col of collections) {
            const name = col.name;
            if (name.startsWith('system.')) continue;
            backupData[name] = await mongoose.connection.db.collection(name).find({}).toArray();
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(backupDir, `backup-${timestamp}.json`);
        
        fs.writeFileSync(backupPath, JSON.stringify({
            success: true,
            timestamp: new Date().toISOString(),
            version: '2.0.0',
            data: backupData
        }));

        console.log(`Backup successfully written to ${backupPath}`);
        
        // Cleanup old backups (keep last 7)
        const files = fs.readdirSync(backupDir)
            .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
            .sort((a, b) => {
                return fs.statSync(path.join(backupDir, b)).mtime.getTime() - 
                       fs.statSync(path.join(backupDir, a)).mtime.getTime();
            });

        if (files.length > 7) {
            for (let i = 7; i < files.length; i++) {
                fs.unlinkSync(path.join(backupDir, files[i]));
                console.log(`Deleted old backup: ${files[i]}`);
            }
        }
    } catch (err) {
        console.error('Automated Backup Failed:', err);
    }
    console.log('--- Nightly Backup Completed ---');
});

console.log('Nightly backup job scheduled.');
