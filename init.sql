-- init.sql
-- Tạo database
CREATE DATABASE IF NOT EXISTS filetransfer;
USE filetransfer;

-- Tạo bảng users
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    locked TINYINT(1) DEFAULT 0,
    reset_token VARCHAR(255),
    reset_token_expires DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tạo bảng files
CREATE TABLE IF NOT EXISTS files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    path VARCHAR(255) NOT NULL,
    uploaded_by VARCHAR(50) NOT NULL,
    received_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(username),
    FOREIGN KEY (received_by) REFERENCES users(username)
);

-- Tạo tài khoản admin mặc định (password: admin123)
INSERT INTO users (username, email, password, role) VALUES 
('admin', 'admin@example.com', '$2b$10$rE5VhPv0QKkG7yxF8HzOh.ZQ3B4CNZGrdGGC0dkqR8GxGWtKGl9Aq', 'admin');