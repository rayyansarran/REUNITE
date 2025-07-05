const { User } = require('../models/associations');

// Middleware to check if user is active
async function checkActiveUser(req, res, next) {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.status === 'pending') {
            return res.status(403).json({ 
                message: 'Your account is pending verification. You cannot perform this action until your account is activated.' 
            });
        }

        if (user.status === 'deactive') {
            return res.status(403).json({ 
                message: 'Your account has been deactivated. You cannot perform this action. Please contact support for assistance.' 
            });
        }

        // User is active, proceed
        next();
    } catch (error) {
        console.error('Error checking user status:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = checkActiveUser; 