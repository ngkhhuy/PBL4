const connection = require('../config/database');
const ftpService = require('../services/ftpService');
const emailService = require('../services/emailService');
const path = require('path');
const fs = require('fs');

class FileController {
    async uploadFile(req, res) {
        try {
            if (!req.file) {
                return res.status(400).send("No file uploaded");
            }

            const { to, from, subject } = req.body;
            const file = req.file;

            // Kiểm tra người nhận có tồn tại không
            const [users] = await connection.promise().execute(
                "SELECT username FROM users WHERE email = ?",
                [to]
            );

            if (users.length === 0) {
                // Xoá upload file nếu  hệ thống lỗi không xử lý tiếp được
                fs.unlink(file.path, (err) => {
                    if (err) console.error("Error deleting file:", err);
                });
                
                return res.send(`
                    <script>
                        alert('Recipient email not found in our system. Please check the email address.');
                        window.location.href = '/upload';
                    </script>
                `);
            }

            const recipientUsername = users[0].username;

            // Lưu thông tin file vào DB
            const [result] = await connection.promise().execute(
                "INSERT INTO files (name, path, uploaded_by, received_by) VALUES (?, ?, ?, ?)",
                [file.originalname, `D:/FTP/${file.originalname}`, req.session.username, recipientUsername]
            );

            // Gửi thông báo qua mail
            try {
                await emailService.sendMail(
                    to,
                    from,
                    `New file shared: ${subject || file.originalname}`,
                    `A new file has been shared with you: ${file.originalname}\n\nYou can download it from your dashboard.`
                );
            } catch (emailError) {
                console.error("Email notification failed:", emailError);
               
            }

            res.send(`
                <script>
                    alert('File uploaded successfully!');
                    window.location.href = '/upload';
                </script>
            `);
        } catch (error) {
            if (req.file) {
                fs.unlink(req.file.path, (err) => {
                    if (err) console.error("Error deleting file:", err);
                });
            }

            console.error("Upload error:", error);
            res.status(500).send(`
                <script>
                    alert('Upload failed: Please make sure the recipient is a registered user.');
                    window.location.href = '/upload';
                </script>
            `);
        }
    }

    async getSentFiles(req, res) {
        try {
            const [files] = await connection.promise().execute(
                "SELECT * FROM files WHERE uploaded_by = ? ORDER BY created_at DESC",
                [req.session.username]
            );

            res.render('sent-files', { files });
        } catch (error) {
            console.error("Error fetching sent files:", error);
            res.render('sent-files', { 
                files: [],
                error: "Error loading files"
            });
        }
    }

   
    async showDownloadPage(req, res) {
        try {
            const [files] = await connection.promise().execute(
                "SELECT id, name, path, created_at FROM files WHERE received_by = ?",
                [req.session.username]
            );

            res.render('download', { files });
        } catch (error) {
            console.error("Error fetching files:", error);
            res.render('download', { 
                files: [],
                error: "Error loading files"
            });
        }
    }


    async downloadFile(req, res) {
        try {
            const fileId = req.params.fileId;
            const [files] = await connection.promise().execute(
                "SELECT * FROM files WHERE id = ?",
                [fileId]
            );

            if (files.length === 0) {
                return res.status(404).send("File not found in database");
            }

            const file = files[0];
            
            // Kiểm tra người dùng có quyền download không
            if (file.received_by !== req.session.username && file.uploaded_by !== req.session.username) {
                return res.status(403).send("Access denied");
            }

            try {
               
                const fileName = path.basename(file.path);
                
                // Tạo một đường dẫn tạm hỗ trợ tải
                const tempDir = path.join(__dirname, '..', 'temp');
                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, { recursive: true });
                }

                
                const tempFilePath = path.join(tempDir, fileName);

                // Kiểm tra file đã tồn tại ở local chưa
                if (fs.existsSync(file.path)) {
                    const fileStream = fs.createReadStream(file.path);
                    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
                    res.setHeader('Content-Type', 'application/octet-stream');
                    return fileStream.pipe(res);
                }

               
                await ftpService.downloadFile(fileName, tempFilePath); 

                // Thiết lập header cho việc download
                res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
                res.setHeader('Content-Type', 'application/octet-stream');

               
                const fileStream = fs.createReadStream(tempFilePath);
                fileStream.pipe(res);
                
                // Dọn file tạm sau khi gửi
                fileStream.on('end', () => {
                    fs.unlink(tempFilePath, (err) => {
                        if (err) console.error('Error deleting temp file:', err);
                    });
                });
            } catch (ftpError) {
                console.error("FTP download error:", ftpError);
                return res.status(500).send(`Error downloading file from server: ${ftpError}`);
            }

        } catch (error) {
            console.error("Download error:", error);
            res.status(500).send("Error processing download request");
        }
    }

}

module.exports = new FileController(); 