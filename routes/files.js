const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fileController = require('../controllers/fileController');
const { requireLogin } = require('../middleware/auth');
const connection = require('../config/database');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'D:/FTP/'); // Match your database path
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Keep original filename
    }
});

const upload = multer({ storage: storage });

// File routes
router.get('/download', requireLogin, fileController.showDownloadPage);
router.get('/download/:fileId', requireLogin, fileController.downloadFile);
router.post('/upload', requireLogin, upload.single('file'), fileController.uploadFile);

// Add this route to handle admin downloads
router.get('/download/:id', async (req, res) => {
    try {
        // First get the file info from database
        const [files] = await connection.promise().execute(
            'SELECT * FROM files WHERE id = ?',
            [req.params.id]
        );

        if (files.length === 0) {
            return res.status(404).send('File not found');
        }

        const file = files[0];
        
        // Check if user is admin based on session role
        const isAdmin = req.session.role === 'admin';
        
        // Check if user is admin or the file owner
        if (isAdmin || req.session.username === file.uploaded_by) {
            const filePath = path.join(__dirname, '../uploads', file.name);
            
            // Check if file exists
            const fs = require('fs');
            if (!fs.existsSync(filePath)) {
                console.error('File not found on disk:', filePath);
                return res.status(404).send('File not found on server');
            }

            res.download(filePath, file.name);
        } else {
            console.log('Access denied. Session:', req.session);
            res.status(403).send('Access denied');
        }
    } catch (error) {
        console.error('Error downloading file:', error);
        res.status(500).send('Error downloading file');
    }
});

module.exports = router; 