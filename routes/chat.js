const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { requireLogin } = require('../middleware/auth');

router.get('/', requireLogin, chatController.getConversations);
router.get('/messages/:userId/:otherId', requireLogin, chatController.getMessages);
router.post('/message', requireLogin, chatController.saveMessage);

module.exports = router; 