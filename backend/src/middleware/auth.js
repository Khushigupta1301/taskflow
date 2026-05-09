const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const AppError = require('../utils/AppError');

// Protect: verify JWT and attach user to req
const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Extract token from header or cookie
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return next(new AppError('Not authenticated. Please log in.', 401));
    }

    // 2. Verify token
    const decoded = verifyToken(token);

    // 3. Check user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser || !currentUser.isActive) {
      return next(new AppError('User no longer exists or is deactivated.', 401));
    }

    // 4. Check if password changed after token was issued
    if (currentUser.passwordChangedAfter(decoded.iat)) {
      return next(new AppError('Password recently changed. Please log in again.', 401));
    }

    // Attach user to request
    req.user = currentUser;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token. Please log in again.', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expired. Please log in again.', 401));
    }
    next(error);
  }
};

// RBAC: restrict to specific roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };
};

module.exports = { protect, restrictTo };
