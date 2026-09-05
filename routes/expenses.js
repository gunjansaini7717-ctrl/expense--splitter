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

// GET the simplified settlement plan for a group
router.get('/:groupId/settlement', async (req, res) => {
  try {
    const { groupId } = req.params;

    // Step A: How much each person has PAID in total (they're owed this back)
    const [paidTotals] = await pool.query(
      `SELECT paid_by AS user_id, users.name, SUM(amount) AS total_paid
       FROM expenses
       JOIN users ON expenses.paid_by = users.id
       WHERE group_id = ?
       GROUP BY paid_by, users.name`,
      [groupId]
    );

    // Step B: How much each person OWES in total (their share across all expenses)
    const [owedTotals] = await pool.query(
      `SELECT expense_splits.user_id, users.name, SUM(share_amount) AS total_owed
       FROM expense_splits
       JOIN expenses ON expense_splits.expense_id = expenses.id
       JOIN users ON expense_splits.user_id = users.id
       WHERE expenses.group_id = ?
       GROUP BY expense_splits.user_id, users.name`,
      [groupId]
    );

    // Step C: Combine both into a single net balance per person
    // We use a plain JS object as a map: { userId: { name, balance } }
    const balances = {};

    paidTotals.forEach(row => {
      balances[row.user_id] = {
        name: row.name,
        balance: parseFloat(row.total_paid)
      };
    });

    owedTotals.forEach(row => {
      if (!balances[row.user_id]) {
        balances[row.user_id] = { name: row.name, balance: 0 };
      }
      balances[row.user_id].balance -= parseFloat(row.total_owed);
    });

    // Step D: Convert the balances object into an array we can sort and process
    // Round to 2 decimals to avoid floating point noise (e.g. 0.0000001 instead of 0)
    let balanceList = Object.entries(balances).map(([userId, data]) => ({
      userId: parseInt(userId),
      name: data.name,
      balance: Math.round(data.balance * 100) / 100
    }));

    // Step E: The greedy settlement algorithm
    const transactions = [];

    // Separate into creditors (owed money, positive) and debtors (owe money, negative)
    let creditors = balanceList.filter(p => p.balance > 0).sort((a, b) => b.balance - a.balance);
    let debtors = balanceList.filter(p => p.balance < 0).sort((a, b) => a.balance - b.balance);

    let i = 0, j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];

      // The amount settled between these two is the smaller of what's owed vs what's due
      const amount = Math.min(-debtor.balance, creditor.balance);

      if (amount > 0) {
        transactions.push({
          from: debtor.name,
          to: creditor.name,
          amount: Math.round(amount * 100) / 100
        });
      }

      // Reduce both balances by the settled amount
      debtor.balance += amount;
      creditor.balance -= amount;

      // Move to the next person once their balance is fully settled (close to zero)
      if (Math.abs(debtor.balance) < 0.01) i++;
      if (Math.abs(creditor.balance) < 0.01) j++;
    }

    res.json({ balances: balanceList, transactions });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;