const bcrypt = require('bcrypt');
const crypto = require('crypto');
const connection = require('../config/database');
const emailService = require('../services/emailService');

class AuthController {
    // Phương thức đăng ký tài khoản
    async register(req, res) {
        const { username, email, password } = req.body;
        try {
            // Check existing user
            const [existing] = await connection.promise().execute(
                "SELECT * FROM users WHERE username = ? OR email = ?", 
                [username, email]
            );

            if (existing.length > 0) {
                return res.status(400).send("Username or email already exists!");
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            await connection.promise().execute(
                "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
                [username, email, hashedPassword]
            );

            res.redirect('/login');
        } catch (error) {
            console.error("Registration error:", error);
            res.status(500).send("Registration failed");
        }
    }
    // Phương thức đăng nhập
    async login(req, res) {
        const { username, password } = req.body;
        try {
            const [rows] = await connection.promise().execute(
                "SELECT * FROM users WHERE username = ?",
                [username]
            );

            if (rows.length === 0) {
                return res.render('login', { 
                    error: "Username not found!"
                });
            }

            const user = rows[0];
            
            // Kiểm tra trạng thái lock
            if (user.locked === 1) {
                return res.render('login', {
                    error: "Your account has been locked. Please contact the administrator."
                });
            }

            const isValid = await bcrypt.compare(password, user.password);

            if (!isValid) {
                return res.render('login', { 
                    error: "Wrong password! Please try again."
                });
            }

            // Lưu phiên làm việc
            req.session.userId = user.id;
            req.session.username = user.username;
            req.session.isAdmin = user.is_admin || false;

            
            return res.redirect('/upload');
        } catch (error) {
            console.error("Login error:", error);
            return res.render('login', { 
                error: "An error occurred! Please try again later."
            });
        }
    }
    
    async forgotPassword(req, res) {
        const { email } = req.body;
        try {
            const [rows] = await connection.promise().execute(
                "SELECT * FROM users WHERE email = ?",
                [email]
            );

            if (rows.length === 0) {
                return res.status(404).send('Email not found in system.');
            }

            const token = crypto.randomBytes(20).toString('hex');
            const expireTime = new Date(Date.now() + 3600000);

            await connection.promise().execute(
                "UPDATE users SET reset_token = ?, token_expiration = ? WHERE email = ?",
                [token, expireTime, email]
            );

            const resetLink = `http://localhost:3000/reset-password/${token}`;
            await emailService.sendMail(
                email,
                'noreply.filetransfer@gmail.com',
                'Reset Your Password',
                `Click this link to reset your password: ${resetLink}`
            );

            res.send(`
                <script>
                    alert('Password reset link has been sent to your email.');
                    window.location.href = '/login';
                </script>
            `);
        } catch (error) {
            console.error("Forgot password error:", error);
            res.status(500).send("Failed to process password reset");
        }
    }

    async renderResetPassword(req, res) {
        const { token } = req.params;
        try {
            const [rows] = await connection.promise().execute(
                "SELECT * FROM users WHERE reset_token = ? AND token_expiration > ?",
                [token, new Date()]
            );

            if (rows.length === 0) {
                return res.status(400).send("Invalid or expired token.");
            }

            res.render('reset-password', { token });
        } catch (error) {
            console.error("Reset password render error:", error);
            res.status(500).send("Error processing request");
        }
    }

    async resetPassword(req, res) {
        const { token } = req.params;
        const { password } = req.body;
        try {
            const [rows] = await connection.promise().execute(
                "SELECT * FROM users WHERE reset_token = ? AND token_expiration > ?",
                [token, new Date()]
            );

            if (rows.length === 0) {
                return res.status(400).send("Invalid or expired token.");
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            await connection.promise().execute(
                "UPDATE users SET password = ?, reset_token = NULL, token_expiration = NULL WHERE id = ?",
                [hashedPassword, rows[0].id]
            );

            res.send(`
                <script>
                    alert('Password updated successfully.');
                    window.location.href = '/login';
                </script>
            `);
        } catch (error) {
            console.error("Reset password error:", error);
            res.status(500).send("Failed to reset password");
        }
    }

    logout(req, res) {
        req.session.destroy(err => {
            if (err) {
                return res.status(500).send("Error logging out.");
            }
            res.redirect('/login');
        });
    }

    adminLogout(req, res) {
        req.session.destroy(err => {
            if (err) {
                return res.status(500).send("Error logging out.");
            }
            return res.redirect('/admin/login');
        });
    }

    async adminLogin(req, res) {
        try {
            const { username, password } = req.body;
            const [rows] = await connection.promise().execute(
                "SELECT * FROM users WHERE username = ? AND role = 'admin'",
                [username]
            );

            if (rows.length === 0) {
                return res.render('admin/login', { 
                    error: 'Invalid login information or no access' 
                });
            }

            const user = rows[0];
            const isValid = await bcrypt.compare(password, user.password);
            
            if (!isValid) {
                return res.render('admin/login', { 
                    error: 'Invalid login information or no access' 
                });
            }

            // Set session
            req.session.userId = user.id;
            req.session.username = user.username;
            req.session.role = user.role;
            
            res.redirect('/admin');
        } catch (error) {
            console.error('Admin login error:', error);
            res.render('admin/login', { 
                error: 'An error occurred during login' 
            });
        }
    };
}

module.exports = new AuthController(); 