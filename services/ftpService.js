const ftp = require("basic-ftp");

class FTPService {
    constructor() {
        this.config = {
            host: process.env.FTP_HOST,
            user: process.env.FTP_USER,
            password: process.env.FTP_PASSWORD,
            secure: false 
        };
    }

    async downloadFile(remotePath, localPath) {
        const client = new ftp.Client();
        try {
            await client.access(this.config);
            console.log("FTP Connected");
            console.log("Downloading:", remotePath, "to", localPath);
            await client.downloadTo(localPath, remotePath);
        } catch (err) {
            console.error("FTP Error:", err);
            throw err;
        } finally {
            client.close();
        }
    }
}

module.exports = new FTPService(); 