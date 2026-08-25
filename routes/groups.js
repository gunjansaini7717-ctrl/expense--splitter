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


// GET all groups the logged-in user belongs to
router.get('/', async (req, res) => {
  try {
    const userId = req.userId;

    // JOIN combines rows from two tables based on a matching condition.
    // Here: we look at group_members (which links users to groups),
    // then JOIN with expense_groups to actually get the group's name/details,
    // filtering to only groups where THIS user is a member.
    const [groupsList] = await pool.query(
      `SELECT expense_groups.id, expense_groups.name, expense_groups.created_at
       FROM expense_groups
       JOIN group_members ON expense_groups.id = group_members.group_id
       WHERE group_members.user_id = ?`,
      [userId]
    );

    res.json(groupsList);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ADD a member to a group, by their email
router.post('/:groupId/members', async (req, res) => {
  try {
    const { groupId } = req.params; // ':groupId' in the URL becomes available here
    const { email } = req.body;
    const requesterId = req.userId; // the logged-in user making this request

    // Step 1: Check that the requester is actually a member of this group
    // (we don't want random logged-in users adding people to groups they're not part of)
    const [membership] = await pool.query(
      'SELECT * FROM group_members WHERE group_id = ? AND user_id = ?',
      [groupId, requesterId]
    );

    if (membership.length === 0) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    // Step 2: Find the user we want to add, by their email
    const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      return res.status(404).json({ error: 'No user found with that email' });
    }

    const newMemberId = users[0].id;

    // Step 3: Add them to the group
    await pool.query(
      'INSERT INTO group_members (group_id, user_id) VALUES (?, ?)',
      [groupId, newMemberId]
    );

    res.status(201).json({ message: 'Member added successfully' });

  } catch (err) {
    // A duplicate entry error happens if this user is ALREADY in the group,
    // thanks to the UNIQUE KEY constraint we set up earlier - MySQL blocks it, and we catch that here
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'User is already a member of this group' });
    }
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;