const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fileController = require('../controllers/fileController');
const { requireLogin } = require('../middleware/auth');
const connection = require('../config/database');

// xác định multer cho các tệp tải lên
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'D:/FTP/'); 
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); 
    }
});

const upload = multer({ storage: storage });

// File routes
router.get('/download', requireLogin, fileController.showDownloadPage);
router.get('/download/:fileId', requireLogin, fileController.downloadFile);
router.post('/upload', requireLogin, upload.single('file'), fileController.uploadFile);

// Kiểm soát admin dashboard
router.get('/download/:id', async (req, res) => {
    try {
    
        const [files] = await connection.promise().execute(
            'SELECT * FROM files WHERE id = ?',
            [req.params.id]
        );

        if (files.length === 0) {
            return res.status(404).send('File not found');
        }

        const file = files[0];
        
        
        const isAdmin = req.session.role === 'admin';
        
        
        if (isAdmin || req.session.username === file.uploaded_by) {
            const filePath = path.join(__dirname, '../uploads', file.name);
            
        
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