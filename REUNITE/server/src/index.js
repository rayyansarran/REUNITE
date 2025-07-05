require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const sequelize = require('./config/database');
const initializeDatabase = require('./config/initDb');
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/postRoutes');
const userRoutes = require('./routes/userRoutes');
const collegeRoutes = require('./routes/collegeRoutes');
const adminUsers = require('./routes/adminUsers');

// Import models with associations
require('./models/associations');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/colleges', collegeRoutes);
app.use('/api/admin/users', adminUsers);

// Database sync and server start
sequelize.sync({ alter: true }).then(() => {
const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        });
}); 