const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAdmin } = require('../middleware/auth');
const connection = require('../config/database');

// Admin login page
router.get('/login', (req, res) => {
    res.render('admin/login', { error: null });
});

// Admin login action
router.post('/login', authController.adminLogin);

// Admin dashboard (protected)
router.get('/', requireAdmin, (req, res) => {
    res.render('admin/dashboard');
});

// Users management
router.get('/users', requireAdmin, async (req, res) => {
    try {
        const [users] = await connection.promise().execute(
            "SELECT id, username, email, role, locked FROM users"
        );
        console.log('Users data:', users);
        res.render('admin/users', { users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send('Error loading users');
    }
});

// Update user information
router.put('/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const { email, role } = req.body;

        // Validate inputs
        if (!email || !role) {
            return res.status(400).json({ error: 'Email and role are required' });
        }

        // Update user in database
        await connection.promise().execute(
            'UPDATE users SET email = ?, role = ? WHERE id = ?',
            [email, role, userId]
        );

        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// Toggle user lock status
router.post('/users/:id/toggle-lock', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        // First get current lock status
        const [rows] = await connection.promise().execute(
            'SELECT locked FROM users WHERE id = ?',
            [id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const newStatus = rows[0].locked === 0 ? 1 : 0;
        
        await connection.promise().execute(
            'UPDATE users SET locked = ? WHERE id = ?',
            [newStatus, id]
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error toggling lock status:', error);
        res.status(500).json({ error: 'Failed to toggle lock status' });
    }
});

// Files management
router.get('/files', requireAdmin, async (req, res) => {
    try {
        const [files] = await connection.promise().execute(`
            SELECT 
                files.id,
                files.name,
                files.uploaded_by,
                files.created_at,
                users.email as user_email
            FROM files 
            JOIN users ON files.uploaded_by = users.username
            ORDER BY files.created_at DESC
        `);
        
        res.render('admin/files', { files });
    } catch (error) {
        console.error('Error fetching files:', error);
        res.status(500).send('Error loading files');
    }
});

// Delete file
router.delete('/files/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await connection.promise().execute(
            'DELETE FROM files WHERE id = ?',
            [id]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

module.exports = router; 