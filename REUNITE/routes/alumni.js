const express = require('express');
const Alumni = require('../models/Alumni');
const router = express.Router();

router.get('/api/colleges', async (req, res) => {
  try {
    console.log('GET /api/colleges called');
    const colleges = await Alumni.distinct('college');
    console.log('Colleges found:', colleges);
    res.json(colleges);
  } catch (err) {
    console.error('Error in /api/colleges:', err);
    res.status(500).json({ error: 'Server error fetching colleges' });
  }
});

router.get('/api/branches/:college', async (req, res) => {
  try {
    const { college } = req.params;
    console.log('GET /api/branches/:college called with:', college);
    const branches = await Alumni.find({ college }).distinct('branch');
    console.log('Branches found:', branches);
    res.json(branches);
  } catch (err) {
    console.error('Error in /api/branches/:college:', err);
    res.status(500).json({ error: 'Server error fetching branches' });
  }
});

router.get('/api/alumni/:college/:branch', async (req, res) => {
  try {
    const { college, branch } = req.params;
    console.log('GET /api/alumni/:college/:branch called with:', college, branch);
    const alumni = await Alumni.find({ college, branch });
    console.log('Alumni found:', alumni);
    res.json(alumni);
  } catch (err) {
    console.error('Error in /api/alumni/:college/:branch:', err);
    res.status(500).json({ error: 'Server error fetching alumni' });
  }
});

module.exports = router;
