const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const College = require('../models/College');

// Register
router.post('/register', async (req, res) => {
  try {
    const { 
      username, 
      email, 
      password, 
      collegeId,
      firstName,
      lastName,
      phoneNumber,
      yearOfGraduation,
      currentCareerStatus,
      linkedinProfileUrl,
      studentMailId
    } = req.body;

    // Check if user already exists
    let user = await User.findOne({ where: { email } });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Validate college
    if (!collegeId) {
      return res.status(400).json({ message: 'College selection is required' });
    }

    const college = await College.findByPk(collegeId);
    if (!college) {
      return res.status(400).json({ message: 'Invalid college selected' });
    }

    // Create new user with all fields
    user = await User.create({
      username,
      email,
      password,
      collegeId,
      firstName,
      lastName,
      phoneNumber,
      yearOfGraduation,
      currentCareerStatus,
      linkedinProfileUrl,
      studentMailId,
      collegeName: college.name // Set college name from the college record
    });

    // Create token
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        collegeId: user.collegeId,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Validate password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        status: user.status,
        role: user.role,
        collegeId: user.collegeId
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user data
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 