const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'filetransfer'
});

connection.connect(error => {
    if (error) {
        console.error('Error connecting to database:', error);
        return;
    }
    console.log('Successfully connected to database');
});

module.exports = connection; 