const requireLogin = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
};

const requireAdmin = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect('/admin/login');
    }
    
    if (req.session.role !== 'admin') {
        return res.status(403).send('Access denied. Admin rights required.');
    }
    
    next();
};

const shareUserData = (req, res, next) => {
    res.locals.username = req.session.username || null;
    res.locals.isAdmin = req.session.isAdmin || false;
    next();
};

module.exports = {
    requireLogin,
    requireAdmin,
    shareUserData
}; 