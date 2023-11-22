const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

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
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  resetToken: String,
  resetTokenExpiry: Date,
});

const User = mongoose.model('User', userSchema);

app.use(express.json());

// Middleware to handle CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Endpoint to initiate the forgot password process
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Generate a random reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Set token expiry to one hour from now
    const resetTokenExpiry = Date.now() + 3600000;

    // Update user with the reset token and expiry
    await User.findOneAndUpdate(
      { email: email },
      { $set: { resetToken: resetToken, resetTokenExpiry: resetTokenExpiry } },
      { new: true }
    );

    // Send reset token to the user's email
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'your-email@gmail.com',
          pass: 'your-password',
        },
      });
      

    const mailOptions = {
      from: 'rohanrai40679@gmail.com',
      to: email,
      subject: 'Password Reset',
      text: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
        Please click on the following link or paste it into your browser to complete the process:\n\n
        http://localhost:3000/reset-password/${resetToken}\n\n
        If you did not request this, please ignore this email and your password will remain unchanged.\n`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        console.log('Email sent:', info.response);
        res.status(200).json({ message: 'Email sent successfully' });
      }
    });
  } catch (error) {
    console.error('Error initiating forgot password:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to reset password using the token
app.post('/api/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    const resetToken = req.params.token;

    // Find the user with the given reset token and check if it's still valid
    const user = await User.findOne({
      resetToken: resetToken,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Update the user's password and clear the reset token fields
    user.password = await bcrypt.hash(password, 10);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
