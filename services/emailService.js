const nodemailer = require('nodemailer');
const emailConfig = require('../config/email');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: emailConfig.auth.user,
        pass: emailConfig.auth.pass
    },
    tls: {
        rejectUnauthorized: false
    }
});

const sendMail = async (to, from, subject, text, attachments = null) => {
    const mailOptions = {
        from: from || emailConfig.defaultFrom,
        to,
        subject,
        text,
        attachments: attachments ? [attachments] : []
    };

    try {
        await transporter.verify(); // Verify connection configuration
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.messageId);
        return true;
    } catch (error) {
        console.error('Email service error:', error);
        if (error.code === 'EAUTH') {
            console.error('Authentication failed. Please check email credentials.');
        }
        throw error;
    }
};

module.exports = { sendMail }; 