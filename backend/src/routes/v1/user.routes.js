const express = require('express');
const { getAllUsers, updateUserRole, toggleUserActive, updateMe } = require('../../controllers/user.controller');
const { protect, restrictTo } = require('../../middleware/auth');

const router = express.Router();

router.use(protect);

router.patch('/me', updateMe);

// Admin-only below
router.use(restrictTo('admin'));
router.get('/', getAllUsers);
router.patch('/:id/role', updateUserRole);
router.patch('/:id/toggle-active', toggleUserActive);

module.exports = router;
