import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'wastewise_secret_key_2026_super_secure';

/**
 * Strict authentication middleware.
 * Rejects requests with missing or invalid JWT tokens.
 */
export const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized: Access token is missing'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized: Invalid or expired token'
    });
  }
};

/**
 * Optional authentication middleware.
 * Attaches decoded user payload if a valid Bearer token is provided,
 * but allows unauthenticated requests to continue safely.
 */
export const optionalAuth = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch {
      // Ignore invalid token on optional routes
    }
  }
  next();
};

/**
 * Role-based authorization middleware.
 * Restricts access to specified user roles.
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user?.role || 'anonymous'}' is not authorized to access this resource`
      });
    }
    next();
  };
};
