const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');

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

const jobSchema = new mongoose.Schema({
  title: String,
  companyName: String,
  companyId: String,
  location: String,
  type: String,
  experience: String,
  salaryRange: String,
  educationLevel: String,
  category: String,
  description: String,
});

const Job = mongoose.model('Job', jobSchema);

app.use(express.json());

app.get('/api/job-listings', async (req, res) => {
  try {
    // Add the new filters to the filters object
    const filters = {
      location: req.query.location,
      type: req.query.type,
      experience: req.query.experience,
      salaryRange: req.query.salaryRange,
      educationLevel: req.query.educationLevel,
      category: req.query.category,
      jobTitle: req.query.jobTitle, // New filter for job title
      companyName: req.query.companyName, // New filter for company name
    };

    // Build the filter object based on the provided filters
    const filterObject = {};
    for (const key in filters) {
      if (filters[key]) {
        // For jobTitle and companyName, use a case-insensitive regex for partial matching
        if (key === 'jobTitle' || key === 'companyName') {
          filterObject[key] = { $regex: new RegExp(filters[key], 'i') };
        } else {
          filterObject[key] = filters[key];
        }
      }
    }

    // Fetch job listings from MongoDB based on the filters
    const jobListings = await Job.find(filterObject);

    res.json(jobListings);
  } catch (error) {
    console.error('Error fetching job listings:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const applicationSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
  },
  name: String,
  email: String,
  portfolio: String,
  resume: {
    data: Buffer,
    contentType: String,
  },
  coverLetter: String,
});

const Application = mongoose.model('Application', applicationSchema);

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/msword' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'));
    }
  },
});

app.post('/api/apply-job/:jobId', upload.single('resume'), async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const { name, email, portfolio, coverLetter } = req.body;

    const application = new Application({
      jobId,
      name,
      email,
      portfolio,
      resume: {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      },
      coverLetter,
    });

    await application.save();
    res.status(201).send('Job application submitted successfully.');
  } catch (error) {
    console.error('Error submitting job application:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
