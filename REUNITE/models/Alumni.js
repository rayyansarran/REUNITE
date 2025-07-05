const mongoose = require('mongoose');

const alumniSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  bio: {
    type: String,
    default: ''
  },
  college: {
    type: String,
    required: true
  },
  branch: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    default: null
  },
  linkedin: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const Alumni = mongoose.model('Alumni', alumniSchema);

module.exports = Alumni; 