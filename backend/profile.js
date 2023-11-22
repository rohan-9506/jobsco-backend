// server.js
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');

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

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  dob: String,
  gender: String,
  nationality: String,
  address: String,
  qualification: String,
  resume: {
    data: Buffer,
    contentType: String,
  },
});

const User = mongoose.model('User', userSchema);

const storage = multer.memoryStorage();
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
app.use(cors());

app.post('/api/user-profile', upload.single('resume'), async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      dob,
      gender,
      nationality,
      address,
      qualification,
    } = req.body;

    const user = new User({
      name,
      email,
      phone,
      dob,
      gender,
      nationality,
      address,
      qualification,
      resume: {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      },
    });

    await user.save();
    res.status(201).send('User profile and resume uploaded successfully.');
  } catch (error) {
    console.error('Error uploading user profile:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
