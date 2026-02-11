const Receipt = require('../models/Receipt');
const path = require('path');
const fs = require('fs');

const EXCHANGE_RATES = {
  KZT: 1,
  USD: 450,
  EUR: 485,
  RUB: 5
};

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

exports.createReceipt = async (req, res, next) => {
  try {
    req.body.user = req.user.id;

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
exports.getReceipts = async (req, res, next) => {
  try {
    const { category, startDate, endDate, search } = req.query;

    let query = {};

    if (req.user.role !== 'admin') {
      query.user = req.user.id;
    }

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

    let receiptsQuery = Receipt.find(query).sort('-date');
    if (req.user.role === 'admin') {
      receiptsQuery = receiptsQuery.populate('user', 'username email');
    }
    const receipts = await receiptsQuery;


    const totalAmountKZT = receipts.reduce((sum, receipt) => {
      const rate = EXCHANGE_RATES[receipt.currency] || 1;
      return sum + (receipt.amount * rate);
    }, 0);

    res.status(200).json({
      success: true,
      count: receipts.length,
      totalAmount: totalAmountKZT,
      data: receipts
    });
  } catch (error) {
    next(error);
  }
};

exports.getReceipt = async (req, res, next) => {
  try {
    const receipt = await Receipt.findById(req.params.id);

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: 'Receipt not found'
      });
    }

    if (
      receipt.user.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    res.status(200).json({
      success: true,
      data: receipt
    });
  } catch (error) {
    next(error);
  }
};

exports.updateReceipt = async (req, res, next) => {
  try {
    let receipt = await Receipt.findById(req.params.id);

    if (!receipt) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }

    if (receipt.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

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

exports.deleteReceipt = async (req, res, next) => {
  try {
    const receipt = await Receipt.findById(req.params.id);

    if (!receipt) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }

    if (receipt.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    deleteFile(receipt.imageUrl);

    await receipt.deleteOne();

    res.status(200).json({ success: true, message: 'Receipt deleted successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getStats = async (req, res, next) => {
  try {
    let query = {};

    if (req.user.role !== 'admin') {
      query.user = req.user.id;
    }

    const receipts = await Receipt.find(query);

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