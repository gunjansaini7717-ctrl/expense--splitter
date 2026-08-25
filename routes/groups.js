// routes/groups.js

const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// Every route in this file requires login, so we apply authMiddleware to ALL of them at once
// by using router.use() instead of adding it individually to each route
router.use(authMiddleware);

// CREATE a new group
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.userId; // set earlier by authMiddleware

    // Insert the new group, marking the logged-in user as its creator
    const [result] = await pool.query(
      'INSERT INTO expense_groups (name, created_by) VALUES (?, ?)',
      [name, userId]
    );

    const groupId = result.insertId;

    // Automatically add the creator as the first member of their own group
    await pool.query(
      'INSERT INTO group_members (group_id, user_id) VALUES (?, ?)',
      [groupId, userId]
    );

    res.status(201).json({ message: 'Group created', groupId });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;