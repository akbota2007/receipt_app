const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getAllUsers,
  deleteUser,
  deleteMyAccount,
  deleteAllUsers
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.delete('/me', protect, deleteMyAccount);
router.delete('/all', protect, authorize('admin'), deleteAllUsers);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/', protect, authorize('admin'), getAllUsers);
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;
