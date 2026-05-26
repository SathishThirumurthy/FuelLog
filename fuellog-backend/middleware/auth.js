// ============================================================
//  FuelLog Backend — middleware/auth.js
//  Verifies JWT token on every protected API request
//  Extracts user_id and attaches it to req.user
// ============================================================

const jwt = require('jsonwebtoken');

module.exports = function authMiddleware(req, res, next) {

  // ── Get token from request header ────────────────────────
  const authHeader = req.headers['authorization'];

  // Expected format: "Bearer eyJhbGc..."
  const token = authHeader && authHeader.split(' ')[1];

  // ── No token provided ─────────────────────────────────────
  if (!token) {
    return res.status(401).json({
      error: 'Access denied. Please log in.',
    });
  }

  try {
    // ── Verify and decode the token ───────────────────────────
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ── Attach user info to request ───────────────────────────
    // Now all routes can access req.user.userId and req.user.email
    req.user = {
      userId: decoded.userId,
      email:  decoded.email,
    };

    // ── Continue to the route handler ─────────────────────────
    next();

  } catch (err) {
    // ── Token is invalid or expired ───────────────────────────
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Session expired. Please log in again.',
      });
    }
    return res.status(401).json({
      error: 'Invalid token. Please log in again.',
    });
  }
};
