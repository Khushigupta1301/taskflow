const express = require('express');
const { body, query } = require('express-validator');
const {
  getAllTasks, getTask, createTask, updateTask, deleteTask, getStats,
} = require('../../controllers/task.controller');
const { protect, restrictTo } = require('../../middleware/auth');

const router = express.Router();

// All task routes require authentication
router.use(protect);

const taskBodyRules = [
  body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title must be 3–100 chars'),
  body('description').optional().isLength({ max: 1000 }),
  body('status').optional().isIn(['todo', 'in_progress', 'done']),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('dueDate').optional().isISO8601().toDate(),
  body('tags').optional().isArray(),
];

// Admin-only routes
router.get('/stats', restrictTo('admin'), getStats);

// User + admin routes
router.route('/')
  .get(getAllTasks)
  .post(taskBodyRules, createTask);

router.route('/:id')
  .get(getTask)
  .patch(taskBodyRules, updateTask)
  .delete(deleteTask);

module.exports = router;
