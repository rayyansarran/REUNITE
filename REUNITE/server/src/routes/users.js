const router = require('express').Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const upload = require('../utils/fileUpload');
const { Op } = require('sequelize');

// Get user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: ['id', 'username', 'email', 'profilePicture', 'collegeId', 'bio']
        });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user profile
router.put('/profile', auth, upload.single('profilePicture'), async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { username, bio } = req.body;
        
        if (username) {
            user.username = username;
        }
        
        if (bio !== undefined) {
            user.bio = bio;
        }

        if (req.file) {
            user.profilePicture = `uploads/${req.file.filename}`;
        }

        await user.save();

        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            profilePicture: user.profilePicture,
            collegeId: user.collegeId,
            bio: user.bio
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Change password
router.put('/password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete account
router.delete('/account', auth, async (req, res) => {
    try {
        const { password } = req.body;
        const user = await User.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify password before deletion
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Password is incorrect' });
        }

        // Delete user (this will cascade delete posts, comments, likes due to foreign key constraints)
        await user.destroy();

        res.json({ message: 'Account deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 