// routes/tasks.js
// Handles creating, viewing, and updating tasks

const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticate, isAdmin } = require('../middleware/auth');

// All routes require login
router.use(authenticate);

// ==============================
// GET /api/tasks
// Get tasks (admin: all tasks, member: only their tasks)
// ==============================
router.get('/', async (req, res) => {
  try {
    let result;

    if (req.user.role === 'admin') {
      result = await pool.query(`
        SELECT t.*, 
          p.name as project_name,
          u.name as assigned_to_name,
          creator.name as created_by_name
        FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
        LEFT JOIN users u ON t.assigned_to = u.id
        LEFT JOIN users creator ON t.created_by = creator.id
        ORDER BY t.created_at DESC
      `);
    } else {
      result = await pool.query(`
        SELECT t.*,
          p.name as project_name,
          u.name as assigned_to_name,
          creator.name as created_by_name
        FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
        LEFT JOIN users u ON t.assigned_to = u.id
        LEFT JOIN users creator ON t.created_by = creator.id
        WHERE t.assigned_to = $1
        ORDER BY t.created_at DESC
      `, [req.user.id]);
    }

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching tasks.' });
  }
});

// ==============================
// GET /api/tasks/project/:projectId
// Get all tasks for a specific project
// ==============================
router.get('/project/:projectId', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*,
        u.name as assigned_to_name,
        creator.name as created_by_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users creator ON t.created_by = creator.id
      WHERE t.project_id = $1
      ORDER BY t.created_at DESC
    `, [req.params.projectId]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching tasks.' });
  }
});

// ==============================
// GET /api/tasks/dashboard
// Get dashboard summary stats
// ==============================
router.get('/dashboard', async (req, res) => {
  try {
    let whereClause = req.user.role === 'admin' ? '' : `WHERE t.assigned_to = ${req.user.id}`;

    const result = await pool.query(`
      SELECT
        COUNT(*) as total_tasks,
        COUNT(*) FILTER (WHERE t.status = 'todo') as todo_count,
        COUNT(*) FILTER (WHERE t.status = 'in_progress') as in_progress_count,
        COUNT(*) FILTER (WHERE t.status = 'done') as done_count,
        COUNT(*) FILTER (WHERE t.due_date < NOW() AND t.status != 'done') as overdue_count
      FROM tasks t
      ${whereClause}
    `);

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching dashboard.' });
  }
});

// ==============================
// POST /api/tasks
// Create a new task (Admin only)
// ==============================
router.post('/', isAdmin, async (req, res) => {
  const { title, description, project_id, assigned_to, due_date, priority } = req.body;

  if (!title || !project_id) {
    return res.status(400).json({ message: 'Task title and project are required.' });
  }

  try {
    const result = await pool.query(`
      INSERT INTO tasks (title, description, project_id, assigned_to, due_date, priority, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `, [title, description, project_id, assigned_to, due_date, priority || 'medium', req.user.id]);

    res.status(201).json({ message: 'Task created!', task: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating task.' });
  }
});

// ==============================
// PATCH /api/tasks/:id/status
// Update task status (both admin and assigned member can do this)
// ==============================
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['todo', 'in_progress', 'done'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Status must be: todo, in_progress, or done' });
  }

  try {
    // Check if user is allowed to update this task
    const task = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    if (task.rows.length === 0) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    const thisTask = task.rows[0];

    // Only the assigned user OR admin can update status
    if (req.user.role !== 'admin' && thisTask.assigned_to !== req.user.id) {
      return res.status(403).json({ message: 'You can only update your own tasks.' });
    }

    await pool.query('UPDATE tasks SET status = $1 WHERE id = $2', [status, req.params.id]);
    res.json({ message: 'Task status updated!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating task.' });
  }
});

// ==============================
// DELETE /api/tasks/:id
// Delete a task (Admin only)
// ==============================
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    res.json({ message: 'Task deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting task.' });
  }
});

// ==============================
// GET /api/tasks/users
// Get all users (for assigning tasks)
// ==============================
router.get('/users/all', isAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role FROM users ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching users.' });
  }
});

module.exports = router;
