const jwt = require('jsonwebtoken');

// Simple auth middleware used by routes that require authentication.
// Verifies a Bearer token from the Authorization header. For CI/tests
// where JWT_SECRET may not be set, fall back to a safe default secret.

const SECRET = process.env.JWT_SECRET || 'testsecret';

module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const parts = authHeader.split(' ');
  const token = parts.length === 2 ? parts[1] : parts[0];

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
