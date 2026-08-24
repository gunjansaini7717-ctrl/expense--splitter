// db.js

// dotenv loads variables from .env into process.env, so we can use them in our code
require('dotenv').config();

// mysql2's 'promise' version lets us use async/await (cleaner than callbacks)
const mysql = require('mysql2/promise');

// This creates a "pool" - a set of reusable connections to MySQL, instead of
// opening/closing a new connection every single time we query. More efficient.
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// We export 'pool' so other files (like server.js) can import and use it to run queries
module.exports = pool;