const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors');
const path = require('path');

const alumniRoutes = require('./routes/alumni');

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

// Debugging middleware for /logos
app.use('/logos', (req, res, next) => {
  const filePath = path.join(__dirname, 'logos', req.path);
  console.log(`[LOGOS DEBUG] Request for: ${req.originalUrl}, Resolved path: ${filePath}`);
  next();
});
app.use('/logos', express.static('logos'));
app.use(cors());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('DB Error:', err));
app.use(alumniRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
