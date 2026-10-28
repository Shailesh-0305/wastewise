import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'wastewise_secret_key_2026_super_secure';

export const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    // For demo ease, default to guest citizen demo context if no header
    req.user = { id: 'u1', name: 'Alex Navillera', role: 'citizen', email: 'alex@example.com' };
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    // If token invalid, proceed gracefully as guest citizen for smooth academic demo
    req.user = { id: 'u1', name: 'Alex Navillera', role: 'citizen', email: 'alex@example.com' };
    next();
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user?.role}' is not authorized to access this resource`
      });
    }
    next();
  };
};
