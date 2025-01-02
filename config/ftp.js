module.exports = {
    host: process.env.FTP_HOST,
    user: process.env.FTP_USER,
    password: process.env.FTP_PASS,
    secure: true,
    secureOptions: { 
        rejectUnauthorized: false 
    }
}; 