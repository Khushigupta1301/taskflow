const { validationResult } = require('express-validator');
const Task = require('../models/Task');
const AppError = require('../utils/AppError');

// Helper: build query filter
const buildFilter = (userId, role, queryParams) => {
  const filter = role === 'admin' ? {} : { owner: userId };
  if (queryParams.status) filter.status = queryParams.status;
  if (queryParams.priority) filter.priority = queryParams.priority;
  if (queryParams.search) {
    filter.title = { $regex: queryParams.search, $options: 'i' };
  }
  return filter;
};

// GET /api/v1/tasks
const getAllTasks = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sort = '-createdAt', ...queryParams } = req.query;
    const filter = buildFilter(req.user._id, req.user.role, queryParams);

    const skip = (Number(page) - 1) * Number(limit);
    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('owner', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Task.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        tasks,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/tasks/:id
const getTask = async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin'
      ? { _id: req.params.id }
      : { _id: req.params.id, owner: req.user._id };

    const task = await Task.findOne(filter).populate('owner', 'name email');
    if (!task) return next(new AppError('Task not found.', 404));

    res.json({ success: true, data: { task } });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/tasks
const createTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const task = await Task.create({ ...req.body, owner: req.user._id });
    await task.populate('owner', 'name email');

    res.status(201).json({ success: true, data: { task } });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/tasks/:id
const updateTask = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const filter = req.user.role === 'admin'
      ? { _id: req.params.id }
      : { _id: req.params.id, owner: req.user._id };

    // Whitelist updatable fields
    const allowedUpdates = ['title', 'description', 'status', 'priority', 'dueDate', 'tags'];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowedUpdates.includes(k))
    );

    const task = await Task.findOneAndUpdate(filter, updates, {
      new: true,
      runValidators: true,
    }).populate('owner', 'name email');

    if (!task) return next(new AppError('Task not found.', 404));

    res.json({ success: true, data: { task } });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/tasks/:id (soft delete)
const deleteTask = async (req, res, next) => {
  try {
    const filter = req.user.role === 'admin'
      ? { _id: req.params.id }
      : { _id: req.params.id, owner: req.user._id };

    const task = await Task.findOneAndUpdate(
      filter,
      { isDeleted: true },
      { new: true }
    );
    if (!task) return next(new AppError('Task not found.', 404));

    res.json({ success: true, message: 'Task deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/tasks/stats (admin only)
const getStats = async (req, res, next) => {
  try {
    const stats = await Task.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          highPriority: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
        },
      },
    ]);

    res.json({ success: true, data: { stats } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllTasks, getTask, createTask, updateTask, deleteTask, getStats };
