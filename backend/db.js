// db.js - This file connects to PostgreSQL database

const { Pool } = require('pg');
require('dotenv').config();

// Create a connection pool to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Required for Railway/Neon cloud databases
});

// Function to create all tables when app starts
const createTables = async () => {
  const query = `
    -- Users table: stores all user accounts
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(20) DEFAULT 'member',  -- 'admin' or 'member'
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- Projects table: stores all projects
    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      description TEXT,
      created_by INTEGER REFERENCES users(id),  -- who created this project
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- Project members table: which users belong to which project
    CREATE TABLE IF NOT EXISTS project_members (
      id SERIAL PRIMARY KEY,
      project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(project_id, user_id)  -- one user can't be added twice
    );

    -- Tasks table: stores all tasks
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      status VARCHAR(20) DEFAULT 'todo',  -- 'todo', 'in_progress', 'done'
      priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high'
      due_date DATE,
      project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      assigned_to INTEGER REFERENCES users(id),  -- which user is doing this task
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  try {
    await pool.query(query);
    console.log('✅ Database tables created successfully!');
  } catch (err) {
    console.error('❌ Error creating tables:', err.message);
  }
};

module.exports = { pool, createTables };
