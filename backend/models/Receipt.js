const mongoose = require('mongoose');

const receiptSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a receipt title'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  merchant: {
    type: String,
    required: [true, 'Please add a merchant name'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Please add an amount'],
    min: [0, 'Amount cannot be negative']
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'KZT']
  },
  category: {
    type: String,
    required: [true, 'Please select a category'],
    enum: ['Food & Dining', 'Shopping', 'Transportation', 'Entertainment', 'Health', 'Bills & Utilities', 'Travel', 'Education', 'Other']
  },
  date: {
    type: Date,
    required: [true, 'Please add a receipt date'],
    default: Date.now
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Credit Card', 'Debit Card', 'Digital Wallet', 'Bank Transfer'],
    default: 'Cash'
  },
  imageUrl: {
    type: String
  },
  tags: [{
    type: String,
    trim: true
  }],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

receiptSchema.index({ user: 1, date: -1 });
receiptSchema.index({ category: 1 });

module.exports = mongoose.model('Receipt', receiptSchema);
