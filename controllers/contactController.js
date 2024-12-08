const emailService = require('../services/emailService');

class ContactController {
    async submitHelp(req, res) {
        const { name, email, subject, message } = req.body;

        try {
            // Gửi email đến admin
            await emailService.sendMail(
                'khanhhuychc@gmail.com', // admin email
                email,
                `Support Request: ${subject}`,
                `From: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
            );

            // Gửi email xác nhận đến user
            await emailService.sendMail(
                email,
                'noreply.filetransfer@gmail.com',
                'We received your support request',
                `Dear ${name},\n\nThank you for contacting us. We have received your support request and will get back to you shortly.\n\nBest regards,\nSupport Team`
            );

            res.send(`
                <script>
                    alert('Your message has been sent successfully!');
                    window.location.href = '/help';
                </script>
            `);
        } catch (error) {
            console.error('Error sending help request:', error);
            res.send(`
                <script>
                    alert('Failed to send message. Please try again later.');
                    window.location.href = '/help';
                </script>
            `);
        }
    }
}

module.exports = new ContactController(); 