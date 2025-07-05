const express = require('express');
const router = express.Router();
const { User, College, Post, Like, Comment } = require('../models/associations');
const authenticateToken = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, collegeId } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Check if college exists
    const college = await College.findByPk(collegeId);
    if (!college) {
      return res.status(400).json({ error: 'College not found' });
    }

    // Create new user
    const user = await User.create({
      username,
      email,
      password,
      collegeId
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        collegeId: user.collegeId
      }
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({
      where: { email },
      include: [{
        model: College,
        attributes: ['id', 'name']
      }]
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        collegeId: user.collegeId,
        college: user.College,
        status: user.status,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include: [{
        model: College,
        attributes: ['id', 'name']
      }]
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, upload.single('profilePicture'), async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { username, bio } = req.body;

    // Update user data
    const updateData = {};
    if (username) updateData.username = username;
    if (bio) updateData.bio = bio;
    if (req.file) {
      updateData.profilePicture = `uploads/${req.file.filename}`;
    }

    await user.update(updateData);

    const updatedUser = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] },
      include: [{
        model: College,
        attributes: ['id', 'name']
      }]
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's general posts (non-college specific)
router.get('/posts/general', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 5 } = req.query;
    const offset = (page - 1) * limit;

    const posts = await Post.findAndCountAll({
      where: { 
        userId: req.user.id,
        isCollegeSpecific: false
      },
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'profilePicture', 'bio', 'collegeName', 'currentCareerStatus', 'yearOfGraduation']
        },
        {
          model: College,
          attributes: ['id', 'name']
        },
        {
          model: Like,
          include: [{
            model: User,
            attributes: ['id', 'username']
          }]
        },
        {
          model: Comment,
          include: [{
            model: User,
            attributes: ['id', 'username', 'profilePicture']
          }]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      posts: posts.rows,
      currentPage: parseInt(page),
      totalPages: Math.ceil(posts.count / limit),
      totalPosts: posts.count
    });
  } catch (error) {
    console.error('Error fetching user general posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's college-specific posts
router.get('/posts/college-specific', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 5 } = req.query;
    const offset = (page - 1) * limit;

    const posts = await Post.findAndCountAll({
      where: { 
        userId: req.user.id,
        isCollegeSpecific: true
      },
      include: [
        {
          model: User,
          attributes: ['id', 'username', 'profilePicture', 'bio', 'collegeName', 'currentCareerStatus', 'yearOfGraduation']
        },
        {
          model: College,
          attributes: ['id', 'name']
        },
        {
          model: Like,
          include: [{
            model: User,
            attributes: ['id', 'username']
          }]
        },
        {
          model: Comment,
          include: [{
            model: User,
            attributes: ['id', 'username', 'profilePicture']
          }]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      posts: posts.rows,
      currentPage: parseInt(page),
      totalPages: Math.ceil(posts.count / limit),
      totalPosts: posts.count
    });
  } catch (error) {
    console.error('Error fetching user college-specific posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete account
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify password before deletion
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Password is incorrect' });
    }

    // Delete user (this will cascade delete posts, comments, likes due to foreign key constraints)
    await user.destroy();

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 