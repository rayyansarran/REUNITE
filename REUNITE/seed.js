const mongoose = require('mongoose');
const Alumni = require('./models/Alumni');
const rawData = require('./new.json');
require('dotenv').config();

const alumniData = rawData
  .filter(entry => entry.Name && entry.College && entry.Branch)
  .map(entry => ({
    name: entry.Name,
    bio: entry.Bio || '',
    college: entry.College,
    branch: entry.Branch,
    year: entry.Year || null,
    linkedin: entry.LinkedIn || ''
  }));

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(async () => {
    console.log('Connected to MongoDB');

    await Alumni.deleteMany({});
    console.log('All alumni data deleted!');
    
    console.log('Filtered entries:', alumniData.length);

    await Alumni.insertMany(alumniData);
    console.log('Alumni data inserted successfully!');

    process.exit();
  })
  .catch(err => {
    console.error('Error interacting with MongoDB:', err);
    process.exit(1);
  });
