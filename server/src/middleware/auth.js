const jwt = require("jsonwebtoken");

/**
 * Middleware to authenticate requests using JWT.
 * Validates the "Authorization: Bearer <token>" header.
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"] || req.headers.authorization;
  const token =
    authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret_key", (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

/**
 * Alias for backward compatibility.
 */
const authenticate = authenticateToken;

/**
 * Middleware to authorize specific roles.
 * @param {string|string[]} roles - Allowed role(s).
 */
const requireRole = (...allowedRoles) => {
  if (allowedRoles.length === 1 && Array.isArray(allowedRoles[0])) {
    allowedRoles = allowedRoles[0];
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied: insufficient permissions" });
    }

    next();
  };
};

/**
 * Alias for backward compatibility.
 */
const authorize = (roles = []) => requireRole(typeof roles === "string" ? [roles] : roles);

module.exports = {
  authenticate,
  authenticateToken,
  authorize,
  requireRole,
};
