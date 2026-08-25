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


// jsonwebtoken lets us create and verify secure tokens
const jwt = require('jsonwebtoken');

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user with this email in the database
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

    // If no user found with that email, reject login
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];

    // bcrypt.compare checks the typed password against the stored HASHED password
    // (we never decrypt the hash - we hash-compare instead, since hashing is one-way)
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Create a token containing the user's id, signed with our secret key
    // 'expiresIn' means this token stops being valid after 7 days - forces re-login eventually (security practice)
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ message: 'Login successful', token, name: user.name });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

