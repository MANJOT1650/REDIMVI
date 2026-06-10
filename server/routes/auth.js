// ─────────────────────────────────────────────────────────────────────────────
// Auth Routes — signup, login, email verification, resend verification
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendVerificationEmail } = require('../utils/email');

const router = express.Router();

// Helper: consistent JWT secret access
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production';

// Helper: base URL for verification links (uses frontend URL so the user
// lands on a React page that calls the API, giving us full UX control)
const getVerificationUrl = (token) => {
  const base = process.env.FRONTEND_URL || 'http://localhost:5173';
  return `${base}/verify-email?token=${token}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/signup
// Creates an unverified user, generates a verification token, sends the email.
// Does NOT return a JWT — the user must verify before logging in.
// ─────────────────────────────────────────────────────────────────────────────
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
        JWT_SECRET,
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

    // ── Generate verification token ──────────────────────────────────
    // 1. Create a cryptographically random token (sent in the email link)
    const rawToken = crypto.randomBytes(32).toString('hex');
    // 2. Hash it before storing — so a DB leak never exposes valid links
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    // 3. Set expiry to 24 hours from now
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create new user (Sequelize will auto-hash password via hook)
    user = await User.create({
      username,
      email,
      password,
      isVerified: false,
      verificationToken: hashedToken,
      verificationTokenExpiry: tokenExpiry,
    });

    // ── Send verification email ──────────────────────────────────────
    const verifyUrl = getVerificationUrl(rawToken);
    try {
      await sendVerificationEmail(email, username, verifyUrl);
    } catch (emailError) {
      // If email fails, still keep the user but inform them
      console.error('Email send failed after signup:', emailError.message);
      return res.status(201).json({
        message: 'Account created but verification email failed to send. Please use "Resend verification email" to try again.',
        emailSent: false,
        email: user.email,
      });
    }

    // Return success — no JWT, user must verify first
    res.status(201).json({
      message: 'Account created! Please check your email to verify your account.',
      emailSent: true,
      email: user.email,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/verify-email?token=xxx
// Validates the token, marks the user as verified, redirects to login.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    // Hash the incoming token to compare against the stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with matching token that hasn't expired
    const user = await User.findOne({
      where: {
        verificationToken: hashedToken,
        verificationTokenExpiry: {
          [require('sequelize').Op.gt]: new Date(), // token must not be expired
        },
      },
    });

    if (!user) {
      return res.status(400).json({
        error: 'Invalid or expired verification link. Please request a new one.',
        expired: true,
      });
    }

    // Already verified (e.g. user clicked the link twice)
    if (user.isVerified) {
      return res.json({
        message: 'Email is already verified. You can log in.',
        alreadyVerified: true,
      });
    }

    // ── Mark as verified and clear token ────────────────────────────
    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiry = null;
    await user.save();

    console.log(`✓ User verified: ${user.email}`);

    res.json({
      message: 'Email verified successfully! You can now log in.',
      verified: true,
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Server error during verification' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/resend-verification
// Generates a fresh token and re-sends the verification email.
// Rate-limited: only allowed if 60 seconds have passed since last send.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ where: { email: email.toLowerCase() } });

    if (!user) {
      // Don't reveal whether the email exists — always return success-like message
      return res.json({
        message: 'If an account with that email exists, a verification email has been sent.',
      });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: 'This email is already verified. Please log in.' });
    }

    // ── Rate limiting: prevent spamming resend ───────────────────────
    // Only allow resend if the previous token was created more than 60s ago
    if (user.verificationTokenExpiry) {
      const tokenCreatedAt = new Date(user.verificationTokenExpiry.getTime() - 24 * 60 * 60 * 1000);
      const cooldownEnd = new Date(tokenCreatedAt.getTime() + 60 * 1000); // 60-second cooldown
      if (new Date() < cooldownEnd) {
        const waitSeconds = Math.ceil((cooldownEnd - new Date()) / 1000);
        return res.status(429).json({
          error: `Please wait ${waitSeconds} seconds before requesting another email.`,
          retryAfter: waitSeconds,
        });
      }
    }

    // ── Generate fresh token ─────────────────────────────────────────
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.verificationToken = hashedToken;
    user.verificationTokenExpiry = tokenExpiry;
    await user.save();

    // Send verification email
    const verifyUrl = getVerificationUrl(rawToken);
    await sendVerificationEmail(user.email, user.username, verifyUrl);

    res.json({
      message: 'Verification email sent! Please check your inbox.',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Server error while resending verification email' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// Validates credentials AND checks isVerified before issuing a JWT.
// ─────────────────────────────────────────────────────────────────────────────
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
        JWT_SECRET,
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

    // ── Block unverified users ───────────────────────────────────────
    if (!user.isVerified) {
      return res.status(403).json({
        error: 'Please verify your email before logging in. Check your inbox for the verification link.',
        needsVerification: true,
        email: user.email,
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
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
