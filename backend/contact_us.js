const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');

const app = express();
const port = process.env.PORT || 3000;

// MongoDB connection
mongoose.connect('mongodb+srv://rohanrai40679:Shivani8826@cluster0.qhakv4a.mongodb.net/job_board', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Define the message schema
const messageSchema = new mongoose.Schema({
  name: String,
  email: String,
  subject: String,
  message: String,
});

const Message = mongoose.model('Message', messageSchema);

// Middleware for parsing JSON
app.use(bodyParser.json());

// Contact Us API endpoint
app.post('/api/contact-us', async (req, res) => {
  try {
    // Extract data from the request body
    const { name, email, subject, message } = req.body;

    // Save the message to MongoDB
    const newMessage = new Message({ name, email, subject, message });
    await newMessage.save();

    // Send email notification
    const transporter = nodemailer.createTransport({
      // Set up your email service provider details
      service: 'gmail',
      auth: {
        user: 'your-email@gmail.com',
        pass: 'your-email-password',
      },
    });

    const mailOptions = {
      from: 'your-email@gmail.com',
      to: 'your-email@gmail.com',
      subject: 'New Contact Us Message',
      text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\nMessage: ${message}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });

    res.status(201).send('Message sent successfully.');
  } catch (error) {
    console.error('Error handling contact us request:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
