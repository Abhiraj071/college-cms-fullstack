/**
 * Automatic Database Backup Job
 * Runs daily at 2:00 AM using node-cron.
 * Keeps the last 7 backups.
 */
const cron     = require('node-cron');
const mongoose = require('mongoose');
const fs       = require('fs');
const path     = require('path');

const BACKUP_DIR  = path.join(__dirname, '../backups');
const MAX_BACKUPS = 7;

async function runBackup() {
    try {
        if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

        const collections = await mongoose.connection.db.listCollections().toArray();
        const snapshot = {};
        for (const col of collections) {
            if (col.name.startsWith('system.')) continue;
            snapshot[col.name] = await mongoose.connection.db.collection(col.name).find({}).toArray();
        }

        const ts       = new Date().toISOString().replace(/[:.]/g, '-');
        const filepath = path.join(BACKUP_DIR, `backup-${ts}.json`);
        fs.writeFileSync(filepath, JSON.stringify({ timestamp: new Date().toISOString(), data: snapshot }), 'utf8');
        console.log(`✅ [Backup] Saved → ${path.basename(filepath)}`);

        // Prune old backups
        const files = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
            .sort();
        while (files.length > MAX_BACKUPS) {
            const old = files.shift();
            fs.unlinkSync(path.join(BACKUP_DIR, old));
            console.log(`🗑️  [Backup] Removed old backup: ${old}`);
        }
    } catch (err) {
        console.error('❌ [Backup] Failed:', err.message);
    }
}

function startBackupJob() {
    cron.schedule('0 2 * * *', runBackup, { timezone: 'Asia/Kolkata' });
    console.log('📦 [Backup] Scheduled daily at 02:00 AM IST');
}

module.exports = { startBackupJob, runBackup };
