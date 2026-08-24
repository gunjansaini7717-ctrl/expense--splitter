// server.js

// 'require' loads an external library into this file. This is how we use Express.
const express = require('express');

// This creates our actual server application object. Every route/feature we add goes on 'app'.
const app = express();
const pool = require('./db');

const authRoutes = require('./routes/auth');

// This lets our server understand JSON data sent in requests (needed for req.body to work)
app.use(express.json());

// Any route starting with /api/auth will be handled by our authRoutes file
app.use('/api/auth', authRoutes);

// Just a plain variable to store which network port our server listens on.
const PORT = 3000;

// This defines a "route": when someone visits our server's root URL ('/') using a GET request,
// run this function. 'req' = the incoming request data, 'res' = what we send back.
app.get('/', (req, res) => {
  res.send('Expense Splitter backend is running!');
});

// This starts the server, telling it to actively listen for incoming requests on PORT 3000.
// The second argument is a function that runs once the server successfully starts.
// A quick one-time test route to confirm MySQL connection works
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



