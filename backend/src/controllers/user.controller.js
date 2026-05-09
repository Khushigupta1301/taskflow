const User = require('../models/User');
const AppError = require('../utils/AppError');

// GET /api/v1/users  (admin only)
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role } = req.query;
    const filter = role ? { role } : {};
    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find(filter).sort('-createdAt').skip(skip).limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: { total, page: Number(page), limit: Number(limit) },
      },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/users/:id/role  (admin only)
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return next(new AppError('Invalid role. Must be "user" or "admin".', 400));
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    );
    if (!user) return next(new AppError('User not found.', 404));

    res.json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/users/:id/deactivate  (admin only)
const toggleUserActive = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(new AppError('User not found.', 404));

    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully.`,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/users/me  (self-update)
const updateMe = async (req, res, next) => {
  try {
    const allowed = ['name'];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k))
    );

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: { user } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllUsers, updateUserRole, toggleUserActive, updateMe };
