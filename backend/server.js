// server.js - This is the MAIN file that starts the whole backend

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { createTables } = require('./db');

// Import all routes
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');

const app = express();

// ========================
// MIDDLEWARE SETUP
// ========================

// Allow frontend to talk to backend (CORS)
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

// Allow reading JSON from requests
app.use(express.json());

// ========================
// ROUTES
// ========================
app.use('/api/auth', authRoutes);       // /api/auth/signup, /api/auth/login
app.use('/api/projects', projectRoutes); // /api/projects
app.use('/api/tasks', taskRoutes);       // /api/tasks

// Health check - to confirm server is running
app.get('/', (req, res) => {
  res.json({ message: '✅ Team Task Manager API is running!' });
});

// ========================
// START SERVER
// ========================
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  // Create database tables when server starts
  await createTables();
});
