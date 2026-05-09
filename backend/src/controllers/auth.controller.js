const { validationResult } = require('express-validator');
const User = require('../models/User');
const { createSendToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

// POST /api/v1/auth/register
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const { name, email, password } = req.body;

    // Check existing user
    const existing = await User.findOne({ email });
    if (existing) {
      return next(new AppError('An account with this email already exists.', 409));
    }

    // Create user (password hashed via pre-save hook)
    const user = await User.create({ name, email, password });

    logger.info(`New user registered: ${email}`);
    createSendToken(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/auth/login
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    // Fetch user including password
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Invalid email or password.', 401));
    }

    if (!user.isActive) {
      return next(new AppError('Account deactivated. Contact support.', 403));
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    logger.info(`User logged in: ${email}`);
    createSendToken(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/auth/me
const getMe = async (req, res) => {
  res.json({ success: true, data: { user: req.user } });
};

// POST /api/v1/auth/logout
const logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.json({ success: true, message: 'Logged out successfully.' });
};

module.exports = { register, login, getMe, logout };
