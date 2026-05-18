const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const ALLOWED_EXTENSIONS = /jpeg|jpg|png|gif|pdf|doc|docx|ppt|pptx|txt|xls|xlsx|csv/;
const ALLOWED_MIMETYPES = /image\/(jpeg|png|gif)|application\/(pdf|msword|vnd\.openxmlformats|vnd\.ms-(excel|powerpoint))|text\/(plain|csv)/;

const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        // Use random hex name to prevent path traversal & filename guessing
        const randomName = crypto.randomBytes(16).toString('hex');
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${randomName}${ext}`);
    }
});

function checkFileType(file, cb) {
    const extOk = ALLOWED_EXTENSIONS.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = ALLOWED_MIMETYPES.test(file.mimetype);

    if (extOk && mimeOk) {
        return cb(null, true);
    }
    cb(new Error('Only allowed file types (images, PDFs, Office documents, CSVs) are permitted.'));
}

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (req, file, cb) => checkFileType(file, cb),
});

module.exports = upload;
