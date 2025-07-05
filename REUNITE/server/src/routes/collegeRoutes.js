const express = require('express');
const router = express.Router();
const { College } = require('../models/associations');
const authenticateToken = require('../middleware/auth');

// Get all colleges
router.get('/', async (req, res) => {
  try {
    const colleges = await College.findAll();
    res.json(colleges);
  } catch (error) {
    console.error('Error fetching colleges:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get college by ID
router.get('/:id', async (req, res) => {
  try {
    const college = await College.findByPk(req.params.id);
    if (!college) {
      return res.status(404).json({ error: 'College not found' });
    }
    res.json(college);
  } catch (error) {
    console.error('Error fetching college:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new college (admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, location, description } = req.body;
    const college = await College.create({
      name,
      location,
      description
    });
    res.status(201).json(college);
  } catch (error) {
    console.error('Error creating college:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update college (admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const college = await College.findByPk(req.params.id);
    if (!college) {
      return res.status(404).json({ error: 'College not found' });
    }
    const { name, location, description } = req.body;
    await college.update({
      name,
      location,
      description
    });
    res.json(college);
  } catch (error) {
    console.error('Error updating college:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete college (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const college = await College.findByPk(req.params.id);
    if (!college) {
      return res.status(404).json({ error: 'College not found' });
    }
    await college.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting college:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 