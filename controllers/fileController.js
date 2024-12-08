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

            // First check if the recipient exists in the users table
            const [users] = await connection.promise().execute(
                "SELECT username FROM users WHERE email = ?",
                [to]
            );

            if (users.length === 0) {
                // Delete the uploaded file since we can't process it
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

            // Save file information to database using the username instead of email
            const [result] = await connection.promise().execute(
                "INSERT INTO files (name, path, uploaded_by, received_by) VALUES (?, ?, ?, ?)",
                [file.originalname, `D:/FTP/${file.originalname}`, req.session.username, recipientUsername]
            );

            // Send email notification
            try {
                await emailService.sendMail(
                    to,
                    from,
                    `New file shared: ${subject || file.originalname}`,
                    `A new file has been shared with you: ${file.originalname}\n\nYou can download it from your dashboard.`
                );
            } catch (emailError) {
                console.error("Email notification failed:", emailError);
                // Continue even if email fails
            }

            res.send(`
                <script>
                    alert('File uploaded successfully!');
                    window.location.href = '/upload';
                </script>
            `);
        } catch (error) {
            // If there was an error, try to delete the uploaded file
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

    // Show download page with list of files
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

    // Handle file download
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
            
            // Check if user has permission to download
            if (file.received_by !== req.session.username && file.uploaded_by !== req.session.username) {
                return res.status(403).send("Access denied");
            }

            try {
                // Extract just the filename from the full path
                const fileName = path.basename(file.path);
                
                // Create a temporary directory if it doesn't exist
                const tempDir = path.join(__dirname, '..', 'temp');
                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, { recursive: true });
                }

                // Local path for temporary file
                const tempFilePath = path.join(tempDir, fileName);

                // Check if the file exists locally first
                if (fs.existsSync(file.path)) {
                    // If file exists locally, stream it directly
                    const fileStream = fs.createReadStream(file.path);
                    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
                    res.setHeader('Content-Type', 'application/octet-stream');
                    return fileStream.pipe(res);
                }

                // If not local, try FTP download
                await ftpService.downloadFile(fileName, tempFilePath); // Just use filename for FTP

                // Set headers for download
                res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
                res.setHeader('Content-Type', 'application/octet-stream');

                // Stream the file and delete it after sending
                const fileStream = fs.createReadStream(tempFilePath);
                fileStream.pipe(res);
                
                // Clean up temp file after sending
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

    // Add other file methods (download, list, etc.)
}

module.exports = new FileController(); 