// routes/projects.js
// Handles creating, viewing, and managing projects

const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticate, isAdmin } = require('../middleware/auth');

// All routes here require login
router.use(authenticate);

// ==============================
// GET /api/projects
// Get all projects for logged-in user
// ==============================
router.get('/', async (req, res) => {
  try {
    let result;

    if (req.user.role === 'admin') {
      // Admins can see ALL projects
      result = await pool.query(`
        SELECT p.*, u.name as creator_name,
          COUNT(DISTINCT pm.user_id) as member_count,
          COUNT(DISTINCT t.id) as task_count
        FROM projects p
        LEFT JOIN users u ON p.created_by = u.id
        LEFT JOIN project_members pm ON p.id = pm.project_id
        LEFT JOIN tasks t ON p.id = t.project_id
        GROUP BY p.id, u.name
        ORDER BY p.created_at DESC
      `);
    } else {
      // Members can only see projects they are part of
      result = await pool.query(`
        SELECT p.*, u.name as creator_name,
          COUNT(DISTINCT pm2.user_id) as member_count,
          COUNT(DISTINCT t.id) as task_count
        FROM projects p
        JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = $1
        LEFT JOIN users u ON p.created_by = u.id
        LEFT JOIN project_members pm2 ON p.id = pm2.project_id
        LEFT JOIN tasks t ON p.id = t.project_id
        GROUP BY p.id, u.name
        ORDER BY p.created_at DESC
      `, [req.user.id]);
    }

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching projects.' });
  }
});

// ==============================
// POST /api/projects
// Create a new project (Admin only)
// ==============================
router.post('/', isAdmin, async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Project name is required.' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO projects (name, description, created_by) VALUES ($1, $2, $3) RETURNING *',
      [name, description, req.user.id]
    );

    const project = result.rows[0];

    // Automatically add the creator as a member too
    await pool.query(
      'INSERT INTO project_members (project_id, user_id) VALUES ($1, $2)',
      [project.id, req.user.id]
    );

    res.status(201).json({ message: 'Project created!', project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating project.' });
  }
});

// ==============================
// POST /api/projects/:id/members
// Add a member to a project (Admin only)
// ==============================
router.post('/:id/members', isAdmin, async (req, res) => {
  const { user_id } = req.body;
  const project_id = req.params.id;

  try {
    // Check if project exists
    const project = await pool.query('SELECT id FROM projects WHERE id = $1', [project_id]);
    if (project.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    // Check if user exists
    const user = await pool.query('SELECT id, name FROM users WHERE id = $1', [user_id]);
    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Add user to project
    await pool.query(
      'INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [project_id, user_id]
    );

    res.json({ message: `${user.rows[0].name} added to project!` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error adding member.' });
  }
});

// ==============================
// GET /api/projects/:id/members
// Get all members of a project
// ==============================
router.get('/:id/members', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.email, u.role
      FROM users u
      JOIN project_members pm ON u.id = pm.user_id
      WHERE pm.project_id = $1
    `, [req.params.id]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching members.' });
  }
});

// ==============================
// DELETE /api/projects/:id
// Delete a project (Admin only)
// ==============================
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM projects WHERE id = $1', [req.params.id]);
    res.json({ message: 'Project deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting project.' });
  }
});

module.exports = router;
