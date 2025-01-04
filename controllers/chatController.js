const connection = require('../config/database');

class ChatController {
    async getConversations(req, res) {
        try {
            const userId = req.session.userId;
            const [conversations] = await connection.promise().execute(
                `SELECT 
                    u.id, u.username, u.email,
                    (SELECT COUNT(*) FROM messages 
                     WHERE receiver_id = ? AND sender_id = u.id AND is_read = FALSE) as unread_count
                FROM users u
                WHERE u.id != ? AND u.role = 'user'`,
                [userId, userId]
            );
            
            res.render('chat', { 
                conversations,
                userId: userId
            });
        } catch (error) {
            console.error('Error fetching conversations:', error);
            res.status(500).send('Error loading conversations');
        }
    }

    async getMessages(req, res) {
        try {
            const { userId, otherId } = req.params;
            const [messages] = await connection.promise().execute(
                `SELECT 
                    m.*, 
                    u.username as sender_name,
                    m.created_at as timestamp
                FROM messages m 
                JOIN users u ON m.sender_id = u.id
                WHERE (m.sender_id = ? AND m.receiver_id = ?)
                OR (m.sender_id = ? AND m.receiver_id = ?)
                ORDER BY m.created_at ASC`,
                [userId, otherId, otherId, userId]
            );

            // Mark messages as read
            await connection.promise().execute(
                "UPDATE messages SET is_read = TRUE WHERE sender_id = ? AND receiver_id = ?",
                [otherId, userId]
            );

            res.json(messages);
        } catch (error) {
            console.error('Error fetching messages:', error);
            res.status(500).json({ error: 'Error loading messages' });
        }
    }

    async saveMessage(req, res) {
        try {
            const { senderId, receiverId, content } = req.body;
            await connection.promise().execute(
                "INSERT INTO messages (sender_id, receiver_id, content, is_read) VALUES (?, ?, ?, FALSE)",
                [senderId, receiverId, content]
            );
            res.json({ success: true });
        } catch (error) {
            console.error('Error saving message:', error);
            res.status(500).json({ error: 'Error saving message' });
        }
    }
}

module.exports = new ChatController(); 