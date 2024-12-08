const ftp = require("basic-ftp");

class FTPService {
    constructor() {
        this.config = {
            host: "192.168.101.237",
            user: "Server",
            password: "123456",
            secure: false // set to true if using FTPS
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