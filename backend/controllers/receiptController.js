const Receipt = require('../models/Receipt');

// @desc    Create new receipt
// @route   POST /api/receipts
// @access  Private
exports.createReceipt = async (req, res, next) => {
  try {
    req.body.user = req.user.id;
    
    const receipt = await Receipt.create(req.body);

    res.status(201).json({
      success: true,
      data: receipt
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all receipts for logged in user
// @route   GET /api/receipts
// @access  Private
exports.getReceipts = async (req, res, next) => {
  try {
    const { category, startDate, endDate, search } = req.query;
    
    // Debug logging
    console.log('📊 Filters received:', { category, startDate, endDate, search });
    
    let query = { user: req.user.id };

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Search by title or merchant
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { merchant: { $regex: search, $options: 'i' } }
      ];
    }

    console.log('🔍 MongoDB query:', JSON.stringify(query, null, 2));

    const receipts = await Receipt.find(query).sort('-date');

    // Calculate statistics
    const totalAmount = receipts.reduce((sum, receipt) => sum + receipt.amount, 0);
    
    console.log('✅ Found receipts:', receipts.length);

    res.status(200).json({
      success: true,
      count: receipts.length,
      totalAmount,
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
      return res.status(404).json({
        success: false,
        message: 'Receipt not found'
      });
    }

    // Make sure user owns the receipt or is admin
    if (receipt.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this receipt'
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

// @desc    Update receipt
// @route   PUT /api/receipts/:id
// @access  Private
exports.updateReceipt = async (req, res, next) => {
  try {
    let receipt = await Receipt.findById(req.params.id);

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: 'Receipt not found'
      });
    }

    // Make sure user owns the receipt
    if (receipt.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this receipt'
      });
    }

    receipt = await Receipt.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: receipt
    });
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
      return res.status(404).json({
        success: false,
        message: 'Receipt not found'
      });
    }

    // Make sure user owns the receipt or is admin
    if (receipt.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this receipt'
      });
    }

    await receipt.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Receipt deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get receipt statistics
// @route   GET /api/receipts/stats/summary
// @access  Private
exports.getStats = async (req, res, next) => {
  try {
    const receipts = await Receipt.find({ user: req.user.id });

    const stats = {
      totalReceipts: receipts.length,
      totalAmount: receipts.reduce((sum, r) => sum + r.amount, 0),
      byCategory: {},
      byMonth: {}
    };

    // Group by category
    receipts.forEach(receipt => {
      if (!stats.byCategory[receipt.category]) {
        stats.byCategory[receipt.category] = {
          count: 0,
          amount: 0
        };
      }
      stats.byCategory[receipt.category].count++;
      stats.byCategory[receipt.category].amount += receipt.amount;
    });

    res.status(200).json({
      success: true,
      data: stats
    });
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
      return res.status(404).json({
        success: false,
        message: 'Receipt not found'
      });
    }

    const likeIndex = receipt.likedBy.indexOf(req.user.id);

    if (likeIndex > -1) {
      // Unlike
      receipt.likedBy.splice(likeIndex, 1);
    } else {
      // Like
      receipt.likedBy.push(req.user.id);
    }

    await receipt.save();

    res.status(200).json({
      success: true,
      liked: likeIndex === -1,
      data: receipt
    });
  } catch (error) {
    next(error);
  }
};
