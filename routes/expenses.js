// routes/expenses.js

const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// CREATE a new expense, split equally among all group members
router.post('/', async (req, res) => {
  try {
    const { groupId, description, amount } = req.body;
    const paidBy = req.userId;

    // Get all members of this group - we need to know who to split the expense between
    const [members] = await pool.query(
      'SELECT user_id FROM group_members WHERE group_id = ?',
      [groupId]
    );

    if (members.length === 0) {
      return res.status(400).json({ error: 'Group has no members' });
    }

    // Insert the main expense record
    const [result] = await pool.query(
      'INSERT INTO expenses (group_id, description, amount, paid_by) VALUES (?, ?, ?, ?)',
      [groupId, description, amount, paidBy]
    );

    const expenseId = result.insertId;

    // Calculate equal share - toFixed(2) rounds to 2 decimal places, matching our DECIMAL(10,2) column
    const shareAmount = (amount / members.length).toFixed(2);

    // Insert one row in expense_splits PER member, using Promise.all to run all inserts
    // concurrently instead of one-by-one (faster, since they don't depend on each other)
    await Promise.all(
      members.map(member =>
        pool.query(
          'INSERT INTO expense_splits (expense_id, user_id, share_amount) VALUES (?, ?, ?)',
          [expenseId, member.user_id, shareAmount]
        )
      )
    );

    res.status(201).json({ message: 'Expense added and split successfully', expenseId });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all expenses for a specific group, along with who paid and each person's split
router.get('/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;

    // Fetch all expenses for this group, JOINing with users to get the payer's name
    const [expenses] = await pool.query(
      `SELECT expenses.id, expenses.description, expenses.amount, expenses.created_at,
              users.name AS paid_by_name
       FROM expenses
       JOIN users ON expenses.paid_by = users.id
       WHERE expenses.group_id = ?
       ORDER BY expenses.created_at DESC`,
      [groupId]
    );

    // For each expense, also fetch its individual splits (who owes how much)
    const expensesWithSplits = await Promise.all(
      expenses.map(async (expense) => {
        const [splits] = await pool.query(
          `SELECT expense_splits.share_amount, users.name AS user_name
           FROM expense_splits
           JOIN users ON expense_splits.user_id = users.id
           WHERE expense_splits.expense_id = ?`,
          [expense.id]
        );
        return { ...expense, splits };
      })
    );

    res.json(expensesWithSplits);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;