const Receipt = require('../models/Receipt');
const path = require('path');
const fs = require('fs');

/**
 * --- КОНСТАНТЫ И УТИЛИТЫ ---
 */

// Статичные курсы валют к KZT
const EXCHANGE_RATES = {
  KZT: 1,
  USD: 450,
  EUR: 485,
  RUB: 5
};

// Функция для физического удаления файла с диска
const deleteFile = (filePath) => {
  if (filePath && filePath.startsWith('/uploads/')) {
    const fullPath = path.join(__dirname, '../../public', filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlink(fullPath, (err) => {
        if (err) console.error('Ошибка при удалении старого файла:', err);
      });
    }
  }
};

/**
 * --- КОНТРОЛЛЕРЫ ---
 */

// @desc    Create new receipt
// @route   POST /api/receipts
// @access  Private
exports.createReceipt = async (req, res, next) => {
  try {
    req.body.user = req.user.id;

    // Если Multer загрузил файл, сохраняем путь к нему
    if (req.file) {
      req.body.imageUrl = `/uploads/${req.file.filename}`;
    }

    const receipt = await Receipt.create(req.body);

    res.status(201).json({
      success: true,
      data: receipt
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all receipts for logged in user (with conversion)
// @route   GET /api/receipts
// @access  Private
exports.getReceipts = async (req, res, next) => {
  try {
    const { category, startDate, endDate, search } = req.query;

    let query = { user: req.user.id };

    if (category) query.category = category;

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { merchant: { $regex: search, $options: 'i' } }
      ];
    }

    const receipts = await Receipt.find(query).sort('-date');

    /**
     * РАСЧЕТ TOTAL AMOUNT С КОНВЕРТАЦИЕЙ В KZT
     */
    const totalAmountKZT = receipts.reduce((sum, receipt) => {
      const rate = EXCHANGE_RATES[receipt.currency] || 1;
      return sum + (receipt.amount * rate);
    }, 0);

    res.status(200).json({
      success: true,
      count: receipts.length,
      totalAmount: totalAmountKZT, // Отправляем сумму в тенге
      data: receipts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single receipt
// @route   GET /api/receipts/:id
// @access  Private
exports.getReceipt = async (req, res, next) => {
  try {
    const receipt = await Receipt.findById(req.params.id);

    if (!receipt) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }

    if (receipt.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.status(200).json({ success: true, data: receipt });
  } catch (error) {
    next(error);
  }
};

// @desc    Update receipt
// @route   PUT /api/receipts/:id
// @access  Private
exports.updateReceipt = async (req, res, next) => {
  try {
    let receipt = await Receipt.findById(req.params.id);

    if (!receipt) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }

    if (receipt.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Если загружено новое фото, удаляем старое
    if (req.file) {
      deleteFile(receipt.imageUrl);
      req.body.imageUrl = `/uploads/${req.file.filename}`;
    }

    receipt = await Receipt.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: receipt });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete receipt
// @route   DELETE /api/receipts/:id
// @access  Private
exports.deleteReceipt = async (req, res, next) => {
  try {
    const receipt = await Receipt.findById(req.params.id);

    if (!receipt) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }

    if (receipt.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Физически удаляем файл изображения с сервера
    deleteFile(receipt.imageUrl);

    await receipt.deleteOne();

    res.status(200).json({ success: true, message: 'Receipt deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get receipt statistics (with conversion)
// @route   GET /api/receipts/stats/summary
// @access  Private
exports.getStats = async (req, res, next) => {
  try {
    const receipts = await Receipt.find({ user: req.user.id });

    const stats = {
      totalReceipts: receipts.length,
      totalAmountKZT: 0,
      byCategory: {}
    };

    receipts.forEach(receipt => {
      const rate = EXCHANGE_RATES[receipt.currency] || 1;
      const amountKZT = receipt.amount * rate;

      stats.totalAmountKZT += amountKZT;

      if (!stats.byCategory[receipt.category]) {
        stats.byCategory[receipt.category] = { count: 0, amount: 0 };
      }
      stats.byCategory[receipt.category].count++;
      stats.byCategory[receipt.category].amount += amountKZT;
    });

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle like on receipt
// @route   POST /api/receipts/:id/like
// @access  Private
exports.toggleLike = async (req, res, next) => {
  try {
    const receipt = await Receipt.findById(req.params.id);

    if (!receipt) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }

    const likeIndex = receipt.likedBy.indexOf(req.user.id);
    if (likeIndex > -1) {
      receipt.likedBy.splice(likeIndex, 1);
    } else {
      receipt.likedBy.push(req.user.id);
    }

    await receipt.save();
    res.status(200).json({ success: true, liked: likeIndex === -1, data: receipt });
  } catch (error) {
    next(error);
  }
};