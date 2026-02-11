const Joi = require('joi');

exports.validateRegister = (req, res, next) => {
  const schema = Joi.object({
    username: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

exports.validateLogin = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};

exports.validateReceipt = (req, res, next) => {
  const schema = Joi.object({
    title: Joi.string().max(100).required(),
    merchant: Joi.string().required(),
    amount: Joi.number().min(0).required(),
    currency: Joi.string().valid('USD', 'EUR', 'GBP', 'KZT', 'RUB'),
    category: Joi.string().valid('Food & Dining', 'Shopping', 'Transportation', 'Entertainment', 'Health', 'Bills & Utilities', 'Travel', 'Education', 'Other').required(),
    date: Joi.date(),
    description: Joi.string().max(500).allow(''),
    paymentMethod: Joi.string().valid('Cash', 'Credit Card', 'Debit Card', 'Digital Wallet', 'Bank Transfer'),
    tags: Joi.array().items(Joi.string()),
    imageUrl: Joi.string().allow('')
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }
  next();
};
