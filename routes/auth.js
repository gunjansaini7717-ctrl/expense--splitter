// routes/auth.js

// express.Router() lets us define a group of related routes separately,
// then plug them into the main app later - keeps code organized by feature
const express = require('express');
const router = express.Router();

// bcrypt for hashing passwords before storing them
const bcrypt = require('bcrypt');

// our database connection pool
const pool = require('../db');

// POST route for signup - POST is used (not GET) because we're SENDING data
// to create something new, not just retrieving/reading data
router.post('/signup', async (req, res) => {
  try {
    // req.body contains the data sent by whoever calls this route (name, email, password)
    const { name, email, password } = req.body;

    // hash the plain password - the '10' is the "salt rounds" (security strength level, 10 is standard)
    const hashedPassword = await bcrypt.hash(password, 10);

    // insert the new user into the database
    // we use '?' placeholders (not direct string insertion) to prevent SQL injection attacks
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );

    // send back a success response with the new user's auto-generated id
    res.status(201).json({ message: 'User created successfully', userId: result.insertId });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;