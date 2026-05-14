// middleware/auth.js
// This file checks if user is logged in before accessing protected routes

const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware to check if user has a valid token
const authenticate = (req, res, next) => {
  // Get token from request header
  const token = req.headers['authorization'];

  // If no token, reject the request
  if (!token) {
    return res.status(401).json({ message: 'No token. Please login first.' });
  }

  try {
    // Verify the token and get user info from it
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Save user info for use in routes
    next(); // Allow request to continue
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token. Please login again.' });
  }
};

// Middleware to check if user is an Admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admins can do this action.' });
  }
  next();
};

module.exports = { authenticate, isAdmin };
