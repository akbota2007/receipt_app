const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
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

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `receipt-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.route('/')
    .get(protect, getReceipts)
    .post(protect, upload.single('image'), validateReceipt, createReceipt);

router.get('/stats/summary', protect, getStats);

router.route('/:id')
    .get(protect, getReceipt)
    .put(protect, upload.single('image'), validateReceipt, updateReceipt)
    .delete(protect, deleteReceipt);

router.post('/:id/like', protect, toggleLike);

module.exports = router;