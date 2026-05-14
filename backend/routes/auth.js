// routes/auth.js
// Handles user Signup and Login

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); // For encrypting passwords
const jwt = require('jsonwebtoken'); // For creating login tokens
const { pool } = require('../db');
require('dotenv').config();

// ==============================
// POST /api/auth/signup
// Create a new user account
// ==============================
router.post('/signup', async (req, res) => {
  const { name, email, password, role } = req.body;

  // Basic validation
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required.' });
  }

  try {
    // Check if email already exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered. Please login.' });
    }

    // Encrypt the password before saving (never save plain passwords!)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user to database
    const userRole = role === 'admin' ? 'admin' : 'member'; // default is member
    const result = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hashedPassword, userRole]
    );

    const newUser = result.rows[0];

    // Create a login token for the new user
    const token = jwt.sign(
      { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // Token expires in 7 days
    );

    res.status(201).json({ message: 'Account created successfully!', token, user: newUser });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ==============================
// POST /api/auth/login
// Login with email and password
// ==============================
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    // Find user by email
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ message: 'No account found with this email.' });
    }

    // Check if password matches
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ message: 'Wrong password. Please try again.' });
    }

    // Create login token
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful!',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

module.exports = router;
