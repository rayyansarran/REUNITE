const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize } = require('./config/database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const collegeRoutes = require('./routes/collegeRoutes');
const users = require('./routes/users');
const adminUsers = require('./routes/adminUsers');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../client')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/users', users);
app.use('/api/posts', postRoutes);
app.use('/api/colleges', collegeRoutes);
app.use('/api/admin/users', adminUsers);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Database sync and server start
const PORT = process.env.PORT || 5000;

console.log('CWD:', process.cwd());
console.log('adminUsers path:', require.resolve('./routes/adminUsers'));

async function startServer() {
  try {
    await sequelize.sync({ alter: true });
    console.log('Database synced successfully');

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

startServer(); 