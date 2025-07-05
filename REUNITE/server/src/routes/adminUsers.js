console.log('adminUsers.js loaded');
const router = require('express').Router();
const User = require('../models/User');
const College = require('../models/College');
const auth = require('../middleware/auth');
const { Op } = require('sequelize');

// Middleware to check admin role
function isAdmin(req, res, next) {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    return res.status(403).json({ message: 'Forbidden: Admins only' });
}

// Get all users with status 'pending'
router.get('/pending', auth, isAdmin, async (req, res) => {
    try {
        const pendingUsers = await User.findAll({
            where: { status: 'pending' },
            attributes: [
                'id', 'username', 'email', 'firstName', 'lastName', 
                'phoneNumber', 'collegeName', 'yearOfGraduation', 
                'currentCareerStatus', 'linkedinProfileUrl', 'studentMailId',
                'profilePicture', 'collegeId', 'status', 'role', 'bio',
                'createdAt', 'updatedAt'
            ],
            include: [{
                model: College,
                attributes: ['id', 'name', 'location']
            }]
        });
        res.json(pendingUsers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user status from 'pending' to 'active' or 'deactive'
router.put('/:id/status', auth, isAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        if (!['active', 'deactive'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.status !== 'pending') {
            return res.status(400).json({ message: 'Status can only be updated if current status is pending' });
        }
        user.status = status;
        await user.save();
        res.json({ message: 'Status updated successfully', user: { id: user.id, status: user.status } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

router.get('/test', (req, res) => {
  res.json({ message: 'Admin users test route works!' });
});

module.exports = router; 