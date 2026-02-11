const User = require('../models/User');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};
exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    const user = await User.create({
      username,
      email,
      password
    });

    try {
      await sendWelcomeEmail(user.email, user.username);
    } catch (emailError) {
      console.log('Email sending failed:', emailError.message);
    }

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        budget: user.budget,
        defaultCurrency: user.defaultCurrency
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        budget: user.budget,
        defaultCurrency: user.defaultCurrency 
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { username, budget, defaultCurrency } = req.body;

    const user = await User.findByIdAndUpdate(
        req.user.id,
        { username, budget, defaultCurrency },
        { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        budget: user.budget,
        defaultCurrency: user.defaultCurrency
      }
    });
  } catch (error) {
    next(error);
  }
};

const sendWelcomeEmail = async (email, username) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Welcome to Receipt App! 🎉',
    html: `
      <h1>Welcome ${username}!</h1>
      <p>Thank you for registering with Receipt App.</p>
      <p>Start managing your receipts efficiently today!</p>
      <p>Best regards,<br>Receipt App Team</p>
    `
  };

  await transporter.sendMail(mailOptions);
};