const express = require('express');
const session = require('express-session');
const path = require('path');
const authMiddleware = require('./middleware/auth');
const fileController = require('./controllers/fileController');
const contactController = require('./controllers/contactController');

// Routes
const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');
const adminRoutes = require('./routes/admin');

const app = express();

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});