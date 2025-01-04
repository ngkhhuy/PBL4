const express = require('express');
const session = require('express-session');
const path = require('path');
const authMiddleware = require('./middleware/auth');
const fileController = require('./controllers/fileController');
const contactController = require('./controllers/contactController');
const http = require('http');
const socketIo = require('socket.io');
const connection = require('./config/database');

// Routes
const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');
const adminRoutes = require('./routes/admin');
const chatRoutes = require('./routes/chat');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true
}));
app.use(authMiddleware.shareUserData);

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/', authRoutes);
app.use('/files', fileRoutes);
app.use('/admin', adminRoutes);
app.use('/chat', chatRoutes);
app.get('/download', authMiddleware.requireLogin, (req, res) => {
    res.redirect('/files/download');
});

// Basic routes
app.get('/', (req, res) => res.render('home'));
app.get('/admin', authMiddleware.requireLogin, (req, res) => res.render('admin'));
app.get('/upload', authMiddleware.requireLogin, (req, res) => res.render('index'));
app.get('/infor', (req, res) => res.render('solution'));
app.get('/feature', (req, res) => res.render('features'));
app.get('/help', (req, res) => res.render('contact'));
app.get('/sent-files', authMiddleware.requireLogin, fileController.getSentFiles);

// Contact form submission
app.post('/help', contactController.submitHelp);

// Update the upload route to use the file routes
app.post('/upload', (req, res) => {
    res.redirect(307, '/files/upload'); // 307 preserves the POST method
});

// WebSocket handling
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('authenticate', (userId) => {
        console.log('User authenticated:', userId);
        socket.userId = userId;
    });

    socket.on('private_message', async (data) => {
        try {
            const { senderId, receiverId, message } = data;
            
            // Lưu tin nhắn vào database
            await connection.promise().execute(
                "INSERT INTO messages (sender_id, receiver_id, content, is_read) VALUES (?, ?, ?, FALSE)",
                [senderId, receiverId, message]
            );

            // Gửi tin nhắn đến người nhận
            io.sockets.emit('new_message', {
                senderId,
                receiverId,
                message,
                timestamp: new Date()
            });

        } catch (error) {
            console.error('Error handling message:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Thay đổi app.listen thành server.listen
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});