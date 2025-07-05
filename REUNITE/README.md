# Alumni Announcement System

A web application for managing alumni announcements and interactions.

## Project Structure

```
announcement/
├── client/          # Frontend application
├── server/          # Backend application
├── models/          # Shared models
└── routes/          # API routes
```

## Features

- User authentication and authorization
- Alumni profile management
- Post announcements and updates
- Comment and like system
- College-specific sections
- Admin dashboard
- File upload functionality

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- npm or yarn package manager

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd announcement
   ```

2. Install dependencies:
   ```bash
   # Install root dependencies
   npm install

   # Install server dependencies
   cd server
   npm install

   # Install client dependencies (if separate)
   cd ../client
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update the values in `.env` with your configuration

4. Initialize the database:
   ```bash
   cd server
   npm run db:init
   ```

5. Start the application:
   ```bash
   # Start the server
   cd server
   npm start

   # Start the client (in a new terminal)
   cd client
   npm start
   ```

## Development

- Server runs on: http://localhost:3000
- Client runs on: http://localhost:5000

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License. 