/**
 * Email Service — nodemailer wrapper.
 * Configure via .env. Fails gracefully if not configured.
 */
const nodemailer = require('nodemailer');

let _transporter = null;

function getTransporter() {
    if (_transporter) return _transporter;
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
    _transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT) || 587,
        secure: parseInt(SMTP_PORT) === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    return _transporter;
}

async function sendEmail({ to, subject, html, text }) {
    const t = getTransporter();
    if (!t) {
        console.warn(`[Email] SMTP not configured — skipping "${subject}" → ${to}`);
        return { sent: false, reason: 'SMTP not configured' };
    }
    try {
        const from = process.env.SMTP_FROM || process.env.SMTP_USER;
        await t.sendMail({ from, to, subject, html, text });
        console.log(`[Email] ✅ Sent "${subject}" → ${to}`);
        return { sent: true };
    } catch (err) {
        console.error('[Email] ❌ Failed:', err.message);
        return { sent: false, reason: err.message };
    }
}

function lowAttendanceAlert({ studentName, email, rollNo, course, semester, percentage }) {
    return sendEmail({
        to: email,
        subject: `⚠️ Low Attendance Alert — ${studentName}`,
        html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:2rem;">
            <h2 style="color:#6366F1;">CollegeOS — Attendance Alert</h2>
            <p>Dear <strong>${studentName}</strong>,</p>
            <p>Your attendance has dropped to <strong style="color:#EF4444;">${percentage}</strong> (required: 75%).</p>
            <table style="width:100%;border-collapse:collapse;margin:1rem 0;background:#f8fafc;border-radius:8px;padding:1rem;">
                <tr><td style="padding:5px 10px;color:#666;">Roll No</td><td><strong>${rollNo}</strong></td></tr>
                <tr><td style="padding:5px 10px;color:#666;">Course</td><td><strong>${course}</strong></td></tr>
                <tr><td style="padding:5px 10px;color:#666;">Semester</td><td><strong>${semester}</strong></td></tr>
            </table>
            <p style="color:#555;">Please attend all remaining classes to improve your attendance.</p>
            <p style="font-size:0.8rem;color:#999;margin-top:2rem;">Automated message from CollegeOS. Do not reply.</p>
        </div>`,
        text: `Attendance Alert: ${studentName} — ${percentage} (below 75%). Course: ${course}, Roll: ${rollNo}.`,
    });
}

function welcomeUser({ name, username, email, role, defaultPassword }) {
    return sendEmail({
        to: email,
        subject: `Welcome to CollegeOS — Your Account is Ready`,
        html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:2rem;">
            <h2 style="color:#6366F1;">Welcome to CollegeOS!</h2>
            <p>Hello <strong>${name}</strong>, your <em>${role}</em> account is ready.</p>
            <div style="background:#f8fafc;padding:1rem;border-radius:8px;border:1px solid #e2e8f0;margin:1rem 0;">
                <p style="margin:0 0 6px;"><strong>Username:</strong> ${username}</p>
                <p style="margin:0;"><strong>Temp Password:</strong> <code style="background:#fff;padding:2px 6px;border-radius:4px;border:1px solid #ddd;">${defaultPassword}</code></p>
            </div>
            <p style="color:#EF4444;font-size:0.85rem;">⚠️ Change your password on first login.</p>
            <p style="font-size:0.8rem;color:#999;margin-top:2rem;">Automated message from CollegeOS. Do not reply.</p>
        </div>`,
        text: `Welcome ${name}! Username: ${username} | Temp Password: ${defaultPassword}. Change your password on first login.`,
    });
}

module.exports = { sendEmail, lowAttendanceAlert, welcomeUser };
