const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'local-development-secret-change-me';

const signToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id, user.role);

  // Cookie options (for production use httpOnly cookies)
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  };

  res.cookie('jwt', token, cookieOptions);

  return res.status(statusCode).json({
    success: true,
    token,
    data: { user },
  });
};

module.exports = { signToken, verifyToken, createSendToken };
