const express = require('express');
const router = express.Router();
const {
  createReceipt,
  getReceipts,
  getReceipt,
  updateReceipt,
  deleteReceipt,
  getStats,
  toggleLike
} = require('../controllers/receiptController');
const { protect } = require('../middleware/auth');
const { validateReceipt } = require('../middleware/validation');

router.route('/')
  .get(protect, getReceipts)
  .post(protect, validateReceipt, createReceipt);

router.get('/stats/summary', protect, getStats);

router.route('/:id')
  .get(protect, getReceipt)
  .put(protect, validateReceipt, updateReceipt)
  .delete(protect, deleteReceipt);

router.post('/:id/like', protect, toggleLike);

module.exports = router;
