const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireLogin, requireAdmin } = require('../middleware/auth');

// Render routes
router.get('/register', (req, res) => res.render('register'));
router.get('/login', (req, res) => {
    res.render('login', { error: null });
});
router.get('/forgot-password', (req, res) => res.render('forgot-password'));
router.get('/reset-password/:token', authController.renderResetPassword);

// Admin routes
router.get('/admin/login', (req, res) => {
    res.render('admin/login', { error: null });
});
router.post('/admin/login', authController.adminLogin);
router.get('/admin', requireLogin, requireAdmin, (req, res) => {
    res.render('admin/dashboard');
});
router.get('/admin/logout', authController.adminLogout);

// Action routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);
router.get('/logout', authController.logout);

module.exports = router; 