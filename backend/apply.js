const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

mongoose.connect('mongodb+srv://rohanrai40679:Shivani8826@cluster0.qhakv4a.mongodb.net/job_board', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

const applicationSchema = new mongoose.Schema({
  jobId: mongoose.Schema.Types.ObjectId, // Reference to the Job ID
  name: String,
  email: String,
  portfolio: String,
  cv: {
    data: Buffer,
    contentType: String,
  },
  coverLetter: String,
});

const Application = mongoose.model('Application', applicationSchema);

const storage = multer.memoryStorage(); // Store file in memory as Buffer
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype === 'application/msword' || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'));
    }
  },
});

app.use(express.json());

app.post('/api/apply-for-job/:jobId', upload.single('cv'), async (req, res) => {
  try {
    const {
      name,
      email,
      portfolio,
      coverLetter,
    } = req.body;

    const jobId = req.params.jobId; // Get the Job ID from the URL parameter

    const application = new Application({
      jobId: mongoose.Types.ObjectId(jobId),
      name,
      email,
      portfolio,
      cv: {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      },
      coverLetter,
    });

    await application.save();
    res.status(201).send('Application submitted successfully.');
  } catch (error) {
    console.error('Error submitting application:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
