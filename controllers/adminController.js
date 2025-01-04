const bcrypt = require('bcrypt');
const connection = require('../config/database');

class AdminController {
    // Lấy toàn bộ users
    async getAllUsers(req, res) {
        try {
            const [users] = await connection.promise().execute(
                "SELECT id, username, email, role, locked FROM users"
            );
            return res.render('admin', { users });
        } catch (error) {
            console.error('Error fetching users:', error);
            return res.status(500).send('Error fetching users');
        }
    }

    // Lấy user theo id
    async getUser(req, res) {
        try {
            const [users] = await connection.promise().execute(
                "SELECT id, username, email, role, locked FROM users WHERE id = ?",
                [req.params.id]
            );

            if (users.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.json(users[0]);
        } catch (error) {
            console.error('Error fetching user:', error);
            res.status(500).json({ message: 'Error fetching user' });
        }
    }

    // Thêm user mới
    async addUser(req, res) {
        try {
            const { username, email, password, role } = req.body;

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert user
            await connection.promise().execute(
                "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
                [username, email, hashedPassword, role]
            );

            res.json({ message: 'User added successfully' });
        } catch (error) {
            console.error('Error adding user:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ message: 'Username or email already exists' });
            }
            res.status(500).json({ message: 'Error adding user' });
        }
    }

    // Cập nhật user
    async updateUser(req, res) {
        try {
            const { email, role } = req.body;
            const userId = req.params.id;

            // Check if user exists
            const [users] = await connection.promise().execute(
                "SELECT * FROM users WHERE id = ?",
                [userId]
            );

            if (users.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Update user
            await connection.promise().execute(
                "UPDATE users SET email = ?, role = ? WHERE id = ?",
                [email, role, userId]
            );

            res.json({ message: 'User updated successfully' });
        } catch (error) {
            console.error('Error updating user:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ message: 'Username or email already exists' });
            }
            res.status(500).json({ message: 'Error updating user' });
        }
    }

    // Chuyển đổi trạng thái khóa user
    async toggleLock(req, res) {
        try {
            const userId = req.params.id;

            // Trạng thái lock hiện tại
            const [users] = await connection.promise().execute(
                "SELECT locked FROM users WHERE id = ?",
                [userId]
            );

            if (users.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Chặn tự Lock
            if (users[0].id === req.session.userId) {
                return res.status(400).json({ message: 'Cannot lock your own account' });
            }

            // Chuyển đổi trạng thái
            const newLockStatus = users[0].locked ? 0 : 1;
            await connection.promise().execute(
                "UPDATE users SET locked = ? WHERE id = ?",
                [newLockStatus, userId]
            );

            res.json({ message: 'User lock status updated successfully' });
        } catch (error) {
            console.error('Error toggling user lock:', error);
            res.status(500).json({ message: 'Error toggling user lock' });
        }
    }
}

module.exports = new AdminController(); 