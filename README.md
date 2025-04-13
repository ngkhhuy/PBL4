# File Transfer and Chat Application
# File Transfer using FTP Server and Chat using Socket.IO

A web application built with Node.js and Express that allows users to transfer files and chat with each other.

## Features

- User Authentication (Login/Register)
- File Upload and Download
- Real-time Chat using Socket.IO
- Admin Dashboard
- Contact Form
- File Management System

## Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: EJS (Embedded JavaScript templates)
- **Database**: MySQL
- **Authentication**: Express Session
- **Real-time Communication**: Socket.IO
- **File Handling**: Multer, basic-ftp, ssh2-sftp-client
- **Email**: Nodemailer
- **Security**: bcrypt for password hashing

## Project Structure

```
├── admin/           # Admin-related views and functionality
├── config/          # Configuration files
├── controllers/     # Business logic controllers
├── downloads/       # Downloaded files storage
├── middleware/      # Custom middleware
├── routes/          # Route definitions
├── services/        # Service layer
├── views/           # EJS templates
├── .env            # Environment variables
├── app.js          # Main application file
├── init.sql        # Database initialization script
└── package.json    # Project dependencies
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   PORT=3000
   DB_HOST=your_database_host
   DB_USER=your_database_user
   DB_PASSWORD=your_database_password
   DB_NAME=your_database_name
   ```
4. Initialize the database using `init.sql`
5. Start the server:
   ```bash
   npm start
   ```

## Usage

- Access the application at `http://localhost:3000`
- Register a new account or login with existing credentials
- Upload files through the upload interface
- Chat with other users in real-time
- Access admin features if you have admin privileges

## Dependencies

- express: ^4.21.2
- express-session: ^1.18.1
- ejs: ^3.1.10
- mysql2: ^3.11.4
- socket.io: ^4.8.1
- multer: ^1.4.5-lts.1
- bcrypt: ^5.1.1
- nodemailer: ^6.9.16
- basic-ftp: ^5.0.5
- ssh2-sftp-client: ^11.0.0

## License

ISC 

