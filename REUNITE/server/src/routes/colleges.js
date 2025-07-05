const router = require('express').Router();
const College = require('../models/College');
const auth = require('../middleware/auth');

// Get all colleges
router.get('/', async (req, res) => {
    try {
        const colleges = await College.findAll({
            order: [['name', 'ASC']]
        });
        res.json(colleges);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create a new college (admin only)
router.post('/', auth, async (req, res) => {
    try {
        // TODO: Add admin check middleware
        const { name } = req.body;
        
        const college = await College.create({
            name
        });

        res.json(college);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 