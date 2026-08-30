// server.js

// 'require' loads an external library into this file. This is how we use Express.
const express = require('express');
const app = express();
const cors = require('cors');
const pool = require('./db');
const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/authMiddleware');
const PORT = 3000;
const groupRoutes = require('./routes/groups');

// This creates our actual server application object. Every route/feature we add goes on 'app'.

// This allows requests from other origins (like our frontend on a different port) to reach this server
app.use(cors());

// This lets our server understand JSON data sent in requests (needed for req.body to work)
app.use(express.json());

// Any route starting with /api/auth will be handled by our authRoutes file
app.use('/api/auth', authRoutes);

app.use('/api/groups', groupRoutes);

// Just a plain variable to store which network port our server listens on.



app.get('/', (req, res) => {
  res.send('Expense Splitter backend is running!');
});


app.get('/test-db', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});





// Notice the second argument here: authMiddleware runs BEFORE this route's function
app.get('/api/profile', authMiddleware, async (req, res) => {
  // If we reach here, authMiddleware already verified the token and attached req.userId
  const [users] = await pool.query('SELECT id, name, email FROM users WHERE id = ?', [req.userId]);
  res.json(users[0]);
});


const expenseRoutes = require('./routes/expenses');
app.use('/api/expenses', expenseRoutes);