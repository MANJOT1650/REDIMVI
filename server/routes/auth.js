const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Signup route
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    // Validation
    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    // Check if database is connected
    if (!req.app.locals.isDbConnected || !req.app.locals.isDbConnected()) {
      // Demo mode - return success without database
      const token = jwt.sign(
        { id: 'demo-user', email: email },
        process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production',
        { expiresIn: '7d' }
      );

      return res.status(201).json({
        message: 'User registered successfully (Demo Mode - No Database)',
        token,
        user: { id: 'demo-user', username: username, email: email },
        demoMode: true
      });
    }

    // Check if user already exists (PostgreSQL/Sequelize)
    const { Op } = require('sequelize');
    let user = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }]
      }
    });
    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new user (Sequelize will auto-hash password via hook)
    user = await User.create({ username, email, password });

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if database is connected
    if (!req.app.locals.isDbConnected || !req.app.locals.isDbConnected()) {
      // Demo mode - accept any credentials
      const token = jwt.sign(
        { id: 'demo-user', email: email },
        process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production',
        { expiresIn: '7d' }
      );

      return res.json({
        message: 'Login successful (Demo Mode - No Database)',
        token,
        user: { id: 'demo-user', username: email.split('@')[0], email: email },
        demoMode: true
      });
    }

    // Find user (PostgreSQL/Sequelize)
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

module.exports = router;
