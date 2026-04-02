// Role hierarchy: viewer < analyst < admin
const ROLE_LEVELS = {
  viewer: 1,
  analyst: 2,
  admin: 3,
};

// Allow only specific roles
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required role: ${roles.join(" or ")}`,
      });
    }
    next();
  };
};

// Allow roles with at least a minimum level
const requireMinRole = (minRole) => {
  return (req, res, next) => {
    const userLevel = ROLE_LEVELS[req.user.role] || 0;
    const requiredLevel = ROLE_LEVELS[minRole] || 0;

    if (userLevel < requiredLevel) {
      return res.status(403).json({
        message: `Access denied. Minimum required role: ${minRole}`,
      });
    }
    next();
  };
};

module.exports = { requireRole, requireMinRole };
