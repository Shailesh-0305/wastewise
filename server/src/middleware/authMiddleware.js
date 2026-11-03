import jwt from 'jsonwebtoken';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Server configuration error: JWT_SECRET environment variable is missing.');
  }
  return secret;
};

/**
 * Strict authentication middleware.
 * Verifies JWT token and attaches user payload to req.user.
 * Rejects requests with missing, invalid, or expired tokens with 401 Unauthorized.
 */
export const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized: Access token is missing. Please sign in.'
    });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.name === 'TokenExpiredError' 
        ? 'Session expired: Please sign in again.' 
        : 'Not authorized: Invalid token.'
    });
  }
};

/**
 * Optional authentication middleware.
 * Decodes Bearer token if present without rejecting anonymous requests.
 */
export const optionalAuth = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, getJwtSecret());
      req.user = decoded;
    } catch {
      // Ignore invalid token on optional routes
    }
  }
  next();
};

/**
 * Role-based authorization middleware.
 * Verifies that the authenticated user possesses one of the required roles.
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role '${req.user?.role || 'anonymous'}' is not authorized to access this resource.`
      });
    }
    next();
  };
};
