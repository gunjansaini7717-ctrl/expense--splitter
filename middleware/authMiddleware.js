// middleware/authMiddleware.js

const jwt = require('jsonwebtoken');

// This function will run BEFORE any protected route's actual logic.
// 'next' is a special function - calling it means "checks passed, continue to the real route"
function authMiddleware(req, res, next) {

  // Tokens are sent by the frontend in a request header called 'Authorization',
  // usually formatted as: "Bearer <token>"
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    // No header at all means no token was sent - reject immediately
    return res.status(401).json({ error: 'No token provided' });
  }

  // authHeader looks like "Bearer eyJhbGciOi..." - we split by space and take the second part
  const token = authHeader.split(' ')[1];

  try {
    // jwt.verify checks the token's signature against our secret key.
    // If valid, it returns the original data we signed it with (in our case, { userId: ... })
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // We attach the decoded user info onto 'req', so the actual route function
    // (which runs next) can access req.userId to know WHO is making this request
    req.userId = decoded.userId;

    // Everything checks out - let the request continue to the real route
    next();

  } catch (err) {
    // jwt.verify throws an error if the token is invalid, tampered with, or expired
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = authMiddleware;