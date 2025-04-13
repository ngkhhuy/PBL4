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


## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   PORT=
   DB_HOST=
   DB_USER=
   DB_PASSWORD=
   DB_NAME=
   EMAIL_USER=
   EMAIL_PASS=
   FTP_HOST=
   FTP_USER=
   FTP_PASS=
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



## License

Author : khanhhuy.dev

